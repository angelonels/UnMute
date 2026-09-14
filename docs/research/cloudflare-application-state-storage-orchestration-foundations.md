# Cloudflare application state, storage, and orchestration foundations

Research date: 2026-09-14

## Question and scope

This report establishes decision-relevant facts for evaluating Better Auth with Google sign-in, D1, Durable Objects, R2, Queues, Workflows, Workers AI, Vectorize, and portable alternatives for UnMute. It does **not** choose an architecture. The intended product concepts are accounts, Meetings, Live Sessions, Meeting Records, authorization, background processing, retention, and deletion.

The central finding is that these products are complementary primitives, not interchangeable entries in a single database shortlist:

- D1 or an external relational database can hold queryable, durable product truth.
- A Durable Object can serialize the changing state of one live coordination unit and maintain its connections.
- R2 can hold large immutable or append-produced artifacts.
- Queues can buffer independent work that may be delivered more than once.
- Workflows can durably coordinate a named, multi-step process with retries and waiting.
- Workers AI is an inference boundary, not a source of record.
- Vectorize is a derived retrieval index, not canonical meeting knowledge.

UnMute should therefore compare **candidate combinations** and their cross-product failure behavior. Selecting each service in isolation would miss the difficult questions: which store is authoritative, how changes are propagated, how duplicate work is made harmless, and how deletion converges across every derivative.

## Evaluation criteria

Any later architecture decision should demonstrate all of the following with a thin end-to-end spike and documented operational behavior:

1. **Authority:** exactly one authoritative home for each datum; indexes, projections, and live caches are visibly derivative.
2. **Consistency:** the guarantees needed by host admission, role changes, revocation, session ending, and record access are stated explicitly.
3. **Lifecycle:** creation, rescheduling, live activation, finalization, partial failure, retry, cancellation, retention expiry, user deletion, and administrative recovery are modeled.
4. **Idempotency:** every queue consumer, workflow step, artifact finalizer, embedding upsert, and delete operation is safe to repeat.
5. **Isolation:** a meeting/session key provides the coordination and authorization boundary; no global singleton serializes unrelated meetings.
6. **Least privilege:** browser clients never receive database, object-store, AI-provider, or administrative credentials. Short-lived artifact access is authorized server-side.
7. **Portability:** application-facing interfaces express product operations rather than Cloudflare IDs, bindings, model names, or response types.
8. **Operability:** per-meeting correlation, state transitions, retry counts, dead letters, stuck workflows, partial deletion, and cost drivers are observable without logging meeting content or credentials.
9. **Local fidelity:** the team knows which bindings are simulated and which require remote staging resources.
10. **Cost shape:** estimates include reads caused by scans, indexed writes, retries, duplicate deliveries, artifact storage/read operations, workflow state, embedding dimensions, and inference—not only Worker requests.

## Identity and authorization: Better Auth plus Google

Better Auth is a framework-agnostic TypeScript auth framework. Its Hono integration forwards the raw Web `Request` directly to the auth handler; on Cloudflare Workers the current integration requires `AsyncLocalStorage` support through `nodejs_compat` (or the narrower applicable compatibility flag). Cross-origin cookie auth requires credentialed CORS with a specific origin and the same origin in Better Auth's `trustedOrigins`; `*` is not valid for credentialed requests. [Better Auth: Hono integration](https://better-auth.com/docs/integrations/hono)

