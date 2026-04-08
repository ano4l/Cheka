# Repository Guidelines

## Project Structure & Module Organization
Cheka is organized by product surface. `apps/web` holds the Next.js front end for the public site and, next, the upload-to-results journey. `apps/mobile` is an Expo shell intended for mobile-first intake and summary delivery. `services/api` contains the FastAPI backend; keep request models in `app/schemas`, HTTP routes in `app/api/routes`, and business logic such as risk scoring in `app/services`. Product and delivery context lives in `docs`, and those documents should be updated when scope or architecture changes materially.

## Build, Test, and Development Commands
Install JavaScript dependencies from the repo root with `npm install`. Run the web app with `npm run dev:web`, build it with `npm run build:web`, and lint it with `npm run lint:web`. Start the Expo app with `npm run dev:mobile`. For the backend, install editable Python dependencies with `python -m pip install -e services/api[dev]`, run the API with `npm run dev:api`, and execute the current backend test suite with `npm run test:api`.

## Coding Style & Naming Conventions
TypeScript components and screens should use PascalCase exports, while utility functions and route helpers should stay in camelCase. The web app uses the Next.js App Router plus Tailwind CSS, so prefer server-friendly composition and keep styling tokens centralized in `app/globals.css`. In Python, use typed functions, small service modules, and Pydantic models as the contract at API boundaries. Keep risk rules deterministic and data-oriented so they are easy to test before AI enrichment is added.

## Testing Guidelines
Backend tests use `pytest` from `services/api/tests`; add focused unit tests whenever risk weights, thresholds, or text-matching rules change. Web and mobile tests are not scaffolded yet, so introduce them alongside the first interactive flows rather than as placeholder suites.

## Commit & Pull Request Guidelines
This directory is not a git repository yet, so no local commit history or PR template exists to infer conventions from. Once version control is initialized, keep commits scoped to a single surface or feature area so product, API, and mobile changes remain easy to review.

