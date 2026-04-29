# Cheka App Progress

_Status snapshot: 21 April 2026_

## Executive Summary

Cheka is no longer just a landing page plus mock analysis. The repository now contains a shared contract-review flow across web, mobile, and API with real job creation, payment preparation, background processing hooks, structured result retrieval, and follow-up handling.

The product is best described as an `advanced prototype / integration build`:

- strong enough for internal demos and realistic product walkthroughs
- meaningfully beyond a static prototype because the API, state machine, and shared data contracts exist
- not yet ready for public launch because persistence, queueing, WhatsApp automation, admin tooling, and observability are still incomplete

The most important reality check is timing: the PRD still targets **1 May 2026**, but the current build still has several launch-critical gaps. Cheka has a believable v1 product shape, but not launch-grade operational maturity yet.

## Status Legend

- `Complete`: implemented and meaningfully usable for the intended slice
- `In progress`: core flow exists, but important production work is still open
- `Partial`: some infrastructure or UX is present, but it is not yet the default or hardened path
- `Started`: scaffolding or basic hooks exist, but the real workflow is not complete
- `Not started`: little to no meaningful implementation yet

## Headline Assessment

- Current stage: `advanced prototype / integration build`
- Strongest areas: shared job model, API-backed intake and payment flow, deterministic risk scoring, structured results, follow-up limits, and usable web/mobile demo experiences
- Weakest areas: launch infrastructure, persistent runtime defaults, WhatsApp completion, admin operations, and monitoring
- Launch risk for 1 May 2026: `high` unless scope is narrowed or the remaining platform work is completed quickly

## What Works Today

The following product slice is already real in the repository:

1. A user can submit contract text from web or mobile and create a review job.
2. When the API is configured, the same clients can also submit a public URL or upload a file.
3. The backend can create the job, prepare checkout, confirm payment, and move the job into processing.
4. Processing produces a structured result with summary, key points, red flags, risk score, obligations, duration terms, cancellation terms, and recommended actions.
5. Completed jobs support follow-up questions with a three-question free limit.
6. The job lifecycle can move through `pending`, `payment_pending`, `processing`, `completed`, and `failed`.
7. Failed paid jobs can be retried from the API.
8. Payment confirmation can come from a direct API call or from a Paystack webhook.
9. Internal ops can filter jobs, inspect details, view queue and risk snapshots, manually confirm stuck payments, and retry failed paid jobs from the web admin surface.

What this does **not** mean yet:

- there is no Redis-backed worker system
- Supabase is not yet enforced as the default live backend in every environment
- WhatsApp is not yet a full end-to-end customer channel
- there is no full admin dashboard
- observability and launch hardening are still thin

## Recent Progress Beyond The Earlier Prototype

Compared with a simpler preview-only implementation, the repository now includes:

- explicit job lifecycle states instead of a single happy-path preview result
- separate API endpoints for text intake, URL intake, and file intake
- checkout-session initialization and webhook-aware payment processing
- retry support for failed jobs
- job listing and retrieval endpoints
- payment-status and market filtering on job listing for internal operations
- filter-aware job metrics for internal queue and risk visibility
- a Supabase-backed store in addition to the in-memory store
- a first-pass database schema for jobs, payments, conversations, and messages
- document extraction helpers for PDFs, DOCX files, and OCR-capable image inputs
- structured follow-up handling with conversation history and free-tier limits
- mobile screens for submission, payment progression, result review, and follow-up

## Delivery Scorecard

| Area | Status | Current Assessment |
| --- | --- | --- |
| Web app | `In progress` | The main web experience is usable through a rich preview studio, but it is still a prototype-style surface rather than a production route set. |
| Mobile app | `In progress` | Core submission and review flows exist, and local device persistence now keeps onboarding state and job history across restarts, but authenticated history is still not in place. |
| API orchestration | `In progress` | FastAPI routes cover intake, jobs, payments, follow-ups, retries, and webhooks, but background execution is still lightweight. |
| Persistence | `Partial` | In-memory and Supabase-backed stores both exist; live persistence is not yet fully enforced. |
| Payments | `Partial` | Paystack initialization and webhook verification exist, but live checkout and reconciliation still need full validation. |
| AI analysis and risk scoring | `In progress` | Deterministic rules are implemented and optional Claude enrichment exists, with safe fallback behavior when live AI dependencies are missing. |
| WhatsApp channel | `Started` | Webhook verification and placeholder handling exist, but the end-to-end WhatsApp product flow is not done. |
| Admin and operations | `Partial` | A minimal internal web jobs studio now covers filtered list, queue and risk snapshots, detail, manual payment confirmation, refresh, and retry actions, but broader payments visibility and intervention tooling are still missing. |
| Testing | `Partial` | Backend tests exist for core service behavior, but web, mobile, and full end-to-end testing are still missing. |
| Launch hardening | `Not started` | Observability, load testing, failure recovery, and launch-readiness work remain largely open. |