Better Auth 1.5 added first-class D1 support: a D1 binding can be passed directly as the database, and Better Auth uses D1 `batch()` where atomic grouped work is needed because D1 does not expose interactive transactions. This is a current capability, but the exact package version and generated schema must be pinned and verified before implementation. [Better Auth 1.5: Cloudflare D1 support](https://better-auth.com/blog/1-5)

Better Auth's ordinary mode uses a server-side session referenced by a cookie. Sessions expire after seven days by default and refresh after `updateAge`; they can be listed and revoked. Cookie caching can reduce reads, but it introduces a bounded revocation delay equal to the cache window. Fully stateless sessions make targeted invalidation difficult; changing a cookie-cache version invalidates all sessions rather than one. A secondary store changes where sessions live unless `storeSessionInDatabase` is enabled, so adding one is a semantic decision, not merely a cache optimization. [Better Auth: session management](https://better-auth.com/docs/concepts/session-management)

Better Auth does not encrypt provider access or refresh tokens in the database by default. If UnMute later requests Calendar scopes and persists Google tokens, token encryption, key rotation, scope minimization, revocation behavior, and deletion must be explicit. [Better Auth: users and accounts](https://better-auth.com/docs/concepts/users-accounts)

Google's web-server OAuth flow requires the callback URI to match an authorized redirect URI exactly. Google recommends CSRF protection using state, minimal scopes, and incremental authorization; refresh tokens can be revoked or expire. Authentication should initially ask only for identity scopes. Calendar access should be a separate, contextual consent so a user can sign in even if they decline scheduling integration. [Google: OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server), [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)

### Boundary implications

- Treat Better Auth as the identity/session mechanism. Keep meeting roles and authorization policies in UnMute's domain because organizer, host, co-host, participant, invited identity, guest, and record viewer are meeting-scoped concepts.
- A guest display name is not an account and must not become durable proof of identity. Admission can create a session-scoped participant principal with a short-lived signed grant bound to a specific Live Session.
- A successful Better Auth session establishes an account identity; it does not by itself authorize any Meeting Record. Handlers must call application policies using the authenticated account or guest principal.
- Preserve provider subject identifiers in the auth account model. Do not use email or display name as the stable authorization key.
- Keep Google tokens out of generic user/session responses and logs. If calendar integration is absent, do not retain unnecessary Google API tokens.

### Identity candidates to compare later

1. **Better Auth + D1:** fewest moving parts and direct Worker binding; evaluate migrations, D1 write latency from expected users, session-refresh write volume, adapter behavior under concurrent callbacks, and rollback/recovery.
2. **Better Auth + managed PostgreSQL through Hyperdrive:** standard relational tooling and a broader portability path, at the cost of another managed service and network/control plane. Hyperdrive supports managed PostgreSQL/MySQL providers including Neon and Supabase, but does not support PostgreSQL advisory locks or `LISTEN`/`NOTIFY`; those cannot be assumed in designs routed through it. [Cloudflare: Hyperdrive supported databases and features](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)
3. **Managed identity provider + either database:** outsource identity operations and account security while retaining meeting authorization in UnMute. Compare guest flows, exportability, pricing at active-user scale, webhook reliability, local/test story, and provider lock-in. Do not choose this solely because it reduces initial code.

## Relational product truth: D1

D1 is SQLite-based and accessed from Workers through a binding. On Workers Paid, current published limits include 50,000 databases per account, 10 GB per database, 1 TB total account storage, 1,000 D1 queries per Worker invocation, 30-second maximum SQL query duration, and 2 MB maximum BLOB/string/row size. Each individual D1 database is single-threaded and processes queries one at a time; overload is queued until capacity is exhausted, then returns an overloaded error. Cloudflare explicitly positions scale-out across multiple smaller databases. [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

On Workers Paid, D1 currently includes 25 billion rows read, 50 million rows written, and 5 GB stored per month; overages are priced per rows read/written and GB-month. Indexes reduce scanned rows but add writes. There is no D1 egress charge. These metrics mean an unindexed query can be financially and operationally expensive even if it returns one row. [Cloudflare Workers pricing: D1](https://developers.cloudflare.com/workers/platform/pricing/#d1)

D1 runs in auto-commit. `batch()` executes statements sequentially and treats the batch as a transaction: failure aborts or rolls back the sequence. Better Auth's D1 support is built around this rather than interactive transactions. [Cloudflare D1 binding API](https://developers.cloudflare.com/d1/worker-api/d1-database/)

Without read replication, a database has one primary location. With read replication enabled, replicas update asynchronously. Applications must use the Sessions API to benefit from replicas and receive sequential consistency; a bookmark gives monotonic reads and read-your-own-writes across logical sessions. Writes still reach the primary. A read that must begin at current primary state can use `first-primary`. [Cloudflare D1 read replication](https://developers.cloudflare.com/d1/best-practices/read-replication/)

D1 Time Travel is always on and supports point-in-time recovery to any minute within 30 days on Workers Paid. A restore overwrites the database in place and cancels in-flight queries; it is disaster recovery, not a substitute for application-level audit, deletion, or a tested backup/export policy. [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

Wrangler provides a standalone local D1 environment running the same D1 version, and migrations are ordered SQL files tracked by the database. Local success still does not test global routing, replica lag, primary-region latency, or overload behavior. [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/), [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

### Fit and cautions for UnMute

D1 is a credible candidate for accounts/auth tables, Meetings, invitations, schedules, durable participant membership, Meeting Record metadata, artifact manifests, authorization grants, processing states, and deletion state. Large transcripts, media, and workflow payloads do not belong in D1 rows; the 2 MB row/value limit reinforces that separation.

Do not use D1 as the event-by-event live-session coordination loop without measuring contention. Admission, role changes, reconnection state, active speakers, media subscription state, and host actions require serial coordination per Live Session and would unnecessarily concentrate transient writes in the global relational store.

Before selection, test:

- Better Auth schema generation/migrations and concurrent OAuth callback/session refresh behavior.
- A single-database design at expected account/meeting write rates, including scheduling hot spots.
- transaction boundaries for meeting creation + invitation and record authorization + grant creation.
- read-after-write behavior with and without Sessions API bookmarks.
- database location latency from expected regions and overloaded/error retry policy.
- export/restore drills and a migration path to PostgreSQL if product requirements outgrow D1.

## Live Session coordination: Durable Objects

A Durable Object is a globally unique, single-threaded instance combining compute and private, transactional, strongly consistent storage. Cloudflare recommends modeling one object per coordination atom and explicitly warns against a single global object. For UnMute, the natural candidate is one object per Live Session, addressed by an opaque stable session ID—not one object for the entire product or necessarily one permanent object per recurring Meeting. [Cloudflare: rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)

SQLite-backed Durable Objects are the recommended backend. On Workers Paid, a SQLite-backed object can store up to 10 GB, object count and aggregate account storage are currently unlimited, CPU defaults to 30 seconds per invocation and can be configured up to five minutes, and received WebSocket messages can be at most 32 MiB. A single object has a soft throughput limit around 1,000 requests/second, highly dependent on work performed. [Cloudflare Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits/)

Durable Object storage is local to that object and is not globally queryable. Cross-object transactions do not exist. This makes it well suited to authoritative **session-local coordination** but unsuitable as the only product catalog. A D1/relational row should locate and describe the Live Session; the object should not be the only place that the application can discover whether a session exists or which account owns its eventual record.

Objects are created on first method invocation. They may hibernate or be evicted, causing their constructor to run again later; hibernatable WebSockets stay connected while the object leaves memory. Consequently, in-memory state is a cache only. Critical admission, role, and session-ending facts must be persisted before being acknowledged, and recovery must rebuild from storage. [Cloudflare: Durable Object lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/)

An object's initial placement is usually close to its first meaningful request and currently does not relocate after creation; premature creation from an unrepresentative region can add lasting latency. Location hints are hints, while `eu`, `us`, and `fedramp` jurisdictional namespaces constrain compute/storage location. [Cloudflare: Durable Object data location](https://developers.cloudflare.com/durable-objects/reference/data-location/)

Each object supports only one current alarm. Alarms are at-least-once and retry an uncaught failure up to six times with exponential backoff. They are useful for a session-local timeout or heartbeat sweep, not as a multi-stage post-meeting pipeline or an unlimited retry system. [Cloudflare Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)

### Failure boundaries to prove

- Reconnect after hibernation/eviction reconstructs participant roles and recording state correctly.
- A duplicated admission or host command is idempotent and carries an operation ID/version.
- The object rejects stale or revoked account/guest grants; authorization refresh rules are explicit.
- External calls are not made while holding broad concurrency blocking. Persist intent, release coordination, then perform retryable side effects through a queue/workflow where appropriate.
- Session finalization has a durable handshake: ending the object emits or records a unique finalization intent, and downstream completion updates relational truth idempotently.
- A dead or partitioned object cannot leave a Meeting permanently “live”; recovery and reconciliation have a defined owner.

## Meeting Record artifacts: R2

R2 is S3-compatible object storage with strongly consistent read-after-write, metadata updates, deletion, and listing. Direct Worker/S3 API readers see writes and deletes immediately; a custom-domain cache can continue serving a deleted or overwritten object until cache expiry or purge, so private Meeting Records should not depend on a public cached URL for authorization or deletion semantics. [Cloudflare R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)

R2 supports unlimited data and objects per bucket, objects up to almost 5 TiB, single-part uploads up to almost 5 GiB, and multipart uploads up to almost 5 TiB. Writes to the same object key above one per second can return 429, so immutable/versioned artifact keys are preferable to repeatedly overwriting a “current” object. [Cloudflare R2 limits](https://developers.cloudflare.com/r2/platform/limits/)

Standard storage currently costs $0.015/GB-month plus Class A mutation and Class B read operations; direct egress is free. Infrequent Access is cheaper per GB but adds retrieval charges and higher operations pricing. Video duration, resolution, participant-track count, renditions, and playback patterns—not merely meeting count—will dominate storage cost. [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

Bucket lifecycle rules can expire objects by prefix and transition storage class. Removal typically happens within 24 hours after expiry rather than at an exact instant. Bucket locks override lifecycle deletion and prevent overwrite/deletion until their retention rule ends. Jurisdiction is fixed when a bucket is created; current restricted jurisdictions include EU and US. [Cloudflare R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/), [Cloudflare R2 bucket locks](https://developers.cloudflare.com/r2/buckets/bucket-locks/), [Cloudflare R2 data location](https://developers.cloudflare.com/r2/reference/data-location/)

### Artifact model implications

- Store media tracks, composed renditions, transcript documents, captions, exports, and large AI outputs under immutable keys containing non-guessable meeting/session/artifact IDs.
- Keep an authoritative artifact manifest in the relational store with kind, version, object key, byte size, checksum, processing state, retention class, and deletion state.
- Never make “knowing the R2 key” authorization. A Worker must authorize each playback/download and issue a bounded access mechanism.
- Multipart uploads need an abandoned-upload cleanup path; R2's default lifecycle expires incomplete multipart uploads after seven days, but UnMute should monitor its own recording/upload state.
- Decide whether source participant tracks are retained after composition. Keeping all participant audio/video indefinitely multiplies cost and deletion surface.

## Background delivery: Queues

Cloudflare Queues decouple producers and consumers and do not delete a message until successful consumption, but delivery is at least once and order is not guaranteed. Consumers therefore require stable event IDs and idempotency records or naturally idempotent writes. [Cloudflare Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/), [Cloudflare: how Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/)

Current limits include 128 KB per message, 5,000 messages/second per queue, 25 GB backlog, up to 14 days retention, and 100 configured retries. Paid-plan retention defaults to four days. A configured dead-letter queue receives exhausted failures; without one, repeatedly failing messages are deleted. [Cloudflare Queues limits](https://developers.cloudflare.com/queues/platform/limits/), [Cloudflare Queues dead-letter queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)

Pricing counts operations in 64 KB units. Normal successful delivery generally costs three operations (write, read, delete), and retries add reads. This favors small event envelopes containing identifiers and object references rather than transcript or media payloads. [Cloudflare Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)

Use Queues candidates for independent fan-out or buffering: artifact-upload notifications, analytics envelopes, indexing requests, email/reminder requests, and reconciliation jobs. Do not use queue order as the Live Session state machine, and do not treat a successful enqueue as completion of user-visible post-processing.

## Durable multi-step processing: Workflows

Cloudflare Workflows persists step results, retries steps, sleeps, and waits for events across infrastructure failures. Each step is individually retryable, so all side effects inside steps must still be idempotent; code with side effects outside steps may be repeated if the engine restarts. [Cloudflare: rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/)

Paid-plan limits currently include 1 GiB persisted state per instance, 10,000 steps by default (configurable to 25,000), 50,000 concurrently running instances, 300 instance creations/second per account and 100/second per workflow, and up to 30 days completed-state retention. Large or long-lived artifacts should live in R2 with references in workflow state. A workflow can wait without consuming a running concurrency slot. [Cloudflare Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)

Workflows are billed for Worker requests/CPU plus persisted storage and steps. Idle waiting does not incur CPU. Retention is configurable per instance and old instance state can be deleted. [Cloudflare Workflows pricing](https://developers.cloudflare.com/workflows/reference/pricing/)

A candidate post-meeting workflow could coordinate “recording finalized → transcript ready → transcript normalized → summary/topics created → retrieval index updated → record marked ready.” The relational record should remain the user-facing source of processing status; workflow instance history is operational evidence with limited retention, not product truth.

Use a Queue when work units are independent, bufferable, and one consumer action is sufficient. Use a Workflow when the product needs an inspectable named process with dependencies, waiting, compensation/rollback, or coordinated retries. A workflow may emit queue messages for fan-out, but avoid duplicating ownership of the same state transition.

## Inference and retrieval: Workers AI and Vectorize

Workers AI supplies model inference and is billed per-model through “Neurons”; the current platform provides 10,000 Neurons/day without charge and paid usage beyond that. Model/task rate limits vary, and local Wrangler inference still consumes remote limits because models are not locally simulated. [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Cloudflare Workers AI limits](https://developers.cloudflare.com/workers-ai/platform/limits/)

Cloudflare states that Workers AI customer inputs, outputs, embeddings, and training data are customer content; it does not use that content to train models or improve services without explicit consent. Models are third-party services with their own licenses. This statement must be evaluated alongside the eventual privacy policy, chosen models, data location needs, and any external provider. [Cloudflare Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/)

Vectorize is a managed derived index. Current limits include 1,536 dimensions, 20 million vectors per index, 10 KiB metadata per vector, 10 metadata indexes, and `topK` up to 50 when values/metadata are returned. Namespaces and metadata filters can narrow search; a vector can belong to only one namespace. [Cloudflare Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/), [Cloudflare Vectorize metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)

Vectorize inserts/upserts are asynchronous and generally take a few seconds to become queryable. They return a mutation ID. Therefore “record ready” and “search ready” may be different states, and immediate read-after-write must not be assumed. [Cloudflare Vectorize API](https://developers.cloudflare.com/vectorize/reference/client-api/)

For UnMute's voice-transcript-only knowledge boundary, store canonical transcript segments and speaker/timestamp metadata outside Vectorize. Put only retrieval vectors plus opaque source-segment IDs, meeting/record scope, and necessary filter metadata into the index. Every answer should resolve results back to authorized canonical segments and cite them. Namespace/filtering is a query aid, not authorization: the server must establish which record IDs the principal may access before querying and re-check returned sources.

Deletion must first revoke user access in authoritative product state, then asynchronously delete artifact objects and vectors, and finally record completion. Because index mutations are asynchronous, deletion is not complete merely because a delete request was accepted; reconciliation should detect residual vectors. Embeddings and AI outputs must be recreated from canonical sources, making Vectorize disposable.

An alternative is PostgreSQL plus pgvector, which co-locates relational authorization metadata and vectors and supports exact search plus HNSW/IVFFlat indexes. It offers a more portable single-database model but makes scaling, tuning, tenant isolation, and vector indexing the database operator's concern. The upstream pgvector project notes that approximate indexes trade recall for speed and that filters may be applied after approximate index scans unless the schema/indexing strategy accounts for them. [pgvector upstream documentation](https://github.com/pgvector/pgvector)

## Local development and test fidelity

Cloudflare's current binding matrix is important:

- D1, Queues, R2, Durable Objects, and Workflows have local simulations.
- AI and Vectorize have no local simulation and use remote binding connections.
- D1, Queues, and R2 can use per-binding remote resources; Durable Objects and Workflows cannot use remote bindings in the same local mode.
- `wrangler dev --remote` supports remote D1, R2, AI, Vectorize, and Durable Objects, but not Queues or Workflows.

[Cloudflare: supported bindings per development mode](https://developers.cloudflare.com/workers/local-development/bindings-per-env/)

Consequently, maintain at least three verification layers:

1. deterministic unit/domain tests using application-facing interfaces;
2. local Worker integration tests against simulated D1/DO/R2/Queues/Workflows;
3. isolated staging smoke/contract tests using real Cloudflare resources, especially Workers AI, Vectorize, placement, OAuth redirects/cookies, async indexing, queue retries, and workflow recovery.

Never point ordinary local development at production indexes or buckets. Remote bindings should use named development/staging resources, and cleanup should be automatic and scoped by run ID.

## Retention and deletion must be a product workflow

Deletion spans systems with different guarantees and cannot be a single SQL cascade:

1. **Authorize and tombstone:** transactionally mark the Meeting Record inaccessible in relational truth, revoke grants, and issue a unique deletion operation ID.
2. **Stop producers:** prevent new recording parts, transcript updates, summaries, and indexing for the record. Terminate/cancel the relevant live or processing owner using idempotent state transitions.
3. **Delete derivatives:** delete R2 media/transcript/export objects, Vectorize entries, cached renditions, temporary upload parts, workflow state where appropriate, and any external provider assets.
4. **Delete or anonymize metadata:** preserve only explicitly justified minimal audit facts; account deletion must define what happens to meetings organized by or shared with others.
5. **Reconcile:** repeatedly compare the manifest against every system until no derivative remains, then mark deletion complete. Surface stalled deletion operationally.

R2 lifecycle expiry is useful for baseline retention but may lag expiration by roughly 24 hours. It does not replace immediate access revocation. Bucket locks can make a requested delete impossible until the lock expires, so enabling them would be a policy decision with user-visible consequences. D1 Time Travel may retain old database versions inside the recovery window; later privacy/legal decisions must determine how deletion claims describe backups and recovery. Workflow histories have independent retention, and queue messages can persist up to their retention window. The final specification needs one inventory of every content-bearing system and an honest deletion SLA.

## Candidate combinations for later decision tickets

These are evaluation candidates, not recommendations:

### Candidate A: Cloudflare-native application foundation

- Better Auth + Google using D1 for accounts/sessions.
- D1 for Meetings, invitations, grants, record manifests, and processing/deletion state.
- One SQLite Durable Object per Live Session for admission, host roles, presence, and connection coordination.
- R2 for participant media tracks, renditions, transcripts, captions, and exports.
- Workflows for post-meeting pipelines and deletion; Queues for fan-out/buffering.
- Workers AI for inference and Vectorize for derived transcript retrieval.

Primary questions: D1 primary-region latency/write headroom, Better Auth+D1 migration behavior, cross-service reconciliation, Cloudflare-wide failure coupling, Vectorize async readiness/deletion, and export/exit paths.

### Candidate B: portable relational core with Cloudflare execution

- Better Auth + Google using managed PostgreSQL, connected from Workers through Hyperdrive or a provider's serverless driver.
- PostgreSQL for product truth and optionally pgvector for retrieval.
- Durable Objects and R2 remain session-coordination and artifact candidates.
- Cloudflare Queues/Workflows or portable external equivalents behind application interfaces.

Primary questions: added vendor/operations cost, regional latency, Hyperdrive's unsupported session features, connection/caching semantics, transaction needs, staging/local parity, and whether co-locating vectors improves deletion/authorization enough to justify database load.

### Candidate C: deliberately replaceable external capabilities

- Keep Cloudflare Workers and Durable Objects for the edge/live plane.
- Use managed identity, relational database, workflow/queue, AI, or vector vendors where a measured requirement exceeds Cloudflare capability.
- R2 remains attractive when S3 compatibility and egress economics matter, but artifact access stays behind UnMute's media-storage interface.

Primary questions: operational fragmentation, webhook/event reliability, data residency, content sent to each processor, credential/security surface, per-minute economics, and end-to-end deletion evidence.

## Provider boundaries worth preserving

Create a boundary only when the first provider is introduced, but make it application-facing:

- `IdentitySessionVerifier`: verify session, return account principal, revoke/list session where the product needs it.
- `LiveSessionCoordinator`: admit/reject, assign role, update presence, end session, and emit finalization intent using domain IDs and operation versions.
- `MeetingRepository` / `RecordRepository`: transactional product operations; no D1 bookmark or PostgreSQL driver types cross the boundary.
- `ArtifactStore`: initiate/finalize upload, open authorized read, delete, list by manifest; no R2/S3 object response types leak inward.
- `JobPublisher`: publish a small, versioned event envelope with an idempotency key.
- `ProcessOrchestrator`: start/status/cancel named product processes; no Workflow instance type leaks inward.
- `InferenceProvider` and `EmbeddingProvider`: model-neutral requests with explicit purpose, content classification, timeout, usage, and provenance.
- `TranscriptSearchIndex`: upsert/query/delete derived segments scoped to allowed record IDs; callers never pass a raw Vectorize namespace as authority.

Avoid a generic “storage service” or “Cloudflare service” facade. D1, DO, R2, Queues, and Vectorize have different semantics; hiding them behind one CRUD abstraction would erase the guarantees the application must reason about.

## Failure-mode checklist for the architecture decision

- OAuth callback succeeds but account/session persistence fails; retry does not create a second account.
- A user revokes Google access; UnMute sign-in/session behavior and optional Calendar integration degrade independently.
- D1/PostgreSQL is unavailable while a Live Session is active; already-authorized participants have a defined grace behavior and privileged actions fail safely.
- A Durable Object is evicted, restarts, or is placed far from most participants.
- “End meeting” is sent twice or the response is lost; exactly one logical Meeting Record finalization results.
- R2 multipart completion succeeds but the relational manifest update fails, and the reverse.
- Queue messages arrive twice, out of order, or after the record is deleted.
- A workflow retries after an external transcription/AI request actually succeeded but its response was lost.
- Vector upsert/delete is accepted but not yet visible; record readiness and deletion reconciliation remain correct.
- AI/vector provider is unavailable; recording/transcript access works and processing is visibly retryable.
- Retention expiry races with playback or an active processing workflow.
- A role or record grant is revoked while a browser holds a playback URL or cached session.
- An account deletion affects records owned by that account and records shared with other accounts; ownership transfer versus deletion is explicit.
- A regional/jurisdiction constraint differs across DO, R2, database, AI, logs, and third-party processors.

## Decision-relevant conclusions

1. Cloudflare has credible primitives for every application-foundation role in this ticket, but there is no evidence yet that an all-Cloudflare combination is the best complete architecture.
2. D1 is a viable relational candidate for the current product envelope, provided its single-primary/single-threaded database behavior, 10 GB-per-database shape, Better Auth adapter, migration/recovery, and regional latency are validated.
3. A per-Live-Session Durable Object is a strong coordination candidate. Its private state should not replace globally queryable Meeting and Meeting Record truth.
4. R2 is the natural Cloudflare candidate for large media and transcript artifacts. Private authorization, immutable keys, manifests, multipart cleanup, cache behavior, and participant-track retention remain application responsibilities.
5. Queues require at-least-once/idempotent consumers and provide buffering; Workflows provide durable multi-step coordination but also retry steps. Neither is a source of product truth.
6. Workers AI and Vectorize should sit behind replaceable boundaries. Canonical transcript segments and citations must remain outside the vector index; index readiness and deletion are asynchronous states.
7. Better Auth can run with Hono/Workers and D1, but OAuth identity must remain separate from meeting authorization. Guest principals are session-scoped, and Google Calendar scopes should not be coupled to basic sign-in.
8. Retention and deletion are first-class, observable workflows across relational data, R2, Vectorize, workflow state, queues, provider assets, caches, and recovery copies—not a later database cascade.
9. The main portable alternative worth prototyping is a managed PostgreSQL core (optionally pgvector) with Workers/Hyperdrive, while retaining DO for live coordination and an S3-shaped artifact boundary. Managed auth and external workflow/vector vendors should be compared only against concrete unmet requirements.
10. Final selection should follow measured spikes for OAuth/session concurrency, per-session DO recovery, recording manifest/finalization, post-meeting retry/idempotency, retrieval readiness/deletion, and cross-region latency/cost.

## Limitations and follow-up research

- This report does not evaluate conferencing/SFU or recording providers; that belongs to the media research ticket.
- It does not compare transcription or model quality; it only establishes application boundaries for inference and retrieval.
- Published limits and prices are snapshots as of the research date and must be rechecked before implementation or launch.
- Cloudflare documentation describes platform guarantees, not UnMute's end-to-end SLA. Load, failover, jurisdiction, and deletion behavior still need deployed tests.
- Managed alternatives are identified only far enough to preserve decision space. A shortlist should be researched after the product's transaction, residency, scale, and operational requirements are settled.
