# AI Chat — Quick Wins to Make It Stand Out

A focused, ranked playbook of 10 high-impact improvements for the portfolio chat at `mastertim.xyz`, based on what's actually shipping in production RAG systems in 2026 and where the current implementation has clear gaps.

> **The big irony to fix first.** Your portfolio context literally says you built RAG pipelines with *"hybrid retrieval, query rewriting, and re-ranking"* at Redbrick. But the chat that demos your work to recruiters runs naive single-vector retrieval with no reranking. The first three recommendations below close that credibility gap — and they're also the highest-ROI changes for answer quality.

---

## What you have today (baseline)

| Layer | Current state |
|---|---|
| Retrieval | Single dense-vector search via LlamaIndex, `topK=3`, `text-embedding-3-large` |
| Reranking | None |
| Query rewriting | None |
| Cache | Exact-string SHA256 → Redis, 1hr TTL |
| Streaming | SSE with `chunk` / `status` / `[DONE]` events, reasoning-start/end already wired |
| History | Last 10 turns concatenated into prompt (no coreference resolution) |
| Citations | None — sources logged server-side but never shown to user |
| Guardrails | 50-word limit on input, system prompt steers topic |
| Generation | Claude Haiku 4.5 via OpenRouter, temperature 0.7 |
| UX extras | Markdown links manually injected by prompt instruction |

---

## The ranked list

Ordered by **impact × ease**. Numbers in parens are rough effort estimates assuming you're comfortable in this stack.

### 1. Hybrid search + cross-encoder reranking (1–2 days) — answer quality + credibility

The single biggest quality lever. Replace the one-shot vector retrieval in `vectordb.ts` with a two-stage pipeline:

1. **Retrieve wide** — pull `topK=20` from dense vectors *and* a BM25 index over the same chunks, fuse with **Reciprocal Rank Fusion** (RRF). Pure hybrid gives roughly +9% recall over vector-only.
2. **Rerank to top 3–5** — pass the candidates through a cross-encoder. As of 2026 the practical leaders are **Cohere Rerank 3.5** (~600ms, 4096-token docs, multilingual — great fit since your bio is bilingual-adjacent) and **Voyage Rerank 2.5** (best quality/latency tradeoff). Both are drop-in API calls.

Why this earns its keep on a portfolio: you can put a small "How this answer was found" trace under each response showing *retrieve → rerank → generate* with the candidate scores. Recruiters who skim AI portfolios eat that up — it's the difference between "built a chatbot" and "built a production RAG system."

LlamaIndex has a built-in `LLMRerank` and supports Cohere/Voyage rerankers natively, so this isn't a rewrite — it's adding a `nodePostprocessors: [reranker]` to your existing retriever.

### 2. Multi-turn query rewriting (half a day) — fixes broken follow-ups

Production studies show **>60% of conversational follow-ups have unresolved coreferences** ("what about the second one?", "and his thesis?") that naive RAG can't retrieve against. Right now you concatenate history into the prompt, which helps the *answer* but not the *retrieval* — the embedding for "and his thesis?" finds nothing about Tim.

The fix: before retrieval, run a tiny LLM call (Haiku 4.5 is already wired, ~50ms) that rewrites the latest user turn into a standalone query using the chat history. Then embed *that* for retrieval. Two extra lines in `streamQueryVectorDB`:

```ts
const standalone = await rewriteQuery(query, history);  // "What's Tim's thesis?"
const nodes = await retriever.retrieve(standalone);
```

Optional second step: **adaptive strategy selection** — if the rewritten query is very short, switch to **HyDE** (generate a hypothetical answer paragraph, embed *that*); if it's ambiguous, fan out to **multi-query** (3 paraphrases, retrieve all, dedupe). Mature 2026 systems pick the strategy per-query rather than locking in one.

### 3. Inline citations with hover preview cards (1 day) — UX that recruiters notice

You already retrieve documents with metadata (`title`, `source`). Surface them.

