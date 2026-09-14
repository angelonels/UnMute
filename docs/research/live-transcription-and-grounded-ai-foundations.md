# Live transcription and transcript-grounded AI foundations

Research for the Wayfinder ticket **“Research live transcription and transcript-grounded AI foundations.”**

- Researched: 2026-09-14
- Scope: low-latency English meeting transcription, speaker attribution, transcript finalization, and grounded retrieval/synthesis during and after a meeting
- Method: current first-party product documentation only; no provider benchmark claims are treated as comparative proof
- Status: decision evidence and shortlist, not an architecture or provider selection

## Executive findings

1. **Known-participant attribution and diarization solve different problems.** UnMute expects the conferencing layer to know which authenticated or admitted participant published each audio track. If the media layer can expose separate participant audio, the transcript pipeline can preserve `participant_id` and `track_id` deterministically. Diarization clusters voices heard in mixed audio; it does not identify a cluster as a known UnMute participant. Deepgram describes diarization as assigning speaker numbers and multichannel transcription as processing channels independently, while AssemblyAI describes diarization as speaker-embedding clustering. Those mechanisms are valuable for mixed recordings and imports, but are a weaker primary identity source for native meetings.[^dg-multichannel][^aai-speaker]
2. **The strongest live-STT shortlist is Cloudflare-hosted Deepgram Nova-3, direct Deepgram Nova-3, and AssemblyAI Streaming.** All have WebSocket streaming, evolving/final transcript semantics, word timestamps, and speaker handling. Cloudflare-hosted Nova-3 is the most Cloudflare-native candidate. Direct Deepgram exposes the broadest documented operational controls and regional endpoints. AssemblyAI has a different, progressively immutable turn model and clear zero-retention conditions. A provider-independent evaluation is still required.
3. **Live and durable transcripts should not be treated as the same artifact.** Interim hypotheses optimize captions; finalized segments optimize live AI; a post-meeting reconciliation pass against retained source tracks optimizes the durable record. Provider messages can be lost or reset on reconnect, and streaming output can differ from a later batch pass. UnMute therefore needs its own versioned transcript event/segment model, stable media-clock anchors, and an idempotent backfill path.
4. **Citation fidelity is primarily an UnMute data-contract concern.** Store start/end media timestamps, participant identity, track identity, and immutable segment IDs before chunking. Retrieval chunks must retain the segment IDs and timestamp span they derive from. The answer UI can then link claims to playback ranges regardless of vector database or LLM. Cloudflare AI Search returns its retrieved source chunks and metadata, but the application must still convert those chunks into trustworthy timestamp citations.[^ai-search-citations]
5. **Cloudflare offers two viable retrieval foundations with different maturity/control trade-offs.** AI Search provides managed ingestion, hybrid retrieval, reranking, filtering, generation, and returned chunks, but it is currently an open beta with unpublished future pricing and a 4 MB file limit. Workers AI + Vectorize provides lower-level, portable retrieval components but requires UnMute to own chunking, indexing, access filtering, prompt construction, citation mapping, and re-indexing.[^ai-search-limits][^vectorize-limits]
6. **Live Q&A should not wait for a vector index.** The latest finalized transcript window is small enough to query directly, and Vectorize writes become query-visible asynchronously—Cloudflare says batched changes can take minutes. Use live transcript state and recent finalized segments for “what just happened?” questions; add indexed retrieval for the growing/full record. This is a design constraint, not a provider choice.[^vectorize-insert]
7. **Provider prices alone are misleading for separate-track transcription.** A two-hour, ten-participant meeting could represent two hours of mixed audio or up to twenty connection-hours if every participant has a continuously open STT stream. AssemblyAI explicitly bills streaming by WebSocket session duration, including idle time. Cloudflare labels Nova-3 WebSocket pricing per audio minute input, while its model page also uses “output”; that ambiguity must be validated before forecasting separate-track cost.[^aai-billing][^cf-ai-pricing]

## Requirements implied by UnMute

The current product direction narrows this research:

