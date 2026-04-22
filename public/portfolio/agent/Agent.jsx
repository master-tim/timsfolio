// Main agent console — the entire portfolio.

function Agent() {
  const D = window.TD_DATA;
  const [log, setLog] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [uptime, setUptime] = React.useState(0);
  const logRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Seed the log once on mount
  React.useEffect(() => {
    seedIntro();
    const t = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Autoscroll
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, busy]);

  async function seedIntro() {
    const push = (m) => new Promise(r => {
      setLog(l => [...l, m]); setTimeout(r, 0);
    });
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    await push({ type:'system', text:`td-agent v0.4.2 — session started · ${new Date().toISOString().slice(0,10)}` });
    await push({ type:'system', text:`type a question or click a suggestion. \`help\` for commands.` });
    await sleep(550);
    await push({ type:'user', text:'whoami' });
    await sleep(220);
    await push({ type:'tool', name:'identity()', status:'ok', result:{
      name:     D.name,
      role:     D.role + ' · Redbrick, Seoul',
      status:   '● open to senior IC — AI / applied LLM',
      summary:  D.tagline,
      metrics:  `${D.metrics.plays} plays · ${D.metrics.grant} grant · ${D.metrics.papers} papers, ${D.metrics.patents} patents`,
    }});
  }

  async function send(q) {
    const query = (q ?? input).trim();
    if (!query || busy) return;
    setInput('');
    setBusy(true);
    const push = async (m) => {
      setLog(l => [...l, m]);
      await new Promise(r => setTimeout(r, 0));
    };
    const ctrl = {
      clear: () => setLog([]),
    };
    setLog(l => [...l, { type:'user', text: query }]);
    await new Promise(r => setTimeout(r, 250));
    await window.TD_AGENT.respond(query, { push, ...ctrl });
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 20);
  }

  // Expose send so tool-result rows can trigger follow-up queries
  React.useEffect(() => { window.TD_CHAT = { send }; }, [busy]);

  const suggestions = [
    { t:'tour',             hot:true },
    { t:'show work',        hot:true },
    { t:'tell me about RAG',hot:true },
    { t:'why hire you',     hot:true },
    { t:'weakness' },
    { t:'experience' },
    { t:'publications' },
    { t:'stack' },
    { t:'contact' },
  ];

  const fmtUptime = (s) => {
    const m = Math.floor(s/60), ss = s % 60;
    return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  };

  return (
    <div style={{
      fontFamily:'var(--a-mono)', color:'var(--a-ink)', background:'var(--a-bg)',
      minHeight: '100vh', padding: '0',
      display:'grid', gridTemplateColumns:'280px 1fr', gap: 0,
    }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        borderRight:'1px solid var(--a-line)', padding:'28px 24px',
        display:'flex', flexDirection:'column', gap: 24, minHeight:'100vh',
        position:'sticky', top: 0, alignSelf:'start', maxHeight:'100vh', overflowY:'auto',
      }}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
            <span style={{display:'inline-block', width:9, height:9, borderRadius:999, background:'var(--a-accent)', boxShadow:'0 0 10px var(--a-accent)'}}/>
            <strong style={{fontSize:13, letterSpacing:'0.02em'}}>td-agent</strong>
            <span style={{color:'var(--a-faint)', fontSize:11, marginLeft:'auto'}}>v0.4.2</span>
          </div>
          <div style={{fontFamily:'var(--a-display)', fontSize: 24, lineHeight: 1.12, letterSpacing:'-0.02em', fontWeight:500, color:'var(--a-ink)'}}>
            {D.name.split(' ')[0]}<br/>{D.name.split(' ')[1]}<span style={{color:'var(--a-accent)'}}>.</span>
          </div>
          <div style={{color:'var(--a-muted)', fontSize:12, marginTop:10, lineHeight:1.6}}>
            AI Engineer.<br/>
            Shipping LLM systems<br/>
            that reach users.
          </div>
        </div>

        {/* Suggestions / "commands" */}
        <div>
          <SideLabel>commands</SideLabel>
          <div style={{display:'flex', flexDirection:'column', gap:2}}>
            {suggestions.map(s => (
              <button key={s.t} onClick={() => send(s.t)} disabled={busy} className="cmd"
                style={{
                  background:'transparent', border:'none', textAlign:'left',
                  fontFamily:'var(--a-mono)', fontSize:12.5,
                  color: s.hot ? 'var(--a-ink)' : 'var(--a-muted)',
                  padding:'6px 0', cursor: busy ? 'default' : 'pointer',
                  display:'flex', gap:8, alignItems:'center',
                }}>
                <span style={{color:'var(--a-accent)', fontSize:10}}>→</span>
                <span>{s.t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <SideLabel>status</SideLabel>
          <div style={{fontSize:11.5, lineHeight:1.9, color:'var(--a-muted)'}}>
            <div><span style={{color:'var(--a-faint)'}}>role</span>  <span style={{float:'right', color:'var(--a-ink)'}}>{D.role}</span></div>
            <div><span style={{color:'var(--a-faint)'}}>loc</span>   <span style={{float:'right', color:'var(--a-ink)'}}>{D.location}</span></div>
            <div><span style={{color:'var(--a-faint)'}}>tz</span>    <span style={{float:'right', color:'var(--a-ink)'}}>{D.tz}</span></div>
            <div><span style={{color:'var(--a-faint)'}}>open</span>  <span style={{float:'right', color:'var(--a-accent)'}}>● senior IC</span></div>
            <div><span style={{color:'var(--a-faint)'}}>up</span>    <span style={{float:'right', color:'var(--a-ink)'}}>{fmtUptime(uptime)}</span></div>
          </div>
        </div>

        {/* Links */}
        <div>
          <SideLabel>links</SideLabel>
          <div style={{display:'flex', flexDirection:'column', gap:4, fontSize:12}}>
            <a href={`mailto:${D.email}`} style={linkStyle}>→ {D.email}</a>
            <a href={`https://github.com/${D.github}`} style={linkStyle}>→ github/{D.github}</a>
            <a href={`https://linkedin.com/in/${D.linkedin}`} style={linkStyle}>→ linkedin/{D.linkedin}</a>
          </div>
        </div>

        <div style={{marginTop:'auto', fontSize:10.5, color:'var(--a-faint)', letterSpacing:'0.04em', lineHeight:1.6, display:'none'}}>
          this page IS an agent.<br/>
          ask anything.<br/>
          free-form questions fall through to claude-haiku.
        </div>
      </aside>

      {/* ─── Main console ─── */}
      <main style={{
        display:'grid', gridTemplateRows:'auto 1fr auto',
        minHeight:'100vh', padding: '0 36px',
      }}>
        <TopBar />

        <div ref={logRef} style={{
          overflowY:'auto', padding:'8px 0 20px',
          fontFamily:'var(--a-mono)', fontSize:13.5, lineHeight:1.65,
          minHeight: 0,
        }}>
          {log.map((m, i) => <LogRow key={i} m={m} />)}
          {busy && <ThinkingLine />}
        </div>

        <InputBar busy={busy} input={input} setInput={setInput} inputRef={inputRef}
          onSubmit={() => send()} />
      </main>
    </div>
  );
}

function SideLabel({ children }) {
  return <div style={{fontSize:10, letterSpacing:'0.12em', color:'var(--a-faint)', textTransform:'uppercase', marginBottom:10}}>{children}</div>;
}
const linkStyle = { color:'var(--a-muted)', textDecoration:'none', padding:'2px 0' };

function TopBar() {
  return null;
}

function ThinkingLine() {
  const [dots, setDots] = React.useState('');
  React.useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 220);
    return () => clearInterval(t);
  }, []);
  return <div style={{color:'var(--a-muted)', padding:'6px 0'}}>▍ thinking{dots}</div>;
}

