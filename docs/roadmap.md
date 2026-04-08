# Delivery Roadmap

## Phase 1: Foundation

- Create the monorepo structure and contributor guidance
- Stand up the FastAPI service, web shell, and mobile shell
- Define environment variables, data contracts, and starter testing patterns

## Phase 2: Intake and extraction

- Add file and URL submission endpoints
- Support PDF, DOCX, and image normalization
- Persist uploads and extracted text
- Introduce job lifecycle states and retry-safe processing

## Phase 3: Payments and gating

- Integrate Paystack checkout initiation
- Verify payment status server-side
- Gate analysis behind verified payment
- Capture reconciliation events for admin reporting

## Phase 4: AI analysis and structured results

- Add Claude-driven structured analysis
- Store normalized summary payloads
- Render results in the web app
- Define disclaimer acceptance and escalation messaging

## Phase 5: Risk intelligence

- Expand deterministic risk rules
- Blend rule output with AI findings
- Tune thresholds using real sample contracts
- Add analytics for risk distribution and model cost

## Phase 6: WhatsApp channel

- Add webhook handling and message-state tracking
- Support document intake, payment, delivery, and follow-up inside chat
- Reuse the same job and conversation models as web and mobile

## Phase 7: Follow-up and subscriptions

- Track free question usage per contract
- Persist context-aware conversation history
- Introduce upsell prompts and future-ready subscription entitlements

## Phase 8: Admin operations

- Build dashboards for jobs, failures, payments, and usage
- Add manual resend and intervention tools
- Surface observability, error, and AI-spend signals in one place

## Phase 9: Hardening for launch

- Test across document formats and markets
- Improve OCR accuracy and failure recovery
- Perform performance and load testing
- Finalize compliance copy and retention settings