- UnMute owns the native live call.
- A first operational target is 2–10 participants, meetings up to two hours, and English transcription.
- Voice transcript is the only meeting knowledge source for the initial AI experience. Screen content, chat, files, and general web knowledge are outside this initial evidence corpus.
- AI capability is limited to retrieval and synthesis: grounded questions, summaries, topics, decisions, and proposed action items. Autonomous actions are not part of this foundation.
- Every participant’s audio/video is intended to be recorded separately enough that playback can later select participants.

These constraints make track-aware transcription unusually attractive. The conferencing architecture research must confirm that the chosen media/recording system can expose individual audio tracks in real time and preserve a common session clock.

## Speaker attribution: preserve identity before inferring it

### Native meetings: track attribution

For a native meeting, the media server already needs a binding such as:

```text
session participant -> media publication -> audio track -> recording track
```

The transcript boundary should accept that identity with audio. A transcript segment can then say “participant 7, track 12, 00:14:03.200–00:14:08.910” without voice biometrics or clustering. This works during overlapping speech because each participant track remains independently attributable. It also supports the proposed selective replay experience.

Ways to send that audio to STT remain open:

- one streaming STT connection per participant track;
- a multichannel stream that assigns a stable channel to each participant (Deepgram documents up to 20 channels); or
- a server-side mixed stream for live captions plus a later per-track reconciliation pass.

The choice depends on the conferencing provider’s egress format, channel stability when people join/leave, STT billing semantics, and connection limits. Deepgram’s multichannel endpoint transcribes each channel independently and supports up to 20 channels, but dynamic meeting membership and WebRTC track routing still need a prototype.[^dg-multichannel]

### Mixed audio and imports: diarization

Diarization answers “which inferred speaker cluster said this?” It is appropriate when only a composed recording exists, for uploaded recordings, or as a consistency check. It should not silently become identity.

- Direct Deepgram returns a numeric `speaker` per word when diarization is enabled. Its streaming diarization has lower self-serve concurrency than ordinary Nova-3 streaming (50 North America; 25 Europe/Australia versus 150 ordinary streams), which matters if UnMute ever transcribes many mixed sessions concurrently.[^dg-live-reference][^dg-limits]
- AssemblyAI streaming adds a turn-level `speaker_label` and word-level speakers for final words. It warns that sub-second turns can be `UNKNOWN`, word labels may be absent, and accuracy improves as the session accumulates context. Its file-transcription explanation says it typically takes roughly 30 seconds of speech to identify a unique speaker and that short contributors may be assigned to a more similar cluster.[^aai-stream-diarization][^aai-speaker]

Consequently, any diarization label needs an explicit status such as `inferred`, `unknown`, or `human_confirmed`; it must not be joined to an account merely because “speaker A” sounded like a participant.

## Live transcription candidates

### Candidate A: Deepgram Nova-3 through Cloudflare Workers AI

Cloudflare hosts `@cf/deepgram/nova-3` as a partner model and marks it batch and real-time. Its documented parameters include diarization, multichannel, interim results, endpointing, VAD events, utterance-end signaling, punctuation, redaction, and utterance segmentation. Cloudflare’s AI Gateway WebSocket API shows direct real-time microphone streaming to the model.[^cf-nova][^cf-realtime-ws]

Decision-relevant facts:

