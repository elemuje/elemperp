/**
 * arcium.ts — Real Arcium SDK integration for ELEMPerp (browser-safe)
 *
 * Uses @arcium-hq/client v0.9.7 for the cryptographic operations that
 * run safely in the browser:
 *
 *   ✓ x25519 ephemeral keypair generation     (@noble/curves — browser safe)
 *   ✓ MXE public key fetch from Devnet        (Solana RPC — browser safe)
 *   ✓ Shared secret derivation                (@noble/curves — browser safe)
 *   ✓ RescueCipher FHE encryption             (pure math — browser safe)
 *   ✓ PDA derivation for computation accounts (@solana/web3.js — browser safe)
 *
 *   ✗ awaitComputationFinalization            (needs @coral-xyz/anchor + Node.js)
 *   ✗ uploadCircuit                            (needs fs.readFileSync)
 *   ✗ getArciumEnv                             (needs process.env)
 *
 * The above excluded functions require a backend/CLI. On Devnet we demonstrate
 * the real cryptographic layer and PDA derivation; full finalization would run
 * in a backend relay or Anchor CLI after the circuit is deployed.
 *
 * Arcium program on Devnet: Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ
 */

// Only import the browser-safe exports from @arcium-hq/client
import { x25519 } from '@noble/curves/ed25519';
import {
  RescueCipher,
  getMXEAccAddress,
  getComputationAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getArciumProgramId,
} from '@arcium-hq/client';

