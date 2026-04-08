# Technical Architecture

## Product surfaces

Cheka ships across three user-facing surfaces and one internal surface:

- `apps/web` for acquisition, contract upload, checkout, and result review
- WhatsApp as the highest-access distribution channel for conversational submission and delivery
- `apps/mobile` for mobile-first users and document sharing from other apps
- an internal admin dashboard for jobs, failures, payments, pricing, and analytics

## Core services

### API gateway and orchestration

FastAPI is the central entry point for web, mobile, admin, and webhook traffic. It owns:

- request validation
- job creation
- payment verification hooks
- dispatch to extraction and AI pipelines
- follow-up conversation routing

The current prototype already includes a preview-job slice with intake creation, mock payment confirmation, structured preview generation, and a 3-question follow-up limit.

### Document processing service

The extraction layer should normalize every input into plain text plus metadata:

- PDFs through `pypdf`
- DOCX through `python-docx`
- images through OCR with `pytesseract`
- URLs through a fetch-and-clean pipeline

Persist the raw upload separately from the normalized text so retries do not require a new user submission.

### AI analysis engine

AI output should be constrained into a structured JSON contract:

- summary
- key points
- red flags
- financial obligations
- duration and renewal terms
- cancellation terms
- confidence notes

This JSON becomes the canonical payload rendered by web, mobile, and WhatsApp.

### Risk engine

The risk engine should combine:

- deterministic clause detection for known risk patterns
- AI-derived clause interpretation for nuanced language
- weighted scoring capped at 100

Suggested launch thresholds:

- `0-24`: low
- `25-59`: medium
- `60-100`: high

Escalation messaging should appear automatically for high-risk outputs.

## Data model boundaries

### Transactional data

Store jobs, payments, conversations, and message history in Supabase Postgres.

### Temporary and derived data

- uploads in object storage
- OCR and parsed artifacts in object storage or structured JSON columns
- short-lived caches and rate limits in Redis

### Deletion and retention

Support immediate user-requested deletion and keep retention windows configurable per market and policy version.

## Integration map

### External systems

- Paystack for checkout and verification
- WhatsApp Business API for messaging
- Supabase for Postgres, auth, and storage
- Claude API for structured contract analysis
- Sentry and PostHog for observability and product analytics

## Delivery architecture

### Hosting split

- Vercel for the Next.js app
- Railway or Render for the FastAPI backend and worker processes
- managed Redis for rate limiting, short-lived state, and follow-up context support

## Implementation notes

- Keep intake idempotent by keying jobs to a stable upload hash plus payment reference.
- Separate synchronous API validation from asynchronous processing so uploads stay fast.
- Treat WhatsApp and web as first-class clients of the same job model rather than bespoke flows.
- Version the AI response schema early to preserve backward compatibility as output quality improves.
