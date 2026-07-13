---
name: Clerk multi-tenancy workaround
description: Replit-managed Clerk provisions individual user identity only, with no built-in organization/tenant concept -- how to build multi-tenant SaaS on top of it.
---

Replit-managed Clerk (the whitelabeled Clerk integration set up via `setupClerkWhitelabelAuth()`) authenticates individual users only. It does not expose organizations, teams, or tenants as a first-class concept the way a standalone Clerk dashboard project might.

**Rule:** For a multi-tenant SaaS built on Replit-managed Clerk, implement tenancy entirely in your own database:
- An `organizations` table (or equivalent) is the tenant boundary.
- A `memberships` table maps `clerkUserId -> organizationId` (+ role).
- Every tenant-scoped table carries `organizationId`, resolved server-side from the authenticated membership -- never accepted from the client in request bodies.
- On first authenticated request from a new Clerk user, JIT-provision a personal organization + owner membership (and any sensible default rows, e.g. default pipeline/category records) inside a DB transaction, in an auth middleware that runs before route handlers.

**Why:** Discovered while building a CRM that needed org-based data isolation on top of Clerk auth -- there is no native "create organization" or "invite to org" API to lean on in this setup; full team/multi-member invite flows are a separate feature to build later if needed.

**How to apply:** Whenever a project needs multi-tenant isolation and uses Replit-managed Clerk for auth, reach for this JIT personal-org pattern rather than searching for a Clerk organizations API.