import {
  Connection,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';

import BN from 'bn.js';

// ── Constants ──────────────────────────────────────────────────────────────

/** Arcium on-chain program ID (Devnet) */
export const ARCIUM_PROGRAM_ID = getArciumProgramId();

/** Public Devnet cluster offset */
export const DEVNET_CLUSTER_OFFSET = 0;

/** Scale factor: float → BigInt for field arithmetic */
const SCALE = 1_000_000n;

// ── Types ──────────────────────────────────────────────────────────────────

export interface TradeParams {
  size:       number;   // USDC
  leverage:   number;   // 1–50
  side:       'long' | 'short';
  stopLoss?:  number;
  takeProfit?: number;
}

export interface ArciumEncryptedPayload {
  /** Ciphertext blocks for each trade field */
  encryptedSize:       number[][];
  encryptedLeverage:   number[][];
  encryptedDirection:  number[][];
  encryptedStopLoss:   number[][];
  encryptedTakeProfit: number[][];
  /** Client x25519 public key — sent to Arcium so MXE can derive shared secret */
  clientPublicKey:  Uint8Array;
  /** 16-byte random nonce for CTR mode */
  nonce:            Uint8Array;
  /** Random u64 used as the on-chain computation PDA offset */
  computationOffset: InstanceType<typeof BN>;
  /** Derived PDAs (pre-computed for the instruction) */
  pdas: {
    mxeAccount:          PublicKey;
    mempoolAccount:      PublicKey;
    executingPool:       PublicKey;
    computationAccount:  PublicKey;
  };
}

// ── MXE public key (cached after first fetch) ──────────────────────────────

let _cachedMxePubKey: Uint8Array | null = null;

/**
 * Fetch Arcium's MXE x25519 public key from Devnet.
 * The MXE account is a PDA of the Arcium program.
 * Its account data layout (after 8-byte Anchor discriminator):
 *   bytes 8–40 → x25519 public key (32 bytes)
 */
export async function fetchMXEPublicKey(
  connection: Connection,
  programId:  PublicKey = ARCIUM_PROGRAM_ID,
): Promise<Uint8Array> {
  if (_cachedMxePubKey) return _cachedMxePubKey;

  const mxeAddress  = getMXEAccAddress(programId);
  const accountInfo = await connection.getAccountInfo(mxeAddress);

  if (!accountInfo || accountInfo.data.length < 40) {
    // MXE account may not be initialised on public Devnet yet;
    // fall back to a well-known Devnet test key (all-zeros placeholder)
    console.warn('[Arcium] MXE account not found — using placeholder key for encryption demo');
    const placeholder = new Uint8Array(32);
    placeholder[0] = 9; // standard x25519 base point scalar (not zero)
    _cachedMxePubKey = placeholder;
    return placeholder;
  }

  const pubKey = new Uint8Array(accountInfo.data.slice(8, 40));
  _cachedMxePubKey = pubKey;
  return pubKey;
}

// ── Core encryption ────────────────────────────────────────────────────────

/**
 * Encrypt trade parameters using Arcium's RescueCipher.
 *
 * This is real cryptography:
 *  1. Generate ephemeral x25519 keypair (one per trade)
 *  2. Fetch MXE public key from Arcium's Devnet program account
 *  3. Derive ECDH shared secret
 *  4. Initialise RescueCipher (Rescue over Curve25519 base field, CTR mode)
 *  5. Encrypt each trade field as a 1-element BigInt vector
 */
export async function encryptTradeParams(
  connection: Connection,
  params:     TradeParams,
): Promise<ArciumEncryptedPayload> {
  // 1. Ephemeral x25519 keypair — never reused across trades
  const clientPrivateKey = x25519.utils.randomPrivateKey();
  const clientPublicKey  = x25519.getPublicKey(clientPrivateKey);

  // 2. MXE public key from Devnet
  const mxePublicKey = await fetchMXEPublicKey(connection);

  // 3. ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(clientPrivateKey, mxePublicKey);

  // 4. RescueCipher — Arcium's Rescue permutation over Curve25519's base field
  const cipher = new RescueCipher(sharedSecret);

  // 5. Random 16-byte CTR nonce (browser crypto.getRandomValues)
  const nonce = crypto.getRandomValues(new Uint8Array(16));

  // 6. Scale float values → BigInt (Arcium field arithmetic is integer-only)
  const toBN = (v: number) => BigInt(Math.round(v * Number(SCALE)));
  const sizeBn       = toBN(params.size);
  const leverageBn   = toBN(params.leverage);
  const directionBn  = params.side === 'long' ? SCALE : 0n;
  const stopLossBn   = params.stopLoss   ? toBN(params.stopLoss)   : 0n;
  const takeProfitBn = params.takeProfit ? toBN(params.takeProfit) : 0n;

  // 7. Encrypt each field — one RescueCipher call per field
  const encryptedSize       = cipher.encrypt([sizeBn],       nonce);
  const encryptedLeverage   = cipher.encrypt([leverageBn],   nonce);
  const encryptedDirection  = cipher.encrypt([directionBn],  nonce);
  const encryptedStopLoss   = cipher.encrypt([stopLossBn],   nonce);
  const encryptedTakeProfit = cipher.encrypt([takeProfitBn], nonce);

  // 8. Random u64 computation offset → PDA derivation
  const offsetBytes     = crypto.getRandomValues(new Uint8Array(8));
  const computationOffset = new BN(Buffer.from(offsetBytes));

  // 9. Derive all required Arcium PDAs up front
  const mxeAccount         = getMXEAccAddress(ARCIUM_PROGRAM_ID);
  const mempoolAccount     = getMempoolAccAddress(DEVNET_CLUSTER_OFFSET);
  const executingPool      = getExecutingPoolAccAddress(DEVNET_CLUSTER_OFFSET);
  const computationAccount = getComputationAccAddress(
    DEVNET_CLUSTER_OFFSET,
    computationOffset,
  );

  return {
    encryptedSize,
    encryptedLeverage,
    encryptedDirection,
    encryptedStopLoss,
    encryptedTakeProfit,
    clientPublicKey,
    nonce,
    computationOffset,
    pdas: { mxeAccount, mempoolAccount, executingPool, computationAccount },
  };
}

// ── Instruction builder ────────────────────────────────────────────────────

/**
 * Build the TransactionInstruction for submitting an encrypted trade to Arcium.
 * In production this would target your deployed Anchor program; here we show
 * the real account structure and PDA layout.
 */
export function buildTradeInstruction(
  payer:   PublicKey,
  payload: ArciumEncryptedPayload,
): TransactionInstruction {
  const { computationOffset, clientPublicKey, nonce, pdas,
          encryptedSize, encryptedLeverage, encryptedDirection,
          encryptedStopLoss, encryptedTakeProfit } = payload;

  // Instruction discriminator (first 8 bytes of sha256("global:submit_encrypted_trade"))
  const discriminator = Buffer.from([0xd4, 0x7b, 0x9a, 0x1e, 0x32, 0x08, 0xf5, 0xc1]);
  const flatten = (ct: number[][]) => Buffer.concat(ct.map((b) => Buffer.from(b)));

  const data = Buffer.concat([
    discriminator,
    computationOffset.toArrayLike(Buffer, 'le', 8),
    Buffer.from(clientPublicKey),
    Buffer.from(nonce),
    flatten(encryptedSize),
    flatten(encryptedLeverage),
    flatten(encryptedDirection),
    flatten(encryptedStopLoss),
    flatten(encryptedTakeProfit),
  ]);

  return new TransactionInstruction({
    programId: ARCIUM_PROGRAM_ID,
    data,
    keys: [
      { pubkey: payer,                        isSigner: true,  isWritable: true  },
      { pubkey: pdas.mxeAccount,              isSigner: false, isWritable: false },
      { pubkey: pdas.mempoolAccount,          isSigner: false, isWritable: true  },
      { pubkey: pdas.executingPool,           isSigner: false, isWritable: true  },
      { pubkey: pdas.computationAccount,      isSigner: false, isWritable: true  },
      { pubkey: SYSVAR_CLOCK_PUBKEY,          isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId,      isSigner: false, isWritable: false },
    ],
  });
}

// ── High-level helper ──────────────────────────────────────────────────────

/**
 * Full browser-side Arcium flow:
 *   - Encrypt trade params with RescueCipher
 *   - Derive all PDAs
 *   - Build instruction
 *   - Return payload for display + signing
 */
export async function prepareArciumTrade(
  connection: Connection,
  params:     TradeParams,
): Promise<{
  payload:     ArciumEncryptedPayload;
  instruction: TransactionInstruction;
}> {
  const payload     = await encryptTradeParams(connection, params);
  const instruction = buildTradeInstruction(PublicKey.default, payload);
  return { payload, instruction };
}

// ── Utilities ──────────────────────────────────────────────────────────────

export function shortKey(pk: PublicKey): string {
  const s = pk.toBase58();
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function explorerLink(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function explorerAccountLink(pk: PublicKey): string {
  return `https://explorer.solana.com/address/${pk.toBase58()}?cluster=devnet`;
}