## Progress By Surface

### Web App (`apps/web`)

Status: `In progress`

Built now:

- Next.js app shell with landing page and product positioning
- `PreviewStudio` flow that acts as the current primary product demo surface
- sample contract loading for guided demos
- contract name, customer email, market, and input-type controls
- text submission flow
- URL submission flow when the external API is configured
- file upload submission flow when the external API is configured
- disclaimer acceptance gate before analysis is unlocked
- checkout preparation and checkout-link handling
- manual payment confirmation step
- retry action for failed paid jobs from the web preview studio
- env-gated internal admin route for filterable job list, queue and risk snapshots, detail, manual payment confirmation, refresh, and retry operations
- structured result rendering for:
  - summary
  - key points
  - recommended actions
  - financial obligations
  - duration terms
  - cancellation terms
  - red flags
  - risk score and classification
- follow-up question input plus rendered conversation history
- visible handling for unpaid, processing, completed, and failed states
- demo-engine fallback when the API is not configured

Important maturity notes:

- The web flow is concentrated inside a single preview studio component, which is good for demos but not yet the same as a production upload-to-results journey.
- The payment UX is still semi-manual because the UI prepares checkout and then asks the user to confirm payment after checkout.
- There is no authenticated user account model, no saved result history, and no durable user retrieval flow.
- There is no dedicated web test suite yet.

Overall assessment:

The web app is already convincing as a prototype and a useful integration client, but it is not yet shaped like a full production customer app.

### Mobile App (`apps/mobile`)

Status: `In progress`

Built now:

- Expo Router application shell
- onboarding screen
- tab layout with home and history surfaces
- submission screen for contract intake
- review screen for job state, payment, results, and follow-up
- market selection for South Africa and Kenya
- text intake flow
- URL intake flow when the API is configured
- device document picker flow for file upload when the API is configured
- disclaimer acceptance gate
- checkout preparation and external checkout opening
- payment confirmation flow
- structured result rendering through shared analysis components
- processing-state and failed-state handling
- retry action for failed paid jobs from the mobile review screen
- follow-up messaging UI
- local device persistence for onboarding state and job history
- detail-screen refresh for API-backed jobs when the review screen regains focus
- local demo/API split similar to the web client

Current limitations:

- There is no authenticated sync for cross-device history.
- There are no mobile automated tests yet.
- WhatsApp and mobile are not yet connected into a single continuation flow.

Overall assessment:

The mobile app is meaningfully ahead of a shell. It can already act as a serious client for the API-backed flow, and it now survives cold starts more credibly, but it still needs authenticated sync and launch polish before it can be considered a finished user product.

### API (`services/api`)

Status: `In progress`

Built now:

- FastAPI application with router composition in `app/main.py`
- health route
- jobs routes
- webhook routes
- endpoint coverage for:
  - preview analysis
  - preview intake
  - URL intake
  - file intake
  - list jobs
  - get job
  - checkout-session initialization
  - confirm payment
  - retry failed jobs
  - follow-up questions
- job lifecycle state machine with:
  - `pending`
  - `payment_pending`
  - `processing`
  - `completed`
  - `failed`
- background processing handoff through FastAPI `BackgroundTasks`
- shared processing path for direct payment confirmation and webhook-driven confirmation
- deterministic risk engine with explainable factors and weighted scoring
- optional Claude-backed structured analysis with deterministic fallback when AI dependencies or keys are unavailable
- optional Claude-backed follow-up answers with fallback behavior when live AI is unavailable
- in-memory job store
- Supabase-backed job store
- store selector that chooses memory, Supabase, or auto mode based on configuration
- file extraction pipeline for uploaded contracts
- optional storage upload hook after file intake

