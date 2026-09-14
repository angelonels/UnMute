# Recording, transcription, and AI-processing trust obligations

Research date: 2026-09-15  
Wayfinder question: What legal variability, platform constraints, and broadly applicable product-trust practices must UnMute account for when it records each participant's audio/video, transcribes speech, derives AI outputs, stores Meeting Records, and offers downloads?

## Status and limits of this report

This is product-planning research, not legal advice. It surveys representative primary law, regulator guidance, and web standards current on the research date. It does not establish which law applies to a particular meeting, participant, organizer, or company. Recording law can depend on every participant's location, the organizer's location, where interception or processing occurs, whether a conversation is confidential, the relationship between the parties, and the meeting's purpose. Privacy obligations also depend on who determines the purposes and means of processing and whether UnMute serves consumers directly or processes meetings for an organization.

The later policy decision needs qualified counsel for each supported launch geography and sensitive vertical. The safest engineering conclusion is to avoid making legality depend on silently detecting every participant's jurisdiction: design an explicit, auditable recording state and a clear participant choice, while recognizing that this conservative design may still need jurisdiction- or customer-specific changes.

## Executive finding

UnMute must treat five distinct acts as separate processing purposes, even when they happen in one product flow:

1. transmitting live audio/video;
2. recording and storing source tracks;
3. transcribing and attributing speech;
4. generating summaries, answers, decisions, and action items;
5. sharing, downloading, exporting, or reusing the resulting Meeting Record.

A host's authority to convene a meeting does not automatically answer whether every participant may be recorded, whether UnMute has a privacy-law basis to process the data, whether the organizer may disclose it to later viewers, or whether meeting content may be used to train a model. Browser permission to use a camera, microphone, or screen is also not legal consent to server-side recording or AI processing.

The primary sources support these planning conclusions:

