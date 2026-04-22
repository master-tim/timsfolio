// Shared data for all three portfolio directions.

window.TD_DATA = {
  name: 'Temirlan Dzhoroev',
  handle: 'td',
  role: 'AI Engineer',
  location: 'Seoul, KR',
  tz: 'GMT+9',
  email: 'dzhoroev1@gmail.com',
  github: 'master-tim',
  linkedin: 'dzhoroev7',

  tagline: 'I build production LLM/RAG systems and browser 3D engines.',

  metrics: {
    plays: '54,000,000',
    grant: '$1.2M',
    latency: '3.2s → 0.8s',
    hallucination: '18% → 4%',
    llmSaved: '~$2K/mo',
    papers: 10,
    patents: 6,
  },

  work: [
    {
      id:'ai-games', year:'2024–25', title:'AI Game Creation System',
      kind:'agent pipeline',
      oneliner:'Text → playable game. Intent parsing, asset gen, scene composition, logic synthesis.',
      ctx:'Centerpiece of a $1.2M Korean government R&D grant. Solo architect; team of 3 on integration.',
      stack:['LangChain','Vercel AI SDK','Claude','Next.js'],
      metric:'$1.2M grant · up to 8 dependent tool calls / request',
      decisions:[
        'Chose ReACT over plain chain-of-thought — needed mid-stream tool retries',
        'Asset pipeline runs async; UI streams placeholders first, swaps on completion',
        'Guardrail layer rejects unsafe asset prompts before image gen (saved ~15% spend)',
      ],
    },
    {
      id:'rag-15k', year:'2024', title:'Production RAG · 15K docs',
      kind:'retrieval system',
      oneliner:'Hybrid retrieval + query rewriting + cross-encoder re-rank over 15K docs in Chroma.',
      ctx:'Internal knowledge assistant. First version hallucinated 18% of answers.',
      stack:['ChromaDB','OpenAI embeddings','bge-reranker','Python'],
      metric:'hallucination 18 → 4% · latency 3.2s → 0.8s · +35% relevance',
      decisions:[
        'Query rewrite step added ~120ms but +28pp recall — worth it',
        'Re-rank top-50 → top-8; bge-reranker-base beat cohere at 1/10 the cost',
        'Eval harness: 200 golden Q/A pairs, runs on every retrieval-code change',
      ],
    },
    {
      id:'semantic-cache', year:'2024', title:'Semantic Cache Layer',
      kind:'infra',
      oneliner:'Embedding-similarity cache over LLM calls. Sub-inference cost routing.',
      ctx:'LLM bill was scaling linearly with traffic. Needed a dial, not a rewrite.',
      stack:['Redis','OpenAI','Vercel AI'],
      metric:'−40% LLM calls · ~$2K/month saved · p50 −180ms',
      decisions:[
        'Cosine threshold tuned per-endpoint; chat = 0.93, completion = 0.88',
        'Cache key includes model + temp + system-prompt hash (invalidates on prompt edits)',
        'Fall-through logs every miss — used to find misclassified routes',
      ],
    },
    {
      id:'engine', year:'2023–24', title:'Browser 3D Game Engine',
      kind:'engine work',
      oneliner:'Modernized a 50k-line Three.js engine. Webpack → Vite, new physics, modular packages.',
      ctx:'Engine powers Redbrick — 54M plays, 10M users. I inherited it mid-growth.',
      stack:['Three.js','WebGL','Vite','Rapier','TypeScript'],
      metric:'54M plays · build time −60% · bundle −35%',
      decisions:[
        'Split monorepo into 6 packages; let 3 teams ship without stepping on each other',
        'Rapier over cannon-es — deterministic multiplayer was non-negotiable',
        'Kept the old asset format; wrote an adapter rather than force 1000+ games to migrate',
      ],
    },
    {
      id:'robot-face', year:'2023', title:'Social-Robot Face Model',
      kind:'research',
      oneliner:'Computational emotion model for robot face + color expression.',
      ctx:'M.S. thesis. IEEE RO-MAN 2023 first author. Lotte Foundation Scholarship.',
      stack:['Python','PyTorch','Unity','HRI study (n=42)'],
      metric:'RO-MAN 2023 · Lotte Scholarship · IRB-approved user study',
    },
    {
      id:'fitts', year:'2022', title:"Fitts' Law × Face Tracking",
      kind:'research',
      oneliner:'Face- vs eye-tracking as mobile-scroll inputs — which throughput wins?',
      ctx:'HCI Korea 2022, first author. Answer: eye > face, but face generalizes to more devices.',
      stack:['OpenCV','MediaPipe','iOS','user study (n=24)'],
      metric:'HCI Korea 2022',
    },
  ],

  exp: [
    { date:'2024 — now',  role:'AI Engineer',          co:'Redbrick',   loc:'Seoul',
      bullets:[
        'End-to-end AI game creation system; centerpiece of $1.2M grant',
        'Production RAG over 15K docs, hybrid retrieval + re-rank',
        'Agentic workflows (ReACT, CoT); up to 8 dependent tool calls',
        'Semantic cache layer; −40% LLM calls, ~$2K/mo saved',
      ] },
    { date:'2023 — 2024', role:'3D Frontend Engineer', co:'Redbrick',   loc:'Seoul',
      bullets:[
        'Three.js/WebGL engine powering 54M plays, 10M users',
        'Webpack → Vite migration, −60% build time, −35% bundle',
        'Refactored engine into modular packages across 3 teams',
        'Onboarding redesign: +25% D7 activation, +15% D30 retention',
      ] },
    { date:'2021 — 2023', role:'Embedded & HCI Researcher', co:'DECS Lab, UNIST', loc:'Ulsan',
      bullets:[
        'IoT firmware in C for ARM Cortex-M — 50+ devices, sub-ms latency',
        '10 peer-reviewed papers, 6 patents',
        'IEEE RO-MAN, ICROS, HCI Korea first-author',
      ] },
  ],

  pubs: [
    { year:'2024', venue:'J. ICROS',                 title:'Dynamic Expression Model for Robot Facial and Movement Expressions', role:'co-author' },
    { year:'2023', venue:'IEEE RO-MAN',              title:"Human Perception on Social Robot's Face and Color Expression via Computational Emotion Model", role:'first author' },
    { year:'2023', venue:'J. Korea Robotics Soc.',   title:'Implementation & Analysis of Facial Expression Customization for a Social Robot', role:'co-author' },
    { year:'2023', venue:'Intell. Service Robotics', title:'Expanded Linear Dynamic Affect-Expression Model for Lingering Emotional Expression', role:'co-author' },
    { year:'2022', venue:'ICROS',                    title:'An Expressive Eye Interface for Pedestrian Interaction with Indoor Mobility', role:'first author' },
    { year:'2022', venue:'HCI Korea',                title:'Comparison of Face & Eye Tracking for Scrolling a Web Browser on Mobile', role:'first author' },
  ],

  certs: [
    'Advanced RAG with Vector Databases · IBM · 2025',
    'Foundation — LangChain (Python) · LangChain · 2025',
    'Gen AI Agents · Google Cloud · 2025',
    'Build RAG Applications · IBM · 2025',
    'Three.js Journey — Completion · 2023',
    'Advanced React · Meta · 2023',
  ],
};
