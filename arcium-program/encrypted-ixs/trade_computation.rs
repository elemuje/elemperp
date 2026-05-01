use arcis::*;

/// Input struct for ELEMPerp trade computation.
/// All fields are encrypted — no node in the MPC cluster
/// ever sees plaintext values.
///
/// Values are scaled by 1_000_000 (6 decimal places) before
/// encryption on the client side, so:
///   size       = USDC notional × 1e6  (e.g. $500 → 500_000_000)
///   leverage   = multiplier × 1e6     (e.g. 10×  → 10_000_000)
///   direction  = 1_000_000 for long, 0 for short
///   stop_loss  = price × 1e6, or 0 if not set
///   take_profit = price × 1e6, or 0 if not set
pub struct TradeInputs {
    pub size:        u64,
    pub leverage:    u64,
    pub direction:   u64, // 1_000_000 = long, 0 = short
    pub stop_loss:   u64,
    pub take_profit: u64,
}

/// Output struct returned by the MPC cluster after computation.
/// All values remain encrypted — only the holder of the client
/// private key can decrypt via RescueCipher.decrypt().
///
///   margin           = size / leverage  (USDC × 1e6)
///   fee              = size × 8 / 10000 (0.08% trading fee × 1e6)
///   liq_price_long   = entry × (1 - 0.9/leverage) × 1e6
///   liq_price_short  = entry × (1 + 0.9/leverage) × 1e6
///   is_valid         = 1 if trade params pass validation, 0 otherwise
pub struct TradeOutputs {
    pub margin:         u64,
    pub fee:            u64,
    pub liq_price_long: u64,
    pub liq_price_short: u64,
    pub is_valid:       u64,
}

#[encrypted]
mod circuits {
    use arcis::*;
    use super::{TradeInputs, TradeOutputs};

    /// ELEMPerp trade validation circuit.
    ///
    /// Takes encrypted trade parameters and computes:
    ///   1. Required margin (size / leverage)
    ///   2. Trading fee (0.08%)
    ///   3. Liquidation prices for both long and short
    ///   4. Validity check (size > 0 && leverage in [1, 50])
    ///
    /// The MPC cluster computes ALL of this on encrypted data.
    /// The computation result is returned encrypted back to the client.
    ///
    /// mark_price is passed as a plaintext u64 (scaled × 1e6) because
    /// it is public data derived from the oracle feed.
    #[instruction]
    pub fn validate_trade(
        inputs: Enc<Shared, TradeInputs>,
        mark_price: u64,
    ) -> Enc<Shared, TradeOutputs> {
        // Decrypt inputs into secret shares — MPC nodes never see plaintext
        let trade = inputs.to_arcis();

        let scale: u64 = 1_000_000;

        // ── Margin: size / leverage ────────────────────────────────────
        // Both size and leverage are scaled × 1e6, so:
        //   margin = (size × scale) / leverage
        let margin = (trade.size * scale) / trade.leverage;

        // ── Fee: 0.08% of notional ─────────────────────────────────────
        // 0.08% = 8 / 10000
        let fee = (trade.size * 8) / 10_000;

        // ── Liquidation price (long): entry × (1 - 0.9/leverage) ──────
        // Scaled arithmetic: liq = mark × (leverage - 0.9×scale) / leverage
        // 0.9 × scale = 900_000
        let liq_price_long = if trade.leverage > 900_000 {
            (mark_price * (trade.leverage - 900_000)) / trade.leverage
        } else {
            0u64
        };

        // ── Liquidation price (short): entry × (1 + 0.9/leverage) ─────
        let liq_price_short = (mark_price * (trade.leverage + 900_000)) / trade.leverage;

        // ── Validity check ─────────────────────────────────────────────
        // size > 0 (min $1 = 1_000_000 scaled) AND leverage ≤ 50_000_000 (50×)
        let min_size: u64     = 1_000_000;
        let max_leverage: u64 = 50_000_000;
        let is_valid: u64 = if trade.size >= min_size && trade.leverage <= max_leverage {
            scale // 1_000_000 represents "true"
        } else {
            0u64
        };

        // ── Re-encrypt outputs ─────────────────────────────────────────
        // from_arcis() encrypts secret shares back to the client's public key
        inputs.owner.from_arcis(TradeOutputs {
            margin,
            fee,
            liq_price_long,
            liq_price_short,
            is_valid,
        })
    }
}