- **Interface:** WebSocket for real time; ordinary HTTP for batch.
- **Transcript semantics:** Deepgram-compatible interim/final concepts are exposed; Cloudflare documents `interim_results`, endpointing, VAD, and utterance-end parameters.
- **Attribution:** diarization and multichannel are exposed. Whether every direct-Deepgram query parameter and response guarantee is identical through Workers AI must be contract-tested rather than assumed.
- **Price:** `$0.0092/audio minute` for WebSocket and `$0.0052/audio minute` for HTTP as of the research date. The daily Workers AI free allocation is 10,000 neurons; paid use above it is `$0.011/1,000 neurons`.[^cf-ai-pricing]
- **Limits:** Cloudflare publishes 720 automatic-speech-recognition requests/minute, but the documentation found does not state a WebSocket concurrency or maximum-session-duration guarantee for Nova-3. Workers HTTP requests have no hard wall-time limit while connected; Durable Objects can also remain active while a WebSocket or pending I/O exists.[^cf-ai-limits][^workers-limits]
- **Privacy:** Cloudflare says Workers AI customer content is not used to train models or improve Cloudflare/third-party services without explicit consent, and is stored only when the customer deliberately uses a storage product. Partner-model license/terms still require review.[^cf-data]
- **Operational fit:** one account, billing plane, Worker binding/gateway, and Cloudflare network path. AI Gateway can observe cost and latency. However, Gateway request/response logs contain prompts and responses and persist according to configured storage; logging should be disabled or intentionally minimized for transcript content.[^gateway-logging]
- **Portability risk:** the request/response shape resembles Deepgram, but the Cloudflare model identifier, Workers AI billing, gateway authorization, and undocumented parity details are vendor-specific.

Questions for a prototype: maximum stable WebSocket duration; reconnection behavior; whether `Finalize`/`CloseStream`/keepalive and all required Deepgram messages pass through; word timestamp behavior after reconnect; channel limits; billing during silent open connections; data processing regions; and whether temporary client credentials are supported or audio must traverse an UnMute backend.

### Candidate B: Deepgram Nova-3 directly

Deepgram’s live endpoint is `wss://api.deepgram.com/v1/listen`. Results include word start/end seconds, confidence, finality, speech-finality, channel index, and optional speaker numbers. Interim results can change; `is_final` commits a processed span, while `speech_final` signals endpointing. A complete utterance may contain multiple final messages and must be assembled until speech-finality.[^dg-live][^dg-endpointing]

Decision-relevant facts:

- **Latency:** Deepgram documents sub-300 ms streaming latency for Nova-3. This is a vendor statement, useful as a target but not a comparative benchmark.[^dg-latency]
- **Attribution:** up to 20 independently transcribed channels; diarization is also available. Multichannel is the relevant capability for known-track identity, subject to the media-routing prototype.[^dg-multichannel]
- **Correction/finalization:** interim text may evolve; finalized segments are the accuracy-oriented stream. `speech_final` alone is not a complete transcript boundary.
- **Recovery:** Deepgram recommends buffering audio during reconnect and offsetting the new connection’s word timestamps because they restart from zero. It warns replay can be sent at only 1.25× real time, so a large outage buffer creates lasting lag.[^dg-recovery]
- **Price:** the public page lists Nova-3 monolingual streaming at `$0.0048/min` (`$0.29/hour`) on pay-as-you-go at the research date.[^dg-pricing]
- **Limits:** pay-as-you-go Nova-3 documents up to 150 concurrent streams per project per region; streaming diarization is lower. Extra projects must not be used to evade limits.[^dg-limits]
- **Privacy/retention:** requests can set `mip_opt_out=true`; Deepgram says opted-out data is retained only as long as required to process the request. It documents North American, EU, and Australian endpoints, TLS 1.3 in flight, and AES-256 at rest.[^dg-privacy]
- **Portability:** a direct provider adapter avoids Cloudflare-specific model transport but creates a second billing/auth/support plane. It may expose Deepgram features sooner and with clearer operational guarantees.

Questions for a prototype: track-per-connection versus multichannel latency and cost; silent-stream billing; timestamp drift against recording time; joining/leaving channel behavior; API-key exposure avoidance through short-lived provider tokens or server relay; and actual accuracy on UnMute meeting audio.

### Candidate C: AssemblyAI Streaming

AssemblyAI’s v3 Streaming API uses a WebSocket and emits `Begin`, evolving `Turn`, and `Termination` messages. Its transcript field accumulates progressively finalized words for the current turn; an `utterance` can be emitted earlier to start LLM work. Sessions last up to three hours by default, which covers the initial two-hour envelope.[^aai-sequence]

Decision-relevant facts:

