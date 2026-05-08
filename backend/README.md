# Deal Ledger Backend

Express + TypeScript backend for the Deal Ledger app.

## Scripts

- `npm run dev` starts the API in watch mode.
- `npm run build` compiles TypeScript into `dist`.
- `npm start` runs the compiled server.
- `npm run prisma:generate` generates the Prisma client.
- `npm run db:check` checks the MongoDB connection.
- `npm run db:push` syncs Prisma models and indexes to MongoDB.
- `npm run prisma:studio` opens Prisma Studio.

## Health Check

```text
GET /api/health
```

## Deal APIs

Money values are accepted and returned as dollar numbers. The database stores them as integer cents.

```text
POST /api/deals
GET /api/deals
GET /api/deals/:id
PUT /api/deals/:id
DELETE /api/deals/:id
```

Example request body:

```json
{
  "dealAmount": 25000,
  "holderFee": 125,
  "clientFee": 150,
  "holderUsername": "Alice_Trader",
  "clientUsername": "Bob_Investor",
  "profit": 900,
  "loss": 0,
  "dealDate": "2026-05-08",
  "status": "PROFIT",
  "notes": "Optional note"
}
```

## Stats APIs

```text
GET /api/stats?range=24h
GET /api/stats?range=weekly
GET /api/stats?range=monthly
GET /api/stats?range=yearly
```

The stats response includes totals, trend percentages, chart data, and recent deals for the dashboard.

## Database

This backend uses Prisma with MongoDB Atlas for data storage.

The database URL is configured in `.env`:

```text
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/deal-ledger?retryWrites=true&w=majority&appName=Cluster0"
```