Important implementation details:

- File intake depends on `python-multipart`; when that dependency is missing, the file route returns a service-unavailable response instead of silently failing.
- Payment initialization can return a mock checkout URL when a live Paystack secret is not configured.
- Background processing currently calls the job processor inside the API process rather than dispatching work to a dedicated queue worker.
- Paystack webhook verification is implemented, but mock mode intentionally cannot validate signatures as a live system would.

Current gaps:

- No Redis queue or standalone worker process yet
- No guaranteed persistent live store across all environments
- No explicit idempotency layer around all external integrations yet
- No admin-facing operational API beyond basic listing and retry functionality
- Logging and error reporting are still minimal

Overall assessment:

The API has the strongest functional progress in the repository. It already expresses the real product model, but the runtime architecture is still prototype-grade in a few critical places.

## Data, Integrations, And Infrastructure Progress

Status: `Partial`

Implemented or scaffolded:

- initial SQL migration for:
  - `jobs`
  - `payments`
  - `conversations`
  - `messages`
- Supabase-backed job and conversation persistence model
- Supabase storage upload helper
- Paystack transaction initialization service
- Paystack webhook signature verification
- WhatsApp service wrapper
- configuration-driven job-store selection
- shared response schemas used by clients and backend

What is partially complete:

- Supabase support exists, but the app still falls back to in-memory storage in auto mode when live Supabase configuration is not present.
- File storage upload is best-effort and not yet a required success path.
- Live payments can be initiated, but reconciliation and edge-case handling still need validation.
- Background execution exists, but it is still in-process rather than queue-backed.

What is still missing:

- Redis-backed queueing
- standalone worker service
- durable retry and dead-letter strategy
- launch-grade audit and observability stack
- analytics integration such as Sentry or PostHog
- formal retention and deletion controls at product level

## WhatsApp Progress

Status: `Started`

Implemented now:

- webhook verification endpoint for Meta challenge flow
- inbound webhook endpoint
- detection of inbound text messages
- detection of inbound document and image messages
- placeholder outbound responses through the WhatsApp service wrapper

Still missing before the WhatsApp channel matches the PRD:

- automatic job creation from uploaded chat documents
- payment-link generation inside the conversation flow
- verified mapping from payment success back to the WhatsApp conversation
- in-chat delivery of the completed structured result
- follow-up answers that reuse the same persistent conversation and job state
- subscription or upsell logic inside chat

Overall assessment:

WhatsApp has crossed from zero to scaffold, but it is not yet a customer-usable channel.

## Admin And Operations Progress

Status: `Partial`

Implemented now:

- job listing endpoint with optional status filtering
- job listing endpoint with optional payment-status and market filtering
- job metrics endpoint for internal operations snapshots and queue counts
- get-job endpoint for job inspection
- direct payment-confirmation endpoint for internal recovery and operational workflows
- retry endpoint for failed paid jobs
- minimal internal web admin studio for filterable list, queue and risk snapshots, detail refresh, manual payment confirmation, and retry workflows

Still missing:

- payment and revenue visibility
- broader manual resend or intervention tools
- pricing controls
- AI-cost monitoring
- failure dashboards and alerting

Overall assessment:

Operational support has moved beyond API-only access because there is now a first internal UI for core job handling plus queue and risk visibility, but the tooling is still narrow and not yet sufficient for day-to-day launch operations.

## Roadmap Progress By Phase

| Phase | Status | Detailed Assessment |
| --- | --- | --- |
| Phase 1: Foundation | `Complete` | Monorepo structure, contributor guidance, core app shells, shared types, and backend starter testing patterns are in place. |
| Phase 2: Intake and extraction | `In progress` | Text, URL, and file intake flows exist. Document extraction helpers are wired, but storage and resilience still need hardening. |
| Phase 3: Payments and gating | `In progress` | Checkout initialization, direct payment confirmation, and webhook-triggered processing exist, but live production validation is still open. |
| Phase 4: AI analysis and structured results | `In progress` | Structured result contracts are implemented and rendered by both clients, with deterministic fallback and optional Claude enrichment. |
| Phase 5: Risk intelligence | `In progress` | Rule-based scoring and explainable factors are implemented. Thresholds and weights exist, but tuning on real production data has not happened yet. |
| Phase 6: WhatsApp channel | `Started` | Verification and basic inbound handling exist, but the end-to-end chat product is still unfinished. |
| Phase 7: Follow-up and subscriptions | `In progress` | Three free follow-up questions per contract are implemented, but subscription and entitlement logic are not. |
| Phase 8: Admin operations | `Partial` | Basic job retrieval and retry support now exist in both the API and a minimal internal web UI, but broader operational tooling is still missing. |
| Phase 9: Hardening for launch | `Not started` | Observability, performance testing, production safeguards, and launch readiness remain largely open. |