- **Interface:** WebSocket; send 50–1000 ms audio chunks and explicitly `Terminate` to receive final termination data.[^aai-stream-product][^aai-sequence]
- **Transcript semantics:** AssemblyAI markets Universal Streaming as immutable low-latency transcription. In the v3 message model, words finalize progressively inside a turn, reducing application-side replacement handling compared with arbitrary interim strings; the contract still needs testing at interruption and formatting boundaries.[^aai-stream-product][^aai-sequence]
- **Attribution:** streaming diarization produces turn and final-word speaker labels, with documented `UNKNOWN`/missing cases. The streamed audio is mono in the documented workflow, so deterministic native participant identity likely requires one session per participant rather than a multichannel session.[^aai-stream-diarization][^aai-file-stream]
- **Price:** Universal Streaming English is `$0.15/hour`; Universal-3 Pro Streaming is `$0.45/hour`. Streaming billing is total WebSocket session duration, including idle periods—not audio actually spoken.[^aai-model-pricing][^aai-billing]
- **Limits:** paid accounts begin at 100+ new streams/minute with automatic scaling; the product page says no hard concurrent-stream cap, but admission can return WebSocket 1008 while the new-stream rate scales. Default maximum session duration is three hours.[^aai-limits][^aai-sequence]
- **Privacy/retention:** AssemblyAI offers zero retention of streaming audio/transcripts when the account is opted out of model training; billing/logging metadata remains. It documents TLS 1.3 for streaming. The opt-out/account configuration and any regional endpoint requirement must be verified during onboarding.[^aai-retention]
- **Portability:** the Turn schema differs significantly from Deepgram. Its early `utterance` signal can improve response start time, but should remain behind an application transcript adapter.

Questions for a prototype: separate-track connection economics; speaker labeling value when track identity already exists; timestamp alignment with the recording clock; interruption/crosstalk behavior; availability of temporary credentials; regions; and accuracy against the same evaluation set.

### Batch reconciliation candidate: Cloudflare Whisper Large v3 Turbo

Cloudflare’s `@cf/openai/whisper-large-v3-turbo` is batch-only and costs `$0.00051/audio minute`. It accepts language, VAD, and prompt controls. It is not a live captioning candidate and its published model page does not expose diarization.[^cf-whisper]

It is worth evaluating as a cheap independent post-meeting pass over each known participant track. A second-model pass could repair gaps or produce a durable transcript, but it could also introduce disagreements, weak timestamp equivalence, and a second normalization path. The batch model should be judged against direct Nova-3/AssemblyAI batch finalization on the same corpus; price alone is insufficient.

## Cost sensitivity at the target envelope

The following examples apply published list prices to a two-hour meeting and exclude recording, storage, retrieval, generation, and network/media costs. They are not forecasts.

| Transport assumption | Cloudflare Nova-3 WebSocket | Direct Deepgram Nova-3 | AssemblyAI Universal English |
| --- | ---: | ---: | ---: |
| One continuously mixed two-hour stream | about `$1.10` | about `$0.58` | `$0.30` |
| Ten continuously open two-hour participant streams | upper-bound about `$11.04` | upper-bound about `$5.80` | `$3.00` |

For AssemblyAI the participant-stream calculation follows its explicit connection-duration billing. For Cloudflare and Deepgram it is a conservative multiplication of listed streaming rates; actual silence/multichannel treatment must be confirmed. A multichannel stream may change billing and should be priced from observed invoices during a prototype.

Batch Cloudflare Whisper Large v3 Turbo over ten separate two-hour tracks would be about `$0.61` at `$0.00051/min`, making post-meeting reconciliation economically plausible if timestamp/accuracy tests pass.

## Transcript lifecycle and application contract

### Three confidence stages

UnMute should model at least these stages independent of provider vocabulary:

1. **Hypothesis:** replaceable, suitable for captions only.
2. **Live-final:** provider-finalized for a source time span; suitable for live retrieval with a visible “meeting still in progress” caveat.
3. **Record-final:** reconciled after all source tracks are available; suitable for durable playback, summaries, and citations.

“Final” must always name its scope. Deepgram finalizes spans before an utterance ends; AssemblyAI finalizes words progressively; a batch pass may later correct both. The product must not promise that a live caption can never change in the durable record.