The pattern that's converged across Perplexity / ChatGPT / Claude: superscript numbers `¹²³` inline in the answer, mapping to source cards rendered below or in a hover popover with title, snippet, and link. Implementation:

- Modify the prompt to emit citations as `[1]`, `[2]` markers tied to retrieved doc indices
- In the SSE stream, send the source list as a separate event before/after streaming text: `data: {"sources": [{id:1, title:"Redbrick AI Engineer Role", url:"/blog/...", snippet:"..."}]}`
- Render markers as styled chips; on hover show a card; on click jump to the source

This is the single most visible "this isn't a toy" signal in a chat UI. It also makes hallucinations way less scary because users can verify in one hover.

### 4. Suggested follow-up questions (a few hours) — engagement

After each answer finishes streaming, generate 3 short follow-ups grounded in *what was just retrieved*. Render as clickable chips below the response. Two ways to do it:

- **Cheap:** one extra LLM call after the main response with the prompt *"Given this answer and the retrieved context, suggest 3 short follow-up questions a recruiter might ask next."*
- **Free:** generate them as part of the same response in a JSON tail — but streaming gets messier.

The Vercel AI SDK's `experimental_output` with a Zod schema makes this clean. Visitors who don't know what to ask convert way better with starter chips.

### 5. Tool-calling for generative UI cards (2–3 days) — the wow factor

Your prompt currently says *"include this exact markdown link after answering."* That's a hack. Replace it with **typed tool calls** the model invokes when relevant, and render each tool result as a custom Astro/HTML component. A few high-leverage tools:

| Tool | Triggers when user asks about | Renders as |
|---|---|---|
| `showProjectCard(slug)` | a specific project / publication | Hero image + tags + "Read post" button |
| `showSkillsRadar()` | skills, stack, "what do you know" | Compact radar/bar chart of TS, Python, Three.js, RAG, etc. |
| `showTimeline()` | career, experience, "walk me through" | Vertical timeline: UNIST → Redbrick 3D → Redbrick AI |
| `showContactCard()` | "how do I reach Tim", hiring intent | Email + LinkedIn + "Schedule a call" button |
| `bookCalendly()` (optional) | recruiter intent | Embedded scheduler |

This is the Vercel AI SDK 5 sweet spot — `streamText({ tools })` with each tool returning structured data, and the client mapping `tool-${name}` parts to components. It instantly makes the chat feel like a real product instead of a markdown box, and it's a **literal demo of agentic AI** living on your portfolio. Hiring managers stop scrolling for this.

### 6. Semantic caching (1 day) — measurable cost win you can brag about

Your current cache is exact-match SHA256 — *"Tell me about Tim"* and *"Who is Tim?"* miss each other. Production reports show semantic caching (cosine similarity over query embeddings) hits **40–73% cost reduction** and ~24× latency improvement on hits.

Implementation in `redis.ts`:
1. On miss, embed the query with a *small/cheap* model (`text-embedding-3-small`, not `-large` — speed matters here).
2. Store `{embedding, response, query}` in Redis with a vector index (Redis Stack supports this natively via RediSearch with HNSW).
3. On lookup, kNN with cosine threshold ≥ 0.92 → return cached response. Below threshold → fall through to RAG.

Two reasons this is portfolio gold: (a) it's a real engineering decision with a measurable metric — wire up a `/api/stats` endpoint that exposes hit rate over the last 24h and put a tiny "cache hit rate: 47%" badge on the chat. (b) Your context already mentions you built semantic caching at Redbrick — having it live on your own site closes the loop.

### 7. Contextual retrieval at index time (half-day re-index) — better chunks

Anthropic's contextual retrieval technique: before embedding each chunk, prepend a 1–2 sentence summary explaining *where this chunk fits in the source document*. Improves retrieval especially for short, ambiguous chunks (e.g. a bullet point pulled out of a CV section).

This is a build-time change in `scripts/build-vectordb.ts`:

```ts
for (const chunk of chunks) {
  const ctx = await llm.complete(
    `Document title: ${doc.title}\nDocument excerpt: ${doc.preview}\nChunk: ${chunk}\n\n` +
    `Write a 1-2 sentence prefix situating this chunk in the document.`
  );
  chunk.text = `${ctx}\n\n${chunk.text}`;
}
```