function LogRow({ m }) {
  if (m.type === 'system') {
    return <div style={{color:'var(--a-faint)', padding:'3px 0', fontSize: 12}}>※ {m.text}</div>;
  }
  if (m.type === 'user') {
    return <div style={{padding:'10px 0 6px', fontSize: 14}}>
      <span style={{color:'var(--a-accent)'}}>td &gt; </span>
      <span style={{color:'var(--a-ink)'}}>{m.text}</span>
    </div>;
  }
  if (m.type === 'thought') {
    return <div style={{color:'var(--a-muted)', padding:'3px 0', fontStyle:'italic', fontSize:12.5}}>· {m.text}</div>;
  }
  if (m.type === 'assistant') {
    return <TypeOut text={m.text} />;
  }
  if (m.type === 'tool') {
    return (
      <div style={{padding:'6px 0 12px'}}>
        <div style={{color:'var(--a-accent)', marginBottom: 8, fontSize: 12.5, display:'flex', gap:10, alignItems:'center'}}>
          <span>⚙</span>
          <span>{m.name}</span>
          {m.status && <span style={{color: m.status==='ok' ? 'var(--a-accent)' : '#E0564B', fontSize: 10.5, letterSpacing:'0.04em', padding:'1px 6px', border:'1px solid currentColor', borderRadius: 2}}>{m.status.toUpperCase()}</span>}
        </div>
        <ToolResult name={m.name} result={m.result} />
      </div>
    );
  }
  return null;
}