### Minimum provider-neutral segment fields

```text
meeting_id
session_id
segment_id                  stable UnMute identifier
participant_id | null       known identity only
speaker_label | null        provider-inferred label, never identity by itself
attribution_kind            track | diarized | unknown | human_confirmed
source_track_id
provider_session_id
provider_segment_key
provider_model_and_version
sequence
start_ms / end_ms            common media-session clock
text
status                       hypothesis | live_final | record_final | superseded
confidence | null
received_at
supersedes_segment_id | null
```

Keep raw provider events for a bounded debugging window only if the privacy/retention decision permits it. Durable product data should use the normalized contract. Idempotency should be based on the provider session/event identity plus time span, not transcript text.

### Failure recovery

A credible pipeline needs to tolerate the STT WebSocket disappearing without losing the meeting:

- retain or spool source audio independently of the STT socket;
- maintain an acknowledged source-audio watermark per track;
- reconnect with an explicit new provider session and map its zero-based timestamps onto the meeting clock;
- buffer a bounded amount of audio and replay at the provider-supported pace;
- mark uncovered time ranges as gaps immediately rather than fabricating continuity;
- after the meeting, transcribe the authoritative recorded track over every gap and reconcile segments idempotently;
- regenerate derived chunks/summaries when record-final transcript revisions change their evidence.

Deepgram’s own recovery guide explicitly requires buffering and timestamp offsets after reconnect. Cloudflare-hosted and AssemblyAI candidates need equivalent failure drills before selection.[^dg-recovery]

## Grounded AI foundation

### Evidence and citations

Voice-only grounding makes the trust rule crisp:

- meeting-grounded claims must cite one or more record-final transcript spans;
- live answers may cite live-final spans and clearly indicate the meeting is still evolving;
- the model must be allowed to answer “the meeting has not established that”;
- summaries, decisions, and action items are derived artifacts, not source evidence;
- a proposed action item should distinguish explicit commitment (“I will send it Friday”) from model inference (“Alice may need to follow up”);
- general model knowledge must not be presented as something said in the meeting.

Chunk IDs and text offsets are insufficient playback anchors because text can be corrected and rechunked. A citation should resolve through immutable segment IDs to a start/end media range and participant attribution. Store retrieved chunk IDs and evidence spans with every generated artifact so outputs can be audited and invalidated after transcript correction.

### Live retrieval path

For a meeting in progress, combine:

- a recent live-final transcript window for recency questions;
- structured indexes over participant and time ranges;
- optional semantic retrieval over older finalized chunks once those writes become query-visible;
- explicit session-only authorization before retrieval.

Do not index hypotheses. Their replacement semantics can poison retrieval and produce citations to words that disappear. Retrieval should prefer live-final segments and later replace their chunks with record-final equivalents.

### Post-meeting retrieval options

#### Option 1: Cloudflare AI Search

AI Search is a managed search/generation layer with configurable chunking, vector, keyword/BM25 and hybrid search, metadata filtering, reranking, query rewriting, and generation. It returns the source chunks used for generation, including source key, text, metadata, scores, and scoring details; streaming responses send chunks before answer tokens.[^ai-search-config][^ai-search-citations]

Relevant constraints:

- It is in open beta; future prices are not yet published, with at least 30 days’ notice promised.
- Workers Paid allows unlimited monthly queries within platform limits, up to 1 million files per instance (500,000 for hybrid search), but only 4 MB per file, five custom metadata fields, and 10 KiB total metadata per vector.
- Built-in uploads are indexed immediately; external R2 data sources sync on a schedule. An R2 source is fixed at instance creation.
- Only the first 64 UTF-8 bytes of an indexed string are filterable.
- Returned source chunks make citations possible, but there is no documented guarantee that generated prose places correct inline citation markers. UnMute should map claims/evidence itself or present the sources used alongside the answer.

