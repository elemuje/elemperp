# ELEMPerp MXE — Arcium Confidential Computation Program

This directory contains the on-chain Anchor program and Arcis circuit that power
ELEMPerp's encrypted trade validation. It is the backend component that enables
the full Arcium computation lifecycle.

## Architecture

```
Browser (ELEMPerp UI)
  │
  │  1. RescueCipher encrypts trade params
  │  2. x25519 ECDH shared secret with MXE
  │  3. validate_trade instruction → Solana
  │
  ▼
ELEMPerp MXE Program (this program)
  │
  │  4. Queues computation in Arcium mempool
  │
  ▼
Arcium MPC Cluster
  │
  │  5. validate_trade Arcis circuit runs on encrypted data
  │  6. Computes margin, fee, liquidation prices — all encrypted
  │  7. Callback: TradeValidatedEvent emitted with encrypted outputs
  │
  ▼
Browser
     8. Polls computation account for Finalized status
     9. RescueCipher decrypts callback outputs
    10. Position opened with verified encrypted params
```

## Files

```
arcium-program/
├── Anchor.toml                              # Anchor workspace config
├── Cargo.toml                               # Rust workspace
├── package.json                             # TypeScript test deps
├── tsconfig.json
├── encrypted-ixs/
│   └── trade_computation.rs                 # Arcis circuit (compiled by arcium build)
├── programs/elemperp-mxe/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs                           # Anchor program (MXE)
└── tests/
    └── elemperp-mxe.ts                      # Full integration test
```

## Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Install Solana CLI (1.18+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 3. Install Anchor CLI (0.32.1)
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.32.1 && avm use 0.32.1

# 4. Install Arcium CLI
cargo install arcium-cli

# 5. Configure Solana for Devnet
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2

# 6. Install TypeScript deps
npm install
```

## Deploy

```bash
# Step 1: Initialise Arcium MXE for this program
arcium init

# Step 2: Build the Arcis circuit (trade_computation.rs → compiled circuit)
arcium build

# Step 3: Upload the compiled circuit to Arcium network
arcium upload-circuit encrypted-ixs/trade_computation.rs

# Step 4: Build the Anchor program
anchor build

# Step 5: Deploy to Devnet
anchor deploy --provider.cluster devnet

# Step 6: Initialise the computation definition on-chain
# (runs initValidateTradeCompDef instruction once)
npx ts-node -e "
const anchor = require('@coral-xyz/anchor');
const { Connection, clusterApiUrl } = require('@solana/web3.js');
// ... init script
"

# Step 7: Update src/lib/arcium.ts with your deployed program ID
# Replace: buildTradeInstruction(payer, ARCIUM_PROGRAM_ID, ...)
# With:    buildTradeInstruction(payer, new PublicKey('YOUR_PROGRAM_ID'), ...)
```

## Run Integration Tests

```bash
# Requires deployed program and funded wallet
npm test
```

The test will:
1. Init the validate_trade computation definition
2. Encrypt a sample trade ($500 USDC, 10×, long SOL)
3. Queue it via the on-chain program
4. Wait for the Arcium MPC cluster to compute
5. Decrypt and verify the output (margin, fee, liq prices)

## Arcis Circuit: trade_computation.rs

The circuit defines what the MPC cluster computes on encrypted data:

```rust
pub fn validate_trade(
    inputs: Enc<Shared, TradeInputs>,  // encrypted
    mark_price: u64,                    // public (oracle)
) -> Enc<Shared, TradeOutputs>         // encrypted result
```

**Inputs (all encrypted):**
- `size`         — USDC notional × 1e6
- `leverage`     — multiplier × 1e6
- `direction`    — 1_000_000 = long, 0 = short
- `stop_loss`    — price × 1e6 (0 if not set)
- `take_profit`  — price × 1e6 (0 if not set)

**Outputs (encrypted back to client):**
- `margin`          — required margin = size / leverage
- `fee`             — 0.08% of notional
- `liq_price_long`  — mark × (1 - 0.9/leverage)
- `liq_price_short` — mark × (1 + 0.9/leverage)
- `is_valid`        — 1 if size ≥ $1 and leverage ≤ 50, else 0

## Connecting to the Frontend

Once deployed, update `src/lib/arcium.ts`:

```ts
// Replace ARCIUM_PROGRAM_ID in buildTradeInstruction with your MXE program:
const MXE_PROGRAM_ID = new PublicKey('YOUR_DEPLOYED_PROGRAM_ID');

export async function prepareArciumTrade(connection, params) {
  const payload = await encryptTradeParams(connection, params);
  const instruction = buildTradeInstruction(
    PublicKey.default,
    MXE_PROGRAM_ID,   // ← your deployed MXE program
    payload,
    params.markPrice,
  );
  return { payload, instruction };
}
```

The browser will then:
1. Call `prepareArciumTrade` → encrypts params + builds instruction
2. Sign and send the instruction via the connected wallet
3. Call `awaitAndDecryptResult` → polls computation account, decrypts result
4. Display margin, fee, liquidation price from the MPC computation

## References

- [Arcium Docs — Computation Lifecycle](https://docs.arcium.com/developers/computation-lifecycle)
- [Arcium Docs — JS Client Library](https://docs.arcium.com/developers/js-client-library)
- [Arcium Docs — Arcis Circuits](https://docs.arcium.com/developers/arcis)
- [Arcium Docs — Program Integration](https://docs.arcium.com/developers/program)
- [Arcium Hello World Example](https://github.com/arcium-hq/examples)