## Testing Status

Status: `Partial`

Current automated coverage:

- backend tests for intake helpers
- backend tests for the deterministic risk engine
- backend tests for job-store behavior
- backend tests for job-state-machine behavior

What the current test picture means:

- the backend core has real automated coverage around the most important deterministic logic
- the repository does not yet have automated confidence around the web UX, mobile UX, or the full integration chain from upload to payment to final result

Still missing:

- web UI tests
- mobile UI tests
- integration tests for file upload to result completion
- webhook-driven payment end-to-end tests
- WhatsApp flow tests
- load and failure-recovery tests

## Launch Readiness View

Ready enough for:

- internal demos
- stakeholder walkthroughs
- API integration iteration
- contract-review UX exploration
- early validation of the shared job and result model

Not yet ready for:

- public consumer launch
- support-heavy operations
- trustworthy payment reconciliation at scale
- production WhatsApp rollout
- launch-date confidence for **1 May 2026**

Why launch readiness is still blocked:

- persistent live infrastructure is not yet the guaranteed default
- async processing is not yet backed by a proper worker system
- admin operations are only partially visible through a narrow internal tool
- observability and analytics are not in place
- the highest-priority access channel in the PRD, WhatsApp, is still incomplete

## Biggest Remaining Gaps

- Make Supabase the enforced backend for live environments and harden that path
- Replace in-process background execution with a real queue and worker service
- Complete live Paystack checkout validation, webhook reconciliation, and failure handling
- Finish end-to-end WhatsApp intake, payment, delivery, and follow-up
- Expand the admin UI from basic job handling into failures, payments, and manual intervention
- Add observability, structured logging, analytics, and alerting
- Add UI and end-to-end tests across the user journey

## Recommended Next Delivery Slice

The strongest next delivery slice is still infrastructure plus one operational surface:

1. Enforce Supabase as the live job backend.
2. Add a real queue and worker process for contract processing and retries.
3. Finish live Paystack reconciliation around the persistent job model.
4. Reuse that same persistent model for WhatsApp jobs.
5. Expand the internal admin screen beyond filtered job handling and basic metrics into payment visibility, failure dashboards, and broader operational coverage.

This sequence reduces the most important launch risk first: not analysis quality, but reliability of paid processing.

## Representative Code Evidence

- Web preview and result flow: `apps/web/app/components/PreviewStudio.tsx`
- Web demo/API bridge: `apps/web/app/lib/preview-demo.ts`
- Mobile submission flow: `apps/mobile/app/submit.tsx`
- Mobile review flow: `apps/mobile/app/job/[id].tsx`
- Mobile local job state: `apps/mobile/lib/store.ts`
- API route composition: `services/api/app/main.py`
- Job routes: `services/api/app/api/routes/jobs.py`
- Webhook routes: `services/api/app/api/routes/webhooks.py`
- Job lifecycle logic: `services/api/app/services/job_state_machine.py`
- Background processor hook: `services/api/app/services/job_processor.py`
- Active in-memory store: `services/api/app/services/job_store.py`
- Supabase-backed store: `services/api/app/services/supabase_job_store.py`
- Job store selector: `services/api/app/services/job_store_selector.py`
- Intake and extraction helpers: `services/api/app/services/intake.py`, `services/api/app/services/document_extractor.py`
- Risk engine and AI merge path: `services/api/app/services/risk_engine.py`
- Follow-up AI fallback path: `services/api/app/services/follow_up.py`
- Paystack integration: `services/api/app/services/paystack.py`
- Storage helper: `services/api/app/services/storage.py`
- Initial schema migration: `services/api/migrations/01_initial_schema.sql`
