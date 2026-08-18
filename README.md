# FusionFTP

SFTP invoice export service for Fusion accounting system. Queries Supabase for invoice data, generates Xero-format Excel files, and uploads via SFTP.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` with your credentials

3. Run `supabase-setup.sql` in Supabase SQL Editor

4. Start server:
```bash
npm run dev
```

## API

**POST** `/api/v1/invoices/export` - Exports next batch of invoices

Header: `x-api-key: YOUR_API_KEY`

## Cron

Runs every Monday at 08:00 SAST, automatically exporting new invoices.