One-time embedding cost; permanent recall improvement. Pairs naturally with #1 (hybrid + rerank).

### 8. Voice mode (1–2 days) — the demo moment

OpenAI's `gpt-realtime` (now GA, late 2025) gives you bidirectional speech-to-speech with sub-second latency over WebRTC. Add a mic button to the hero chat that opens a voice session reusing your existing system prompt + retrieved-context as the realtime instructions.

Why bother on a portfolio: it's the kind of thing recruiters screenshot and DM each other. "Wait, Tim's site has a voice agent that knows his entire CV?" Cost is minimal because most visitors won't use it; the ones who do are the ones who care most.

Optional spice: pipe the visitor's question through the same RAG pipeline first, then feed retrieved context into the realtime session — you get *grounded* voice answers, not generic ones.

### 9. Prompt-injection + abuse guardrails (half-day) — production hygiene

Prompt injection is OWASP's #1 LLM vulnerability for 2026 and 73% of production AI deployments are vulnerable. On a portfolio it's not catastrophic, but a public chat that can be jailbroken into writing slurs is a bad screenshot. Easy layered defenses:

- **Input filter:** before retrieval, run a small classifier prompt or use **Rebuff** (open-source, free) / **Lakera Guard** (free tier, ~50ms) to flag obvious jailbreaks ("ignore previous instructions", role-play attacks).
- **Output filter:** simple regex + topic classifier on the streamed response — if it drifts off Tim, replace with the canned refusal.
- **Rate limiting:** per-IP, per-session token budget. Vercel KV makes this 10 lines of code.
- **Canary string** in your system prompt — if it ever appears in output, you know injection succeeded and can log/alert.

Document the guardrails in a `/security` page or a footer link — it's another "this person ships production code" signal.

### 10. Lightweight eval dashboard (1 day) — the resume-grade differentiator

This is the one *most* portfolios don't have, and it's the cheapest way to look like a serious AI engineer.

Wire up **Arize Phoenix** (open-source, free, runs on Vercel) or **RAGAS** to log every chat session with:
- Retrieved chunks + scores
- Generated answer
- Latency breakdown (retrieve / rerank / generate)
- Faithfulness + answer-relevance scores from RAGAS metrics (LLM-as-judge calls)

Then expose a public read-only `/admin/evals` dashboard (or a screenshot in your About page) showing live metrics: *"Last 100 questions: 94% faithfulness, 0.61s p50 latency, 47% cache hit rate."*

This is the single most credible AI-engineer signal you can put on a portfolio. Anyone can build a chatbot. Almost nobody has it instrumented end-to-end with eval scores in production.

---

## Suggested rollout order

If you want a phased plan:

**Week 1 — Quality foundation.** Items 1, 2, 7. After this the chat actually answers well and matches what your bio claims you can build.

**Week 2 — Visible UX.** Items 3, 4, 5. Citations, follow-up chips, generative-UI cards. This is where visitors notice.

**Week 3 — Production polish.** Items 6, 9, 10. Semantic cache, guardrails, eval dashboard — the "I ship real systems" layer.

**Week 4 (optional flex).** Item 8 — voice mode as the conversation-stopper.

---

## Stack notes

Everything above stays inside your current Astro/Vercel/LlamaIndex/AI-Gateway-via-OpenRouter setup. The only new dependencies you'd pick up:

- `@cohere-ai/cohere-typescript` *or* `voyageai` — for the reranker (#1)
- Redis Stack (you're already on Redis) for vector caching (#6)
- `arize-phoenix` *or* `ragas` (Python — runs as a sidecar, or use TS-native `autoevals`) for #10
- `openai` SDK with realtime support for #8

No infra rearchitecture required. Each item is independently shippable and each one is a real bullet you can put on a resume.

---

## Sources

- [RAG Is Not Dead: Advanced Retrieval Patterns That Actually Work in 2026](https://dev.to/young_gao/rag-is-not-dead-advanced-retrieval-patterns-that-actually-work-in-2026-2gbo)
- [Optimizing RAG with Hybrid Search & Reranking — Superlinked](https://superlinked.com/vectorhub/articles/optimizing-rag-with-hybrid-search-reranking)
- [Building Contextual RAG Systems with Hybrid Search and Reranking — Analytics Vidhya](https://www.analyticsvidhya.com/blog/2024/12/contextual-rag-systems-with-hybrid-search-and-reranking/)
- [Retrieval Is the Bottleneck: HyDE, Query Expansion, and Multi-Query RAG — Medium](https://medium.com/@mudassar.hakim/retrieval-is-the-bottleneck-hyde-query-expansion-and-multi-query-rag-explained-for-production-c1842bed7f8a)
- [RAG Query Rewriting: 4 Layers That Fix Multi-Turn Retrieval — Alhena](https://alhena.ai/blog/query-rewriting-before-retrieval-multi-turn-rag/)
- [Ultimate Guide to Choosing the Best Reranking Model in 2026 — ZeroEntropy](https://zeroentropy.dev/articles/ultimate-guide-to-choosing-the-best-reranking-model-in-2025/)
- [Best Reranker for RAG: We tested the top models — Agentset](https://agentset.ai/blog/best-reranker)
- [Beyond Naive RAG: A Step-by-Step Guide to Building Agentic RAG in 2026 — Medium](https://medium.com/@vkrishnan9074/beyond-naive-rag-a-step-by-step-guide-to-building-agentic-rag-in-2026-fceddd989c74)
- [Agentic RAG vs Classic RAG: From a Pipeline to a Control Loop — TDS](https://towardsdatascience.com/agentic-rag-vs-classic-rag-from-a-pipeline-to-a-control-loop/)
- [AI SDK UI: Generative User Interfaces — Vercel AI SDK Docs](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)
- [Multi-Step & Generative UI — Vercel Academy](https://vercel.com/academy/ai-sdk/multi-step-and-generative-ui)
- [AI UX Patterns | Citations — ShapeofAI](https://www.shapeof.ai/patterns/citations)
- [AI Chat UI Best Practices: Designing Better LLM Interfaces — thefrontkit](https://thefrontkit.com/blogs/ai-chat-ui-best-practices)
- [Introducing gpt-realtime and Realtime API updates for production voice agents — OpenAI](https://openai.com/index/introducing-gpt-realtime/)
- [Voice agents — OpenAI API Docs](https://platform.openai.com/docs/guides/voice-agents)
- [Semantic Caching for LLM Apps: Reduce Costs by 40-80% — Percona](https://www.percona.com/blog/semantic-caching-for-llm-apps-reduce-costs-by-40-80-and-speed-up-by-250x/)
- [Semantic Caching Cuts Our LLM Inference Costs by Up to 73% — The Agent Times](https://theagenttimes.com/articles/semantic-caching-cuts-our-llm-inference-costs-by-up-to-73-pe-9d571767)
- [Prompt Injection in 2026: Still OWASP's Number One LLM Vulnerability — Kunal Ganglani](https://www.kunalganglani.com/blog/prompt-injection-2026-owasp-llm-vulnerability)
- [LLM Guardrails Explained: Prompt Injection, PII Detection & Content Moderation — LLM Gateway](https://llmgateway.io/blog/llm-guardrails-explained)
- [Top 5 Tools to Evaluate RAG Performance in 2026 — Maxim AI](https://www.getmaxim.ai/articles/top-5-tools-to-evaluate-rag-performance-in-2026/)
- [Evaluating and Analyzing Your RAG Pipeline with Ragas — Arize AI](https://arize.com/blog/ragas-how-to-evaluate-rag-pipeline-phoenix/)
- [Why Your 2026 Job Search Needs an Interactive Portfolio Chatbot — Knak Digital](https://knakdigital.com/job-seeker-advice/why-your-2026-job-search-needs-an-interactive-portfolio-chatbot/)