AI Search is especially attractive for a fast managed prototype. Its beta status, document-oriented ingestion, file-size limit, authorization topology, deletion/re-index behavior, and future pricing are material reasons not to hard-wire domain data to its item schema.[^ai-search-limits][^ai-search-storage]

#### Option 2: Workers AI embeddings + Vectorize + UnMute retrieval

Cloudflare’s current embedding candidates include `@cf/qwen/qwen3-embedding-0.6b`, with an 8,192-token context and `$0.012/million input tokens` pricing. Vectorize supports namespaces and pre-query metadata filters; a vector can carry up to 10 KiB metadata. Current limits include 1,536 dimensions/vector, 20 million vectors/index, 50,000 namespaces on Workers Paid, ten metadata indexes, and `topK` up to 50 when returning values or metadata.[^qwen-embed][^vectorize-limits][^vectorize-filter]

This option lets UnMute:

- define transcript-specific chunks and timestamp metadata;
- scope searches by meeting/session authorization before nearest-neighbor search;
- combine semantic matches with direct recent/time/participant lookups;
- select or replace generation models independently;
- store transcript truth in an application database/object store rather than the vector index.

The cost is more code and evaluation work. Vector indexes have fixed dimensions/distance metrics and cannot be reconfigured; changing embedding models can require a new index and re-embedding. Writes are durable through a write-ahead log but asynchronously incorporated into queryable indexes, so this is not the sole live transcript store.[^vectorize-create][^vectorize-insert]

#### Option 3: provider-neutral external retrieval/generation through AI Gateway

Cloudflare AI Gateway can front external model providers and centralize analytics, costs, caching, retries/fallbacks where supported. This keeps a Cloudflare control plane while allowing non-Workers-AI models. The privacy trap is observability: Gateway logs can contain full prompts and responses and persist to configured storage limits. Meeting content requires log opt-out or a deliberately redacted configuration.[^gateway-logging]

This option is a portability hedge, not a complete retrieval system. Transcript storage, chunking, access filtering, source anchors, and evaluation remain UnMute responsibilities.

### Storage roles

- **R2:** authoritative per-participant recordings, transcript exports, and possibly batch-input artifacts. R2 is strongly globally consistent for object operations, supports objects up to 5 TiB, and is suitable for immutable media artifacts.[^r2-consistency][^r2-limits]
- **Application relational storage (candidate D1 or another database):** meetings, participants, grants, transcript segment revisions, processing jobs, citations, and derived artifact versions. Database choice is outside this ticket.
- **Durable Object:** candidate coordinator for one live session’s transcript fan-in, ordering, current finalized window, WebSocket clients, and source watermarks. It is not a durable media store. Cloudflare documents unlimited wall time while a caller/WebSocket/pending I/O keeps a Durable Object active.[^workers-limits]
- **Vectorize or AI Search:** derived retrieval indexes, rebuildable from record-final transcript truth. Authorization cannot depend only on obscurity of a vector namespace or item key.

## Accuracy and evaluation gate

No primary source provides a trustworthy cross-provider answer for UnMute’s audio. Vendor latency and accuracy claims use different datasets and configurations. Provider selection therefore requires a small evaluation harness and representative corpus, including:

- two to ten speakers, Indian and other intended English accents;
- headset, laptop microphone, packet loss, background noise, and far-field audio;
- overlap, interruptions, short acknowledgements, silence, names, acronyms, numbers, and code/product terminology;
- join/leave and track replacement;
- at least one forced WebSocket disconnect and recovery;
- comparison against human-corrected reference text and speaker/time labels.

Measure word error rate, named-entity error rate, attribution error, timestamp deviation from recording, p50/p95 first-hypothesis latency, p50/p95 finalization latency, correction/retraction frequency, gap duration, reconnect recovery time, and actual billed cost. Run per-track and mixed/multichannel variants. Record model IDs, versions, regions, audio encoding/sample rate, and endpointing settings so results remain reproducible.

Grounded AI also needs retrieval and answer evaluation: evidence recall, citation precision, unsupported-claim rate, explicit-versus-inferred action-item accuracy, answer latency, and behavior when the transcript does not contain an answer.

