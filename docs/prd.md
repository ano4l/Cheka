# Cheka PRD

## Executive summary

Cheka is an AI-powered contract intelligence platform that helps everyday users understand agreements before signing them. Users can upload a document, share a link, or send a contract via WhatsApp and receive:

- a plain-language summary
- 3 to 5 key points
- highlighted red flags
- a risk score with a clear classification
- follow-up answers within a limited free tier

The v1 launch is designed around accessibility, trust, and affordability for South Africa and Kenya, with WhatsApp as the most important access channel.

## Product objectives

### Primary objective

- Help users understand contracts quickly
- Surface risks clearly
- Support confident, informed decisions

### Secondary objectives

- Establish a scalable legal-assist platform
- Earn trust as a consumer-first protection tool
- Create a path toward B2B and enterprise use cases

## Target market

### Initial markets

- South Africa
- Kenya

### Primary users

- Students
- Young professionals
- Tenants
- Entry-level employees
- Everyday consumers

### Secondary users

- Small businesses
- HR teams
- Legal-lite enterprise users

## Product scope for v1

### Inputs

- PDF
- DOCX
- JPG, JPEG, PNG
- public URLs

### Outputs

- plain-language summary
- 3 to 5 key points
- red flags
- numeric risk score plus classification
- 3 free follow-up questions
- legal disclaimer acknowledgement

### Platforms

- web application
- WhatsApp bot
- React Native mobile application

## Core features

### User features

- Contract submission by upload, URL, or WhatsApp
- AI analysis with structured summaries and red flags
- Risk score from 0 to 100 with low, medium, or high classification
- Three free follow-up questions per contract
- Pay-per-use checkout with Paystack and Apple Pay through Paystack
- Trust flows including disclaimer acceptance and escalation guidance

### WhatsApp features

- document submission inside chat
- payment link generation
- summary and red-flag delivery in chat
- follow-up interaction in chat
- subscription upsell messaging

### Admin features

- processing job visibility
- failed-job monitoring
- payment and revenue tracking
- risk-distribution analytics
- summary resend tools
- AI cost and system-usage monitoring
- dynamic pricing controls

## Technical direction

### Frontend

- Next.js with TypeScript
- Tailwind CSS
- React Hook Form
- Zod

### Mobile

- React Native with Expo
- Zustand
- TanStack Query

### Backend

- Python 3.12
- FastAPI
- Pydantic
- Uvicorn

### AI and document processing

- Claude API
- PyPDF or PyPDF2
- python-docx
- pytesseract
- Pillow
- pdf2image

### Infrastructure

- Supabase PostgreSQL
- Redis
- Supabase Storage or Cloudflare R2
- Paystack
- WhatsApp Business API
- Vercel plus Railway or Render
- GitHub Actions
- Sentry
- PostHog

## System flows

### Web flow

1. User submits a contract.
2. The system validates the input and creates a pending job.
3. The user completes payment.
4. Payment is verified server-side.
5. The platform extracts text, runs AI analysis, and evaluates risk.
6. The result is generated and shown to the user.
7. Follow-up questions become available.

### WhatsApp flow

1. User starts a chat and sends a contract.
2. The system generates a payment link.
3. Payment is verified.
4. Processing begins.
5. Results are sent back in chat.
6. Follow-up questions remain in the same conversation context.

## Risk engine

Cheka uses a hybrid model:

- AI to detect nuanced language and summarize intent
- rules to catch known patterns consistently

Initial rule focus:

- auto-renewal clauses
- cancellation penalties
- hidden fees
- non-compete clauses
- long-term lock-ins
- liability imbalance
- arbitration clauses

## Data model

### Jobs

- `id`
- `status`
- `input_type`
- `extracted_text`
- `summary_data`
- timestamps

### Payments

- `reference`
- `status`
- `amount`
- `email`

### Conversations

- `job_id`
- `question_count`

### Messages

- `role`
- `content`
- `timestamp`

## Non-functional requirements

- fast upload validation
- acceptable processing latency
- scalable infrastructure
- idempotent processing
- retries for recoverable failures
- secure uploads and protected endpoints
- role-based admin access
- logging, error tracking, and performance monitoring

## Launch target

Target launch remains **1 May 2026**.

