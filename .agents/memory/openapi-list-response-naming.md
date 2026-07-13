---
name: OpenAPI list-response schema naming collisions
description: Naming rule for OpenAPI component schemas used as array/list API responses, to avoid TS2308 collisions with Orval-generated types.
---

Orval (the OpenAPI → TS codegen tool used in this monorepo) auto-derives a `<OperationId>Response` type for every operation. If you also define an explicit OpenAPI component schema for a list/array response and name it the same way (e.g. an operation `listContacts` plus a component schema literally called `ListContactsResponse`), the generated types collide (TS2308 duplicate export).

**Rule:** Name array/list response component schemas after the entity, not the operation -- e.g. `ContactList`, `DealList`, `TaskList`, `PipelineStageList` -- rather than `List<Entity>Response`.

**Why:** This is the same root cause as the already-documented rule against reusing operation-derived names for request body schemas, but it also applies to list/array response schemas, which is easy to miss since the natural name to reach for is `List<X>Response`.

**How to apply:** Whenever authoring or reviewing an OpenAPI spec that will be fed through the Orval codegen workflow, check every array-typed response component schema name against this pattern before running codegen.