## Shortlist to carry into later decisions

This research does **not** pick a winner. It narrows the credible paths:

| Layer | Candidate | Why it remains viable | Main uncertainty to clear |
| --- | --- | --- | --- |
| Live STT | Cloudflare Workers AI Nova-3 WebSocket | Cloudflare-native, real-time, diarization/multichannel, one platform | feature parity, long-session guarantees, silent billing, recovery and regions |
| Live STT | Direct Deepgram Nova-3 | explicit operational docs, up to 20 channels, clear recovery/concurrency controls | second vendor plane; track economics and credential architecture |
| Live STT | AssemblyAI Universal Streaming / U3 Pro | immutable turn model, early utterances, clear 3-hour sessions and zero-retention condition | mono/separate-session economics; comparative accuracy |
| Durable reconciliation | Cloudflare Whisper Large v3 Turbo batch | extremely low listed price and independent batch model | timestamp fidelity, reconciliation quality, lack of diarization (irrelevant per known track) |
| Retrieval | Cloudflare AI Search | managed hybrid retrieval/generation with returned source chunks | open-beta pricing/maturity, 4 MB documents, authorization/deletion topology |
| Retrieval | Workers AI embeddings + Vectorize | transcript-specific control, metadata filters, rebuildable/provider-adaptable | more implementation/evaluation; asynchronous index visibility |
| Generation | Workers AI model behind an UnMute interface | Cloudflare data-use policy and integrated billing | model quality/context/cost selection needs its own evaluation |
| External generation | provider through AI Gateway | portability and centralized routing/observability | content logging must be disabled/minimized; provider terms vary |

## Decisions this research unlocks

Later Wayfinder tickets can now precisely decide:

1. whether native live transcription uses per-track connections, a stable multichannel stream, or mixed live audio plus post-meeting per-track reconciliation;
2. whether Cloudflare-hosted Nova-3, direct Deepgram, or AssemblyAI enters the implementation prototype;
3. what transcript stage is visible to live AI and when record-final output replaces it;
4. whether post-meeting retrieval begins with managed AI Search or an UnMute-owned Vectorize pipeline;
5. what retention, logging, residency, and provider opt-out controls are mandatory;
6. what benchmark thresholds a provider must pass before adoption.

## Limitations

- This is documentation research, not an audio benchmark or integration prototype. Accuracy and end-to-end latency remain unknown for UnMute.
- Pricing and limits are point-in-time public list values as of 2026-09-14 and can change. Enterprise discounts, taxes, regional pricing, media egress, and support commitments are excluded.
- Cloudflare Nova-3 is a partner model. The documentation found does not fully specify its WebSocket concurrency, maximum duration, silence billing, data-processing region, temporary credential story, or exact parity with direct Deepgram.
- The conferencing/SFU provider has not been chosen. Whether separate tracks can be streamed to STT cheaply and with a common clock is an external dependency.
- Legal consent, retention policy, and jurisdictional requirements are deliberately not decided here.
- AI Search is in open beta. Its behavior and commercial terms may change before implementation.
- No final architecture or provider is selected by this report.

## Primary sources