- United States federal interception law contains a one-party-consent exception, but states can impose stricter rules. California requires all parties' consent for a confidential communication; Florida authorizes interception when all parties have given prior consent; Massachusetts defines prohibited interception around secret recording without prior authority from all parties. A global product cannot safely infer “the host clicked record” is enough. [18 U.S.C. § 2511](https://uscode.house.gov/view.xhtml?req=%28title%3A18+section%3A2511%29) [California Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632.) [Florida Statutes § 934.03](https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0900-0999/0934/Sections/0934.03.html) [Massachusetts General Laws ch. 272 § 99](https://malegislature.gov/laws/generallaws/partiv/titlei/chapter272/section99)
- Data-protection law governs the full lifecycle beyond initial capture. Under the EU GDPR, processing must have a lawful basis and follow transparency, purpose limitation, data minimization, accuracy, retention, security, rights, processor-contract, privacy-by-design, impact-assessment, and international-transfer rules. Consent is only one possible lawful basis, and choosing another basis does not erase the transparency or recording-law questions. [GDPR](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32016R0679)
- India's Digital Personal Data Protection Act and final 2025 Rules are being brought into force in stages. As of this report, many substantive processing provisions are scheduled for eighteen months after the 13 November 2025 notification, not yet fully effective; product architecture should nevertheless anticipate clear notice, specified purposes, consent/withdrawal where relied upon, rights, security, breach processes, erasure, processors, children, and cross-border restrictions rather than build to a temporary commencement gap. [commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf) [final Rules](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) [DPDP Act](https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf)
- An AI chatbot interacting with EU users must disclose that it is AI unless obvious under Article 50 of the EU AI Act, which is applicable from 2 August 2026 for the relevant general provisions. Other Article 50 labeling duties depend on the kind and use of generated content. A meeting summary is not automatically a deepfake or public-interest publication, but UnMute should label all derived artifacts as AI-generated because users may otherwise mistake them for the source record. [EU AI Act, Article 50](https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng)
- Training or fine-tuning on Meeting Records is a new, high-impact purpose—not a technical implementation detail. The EDPB says personal-data roles and responsibilities for AI development/deployment should be assessed before processing, and that legitimate interests require necessity and balancing; unlawfully processed training data can affect deployment lawfulness. [EDPB Opinion 28/2024](https://www.edpb.europa.eu/documents/opinion-of-the-board-art-64/opinion-282024-on-certain-data-protection-aspects-related-to_en)

The conservative product-trust baseline is therefore: announce planned processing before entry; require an affirmative participant acknowledgment before joining a recorded/transcribed session; show persistent in-session state; announce state changes; provide a leave path; prevent recording from starting until the chosen policy is satisfied; record an audit trail; limit Meeting Record access; give users workable deletion/export/complaint channels; never use meeting content for model training by default; and clearly distinguish source transcript from fallible AI-derived output. These are product recommendations, not a claim that the same exact interaction is legally required or sufficient everywhere.

## 1. Capture and communications-recording law

### United States federal baseline

Title III generally prohibits intentional interception, use, or disclosure of wire, oral, or electronic communications, subject to exceptions. For a private person, 18 U.S.C. § 2511(2)(d) says interception is not unlawful under that chapter where the person is a party or one party gave prior consent, unless the interception is for a criminal or tortious purpose. This is a federal baseline, not a nationwide product rule that preempts stricter state requirements. [18 U.S.C. § 2511](https://uscode.house.gov/view.xhtml?req=%28title%3A18+section%3A2511%29)

Several state statutes illustrate why participant location and confidentiality matter:

- California Penal Code § 632 covers intentionally recording a “confidential communication” without all parties' consent. It defines confidentiality by circumstances reasonably indicating that a party wants the communication confined to the parties and excludes public gatherings and circumstances where recording may reasonably be expected. The statute also excludes a person known by all parties to be overhearing or recording from its definition of the prohibited actor. [California Penal Code § 632](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632.)
- Florida § 934.03(2)(d) authorizes a person to intercept when all parties have given prior consent, subject to enumerated exceptions. [Florida Statutes § 934.03](https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0900-0999/0934/Sections/0934.03.html)
- Massachusetts defines “interception” as secretly hearing or secretly recording without prior authority from all parties, making secrecy and notice central to the statutory structure. [Massachusetts General Laws ch. 272 § 99](https://malegislature.gov/laws/generallaws/partiv/titlei/chapter272/section99)

This report does not attempt a 50-state chart. A static chart would still not resolve conflict-of-laws questions for a call spanning multiple states. Before a US launch, counsel should determine the supported policy against the strictest relevant state rules and examine whether separate treatment is needed for confidential/non-confidential communications, recording start after join, late joiners, and meetings crossing state or national borders.

### Consent must match the act

“Recording” for UnMute is not one invisible operation. It may include microphone tracks, camera tracks, screen-share video, screen/system audio, a composite, and a transcript. A useful disclosure should name what is captured and what happens next. Consent or acknowledgment obtained for live transmission should not be stretched to cover indefinite storage, public-link sharing, model training, biometric identification, or unrelated analytics.

Participants joining late or reconnecting must receive the current state before publishing media. If a host can start recording during an already-live session, the product must define whether participants must actively acknowledge the change, whether continued presence counts as assent in supported jurisdictions, and what happens to participants who decline. That is a later legal/product decision; a tone or toast alone should not be assumed sufficient.

### Screen sharing is additional capture

Screen capture can expose other people's messages, health/financial information, credentials, copyrighted material, or unrelated application audio. The W3C Screen Capture specification requires the browser to let the user choose a display surface every time, prohibits persisting a granted display-capture permission, requires transient user activation, and extends privacy-indicator requirements. Audio availability and source differ by browser. These browser guarantees govern user-to-browser permission; they do not authorize UnMute to retain or analyze the shared content. [W3C Screen Capture](https://www.w3.org/TR/screen-capture/)

UnMute currently plans to let AI use only voice transcript as meeting knowledge. That boundary should be technically enforced: screen-share frames, chat, files, camera video, and system audio should not enter AI pipelines merely because the media provider can expose them.

## 2. Data-protection lifecycle

### EU/EEA and UK-style obligations

Audio, video, transcripts, names, participant identifiers, timestamps, attendance, chat metadata, and AI outputs linked to a person are personal data. Under GDPR Article 5, processing must be lawful, fair, transparent, purpose-limited, minimized, accurate, storage-limited, secure, and accountable. Article 6 requires a lawful basis. Articles 12–14 govern notice; Articles 15–22 create access and other data-subject rights; Article 25 requires data protection by design/default; Article 28 governs processors; Article 32 security; Articles 33–34 breach handling; Article 35 impact assessments for processing likely to create high risk; and Chapter V governs international transfers. [GDPR](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32016R0679)

Important distinctions for planning:

- **Consent is not automatically the right GDPR basis.** It must be freely given, specific, informed, unambiguous, demonstrable, and withdrawable. Employment or education power imbalances can make “freely given” difficult. Contract or legitimate interests may apply to some purposes, but each needs its own legal analysis; recording law can separately require consent.
- **Withdrawal is not identical to deletion.** Withdrawal affects future consent-based processing; erasure has conditions and exceptions. The product needs explicit behavior for source recordings, derived transcripts/summaries, backups, shared copies, and legal holds.
- **Accuracy applies to derived personal data.** An incorrect action item attributed to a participant or an inaccurate summary may be personal data requiring correction. Keeping an immutable source transcript while allowing correction/annotation of derived artifacts is worth considering.
- **Controller/processor roles vary.** In a direct consumer product, UnMute will often determine purposes and means. In an organizational offering, the customer may be controller and UnMute processor for customer-directed meeting processing, while UnMute remains controller for account security, billing, or product telemetry. The contract label alone is not decisive; the actual decisions are. [EDPB controller/processor guidelines](https://www.edpb.europa.eu/documents/guideline/guidelines-072020-on-the-concepts-of-controller-and-processor-in-the-gdpr_en)
- **Vendor chains matter.** Media, storage, transcription, embedding, and LLM providers may be processors/subprocessors. Article 28 terms, subprocessors, deletion, audit/security commitments, incident notice, and transfer mechanisms need review before selection.
- **International routing is processing.** A globally routed SFU, US-hosted model, or cross-region backup may constitute a restricted transfer even if the application server is in Europe. The EDPB advises mapping transfers, identifying a Chapter V transfer tool, assessing destination-country law, and applying supplementary measures where needed. [EDPB transfer recommendations](https://www.edpb.europa.eu/system/files/2021-06/edpb_recommendations_202001vo.2.0_supplementarymeasurestransferstools_en.pdf)

The UK ICO's small-business guidance specifically says recorded video-conference images and voices require a valid purpose that cannot be achieved through a less intrusive method, and the lawful basis should be recorded and justified. UK analysis must be performed under current UK law rather than assumed identical to EU law. [ICO data-sharing advice](https://ico.org.uk/for-organisations/advice-for-small-organisations/information-security/data-sharing-advice/)

### India

The DPDP Act covers digital personal data within India and certain processing outside India connected to offering goods or services to people in India. Its core structure includes notice, consent and certain legitimate uses, general Data Fiduciary obligations, children, access, correction/erasure, grievance redressal, processors, security, breach notification, erasure, and possible restrictions on transfers. [DPDP Act](https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf)

Commencement is staged. The 13 November 2025 notification brought institutional and specified provisions into force immediately, schedules section 6(9) and a related Board provision one year later, and schedules most substantive processing/rights provisions eighteen months later. The final Rules follow the same broad staging: Rules 1, 2, and 17–21 immediately; Rule 4 after one year; and Rules 3, 5–16, 22, and 23 after eighteen months. As of 15 September 2026, do not describe all DPDP duties as already operative. [Act commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf) [final Rules](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)

The final Rule 3 notice standard, when commenced, requires an independently understandable notice in clear language with itemized personal data, specified purposes and uses, and routes to withdraw consent, exercise rights, and complain. This fits a layered UnMute flow: short, specific pre-join disclosure plus accessible full privacy information. The product should preserve consent/notice versions and event records so it can later demonstrate what each participant saw and did.

### California consumer privacy

If UnMute becomes a business subject to the CCPA, California consumers have rights to know, delete, correct, opt out of sale/sharing, limit certain sensitive-personal-information uses, and avoid discrimination, with notice required before or at collection. Applicability thresholds and exemptions require separate analysis; a small portfolio deployment is not automatically covered. [California Attorney General CCPA overview](https://oag.ca.gov/privacy/ccpa)

Meeting content can contain sensitive information even if the media file is not categorically “sensitive personal information.” California's definition includes biometric information processed to identify a consumer and health, racial/ethnic, religious, union, sexual-orientation, and other listed data. Product design should not depend only on categorical labels: a transcript is high-impact because ordinary conversation can reveal many sensitive facts.

### Retention and deletion are linked graphs

A Meeting Record is a dependency graph, not one file:

- source microphone/camera/screen tracks;
- composite and playback derivatives;
- transcript segments, diarization, speaker mapping, captions;
- embeddings and search indexes;
- prompts, retrieved passages, answers, summaries, topics, decisions, action items;
- thumbnails, waveforms, logs, audit entries, exports, caches, backups, and provider-held copies.

A deletion policy must specify whether deleting a meeting deletes all derivatives, how shared copies and user downloads are treated, how search indexes are purged, what minimal audit/security records remain, and when backups age out. A provider deletion API returning success is not enough; UnMute needs deletion state and retry/reconciliation for every processor.

Downloads create an important limit: once an authorized user downloads a file, UnMute generally cannot technically revoke that copy. The UI and policy should communicate this before sharing/downloading, and access logs should record the export. Watermarking or recipient-specific export metadata may deter misuse but should not be represented as revocation or legal protection.

## 3. Biometrics and speaker attribution

A voice or face recording is not necessarily biometric identification merely because it depicts a person. Risk increases when UnMute extracts templates or features to recognize or verify identity.

- GDPR defines biometric data around specific technical processing of physical, physiological, or behavioral characteristics allowing or confirming unique identification; Article 9 restricts special-category biometric data used for unique identification. [GDPR](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32016R0679)
- Illinois BIPA expressly includes a voiceprint as a biometric identifier. For covered private entities, the statute requires a public retention/destruction policy and, before collecting or obtaining biometric identifiers/information, written notice of collection/storage and purpose/term plus a written release; it also restricts disclosure and sale/profit. [Illinois BIPA, 740 ILCS 14](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=3004&ChapterID=57)
- California treats biometric information processed to identify a consumer as sensitive personal information under the CCPA framework. [California Attorney General CCPA overview](https://oag.ca.gov/privacy/ccpa)

Simple diarization (“speaker A” versus “speaker B” within one recording) and mapping a participant's authenticated track to their display name may avoid persistent voiceprints. Cross-meeting voice recognition, face recognition, emotion inference, or identity verification changes the legal/risk profile and should be out of the default transcript pipeline unless separately researched and approved.

## 4. AI-specific obligations and trust risks

### Transparency and scope

For EU users, AI Act Article 50 requires a directly interacting AI system to inform people that they are interacting with AI unless obvious, in a clear and distinguishable way by the first interaction. It also contains separate machine-readable marking duties for providers of synthetic content and disclosure rules for deepfakes and certain public-interest text. The exact provider/deployer role and each output category need assessment; a blanket claim that every private meeting summary has the same legal label is not supported by Article 50. [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng)

UnMute should nevertheless label every summary, topic, decision, action item, and answer as AI-generated or AI-assisted, because these are interpretations rather than the source record. The UI should link claims to transcript timestamps and let authorized users inspect the underlying segment.

### Accuracy and human reliance

NIST describes generative-AI “confabulation” as confidently presented erroneous or false content and notes it is a natural consequence of generative models, especially in open-ended and highly contextual domains. [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

For UnMute, that means:

- do not silently write AI output back into the transcript;
- distinguish verbatim/edited transcript, speaker attribution, and generated interpretation;
- cite transcript evidence and display uncertainty or “not established in this meeting”;
- allow correction, dismissal, and version history for derived artifacts;
- do not represent summaries as complete minutes or action items as accepted commitments;
- require human review before external action, calendar mutation, or messages are sent;
- evaluate accuracy across accents, audio quality, overlapping speech, names, multilingual content, and domain vocabulary;
- avoid consequential scoring or inference about participants.

These are trust controls, not guarantees that an AI answer is legally or factually correct.

### Training and secondary use

The default product promise should be that meeting content is used only to provide the requested meeting features and is not used to train or improve general models. If UnMute later wants training/fine-tuning/evaluation use, it must become a separate Wayfinder/legal effort addressing a new purpose, lawful basis, participant expectations, withdrawal/deletion effects, vendor terms, de-identification limits, and whether every person whose speech appears can meaningfully choose.

“De-identified transcript” should not be assumed anonymous. Meeting context, names, roles, rare events, writing style, and linked metadata can re-identify people. The EDPB says AI-model anonymity must be assessed case by case and requires it to be very unlikely both that people are identifiable and that personal data can be extracted via queries. [EDPB Opinion 28/2024 summary](https://www.edpb.europa.eu/news/edpb-opinion-on-ai-models-gdpr-principles-support-responsible-ai_en)

### Sensitive-use contexts

The same general meeting product can enter regulated contexts through customer use:

- If UnMute creates, receives, maintains, or transmits electronic protected health information on behalf of a HIPAA covered entity or business associate, HHS says the cloud provider is generally a business associate even if it holds only encrypted ePHI without the key, requiring a HIPAA-compliant BAA and Security Rule compliance. UnMute should not claim HIPAA suitability until every relevant subprocessor signs appropriate terms and the full product has been assessed. [HHS cloud guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
- A school-maintained video directly related to a student may be an education record under FERPA, including recordings containing PII from education records. Multi-student records create access and redaction complications. [US Department of Education FERPA video FAQ](https://studentprivacy.ed.gov/faq/faqs-photos-and-videos-under-ferpa)
- Employment, recruitment, education admissions, credit, health, legal, and disciplinary uses can trigger sector law and materially increase harm from inaccurate summaries. UnMute should not market AI-derived judgments for these uses without separate assessment.

## 5. Children and age scope

US COPPA applies to child-directed online services collecting personal information from children under 13 and to general-audience services with actual knowledge they are doing so. Covered operators must provide notice and obtain verifiable parental consent before collection/use/disclosure, subject to limited exceptions, and meet security, retention, deletion, and parental-right requirements. Audio containing a child's voice and photos/videos are among the kinds of data that can bring the rule into play. [FTC COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa) [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

India's DPDP Act defines a child as under 18, requires verifiable parental consent before processing children's personal data, and restricts detrimental processing, tracking/behavioral monitoring, and targeted advertising, subject to notified exceptions and phased commencement. GDPR Member States can set the child-consent age for information-society services between 13 and 16, but that provision does not resolve school authority, recording law, or other lawful bases.

Allowing unnamed guests makes reliable age handling harder, not easier. The later scope decision should choose among an adults-only product, a general-audience product that blocks known minors and defines escalation, or a deliberately child-capable education product with parental/school controls. “Anyone with a link” is not an age policy.

## 6. Platform and vendor constraints

### Browser capture

Camera and microphone access is governed by `getUserMedia`, browser permission, secure-context and Permissions Policy behavior, with browser-controlled privacy indicators. Display capture requires a fresh user choice and activation each time. UnMute cannot auto-start screen sharing or replace these prompts with its own consent screen. [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/) [W3C Screen Capture](https://www.w3.org/TR/screen-capture/)

Browser permission and server recording state must be shown separately. A participant may permit camera use for a live unrecorded session, while declining a later recording request. Conversely, turning the local camera off should not imply that previously recorded media or the microphone transcript was deleted.

### Provider contracts and policies

The media, transcription, storage, embedding, and LLM vendors are not selected, so this ticket cannot resolve provider-specific policy compliance. Before selection, require a documented matrix for each vendor covering:

- customer-content ownership and license;
- whether inputs/outputs are used for model training or human review and how to opt out;
- retention in primary systems, abuse logs, backups, and failed jobs;
- deletion APIs and deletion completion;
- subprocessors and processing regions;
- encryption and key options;
- DPA, standard contractual clauses/transfer mechanism, and security reports;
- incident-notification commitment;
- HIPAA/education or other regulated-use availability if in scope;
- content restrictions and whether Meeting Record downloads/exports are permitted;
- webhook authentication, audit logs, account termination/export behavior, and portability.

Contractual “zero retention” must be checked against operational logs, safety systems, and the exact API/product tier. The frontend should never send the full Meeting Record to a provider when only a retrieved transcript segment is necessary.

## 7. Conservative product-trust baseline

The following is a recommended common floor, not a conclusion that it satisfies every law.

### Before the session

- The invitation states whether the organizer intends to record, transcribe, and run AI, naming each purpose separately.
- The pre-join screen identifies the organizer and gives a concise, plain-language summary of captured sources, derived artifacts, who can access them, current retention, download possibility, AI vendors/categories, and a link to full privacy information.
- A participant takes an affirmative action acknowledging the disclosed state before entering. Store the notice version, policy version, meeting/session ID, participant/guest ID, timestamp, and action—not raw IP/device data unless justified.
- Declining has a clear consequence and exit path. Do not use coercive copy such as “By joining you agree to anything.”
- Late joiners and reconnecting participants see the current state before publishing media.

### During the session

- Show a persistent, accessible recording/transcription/AI indicator visible in all layouts, including screen-share focus and mobile-responsive views.
- Announce every transition with visual and audible cues; do not let a host suppress participant indicators.
- Prevent recording/transcription startup until the selected admission/acknowledgment policy is satisfied.
- Define what happens when a participant withdraws or leaves: stop future capture for that participant/session as policy requires, without falsely promising deletion of already lawfully processed data.
- Make host/co-host permissions explicit and audited. Starting/stopping recording, exporting, changing access, and deleting are high-impact events.
- Keep voice-transcript AI isolation as an enforceable allowlist: AI does not receive video, screen frames, chat, or files.

### After the session

- Default Meeting Records to restricted access; guest attendance alone does not imply permanent access.
- Show who currently has access and maintain audit events for views, grants, revocations, downloads, deletion, and retention changes.
- Use expiring, scoped download URLs. Do not expose provider bucket URLs directly as durable authorization.
- Warn that downloaded copies cannot be remotely revoked. Allow the organizer to disable future downloads separately from streaming access if useful.
- Give participants a route to challenge speaker attribution or AI-derived claims and to submit privacy requests even if they had no account.
- Label transcript corrections and AI output versions; preserve enough provenance to explain the change without retaining unnecessary deleted content.
- Apply an explicit retention timer and notify organizers before deletion if restoration is offered. Backups and processor copies follow documented schedules.

### Security and operations

- Encrypt transport and stored assets; isolate tenant/meeting authorization server-side; use least-privilege, short-lived media and download credentials.
- Separate provider management credentials from browser tokens; verify and deduplicate webhooks.
- Treat recording tracks, transcripts, embeddings, prompts, and audit trails as sensitive data in logs, support tools, analytics, and error reports.
- Maintain a data inventory and deletion map across providers. NIST's voluntary Privacy Framework recommends identifying ecosystem parties, managing them through contracts, and routinely assessing whether they meet obligations. [NIST Privacy Framework](https://www.nist.gov/privacy-framework/using-privacy-framework-11)
- Create a breach-response plan before retaining real meetings. Applicable notice deadlines and recipients vary by jurisdiction and customer contract.
- Conduct a privacy/threat review before adding public links, cross-meeting search, model training, biometric recognition, or autonomous actions.

## 8. Explicit human decisions UnMute must make later

The research resolves facts, not these policy choices:

1. **Launch geography:** Which participant/organizer locations will be supported initially, and will UnMute block unsupported locations or rely on organizer contractual promises?
2. **Product role:** Is UnMute the controller/business deciding meeting processing, a processor/service provider for an organizer, or both in different offerings?
3. **Meeting organizer authority:** What must the organizer represent about their authority, and when does UnMute independently collect participant acknowledgment or consent?
4. **Recording admission rule:** Must every participant affirm before entry, may unrecorded participants remain, and what happens when someone declines?
5. **Mid-session changes:** Can recording/transcription/AI begin after entry, what renewed action is required, and what happens to non-responders?
6. **Capture scope:** Are camera, microphone, screen-share video, screen audio, captions, and raw source tracks independently controllable and disclosed?
7. **AI boundary:** Is voice transcript the only AI input by technical policy, and are live answers/summaries separate purposes from transcription?
8. **Lawful bases:** For each supported legal regime and purpose, which lawful basis applies and how are consent withdrawal, objection, or contract necessity handled?
9. **Record ownership and access:** Does organizer control prevail, what rights do authenticated participants receive automatically, and how can guests exercise rights?
10. **Downloads and sharing:** Who may download, can public/revocable links exist, is recipient watermarking used, and how are exports audited?
11. **Retention:** Default and maximum retention for raw tracks, composites, transcripts, embeddings, AI outputs, audit records, logs, backups, and provider copies.
12. **Deletion and correction:** Who may delete a Meeting Record; can a participant request deletion or correction of their segment; how are conflicts among participants resolved?
13. **Training:** Will meeting content ever be used for model training, fine-tuning, evaluation, or product improvement? Recommended default: no; any change requires a new explicit decision.
14. **Biometrics:** Will UnMute ever create persistent voice/face templates or cross-meeting recognition? Recommended initial boundary: no.
15. **Minors:** Adults-only, general-audience with known-minor handling, or deliberately child-capable; how are guests handled?
16. **Regulated contexts:** Will healthcare, schools, employers, recruiters, legal services, or other sensitive uses be prohibited, unsupported, or supported through a separate product tier and contracts?
17. **Regions and vendors:** Required processing/storage regions, subprocessor acceptance, cross-border transfer mechanism, and fallback when a vendor changes terms.
18. **AI presentation:** Required citations, uncertainty, edit/review workflow, provenance, and the boundary before AI can take an external action.
19. **Incident response:** Who is notified, through what channel, under which timelines, and how organizer/customer obligations are supported?
20. **Evidence/audit:** What is logged to prove notice, acknowledgment, access, downloads, policy changes, and deletion without collecting disproportionate telemetry?

## 9. Decisions that should be made before vendor selection

The following choices materially affect media and AI architecture and therefore should precede final provider selection:

- whether all participants must be acknowledged before any server-side recording starts;
- whether per-participant capture can be selectively excluded or must be all-or-nothing;
- whether mid-session start/stop and late joiners require per-participant state changes;
- the maximum raw-track retention and whether providers may temporarily retain copies;
- allowed processing/storage regions;
- the no-training requirement and vendor zero-retention requirement;
- guest privacy-request identity verification;
- whether regulated or minor use is excluded at launch;
- whether audio/video source tracks are independently deletable or the meeting is one shared record.

A provider whose recorder automatically captures all tracks from first join may conflict with per-participant opt-out. A provider that cannot delete individual tracks may conflict with segment-level erasure policy. A provider that routes globally without region controls may conflict with later transfer/data-residency decisions. These are product-policy inputs to architecture, not post-launch paperwork.

## 10. Remaining legal uncertainties

- No universal rule establishes which jurisdiction's recording law governs a multi-jurisdiction online meeting.
- State wiretap/eavesdropping statutes and case law are not exhausted here; sector-specific and civil claims may add requirements.
- The exact GDPR/UK GDPR role allocation between organizer and UnMute depends on product contracts and actual control.
- Whether consent is freely given in employment or education contexts depends on circumstances and local guidance.
- CCPA applicability depends on statutory thresholds, business relationships, and exemptions; similar US state privacy laws were not catalogued.
- DPDP substantive commencement is staged and future government notifications can affect transfers, children, exemptions, and Significant Data Fiduciary status.
- AI Act classification depends on intended purpose. A general meeting assistant is not automatically high-risk, but features used to evaluate employment, education access, or other Annex III decisions can change that assessment.
- “Speaker attribution” can range from track mapping to biometric voice identification; implementation facts determine biometric-law exposure.
- Recording disclosure does not resolve copyright, confidentiality, trade-secret, privilege, employment, contractual, or sector-specific restrictions on later sharing and AI use.
- Vendor terms, subprocessors, training defaults, retention, and supported regions can change and require review at selection and renewal.

## Decision-relevant conclusion

UnMute should not adopt “host clicks record” or browser media permission as its trust model. The architecture must support explicit, versioned participant processing state; visible recording/transcription/AI status; auditable transitions; source-limited AI; restricted and revocable server-side access; lifecycle deletion across derivatives and processors; and a firm no-training default unless a later effort deliberately changes it.

The later human policy ticket must still choose jurisdiction scope, legal bases, organizer/participant control, decline and withdrawal behavior, ownership/access, retention/deletion, minors and regulated-context boundaries, and vendor/region requirements. A conservative all-participant acknowledgment flow is the most portable product baseline identified by this research, but counsel must confirm whether it is required and sufficient for each supported use.
