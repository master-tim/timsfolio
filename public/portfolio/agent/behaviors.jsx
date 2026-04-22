// Agent behaviors — recognizers, tool simulators, response composers.
// Kept separate from the UI so the console is small.

window.TD_AGENT = (() => {
  const D = window.TD_DATA;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Recognizers: ordered — first match wins.
  const INTENTS = [
    { re: /^(tour|overview|start|begin|hi|hello|hey)\b/i, fn: 'tour' },
    { re: /work|project|shipped|built|portfolio|ship/i,     fn: 'listWork',
      guard: (q) => !/rag|engine|cache|game|robot|fitt/i.test(q) },
    { re: /rag|retriev|halluc|15k|chroma/i,                 fn: 'rag' },
    { re: /game|text.?to.?game|agent|pipeline/i,            fn: 'aiGames' },
    { re: /cache|cost|budget|save/i,                        fn: 'cache' },
    { re: /engine|three|webgl|3d|redbrick/i,                fn: 'engine' },
    { re: /robot|ro.?man|hri|thesis/i,                      fn: 'robot' },
    { re: /fitt|eye.?track|face.?track/i,                   fn: 'fitts' },
    { re: /hire|why|pitch|strength|should i/i,              fn: 'pitch' },
    { re: /experience|resume|cv|career|where.*work/i,       fn: 'career' },
    { re: /paper|publication|research|academ|phd/i,         fn: 'pubs' },
    { re: /stack|tool|tech|language/i,                      fn: 'stack' },
    { re: /contact|email|reach|available|open/i,            fn: 'contact' },
    { re: /skills|what.*(can|do) you (do|build)/i,          fn: 'skills' },
    { re: /where.*live|location|seoul|timezone|gmt/i,       fn: 'location' },
    { re: /weak|fail|worst|fuck.?up|mistake/i,              fn: 'weakness' },
    { re: /joke|fun|haha|lol/i,                             fn: 'joke' },
    { re: /ping|status|alive/i,                             fn: 'ping' },
    { re: /clear|reset/i,                                   fn: 'clear' },
    { re: /help|\?|commands/i,                              fn: 'help' },
  ];

  function match(q) {
    for (const i of INTENTS) {
      if (i.re.test(q) && (!i.guard || i.guard(q))) return i.fn;
    }
    return null;
  }

  // Response handlers — each yields events via push(). Some are multi-step.
  const handlers = {
    async tour(push) {
      await push({ type:'thought', text:'rolling the 30-second version.' });
      await sleep(350);
      await push({ type:'tool', name:'tour()', status:'ok', result:{
        now:       'AI Engineer @ Redbrick · Seoul · open to senior IC',
        shipped:   '$1.2M RAG/agent pipeline · 3.2s→0.8s · 18%→4% hallucination',
        before:    'Modernized Redbrick 3D engine — 54M plays',
        earlier:   '10 peer-reviewed papers, 6 patents (HRI + embedded)',
        next:      'try: show work · why hire you · tell me about RAG',
      }});
    },

    async listWork(push) {
      await push({ type:'thought', text:'listing 6 of 18 projects, newest first.' });
      await sleep(350);
      await push({ type:'tool', name:'list_work(limit=6)', status:'ok', result:'WORK_TABLE' });
    },

    async rag(push)      { await projectCard(push, 'rag-15k'); },
    async aiGames(push)  { await projectCard(push, 'ai-games'); },
    async cache(push)    { await projectCard(push, 'semantic-cache'); },
    async engine(push)   { await projectCard(push, 'engine'); },
    async robot(push)    { await projectCard(push, 'robot-face'); },
    async fitts(push)    { await projectCard(push, 'fitts'); },

    async career(push) {
      await push({ type:'tool', name:'timeline()', status:'ok', result:'EXPERIENCE' });
    },

    async pubs(push) {
      await push({ type:'tool', name:'publications(limit=6)', status:'ok', result:'PUBS' });
    },

    async stack(push) {
      await push({ type:'tool', name:'stack()', status:'ok', result:'STACK' });
    },

    async skills(push) {
      await push({ type:'assistant', text:
`Roughly, in order of depth:

 · RAG systems — ingestion, hybrid retrieval, rerank, eval, guardrails
 · Agents — ReACT, tool-use orchestration, dependency graphs
 · 3D / WebGL — Three.js engines at production scale
 · Frontend — React, Next.js, Astro, Tailwind
 · Research — HRI, computer vision, embedded C (if you need it)

If you want depth on any of these, ask me.` });
    },

    async pitch(push) {
      await push({ type:'thought', text:'being honest, not a salesperson.' });
      await sleep(500);
      await push({ type:'assistant', text:
`Three honest answers:

1. I've shipped LLM systems end-to-end, not just prompts. RAG, agents, caching, evals.
2. Research background means I read the paper before I open the IDE.
3. I care about the boring parts — eval harnesses, cost dials, guardrails.

Not the person who'll build your fourteenth demo. The person who makes demo #1 a product.` });
    },

    async weakness(push) {
      await push({ type:'thought', text:'these are real answers, not interview answers.' });
      await sleep(400);
      await push({ type:'assistant', text:
`Three things I'm working on:

 · I over-index on measurement. Sometimes you just have to ship the thing and see.
 · I underestimate how long writing takes. I'm usually a day late on docs.
 · I'm not a distributed-systems native — I can reason about it, not architect it from scratch.

Counter-weight: none of these have cost anyone money. Yet.` });
    },

    async contact(push) {
      await push({ type:'tool', name:'contact()', status:'ok', result:{
        email:     D.email,
        github:    'github.com/' + D.github,
        linkedin:  'linkedin.com/in/' + D.linkedin,
        timezone:  D.tz,
        reply_sla: 'usually <24h',
      }});
    },

    async location(push) {
      await push({ type:'tool', name:'whereami()', status:'ok', result:{
        city:     D.location,
        timezone: D.tz,
        remote:   'yes · friendly to NA/EU teams',
        relocate: 'open to discussion',
      }});
    },

    async ping(push) {
      const t = (Math.random() * 40 + 12).toFixed(1);
      await push({ type:'tool', name:'ping()', status:'ok', result:{ status:'alive', latency_ms: t, model:'td-agent@0.4.2' }});
    },

    async joke(push) {
      const jokes = [
        'Two RAG engineers walk into a bar. Bartender asks "embedding?" They say "yes please, with re-rank."',
        'My favorite framework? Whichever one my on-call rotation is least familiar with.',
        "I told my LLM to be concise. It wrote me a haiku about why conciseness is subjective.",
      ];
      await push({ type:'assistant', text: jokes[Math.floor(Math.random() * jokes.length)] });
    },

    async help(push) {
      await push({ type:'tool', name:'help()', status:'ok', result:{
        work: 'show work · tell me about RAG · cache · engine · games',
        me:   'tour · why hire you · weakness · skills · experience',
        meta: 'contact · pubs · stack · ping · location',
        easter_egg: 'ask me a joke',
      }});
    },

    async clear(push, ctrl) {
      ctrl.clear();
    },
  };

  async function projectCard(push, id) {
    const w = D.work.find(x => x.id === id);
    if (!w) return;
    await push({ type:'thought', text:`opening ${w.id}…` });
    await sleep(220);
    await push({ type:'tool', name:`open(project="${w.id}")`, status:'ok', result:'PROJECT:'+id });
  }

  async function respond(q, ctx) {
    const fn = match(q);
    if (fn && handlers[fn]) {
      return handlers[fn](ctx.push, ctx);
    }
    // Fallback: route to /api/agent (OpenRouter → Claude Haiku)
    try {
      await ctx.push({ type:'thought', text:'no pattern match — routing to claude-haiku.' });
      await sleep(150);
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tone: ctx.tone || 'playful, dry, confident, concise' }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.text || '').trim();
        if (text) {
          await ctx.push({ type:'assistant', text });
          return;
        }
      }
    } catch {}
    await ctx.push({ type:'assistant', text: `hmm, not sure how to route "${q}". try \`help\` or one of: tour · show work · why hire you · contact.` });
  }

  return { respond, match, handlers };
})();
