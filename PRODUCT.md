# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Portfolio/demo audience: recruiters and engineers evaluating the project as a showcase of a tool-calling LLM agent. End users of the app itself are readers who want a personalised news digest by category or free-text topic. (Audience confirmed by the user; end-user detail inferred from README.)

## Product Purpose
The AI Briefing is a news-digest app built around a tool-calling LLM agent. Given a topic, the model decides how many searches to run, when to broaden scope, which stories to publish, and whether its own draft passes a relevance/originality check before output reaches the user.

## Positioning
The agent, not the caller, controls the loop: search depth, scope-broadening and stopping are model decisions. The same architecture runs on two providers (Gemini and Groq).

## Operating Context
Next.js 14 app with Tailwind and Supabase auth (Google OAuth only). Digests stream NDJSON progress events from `/api/digest`. Theming is CSS-variable driven via a `data-theme` attribute on `<html>`; light and dark are both supported, and the layout is responsive down to 390px.

## Capabilities and Constraints
- Follow categories or free-text topics, reorder them, regenerate on demand, one summary and photo per story.
- Both light and dark themes must keep working; no component-level theme branching.
- News sources: Google News RSS; images: Openverse.

## Evidence on Hand
Landing, sign-in and mobile screenshots under `docs/screenshots/`. No testimonials or usage metrics exist; do not fabricate them.

## Product Principles
- The agent's autonomy should be legible to the user, not hidden.
- Reading the news is the job; interface effects support it and never block it.
- Both themes and mobile are first-class.

## Accessibility & Inclusion
Not specified beyond theme support and responsiveness. Open decision: honouring prefers-reduced-motion was offered but not selected.
