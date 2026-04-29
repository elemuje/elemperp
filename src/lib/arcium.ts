/**
 * arcium.ts — Real Arcium SDK integration for ELEMPerp
 *
 * Uses @arcium-hq/client v0.9.7 to:
 *   1. Generate an ephemeral x25519 keypair per trade
 *   2. Fetch the MXE public key from Arcium's on-chain account
 *   3. Derive a shared secret and initialise RescueCipher
 *   4. Encrypt trade parameters (size, leverage, direction) into ciphertext
 *   5. Build the on-chain instruction payload
 *   6. Poll awaitComputationFinalization for the result signature
 *
 * On Devnet the Arcium program is deployed at:
 *   Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ
 *
 * The browser cannot call getArciumEnv() (it reads process.env).
 * We derive the cluster offset from the known Devnet constant instead.
 */

import {
  x25519,
  RescueCipher,
  getMXEAccAddress,
  getComputationAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getArciumProgramId,
  awaitComputationFinalization,
} from '@arcium-hq/client';

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';

import BN from 'bn.js';

// ── Constants ──────────────────────────────────────────────────────────────

/** Arcium program address (Devnet) */
export const ARCIUM_PROGRAM_ID = getArciumProgramId();

/**
 * Devnet cluster offset — the index of the public Arcium cluster.
 * Obtained from Arcium's public Devnet deployment docs.
 */
export const DEVNET_CLUSTER_OFFSET = 0;

/**
 * Fixed-point scale factor: trade values are multiplied by 1e6 before
 * being passed to Arcium's integer-only field arithmetic.
 */
const SCALE = 1_000_000n;

// ── Types ──────────────────────────────────────────────────────────────────

export interface TradeParams {
  /** Position size in USDC (e.g. 500.00) */
  size: number;
  /** Leverage multiplier (1–50) */
  leverage: number;
  /** Trade direction */
  side: 'long' | 'short';
  /** Optional stop-loss price */
  stopLoss?: number;
  /** Optional take-profit price */
  takeProfit?: number;
}

export interface ArciumEncryptedPayload {
  /** Encrypted size ciphertext (32 bytes each block) */
  encryptedSize: number[][];
  /** Encrypted leverage ciphertext */
  encryptedLeverage: number[][];
  /** Encrypted direction (1n = long, 0n = short) */
  encryptedDirection: number[][];
  /** Encrypted stop-loss price (0 if not set) */
  encryptedStopLoss: number[][];
  /** Encrypted take-profit price (0 if not set) */
  encryptedTakeProfit: number[][];
  /** Client's x25519 public key — must be included in the instruction */
  clientPublicKey: Uint8Array;
  /** 16-byte random nonce used for encryption */
  nonce: Uint8Array;
  /** Random BN used as the computation offset on-chain */
  computationOffset: InstanceType<typeof BN>;
}

export interface ArciumComputationResult {
  /** Transaction signature of the finalization tx */
  finalizationSignature: string;
  /** Whether the computation succeeded on-chain */
  success: boolean;
  /** Derived computation account (for logging / explorer links) */
  computationAccount: PublicKey;
}

// ── MXE public key cache ───────────────────────────────────────────────────

let _mxePublicKey: Uint8Array | null = null;

/**
 * Fetch the MXE (Multi-party eXecution Environment) public key from Arcium's
 * on-chain MXE account. The MXE account is a PDA derived from the program ID
 * that stores the x25519 public key used for shared-secret derivation.
 *
 * We parse the account data directly because the browser cannot use the full
 * Anchor provider setup (no process.env).
 */
export async function getMXEPublicKey(
  connection: Connection,
  mxeProgramId: PublicKey,
): Promise<Uint8Array> {
  if (_mxePublicKey) return _mxePublicKey;

  const mxeAddress = getMXEAccAddress(mxeProgramId);
  const accountInfo = await connection.getAccountInfo(mxeAddress);

  if (!accountInfo) {
    throw new Error(
      `Arcium MXE account not found at ${mxeAddress.toBase58()}. ` +
      'Ensure your connection is pointed at Solana Devnet.'
    );
  }

  // MXE account layout (after 8-byte Anchor discriminator):
  // bytes 8..40 = x25519 public key (32 bytes)
  if (accountInfo.data.length < 40) {
    throw new Error('MXE account data too short — unexpected format.');
  }

  const pubKey = new Uint8Array(accountInfo.data.slice(8, 40));
  _mxePublicKey = pubKey;
  return pubKey;
}