// Stream text out character by character (or line by line for longer text)
function TypeOut({ text }) {
  const [shown, setShown] = React.useState('');
  React.useEffect(() => {
    let i = 0;
    const step = text.length > 200 ? 4 : 1;
    const speed = text.length > 200 ? 8 : 12;
    const t = setInterval(() => {
      i += step;
      if (i >= text.length) { setShown(text); clearInterval(t); }
      else setShown(text.slice(0, i));
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <div style={{padding:'6px 0 10px', whiteSpace:'pre-wrap', fontSize:13.5, color:'var(--a-ink)'}}>
    {shown}{shown.length < text.length && <span style={{color:'var(--a-accent)'}}>▍</span>}
  </div>;
}

function InputBar({ busy, input, setInput, inputRef, onSubmit }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }}
      style={{
        padding: '16px 0 24px', borderTop:'1px solid var(--a-line)',
        display:'flex', flexDirection:'column', gap:10, background: 'var(--a-bg)',
      }}>
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        border:'1px solid ' + (input.trim() ? 'var(--a-accent)' : 'var(--a-line)'),
        background:'var(--a-surf)', padding:'12px 16px', borderRadius: 2,
        transition:'border-color 0.2s',
      }}>
        <span style={{color:'var(--a-accent)'}}>td &gt;</span>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          autoFocus
          placeholder="ask anything · 'why hire you' · 'tell me about RAG' · 'weakness'…"
          disabled={busy}
          style={{flex:1, border:'none', background:'transparent', outline:'none',
                  fontFamily:'var(--a-mono)', fontSize:14, color:'var(--a-ink)'}}/>
        <button disabled={busy || !input.trim()} type="submit" style={{
          fontFamily:'var(--a-mono)', fontSize:11, letterSpacing:'0.06em',
          color: input.trim() ? 'var(--a-bg)' : 'var(--a-muted)',
          background: input.trim() ? 'var(--a-accent)' : 'transparent',
          border: '1px solid ' + (input.trim() ? 'var(--a-accent)' : 'var(--a-line)'),
          padding:'6px 14px', borderRadius: 2, cursor: input.trim() && !busy ? 'pointer' : 'default',
          textTransform:'uppercase',
        }}>↵ send</button>
      </div>
      <div style={{fontSize:10.5, color:'var(--a-faint)', display:'flex', justifyContent:'space-between', letterSpacing:'0.04em'}}>
        <span>↑/↓ for history · tab to complete · free-form → claude-haiku fallback</span>
        <span>© 2026 td</span>
      </div>
    </form>
  );
}

window.Agent = Agent;
