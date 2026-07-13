# EduCRM

## Overview
EduCRM is a multi-tenant SaaS CRM built for EdTech micro-schools (tutoring studios, coding bootcamps, language schools, homeschool co-ops) to manage prospective and enrolled families through the enrollment funnel.

MVP scope:
- **Contacts** — family/lead records with notes, source, contact info.
- **Deals / pipeline** — kanban board of enrollment deals across customizable pipeline stages, drag-and-drop stage changes.
- **Tasks** — reminders/follow-ups, optionally linked to a contact or deal.
- **Dashboard** — at-a-glance summary (contacts, open pipeline value, deals won this month, tasks due/overdue, deals by stage).

## Architecture
- **Frontend**: `artifacts/crm` — React + Vite, wouter routing, TanStack Query, shadcn/radix UI. Warm "academic" visual identity (parchment background, deep ivy/forest green, Fraunces + Plus Jakarta Sans typography) — deliberately not generic SaaS blue.
- **Backend**: `artifacts/api-server` — Express 5, OpenAPI-first (`lib/api-spec/openapi.yaml` → Orval codegen → `@workspace/api-client-react` hooks + `@workspace/api-zod` schemas).
- **Database**: `@workspace/db` (Drizzle ORM / PostgreSQL). Tables: `organizations`, `memberships`, `contacts`, `pipeline_stages`, `deals`, `tasks` — all tenant-scoped tables carry `organizationId`.
- **Auth & multi-tenancy**: Replit-managed Clerk handles individual user identity only (email/password + Google). Clerk has no native org/tenant concept in this setup, so multi-tenancy is custom: on every authenticated request, `requireOrg` middleware (`artifacts/api-server/src/middlewares/requireOrg.ts`) looks up the Clerk user's `membership` row, or JIT-provisions a personal `organization` + `membership` (role `owner`) + a default 4-stage pipeline on first sign-in. `organizationId` is derived server-side from the authenticated membership and is **never** accepted from the client in request bodies.

## User preferences
- User has a C#/.NET/MS SQL background; is new to the Replit/Node/TypeScript stack, so explanations should map new concepts to familiar EF Core/ASP.NET equivalents when helpful.
- No project tasks required for this first build; no code review/e2e testing requested unless issues surface.