// ── Core encryption ────────────────────────────────────────────────────────

/**
 * Encrypt trade parameters using Arcium's RescueCipher over the shared secret
 * derived from our ephemeral x25519 keypair and the MXE's public key.
 *
 * This is the real cryptographic step. The returned ciphertext is what gets
 * submitted to the Arcium on-chain program — no plaintext trade data leaves
 * this function.
 */
export async function encryptTradeParams(
  connection: Connection,
  mxeProgramId: PublicKey,
  params: TradeParams,
): Promise<ArciumEncryptedPayload> {
  // 1. Ephemeral x25519 keypair (one per trade, never reused)
  const clientPrivateKey = x25519.utils.randomPrivateKey();
  const clientPublicKey  = x25519.getPublicKey(clientPrivateKey);

  // 2. MXE public key
  const mxePublicKey = await getMXEPublicKey(connection, mxeProgramId);

  // 3. Shared secret → RescueCipher
  const sharedSecret = x25519.getSharedSecret(clientPrivateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);

  // 4. Random 16-byte nonce
  const nonce = crypto.getRandomValues(new Uint8Array(16));

  // 5. Scale values to BigInt (Arcium field arithmetic is integer-only)
  const sizeBn      = BigInt(Math.round(params.size      * Number(SCALE)));
  const leverageBn  = BigInt(Math.round(params.leverage  * Number(SCALE)));
  const directionBn = params.side === 'long' ? 1n * SCALE : 0n;
  const stopLossBn  = params.stopLoss  ? BigInt(Math.round(params.stopLoss  * Number(SCALE))) : 0n;
  const takeProfitBn = params.takeProfit ? BigInt(Math.round(params.takeProfit * Number(SCALE))) : 0n;

  // 6. Encrypt each field individually (one RescueCipher call per field)
  const encryptedSize       = cipher.encrypt([sizeBn],       nonce);
  const encryptedLeverage   = cipher.encrypt([leverageBn],   nonce);
  const encryptedDirection  = cipher.encrypt([directionBn],  nonce);
  const encryptedStopLoss   = cipher.encrypt([stopLossBn],   nonce);
  const encryptedTakeProfit = cipher.encrypt([takeProfitBn], nonce);

  // 7. Random computation offset (u64, used to derive the computation PDA)
  const offsetBytes = crypto.getRandomValues(new Uint8Array(8));
  const computationOffset = new BN(offsetBytes);

  return {
    encryptedSize,
    encryptedLeverage,
    encryptedDirection,
    encryptedStopLoss,
    encryptedTakeProfit,
    clientPublicKey,
    nonce,
    computationOffset,
  };
}

// ── On-chain instruction builder ───────────────────────────────────────────

/**
 * Build a Solana TransactionInstruction that submits the encrypted trade to
 * Arcium's on-chain mempool. The instruction data is serialised as:
 *
 *   [ discriminator (8) | computationOffset (8) | clientPubkey (32) |
 *     nonce (16) | encSize (32) | encLev (32) | encDir (32) |
 *     encSL (32) | encTP (32) ]
 *
 * This is a stub layout — in a production deployment you would codegen
 * this from your own Anchor program's IDL. Here we demonstrate the real
 * Arcium account structure and PDA derivation.
 */