[^cf-nova]: Cloudflare, [Deepgram Nova-3 model documentation](https://developers.cloudflare.com/workers-ai/models/nova-3/).
[^cf-realtime-ws]: Cloudflare, [AI Gateway Realtime WebSockets API](https://developers.cloudflare.com/ai-gateway/usage/websockets-api/realtime-api/).
[^cf-ai-pricing]: Cloudflare, [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).
[^cf-ai-limits]: Cloudflare, [Workers AI limits](https://developers.cloudflare.com/workers-ai/platform/limits/).
[^cf-data]: Cloudflare, [Your Data and Workers AI](https://developers.cloudflare.com/workers-ai/platform/data-usage/).
[^cf-whisper]: Cloudflare, [Whisper Large v3 Turbo model documentation](https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/).
[^workers-limits]: Cloudflare, [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/).
[^gateway-logging]: Cloudflare, [AI Gateway logging](https://developers.cloudflare.com/ai-gateway/observability/logging/).
[^vectorize-limits]: Cloudflare, [Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/).
[^vectorize-filter]: Cloudflare, [Vectorize metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/).
[^vectorize-create]: Cloudflare, [Create Vectorize indexes](https://developers.cloudflare.com/vectorize/best-practices/create-indexes/).
[^vectorize-insert]: Cloudflare, [Insert vectors](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/).
[^qwen-embed]: Cloudflare, [Qwen3 Embedding 0.6B model documentation](https://developers.cloudflare.com/workers-ai/models/qwen3-embedding-0.6b/).
[^ai-search-config]: Cloudflare, [AI Search configuration](https://developers.cloudflare.com/ai-search/configuration/).
[^ai-search-citations]: Cloudflare, [Show source citations in AI Search responses](https://developers.cloudflare.com/ai-search/how-to/chunk-citations/).
[^ai-search-limits]: Cloudflare, [AI Search limits and pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/).
[^ai-search-storage]: Cloudflare, [AI Search built-in storage](https://developers.cloudflare.com/ai-search/configuration/data-source/built-in-storage/).
[^r2-consistency]: Cloudflare, [R2 consistency model](https://developers.cloudflare.com/r2/reference/consistency/).
[^r2-limits]: Cloudflare, [R2 limits](https://developers.cloudflare.com/r2/platform/limits/).
[^dg-live]: Deepgram, [Live streaming audio guide](https://developers.deepgram.com/docs/live-streaming-audio).
[^dg-live-reference]: Deepgram, [Live Audio API reference](https://developers.deepgram.com/reference/speech-to-text/listen-streaming).
[^dg-endpointing]: Deepgram, [Configure endpointing and interim results](https://developers.deepgram.com/docs/understand-endpointing-interim-results).
[^dg-multichannel]: Deepgram, [Multichannel](https://developers.deepgram.com/docs/multichannel).
[^dg-recovery]: Deepgram, [Recovering from live connection errors and timeouts](https://developers.deepgram.com/docs/recovering-from-connection-errors-and-timeouts-when-live-streaming-audio).
[^dg-latency]: Deepgram, [Measuring streaming latency](https://developers.deepgram.com/docs/measuring-streaming-latency).
[^dg-limits]: Deepgram, [API rate limits](https://developers.deepgram.com/reference/api-rate-limits).
[^dg-pricing]: Deepgram, [Pricing](https://deepgram.com/pricing).
[^dg-privacy]: Deepgram, [Model Improvement Partnership Program](https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program).
[^aai-stream-product]: AssemblyAI, [Streaming Speech-to-Text API](https://www.assemblyai.com/products/streaming-speech-to-text).
[^aai-sequence]: AssemblyAI, [Streaming API message sequence](https://www.assemblyai.com/docs/streaming/message-sequence).
[^aai-stream-diarization]: AssemblyAI, [Streaming diarization and multichannel](https://www.assemblyai.com/docs/streaming/label-speakers-and-separate-channels).
[^aai-speaker]: AssemblyAI, [How speaker labels identify speakers](https://www.assemblyai.com/docs/faq/how-are-individual-speakers-identified-and-how-does-the-speaker-label-feature-work).
[^aai-file-stream]: AssemblyAI, [Stream a pre-recorded file in real time](https://www.assemblyai.com/docs/streaming/guides/stream_prerecorded_file_realtime).
[^aai-model-pricing]: AssemblyAI, [Model options and pricing](https://www.assemblyai.com/docs/faq/how-can-i-use-universal-1).
[^aai-billing]: AssemblyAI, [Streaming Speech-to-Text billing](https://www.assemblyai.com/docs/faq/how-to-get-your-api-key#streaming-speech-to-text-billing).
[^aai-limits]: AssemblyAI, [Streaming Speech-to-Text usage limits](https://www.assemblyai.com/docs/faq/how-to-get-your-api-key#streaming-speech-to-text-usage-limits).
[^aai-retention]: AssemblyAI, [Data retention and model training](https://www.assemblyai.com/docs/data-retention-and-model-training).
