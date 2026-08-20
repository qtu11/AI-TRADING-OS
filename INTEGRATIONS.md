# AI TRADING OS — MetaTrader 5 & External Integrations

## MetaTrader 5 Bridge Architecture

The MT5 integration layer enables non-intrusive historical trade syncing and live floating position monitoring.

```
[MetaTrader 5 Terminal] (Desktop / VPS)
         │
         │ REST API / WebSocket
         ▼
[MT5 Bridge Service] (Python / Node.js EA)
         │
         │ HTTP POST /api/mt5/sync
         ▼
[AI TRADING OS Next.js Backend]
         │
         │ 1. Ingestion Validation
         │ 2. Deduplication Check (Unique Ticket ID)
         │ 3. Normalization (Forex / Gold Specs)
         ▼
[Firebase Firestore] (Persistent Subcollection)
```

---

## 1. Connecting MT5

1. Navigate to `/integrations` in the navigation sidebar.
2. Enter your **Account Number** (e.g. `50123984`) and **Broker Server Name** (e.g. `ICMarketsSC-Live`).
3. Provide your **Investor (Read-Only) Password**.
4. Click **Connect MT5 Account**.

---

## 2. Deduplication Protection

To avoid duplicate record imports:
- Each incoming record is keyed by `externalTradeId = "mt5-{ticket}"`.
- The synchronization handler (`filterDuplicateTrades`) checks against all existing tickets in Firestore before persisting new entries.
- If a ticket already exists, its latest execution data (such as exit price and close time) is updated without altering original timestamps.

---

## 3. Webhook Integration

External bridge servers can send trade close payloads directly to `/api/mt5/webhook`:

```json
{
  "secret": "YOUR_MT5_API_KEY",
  "userId": "user_id_here",
  "trade": {
    "ticket": 98234120,
    "symbol": "EURUSD",
    "type": "BUY",
    "volume": 1.0,
    "openPrice": 1.0850,
    "closePrice": 1.0880,
    "sl": 1.0820,
    "tp": 1.0890,
    "profit": 300.0,
    "commission": -3.5,
    "swap": 0.0,
    "openTime": 1755331200,
    "closeTime": 1755338400
  }
}
```
