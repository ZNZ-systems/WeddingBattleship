# Wedding Battleship Pro – Implementation Plan

This roadmap breaks the strategic vision into pragmatic engineering phases. Each phase
builds on the existing Create React App codebase and moves us toward the fully fledged
Next.js SaaS platform outlined in the strategy.

## Phase 0 – Stabilise the current editor (Weeks 1-2)
- [x] Introduce deterministic plan state management with history to unblock
      future versioning features.
- [ ] Establish automated linting, testing, and formatting baselines.
- [ ] Document coding standards and contribution guidelines.
- [ ] Add telemetry hooks to understand current usage patterns.

## Phase 1 – Platform foundations (Weeks 2-6)
- [ ] Migrate the UI shell to Next.js 15 App Router while keeping the seating
      editor embedded as a client component.
- [ ] Convert core modules to TypeScript and define shared domain models.
- [ ] Introduce Clerk authentication with email + social providers on top of
      Supabase Row Level Security.
- [ ] Stand up CI/CD (GitHub Actions) running unit tests, linting, and bundle
      size checks.

## Phase 2 – Collaboration & persistence (Weeks 6-10)
- [ ] Replace direct Supabase writes with an API layer (Next.js route handlers)
      that mediates access and queues heavy jobs.
- [ ] Add Ably-backed CRDT collaboration with optimistic UI updates.
- [ ] Implement Redis/Upstash caching for active sessions and plan snapshots.
- [ ] Ship first iteration of plan versioning: timeline view, labelled saves,
      and restore.

## Phase 3 – Monetisation & multi-tenancy (Weeks 10-14)
- [ ] Launch tiered billing using Clerk Billing + Stripe webhooks.
- [ ] Model organisations, seats, and role-based permissions.
- [ ] Create white-label client portals with custom branding.
- [ ] Add export workflows (PDF/CSV/Excel) backed by Cloudflare R2 storage.

## Phase 4 – Intelligence & analytics (Weeks 14-20)
- [ ] Deliver constraint-based seating optimisation with manual override tools.
- [ ] Build analytics dashboards for professionals (utilisation, satisfaction,
      conversion metrics).
- [ ] Instrument product analytics and churn forecasting pipelines.
- [ ] Introduce template marketplace with revenue sharing.

## Phase 5 – Reliability, compliance, and scale (Weeks 20-26)
- [ ] Harden observability: Sentry, Datadog APM, structured logging, on-call
      playbooks.
- [ ] Implement disaster recovery (backups, runbooks) and SOC 2 controls.
- [ ] Optimise performance via canvas virtualisation, workers, and ISR.
- [ ] Finalise GDPR tooling (export/delete requests, consent flows).

Each phase should conclude with a retrospective to adjust the backlog based on
user feedback and operational insights.
