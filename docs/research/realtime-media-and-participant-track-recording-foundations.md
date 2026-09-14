# Real-time media and participant-track recording foundations

Research date: 2026-09-14  
Wayfinder question: Which current Cloudflare and non-Cloudflare foundations can support UnMute's native Live Session, initially for 2–10 participants, while retaining a credible growth path and enabling per-participant audio/video recording and later selective playback?

## Executive finding

All four managed SFU candidates in this report—Cloudflare RealtimeKit, LiveKit Cloud, Daily, and 100ms—comfortably cover the initial 2–10-participant live-call envelope on paper. They all provide browser SDKs, screen sharing, participant state, role or token controls, and adaptive video mechanisms. The differentiator for UnMute is not basic conferencing; it is the recording contract.

The requested recording model means UnMute needs durable, time-alignable source assets for every participant's microphone and camera (and probably screen-share tracks), plus stable participant/track metadata. Selective playback is then an UnMute playback/composition feature. It cannot be recovered faithfully from a single composite recording.

The current shortlist is:

1. **LiveKit Cloud** — strongest documented match for individual audio and video export, selective subscriptions, and portability through its open-source media server. It deserves a proof-of-capability focused on automatic all-track egress, synchronization/manifests, browser behavior, storage, and the cost/concurrency semantics of a 10-participant recording.
2. **100ms** — strongest managed, conferencing-oriented alternative with explicitly documented per-peer audio, video, and screen track recording. It deserves the same proof, especially around asset synchronization, storage export, regions, and current SDK/support quality.
3. **Daily** — mature custom-call API with raw-track recording, fine-grained receive settings, and transparent pricing, but raw tracks require a custom S3 bucket. It remains a credible alternative if an AWS storage dependency is acceptable.
4. **Cloudflare RealtimeKit** — most cohesive fit with UnMute's preferred Cloudflare stack and a strong live-call product layer, but **does not currently meet the stated per-participant video-recording requirement**: track recording supports separate audio only and says video is in development. It should stay on the shortlist only if UnMute is willing to (a) defer participant video replay, (b) build and operate a custom recorder/Raw RTP pipeline, or (c) wait for and validate Cloudflare's future video-track recording.

No final architecture should be chosen from documentation alone. A later decision should be preceded by the same instrumented 2-, 5-, and 10-participant spike on at least LiveKit Cloud and 100ms, with Cloudflare RealtimeKit included if its recording gap can be accepted or closed.

## Decision criteria

The later architecture decision should treat these as hard gates:

- A browser client can publish microphone, camera, and screen-share tracks and selectively render remote tracks.
- The backend—not a browser-supplied role string—authorizes joining, publication, subscription, moderation, and recording.
- A 2–10-person session can record every participant's audio and video without manually starting a fragile per-track job after each publication.
- Exported assets preserve stable participant and track identity and enough timing information to align them on one meeting timeline.
- Recording completion is observable through authenticated webhooks or equivalent server events.
- Assets can be copied into storage controlled by UnMute before vendor links expire.
- Simulcast/adaptive subscription behavior is usable in a custom React UI.
- The provider has a credible path past ten participants without forcing a topology rewrite.

Selective playback itself is not a provider checkbox. If the provider returns separate files, UnMute still needs a manifest mapping each asset to meeting session, participant, source (camera/microphone/screen), capture interval, mute/unpublish gaps, codec, and timeline offset. The playback UI must synchronize multiple media elements or request a server-generated composition. Track export proves that this is possible; it does not deliver the feature.

## Comparison at a glance

