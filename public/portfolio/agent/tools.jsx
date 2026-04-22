// Tool-result renderers. Given a tool name + result payload, return JSX.

function ToolResult({ name, result }) {
  const D = window.TD_DATA;

  if (result === 'WORK_TABLE')  return <ResWork   D={D}/>;
  if (result === 'EXPERIENCE')  return <ResExp    D={D}/>;
  if (result === 'PUBS')        return <ResPubs   D={D}/>;
  if (result === 'STACK')       return <ResStack/>;
  if (typeof result === 'string' && result.startsWith('PROJECT:')) {
    return <ResProject D={D} id={result.slice(8)}/>;
  }
  // default JSON-ish
  return <ResJSON result={result}/>;
}

function ResWork({ D }) {
  return (
    <div style={resBoxStyle}>
      <div style={{
        display:'grid', gridTemplateColumns:'70px 1.15fr 2fr 120px',
        gap:14, padding:'8px 14px', fontSize:10.5, color:'var(--a-faint)',
        letterSpacing:'0.08em', borderBottom:'1px solid var(--a-line)',
        textTransform:'uppercase',
      }}>
        <span>year</span><span>project</span><span>what</span><span style={{textAlign:'right'}}>kind</span>
      </div>
      {D.work.map((w, i) => (
        <div key={w.id}
          style={{
            display:'grid', gridTemplateColumns:'70px 1.15fr 2fr 120px',
            gap:14, padding:'10px 14px',
            borderTop: i ? '1px solid var(--a-line)' : 'none',
            fontSize:13, cursor:'pointer',
          }}
          className="tbl-row"
          onClick={() => window.TD_CHAT?.send(`tell me about ${w.id}`)}>
          <span style={{color:'var(--a-muted)'}}>{w.year}</span>
          <span style={{color:'var(--a-ink)'}}>{w.title}</span>
          <span style={{color:'var(--a-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{w.oneliner}</span>
          <span style={{color:'var(--a-accent)', textAlign:'right', fontSize:11}}>▸ {w.kind}</span>
        </div>
      ))}
      <style>{`.tbl-row:hover { background: rgba(255,255,255,0.03); }`}</style>
    </div>
  );
}

function ResProject({ D, id }) {
  const w = D.work.find(x => x.id === id);
  if (!w) return null;
  return (
    <div style={{...resBoxStyle, padding: 0}}>
      <div style={{padding:'16px 20px', borderBottom:'1px solid var(--a-line)', display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <strong style={{color:'var(--a-ink)', fontSize:15, letterSpacing:'-0.01em'}}>{w.title}</strong>
        <span style={{color:'var(--a-muted)', fontSize:11}}>{w.year} · {w.kind}</span>
      </div>
      <div style={{padding:'16px 20px'}}>
        <div style={{color:'var(--a-ink)', marginBottom:10, fontSize:14, lineHeight:1.55}}>{w.oneliner}</div>
        <div style={{color:'var(--a-muted)', marginBottom:14, fontSize:12.5, lineHeight:1.55}}>{w.ctx}</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:14}}>
          {w.stack.map(s => (
            <span key={s} style={{fontSize:11, border:'1px solid var(--a-line)', padding:'3px 9px', color:'var(--a-muted)', borderRadius: 2}}>{s}</span>
          ))}
        </div>
        <div style={{
          display:'inline-block', padding:'6px 10px',
          background:'rgba(124, 255, 107, 0.08)', color:'var(--a-accent)',
          fontSize:11.5, borderRadius:2, marginBottom: w.decisions ? 16 : 0,
        }}>▸ {w.metric}</div>
        {w.decisions && (
          <div style={{borderTop:'1px solid var(--a-line)', paddingTop: 14}}>
            <div style={{color:'var(--a-faint)', fontSize:10.5, letterSpacing:'0.1em', marginBottom:8}}>KEY DECISIONS</div>
            {w.decisions.map((d, i) => (
              <div key={i} style={{fontSize:12.5, color:'var(--a-ink)', padding:'3px 0', display:'flex', gap:8}}>
                <span style={{color:'var(--a-muted)', flexShrink:0}}>{String(i+1).padStart(2,'0')} →</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResExp({ D }) {
  return (
    <div style={resBoxStyle}>
      {D.exp.map((e, i) => (
        <div key={i} style={{padding:'14px 18px', borderTop: i?'1px solid var(--a-line)':'none'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8, gap:12, flexWrap:'wrap'}}>
            <span style={{color:'var(--a-ink)', fontSize:13.5}}>
              <strong>{e.role}</strong>{' '}
              <span style={{color:'var(--a-muted)'}}>· {e.co}</span>
            </span>
            <span style={{color:'var(--a-muted)', fontSize:11.5}}>{e.date} · {e.loc}</span>
          </div>
          {e.bullets.map((b, j) => (
            <div key={j} style={{fontSize:12.5, color:'var(--a-muted)', padding:'3px 0', display:'flex', gap:10}}>
              <span style={{color:'var(--a-faint)'}}>—</span><span>{b}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ResPubs({ D }) {
  return (
    <div style={resBoxStyle}>
      {D.pubs.map((p, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'56px 160px 1fr 90px',
          gap:12, padding:'9px 14px',
          borderTop: i?'1px solid var(--a-line)':'none',
          fontSize:12.5, alignItems:'baseline',
        }}>
          <span style={{color:'var(--a-muted)'}}>{p.year}</span>
          <span style={{color:'var(--a-accent)', fontSize:11, letterSpacing:'0.04em', textTransform:'uppercase'}}>{p.venue}</span>
          <span style={{color:'var(--a-ink)', lineHeight:1.45}}>{p.title}</span>
          <span style={{color:'var(--a-faint)', textAlign:'right', fontSize:11}}>{p.role}</span>
        </div>
      ))}
    </div>
  );
}

function ResStack() {
  const S = [
    ['AI / LLM',   ['LangChain','LlamaIndex','Vercel AI SDK','ChromaDB','OpenAI','Claude','Embeddings','RAG','Agents','Evals']],
    ['Frontend',   ['React','Next.js','Astro','TypeScript','Tailwind','Vite']],
    ['3D / WebGL', ['Three.js','WebGL','GLSL','WebXR','Rapier','Blender']],
    ['Backend',    ['Node.js','Python','Redis','Docker','AWS','CI/CD']],
    ['Research',   ['HCI','HRI','Computer Vision','Embedded C','ARM Cortex-M']],
  ];
  return (
    <div style={resBoxStyle}>
      {S.map(([k, items], i) => (
        <div key={k} style={{
          padding:'12px 16px', display:'grid', gridTemplateColumns:'120px 1fr', gap:16,
          borderTop: i?'1px solid var(--a-line)':'none', alignItems:'start',
        }}>
          <span style={{color:'var(--a-muted)', fontSize:11.5, paddingTop:4}}>{k}</span>
          <span style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {items.map(it => (
              <span key={it} style={{
                fontSize:11, color:'var(--a-ink)',
                border:'1px solid var(--a-line)', padding:'3px 9px', borderRadius: 2,
              }}>{it}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResJSON({ result }) {
  return (
    <div style={resBoxStyle}>
      {Object.entries(result).map(([k, v], i) => (
        <div key={k} style={{
          display:'grid', gridTemplateColumns:'180px 1fr', gap:14,
          padding:'6px 16px', borderTop: i?'1px solid var(--a-line)':'none',
        }}>
          <span style={{color:'var(--a-faint)', fontSize:11.5}}>{k}</span>
          <span style={{color:'var(--a-ink)', fontSize:12.5, wordBreak:'break-word'}}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

const resBoxStyle = {
  border:'1px solid var(--a-line)', borderRadius: 2, overflow:'hidden',
  background:'rgba(255,255,255,0.015)',
};

window.ToolResult = ToolResult;
