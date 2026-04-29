# Cheka

Cheka is an AI-powered contract intelligence platform built to help people understand agreements before they sign them. The initial product focuses on South Africa and Kenya, with web and WhatsApp as the primary channels and mobile support close behind.

## Repository layout

- `apps/web`: Next.js marketing site and future upload, payment, and results journey
- `apps/mobile`: Expo starter for mobile intake and summary access
- `services/api`: FastAPI service for intake, orchestration, and risk analysis
- `docs`: product, architecture, and delivery documents derived from the launch PRD

## Starter commands

### Web

```bash
npm install
npm run dev:web
```

Optional:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Set `NEXT_PUBLIC_CHEKA_API_URL` if you want the web preview studio to call the FastAPI service instead of using its built-in demo engine.
Set `NEXT_PUBLIC_ENABLE_ADMIN_STUDIO=true` if you want the internal admin route at `/admin` available in local development for filtered job review, queue and risk snapshots, manual payment confirmation, and retry handling.

### Mobile

```bash
npm install
npm run dev:mobile
```

### API

```bash
python -m pip install -e services/api[dev]
npm run dev:api
npm run test:api
```

## Current foundation

This starter repo intentionally focuses on the product spine instead of pretending the whole platform already exists. The codebase currently includes:

- a polished web landing page with an interactive contract preview studio
- a lightweight Expo shell for the mobile app
- a FastAPI service with preview intake, mock payment unlock, job retrieval, and follow-up question endpoints
- an internal web admin studio for filtered job monitoring, queue and risk snapshots, payment intervention, and retry handling
- a cleaned-up documentation set covering product scope, architecture, and launch sequencing
- a shared launch-oriented risk model implemented in both the API and the web demo flow

## Immediate next milestones

1. Replace the mock checkout step with live Paystack session creation and verification.
2. Expand the API from text-only preview analysis into job-based document processing with storage, OCR, and AI orchestration.
3. Connect Paystack, Supabase, Redis, and WhatsApp webhooks end to end.
4. Expand admin surfaces for payment visibility, reconciliation, and AI cost visibility.