| Dimension | Cloudflare RealtimeKit | LiveKit Cloud | Daily | 100ms |
| --- | --- | --- | --- | --- |
| Live topology | Managed SFU on Cloudflare's global WebRTC network | Managed global-mesh SFU; open-source server is single-home when self-hosted | Managed WebRTC/SFU call service | Managed conferencing service with SFU-style published/subscribed tracks |
| Custom web client | Core SDK plus React bindings/UI kit | TypeScript/React client SDKs; prebuilt components also available | `daily-js` call object / React library; Prebuilt optional | JavaScript and React SDK/store; Prebuilt optional |
| Participant state | Joined, waitlisted, active, pinned maps; media/state events | Participant and track-publication model with events | Participant, waiting-participant, track, quality events | Peer/track store and selectors |
| Screen share | Core/UI SDK and preset permissions | First-class screen and screen-audio track sources | First-class screen tracks and permissions | First-class screen share controlled by role |
| Adaptation | Simulcast supported in SFU; RealtimeKit publishes best-practice controls | Simulcast, adaptive stream, dynacast, manual layer/subscription control | Receive/send settings and automatic/manual subscriptions; provider manages call topology | Opt-in simulcast with automatic layer choice in React `useVideo`, or manual layer selection |
| Server authorization | Backend creates meeting/participant and returns participant token; reusable permission presets | Backend-minted JWT grants plus server participant APIs | Backend-created meeting tokens and dynamic participant permissions | Backend-generated auth tokens; roles/templates define publish, subscribe, and moderation |
| Composite recording | Yes, including custom browser-rendered layouts | Yes through template/browser egress | Yes, with multiple layouts | Yes, browser/custom composite |
| Separate audio | Yes, per participant | Yes, per track or participant | Yes through raw tracks | Yes, per track |
| Separate video | **No in managed track recording today** | Yes, per track or participant | Yes through raw tracks | Yes, per track |
| Screen-track recording | Composite; separate screen video not documented in managed track recorder | Yes through track/participant egress | Raw-track model is the likely route; verify exact screen asset behavior in spike | Yes; docs explicitly describe camera, microphone, and desktop-screen track assets |
| Provider storage | Managed R2 (7-day URLs) or configured own storage for composite; Raw RTP-to-R2 product exists | S3, GCP, Azure outputs; egress service is separate if self-hosted | Raw tracks require custom S3 bucket | Managed 15-day retention or configured S3/GCS/Azure/Alibaba storage |
| Portability | Realtime SFU is lower-level but RealtimeKit product semantics are proprietary | Highest: media server and egress are open source, with managed-cloud parity caveats | Proprietary managed API | Proprietary managed API |
| Main issue for UnMute | Participant video-track recording gap; young/evolving recording surface | Validate all-track egress cost/concurrency and operational semantics | Custom S3 requirement and proprietary raw-track packaging | Validate regional behavior, manifests/sync, and operational maturity firsthand |

## Cloudflare options

### RealtimeKit: managed product layer

RealtimeKit supplies meetings, participants, reusable presets, waiting-room state, host controls, Core SDKs, UI kits, webhooks, composite recording, transcription, and summaries. The application backend creates meetings and participants with the REST API, then gives the returned participant auth token to the browser; the application continues to own scheduling, user identity, and its product workflow. This fits UnMute's intended modular boundary well: UnMute can map its Meeting/Live Session/Participant concepts to provider identifiers without letting provider objects become domain identity. [RealtimeKit overview](https://developers.cloudflare.com/realtime/realtimekit/) [participant model](https://developers.cloudflare.com/realtime/realtimekit/concepts/participant/)