export function buildSubmitTradeInstruction(
  payer: PublicKey,
  mxeProgramId: PublicKey,
  payload: ArciumEncryptedPayload,
): TransactionInstruction {
  const { computationOffset, clientPublicKey, nonce,
          encryptedSize, encryptedLeverage, encryptedDirection,
          encryptedStopLoss, encryptedTakeProfit } = payload;

  // Derive the required Arcium PDAs
  const mxeAccount        = getMXEAccAddress(mxeProgramId);
  const mempoolAccount    = getMempoolAccAddress(DEVNET_CLUSTER_OFFSET);
  const executingPool     = getExecutingPoolAccAddress(DEVNET_CLUSTER_OFFSET);
  const computationAccount = getComputationAccAddress(
    DEVNET_CLUSTER_OFFSET,
    computationOffset,
  );

  // Serialise instruction data
  // discriminator = first 8 bytes of sha256("global:submit_encrypted_trade")
  // (placeholder — replace with your program's actual discriminator)
  const discriminator = Buffer.from([0xd4, 0x7b, 0x9a, 0x1e, 0x32, 0x08, 0xf5, 0xc1]);

  const offsetBuf = computationOffset.toArrayLike(Buffer, 'le', 8);

  const flatten = (ct: number[][]): Buffer =>
    Buffer.concat(ct.map((block) => Buffer.from(block)));

  const data = Buffer.concat([
    discriminator,
    offsetBuf,
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
      { pubkey: payer,             isSigner: true,  isWritable: true  },
      { pubkey: mxeAccount,        isSigner: false, isWritable: false },
      { pubkey: mempoolAccount,    isSigner: false, isWritable: true  },
      { pubkey: executingPool,     isSigner: false, isWritable: true  },
      { pubkey: computationAccount,isSigner: false, isWritable: true  },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
  });
}

// ── Computation finalisation ───────────────────────────────────────────────

/**
 * Poll Arcium's on-chain state until the computation is finalised.
 * Uses the real awaitComputationFinalization from @arcium-hq/client.
 *
 * Returns the finalization transaction signature and the computation account
 * address — both can be verified on Solana Explorer.
 */
export async function waitForComputation(
  connection: Connection,
  mxeProgramId: PublicKey,
  computationOffset: InstanceType<typeof BN>,
  timeoutMs = 60_000,
): Promise<ArciumComputationResult> {
  const computationAccount = getComputationAccAddress(
    DEVNET_CLUSTER_OFFSET,
    computationOffset,
  );

  try {
    // Build a minimal AnchorProvider-compatible object for the SDK call
    const fakeWallet = {
      publicKey: PublicKey.default,
      signTransaction: async <T>(tx: T) => tx,
      signAllTransactions: async <T>(txs: T[]) => txs,
    };

    const provider = {
      connection,
      wallet: fakeWallet,
      opts: { commitment: 'confirmed' as const },
      publicKey: PublicKey.default,
      sendAndConfirm: async (tx: Transaction) => {
        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig, 'confirmed');
        return sig;
      },
    };

    const finalizeSig = await awaitComputationFinalization(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider as any,
      computationOffset,
      mxeProgramId,
      'confirmed',
      timeoutMs,
    );

    return {
      finalizationSignature: finalizeSig,
      success: true,
      computationAccount,
    };
  } catch (err) {
    console.error('[Arcium] Computation finalization error:', err);
    return {
      finalizationSignature: '',
      success: false,
      computationAccount,
    };
  }
}

// ── High-level helper ──────────────────────────────────────────────────────

/**
 * Full Arcium trade submission flow:
 *   encrypt → build instruction → (caller signs & sends) → await finalization
 *
 * Returns the encrypted payload (for the caller to sign and send the tx)
 * and a function to call after the tx is confirmed to await finalization.
 */
export async function prepareArciumTrade(
  connection: Connection,
  params: TradeParams,
): Promise<{
  payload: ArciumEncryptedPayload;
  instruction: TransactionInstruction;
  awaitResult: (payer: PublicKey) => Promise<ArciumComputationResult>;
}> {
  const mxeProgramId = ARCIUM_PROGRAM_ID;
  const payload = await encryptTradeParams(connection, mxeProgramId, params);

  // We pass PublicKey.default here; the caller replaces it with the real payer
  // when building the Transaction
  const instruction = buildSubmitTradeInstruction(
    PublicKey.default,
    mxeProgramId,
    payload,
  );

  const awaitResult = (_payer: PublicKey) =>
    waitForComputation(connection, mxeProgramId, payload.computationOffset);

  return { payload, instruction, awaitResult };
}

// ── Utility: format for display ────────────────────────────────────────────

/** Shorten a base58 pubkey for display */
export function shortKey(pk: PublicKey): string {
  const s = pk.toBase58();
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

/** Solana Explorer link for a signature on Devnet */
export function explorerLink(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

/** Solana Explorer link for an account on Devnet */
export function explorerAccountLink(pk: PublicKey): string {
  return `https://explorer.solana.com/address/${pk.toBase58()}?cluster=devnet`;
}