For a custom React call surface, the Core SDK exposes joined, waitlisted, active, and pinned participant collections, local media controls, participant media state, and events. Presets cover publish permissions, screen sharing, recording, kicking, muting, waiting-room admission, stage behavior, chat, and participant-list visibility. These are a strong functional match for host/co-host/guest roles, but UnMute must still authorize the chosen preset on its server before adding a participant. [Core client](https://developers.cloudflare.com/realtime/realtimekit/core/api-reference/realtimekitclient/) [participant collections](https://developers.cloudflare.com/realtime/realtimekit/core/api-reference/rtkparticipants/) [permission preset](https://developers.cloudflare.com/realtime/realtimekit/core/api-reference/rtkpermissionspreset/)

The service routes media on Cloudflare's global WebRTC infrastructure rather than asking the application to select a region. Cloudflare says the underlying SFU runs in hundreds of cities; TURN uses anycast to connect clients to the nearest Cloudflare location and is free when used with Cloudflare's SFU. This is operationally attractive, but the public documentation reviewed here does not give a RealtimeKit-specific data-residency/pinning contract. That must be asked explicitly if jurisdictional control later becomes a requirement. [Realtime SFU overview](https://developers.cloudflare.com/realtime/sfu/) [TURN service](https://developers.cloudflare.com/realtime/turn/)

Cloudflare documents simulcast in the lower-level SFU and provides RealtimeKit guidance for resolution and simulcast. The raw SFU has no stated upper track count per session; practical limits are client/server bandwidth, with up to 64 tracks per API call and 50 API calls per second per session. Those are not a RealtimeKit room-size guarantee, but they show ample primitive headroom for the 2–10-person target. [simulcast](https://developers.cloudflare.com/realtime/sfu/simulcast/) [SFU limits](https://developers.cloudflare.com/realtime/sfu/limits/)

The critical gap is recording. Composite recording can render the default UI or a custom recording web app. Managed track recording creates one WebM file per participant **for audio only**; Cloudflare explicitly says video-track recording is in development. Participant selection is also marked early beta in the API reference. Managed recording links expire after seven days unless assets are moved/configured into owned storage. [track recording](https://developers.cloudflare.com/realtime/realtimekit/recording-guide/track-recording/) [start composite recording](https://developers.cloudflare.com/realtime/realtimekit/recording-guide/start-recording/) [custom recording app](https://developers.cloudflare.com/realtime/realtimekit/recording-guide/create-record-app-using-sdks/)

RealtimeKit therefore meets UnMute's live-call needs but not its current recording requirement as a managed end-to-end product. A custom browser recorder could create participant-focused composites, but one browser render is not equivalent to exporting every original participant track. Multiple custom recorder instances may be possible, but their concurrency, reliability, cost, and synchronization are not documented as a supported per-participant recording architecture.

Pricing as of the research date is unusually simple: audio/video participants are $0.002 per participant-minute, video export is $0.010 per recorded minute, and Raw RTP export into R2 is $0.0005 per minute. Cloudflare does not say on the pricing page whether Raw RTP export is charged per meeting, participant, or exported track, so it cannot yet be used for a trustworthy all-participant estimate. [RealtimeKit pricing](https://developers.cloudflare.com/realtime/realtimekit/pricing/)

### Realtime SFU: primitive layer

Cloudflare Realtime SFU is materially different from RealtimeKit. It routes WebRTC tracks and DataChannels but does **not** define rooms, participants, roles, presence, or signaling/discovery. The application's backend must authenticate users, authorize each publish/subscribe operation, store application state, exchange SDP with Cloudflare, and distribute session/track identifiers. [SFU overview](https://developers.cloudflare.com/realtime/sfu/) [example architecture](https://developers.cloudflare.com/realtime/sfu/example-architecture/)

This primitive surface offers maximum product control and could pair naturally with a Durable Object for per-session coordination, but it also makes UnMute responsible for the hardest and least differentiating real-time control-plane work. Cloudflare mentions headless recording clients and offers Raw RTP export into R2, yet the reviewed primary documentation does not establish an off-the-shelf, all-participant audio/video recorder with manifests and synchronized selective playback. Treat a Realtime SFU + custom recorder design as a separate build-vs-buy candidate, not as a way to claim RealtimeKit already meets the recording requirement.

### Cloudflare-specific conclusion

Cloudflare should remain the preferred application/backend ecosystem regardless of media provider: Workers can mint provider tokens, accept signed webhooks, coordinate Live Session state, and enqueue post-meeting work; R2 can own final artifacts where a provider supports it. The paid Workers plan does not make RealtimeKit participant/export usage free, and it should not outweigh the missing video-track feature.

## LiveKit Cloud

LiveKit models rooms, participants, and separately published tracks. Participant identities are developer-supplied and unique within a room; track publications remain visible even when the local client is not subscribed. Track sources distinguish camera, microphone, screen share, and screen-share audio. This maps cleanly to UnMute's need for stable participant/source metadata. [participants](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/) [tracks](https://docs.livekit.io/intro/basics/rooms-participants-tracks/tracks/)

Its SDK supports selective subscription. Adaptive Stream chooses a simulcast layer according to the attached element's dimensions and pauses delivery when it is hidden; callers can disable auto-subscribe and control tracks/layers manually. That is particularly relevant to later selective playback-like live layouts and to limiting bandwidth in grids. [receiving tracks and Adaptive Stream](https://docs.livekit.io/guides/room/receive) [selective subscriptions](https://docs.livekit.io/transport/media/subscribe/)

Authorization is backend-minted JWT grants. Grants can restrict room join, publication, subscription, data, and exact publish sources; server APIs can update participant permissions, mute, remove, and manage subscriptions. Short-lived tokens are essential, and LiveKit documents a meaningful cloud/self-host difference: LiveKit Cloud revokes current tokens when permissions change, whereas self-hosted deployments require the application to control TTL/reissuance. [access tokens and grants](https://docs.livekit.io/frontends/reference/tokens-grants/) [participant management](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/)

Recording is the strongest documented fit in this set. Egress can record a room composite, a participant's audio/video, a selected audio/video pair, or one audio/video track without transcoding. Participant Egress follows track mute/unpublish changes and can include screen share. Auto Egress can export every published track separately from room creation, producing source-grade files and manifests in configured S3, GCP, or Azure storage. [egress overview](https://docs.livekit.io/transport/media/ingress-egress/egress/) [participant and track-composite egress](https://docs.livekit.io/transport/media/ingress-egress/egress/participant/) [track egress](https://docs.livekit.io/transport/media/ingress-egress/egress/track/) [auto egress](https://docs.livekit.io/transport/media/ingress-egress/egress/autoegress/)

LiveKit Cloud uses a global mesh; self-hosted LiveKit is described as a single-home SFU. Cloud supports regional pinning groups including India, Asia Pacific, EU, US, Canada, the Middle East, and others; multi-location groups provide in-region redundancy. The open-source server and client ecosystem provide the clearest escape hatch from a managed vendor, but self-hosting global media plus Redis and separate Egress workers is a real operations project, not a zero-cost switch. [Cloud vs self-hosted](https://docs.livekit.io/intro/cloud/) [regions](https://docs.livekit.io/deploy/admin/regions/endpoints/) [self-hosted egress](https://docs.livekit.io/transport/self-hosting/egress/)

The free Build plan currently allows 100 concurrent participants but only two concurrent egress requests, with 5,000 WebRTC participant-minutes, 50 GB downstream transfer, 60 transcode minutes, and 60 track-egress minutes included. Paid plans provide higher allowances and published overage rates; current pricing lists $0.001/track-egress minute after included allowance and separate participant, bandwidth, and composite/participant-transcode charges. It is **unclear from public docs how Auto Egress of every published track counts against concurrent-export limits**, so a 10-person session publishing 20+ tracks must be tested or confirmed with LiveKit before selection. [quotas](https://docs.livekit.io/deploy/admin/quotas-and-limits/) [pricing](https://livekit.com/pricing)

Portability is LiveKit's main strategic advantage. The trade-off is a somewhat lower-level product surface than RealtimeKit/100ms: UnMute owns more of the waiting-room and meeting-product behavior, and managed-cloud-only capabilities or global-mesh behavior do not automatically carry to a self-hosted deployment.

## Daily

Daily offers a high-level Prebuilt option and a custom `daily-js` call object. The custom client exposes participant and waiting-participant events, local and remote tracks, screen sharing, network/quality events, receive/send settings, and manual automatic-subscription controls. This is enough to build UnMute's custom call UI without embedding Daily Prebuilt. [Daily call client](https://docs.daily.co/reference/daily-js/daily-call-client) [instance methods](https://docs.daily.co/reference/daily-js/instance-methods)

Private rooms use backend-created meeting tokens. Token/room permissions can restrict audio, video, screen audio/video, received media, and admin capabilities; the backend can issue owner tokens and clients with participant-admin permission can update participant permissions during a call. Daily strongly recommends token expiration. Private rooms also offer a built-in knocking/lobby behavior. [meeting tokens](https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token) [room configuration](https://docs.daily.co/reference/rest-api/rooms/create-room)

Daily's raw-track recording is the relevant export mode. The REST API can start `raw-tracks` or audio-only raw tracks; raw-track recording requires a custom S3 bucket. The same API supports multiple recording instances subject to a domain-specific limit, and its default recording maximum is roughly three hours. Public docs reviewed here do not clearly specify file naming, synchronization metadata, how mute/unpublish gaps appear, or whether screen video/audio is guaranteed as raw assets. Those details must be proven in a spike. [start recording API](https://docs.daily.co/reference/rest-api/rooms/recordings/start) [stop recording API](https://docs.daily.co/reference/rest-api/rooms/recordings/stop)

The custom-S3 requirement is a concrete architectural drawback for a Cloudflare-centered product. Do not assume R2's S3 compatibility is supported: Daily says “custom S3 bucket,” and no primary Daily documentation found in this research names R2 as a supported raw-track destination. Ask Daily or test it; otherwise budget an AWS S3 boundary and later copy to R2 if desired.

Daily publishes transparent usage pricing: 10,000 video/audio participant-minutes monthly free, then $0.004 per participant-minute at the first paid tier; cloud video recording is $0.01349 per recorded minute plus $0.003/min storage. The pricing page does not separately explain whether raw-track recording uses the same price regardless of participant/track count, so that must be confirmed before comparing all-track cost. [Daily pricing](https://www.daily.co/pricing/video-sdk/)

Daily is proprietary, so portability means retaining a strict UnMute media adapter and domain-owned identifiers/manifests, then rewriting the transport. Its maturity, browser API breadth, and 200-participant default room ceiling are positives; raw-track storage and packaging are the decision risks.

## 100ms

100ms provides JavaScript and React SDKs organized around rooms, peers, tracks, templates, and roles. Roles specify which audio/video/screen sources can be published, which roles can be subscribed to, priority/degradation, and moderation permissions. Browser screen sharing is first-class. Simulcast is opt-in per role; the React `useVideo` path automatically selects an appropriate layer based on element dimensions, and applications can choose high/medium/low layers manually. [templates and roles](https://www.100ms.live/docs/get-started/v2/get-started/concepts/templates-and-roles) [screen share](https://www.100ms.live/docs/javascript/v2/how-to-guides/set-up-video-conferencing/screen-share) [adaptive bitrate](https://www.100ms.live/docs/get-started/v2/get-started/features/quality/adaptive-bitrate)

End-user auth tokens are generated by the application backend and bind a peer to a room and role; management tokens protect server APIs. Role changes can promote waiting participants and alter publish/subscribe/moderation behavior, so the primitives cover UnMute's host/co-host/guest and lobby direction. [auth FAQ](https://www.100ms.live/docs/javascript/v2/how-to-guides/debugging/faq) [role changes](https://www.100ms.live/docs/javascript/v2/how-to-guides/control-remote-peers/change-role)

Recording is an explicit first-class matrix:

- Track recording produces a separate WebM asset for every peer's audio, video, and desktop-screen track.
- Stream recording produces per-peer audio/video MP4 composites.
- Room composite recording produces an MP4 of all peers.
- Track recordings begin automatically with the first peer and stop with the last; they cannot be started ad hoc by the client or REST API.
- Assets are available through recording APIs and webhooks. Managed storage retains assets for 15 days by default; configured S3, Google Cloud Storage, Azure Blob, or Alibaba OSS gives the application storage control.

[recording overview](https://www.100ms.live/docs/get-started/v2/get-started/features/recordings/overview) [track recordings](https://www.100ms.live/docs/get-started/v2/get-started/features/recordings/recording-modes/track-recordings) [asset types](https://www.100ms.live/docs/get-started/v2/get-started/features/recordings/recording-assets/recording-asset-types) [recording setup](https://www.100ms.live/docs/get-started/v2/get-started/features/recordings/set-up-recording)

This is a direct functional match for later participant/source selection, provided the exported metadata gives UnMute enough timing information. Automatic all-track recording is operationally simple but may be less flexible for per-participant consent or recording only part of a session; that policy interaction must be tested.

Current public pricing includes 10,000 conferencing minutes and 300 recording minutes per month, then $0.004 per participant-minute and $0.0135 per recording minute. The page does not state whether enabling track recording changes the recording unit with participant/track count, so obtain a written cost example for 10 participants publishing camera and microphone for two hours. [100ms pricing](https://www.100ms.live/pricing)

100ms is a proprietary managed service. Its documentation exposes useful quality analytics and webhook replay, but this research did not find a current first-party region list or a formal statement of media-routing/data-residency choices. That absence is not proof of poor coverage; it is a question that must be answered before choosing it for a global product. The current support page advertises a 99.99% uptime SLA at premium support tiers, while developer support is best effort. Pricing/support and regional behavior should therefore be validated rather than inferred from marketing.

## Cost shape for the initial envelope

For one two-hour session with ten participants, live transport is 1,200 participant-minutes. Recording cost is not safely comparable yet because “recording minute” and “track egress minute” may apply differently when 20–30 participant tracks are exported.

Known list-price live-media arithmetic, before free allowances:

| Provider | Published unit | Illustrative live cost for 1,200 participant-minutes |
| --- | --- | ---: |
| Cloudflare RealtimeKit | $0.002 / A/V participant-minute | $2.40 |
| Daily | $0.004 / A/V participant-minute at first paid tier | $4.80 |
| 100ms | $0.004 / participant-minute after allowance | $4.80 |
| LiveKit Cloud | plan allowances + participant minutes + downstream GB | Cannot be reduced to one trustworthy number without measured bandwidth and plan choice |

These figures are not a provider ranking. Cloudflare's $1.20 illustrative composite export charge at $0.010/min does not buy separate participant video. LiveKit's $0.001/track-egress-minute could mean roughly $2.40 for 20 continuously published microphone/camera tracks over two hours, before screen tracks and other charges, but that is an inference and must be confirmed. Daily and 100ms do not publicly state whether raw/track recording bills once per wall-clock minute or per asset/track. A cost bake-off needs provider invoices or written confirmations, not just pricing-page multiplication.

Storage is also material. Ten source cameras at typical WebRTC bitrates can dwarf a single composite file. The spike should measure bytes per participant-hour at the chosen camera qualities and estimate R2/S3 storage, playback egress, and optional derived-composite costs.

## Operational burden and portability

### Lowest custom operations

RealtimeKit and 100ms expose the most meeting-product behavior—presets/roles, waiting rooms, moderation, UI kits, and recording workflows. Daily is similarly managed but leaves more custom UI composition to its call object when Prebuilt is not used. These reduce real-time control-plane ownership.

### Best portability

LiveKit's server and Egress components are open source, its client APIs operate against managed or self-hosted deployments, and its track-centric model is explicit. This is the best escape hatch. However, self-hosting requires regional SFU capacity, TURN, Redis, Egress workers, autoscaling, upgrades, observability, and incident response. For a solo project, LiveKit Cloud is the realistic starting form even if portability matters.

### Highest custom burden

Cloudflare Realtime SFU primitives require UnMute to build signaling, rooms, presence, permissions, publication/subscription coordination, reconnect semantics, and recording integrations. Durable Objects can coordinate that state, but they do not remove WebRTC/media expertise or recorder operations. This route should be chosen only if custom control is itself a product requirement.

### Vendor-boundary requirements

Whichever provider is selected, preserve these application-facing boundaries:

- UnMute issues its own Meeting and Live Session identifiers; provider room/meeting IDs are mapping data.
- UnMute decides join/admit/host/co-host policy before minting the narrow provider credential.
- The browser sees only a short-lived join token, never the provider management secret.
- Provider participants map to a stable UnMute attendance identity, including a unique guest identity unrelated to display name.
- Provider webhook events enter through verified, idempotent handlers and are normalized to UnMute lifecycle events.
- Recording manifests and durable artifact metadata are owned by UnMute, not reconstructed on demand from expiring provider URLs.
- A frontend media adapter should expose local/remote participants and tracks without leaking provider-specific preset, role, or SID types through feature code.

These boundaries do not make switching cheap, but they prevent authentication, meeting access, and post-meeting artifacts from becoming inseparable from the initial vendor.

## Required proof before the architecture decision

Build the same narrow vertical spike against at least LiveKit Cloud and 100ms; optionally include RealtimeKit if its participant-video gap is acceptable enough to test.

1. Join from Chrome and one non-Chromium browser where supported with 2, 5, and 10 real or automated publishers.
2. Publish microphone and camera from every participant; start/stop one screen share; toggle mute/video and disconnect/reconnect.
3. Exercise host admission, removal, and permission updates using backend-minted credentials.
4. Record every published microphone, camera, and screen track for 15–30 minutes.
5. Verify webhook authentication, retries, duplicate handling, recording finalization time, failure reporting, and incomplete recording behavior.
6. Download or receive assets into application-owned storage and build a manifest with participant, source, codec, start offset, gaps, duration, and checksum.
7. Play two selected participants in sync, then switch the selected participant without losing the common timeline.
8. Measure publish-to-view latency, CPU, upstream/downstream bandwidth, quality changes, reconnect time, asset byte size, completion latency, and actual billed units.
9. Repeat from at least two materially different regions, including India, and through a restrictive network that forces TURN.
10. Confirm whether all-track automatic recording counts as one or many concurrent recording jobs and obtain a written 10-participant/two-hour price example.

The spike should fail a candidate if it cannot preserve synchronized per-participant camera and microphone assets, if a single track failure silently invalidates the meeting record, or if the cost unit cannot be bounded.

## Open questions and limitations

- Cloudflare says participant video track recording is in development but gives no public delivery date. Do not plan against an uncommitted roadmap.
- Cloudflare Raw RTP-to-R2 may provide a custom path, but the reviewed docs do not establish a production-ready multi-participant recorder/manifester or explain its cost unit.
- LiveKit Auto Egress appears to be the cleanest all-track option, but its interaction with Cloud free-plan concurrency and per-track billing needs direct validation.
- Daily raw tracks require custom S3. Exact screen-track assets, synchronization metadata, packaging, R2 compatibility, and raw-track billing need a spike or provider answer.
- 100ms documents the right asset types, but exact synchronization/manifests, partial-session control, regional placement, track-recording billing, and failure semantics need direct validation.
- Provider documentation proves API availability, not call quality. No candidate was load-tested in this ticket.
- Prices are a snapshot from 2026-09-14 and exclude storage, playback egress, taxes, support tiers, transcription, derived compositions, and discounts.
- This report does not decide recording consent, retention, legal geography, or whether selective playback should be multi-track client playback versus server-side on-demand composition.

## Decision-relevant conclusion

The later architecture ticket should shortlist **LiveKit Cloud and 100ms as the two providers that currently document the complete source-track requirement**, retain **Daily as a credible third candidate if S3 and proprietary raw-track packaging are acceptable**, and treat **Cloudflare RealtimeKit as conditionally viable only after explicitly resolving its lack of separate participant video recording**. Cloudflare remains a sensible home for UnMute's application services and durable artifact storage even if another provider carries WebRTC media.

The best next evidence is not another broad comparison. It is a parity spike that proves synchronization, failure handling, bytes, regional behavior, and actual billed units for a 10-participant all-track recording.
