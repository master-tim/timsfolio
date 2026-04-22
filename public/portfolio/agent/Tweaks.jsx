// Tweaks panel — accent color, density, agent tone fallback, sidebar/no.

window.APPLY_A_TOKENS = function(t) {
  const r = document.documentElement;
  r.style.setProperty('--a-accent', t.accent);
  r.style.setProperty('--a-bg', t.scheme === 'ink' ? '#080810' : t.scheme === 'graphite' ? '#0F1012' : '#0B0B0E');
  r.style.setProperty('--a-surf', t.scheme === 'ink' ? '#0E0E18' : t.scheme === 'graphite' ? '#17181C' : '#121217');
  const s = t.density === 'compact' ? 0.92 : t.density === 'loose' ? 1.1 : 1;
  r.style.setProperty('--a-scale', s);
};

window.A_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#7CFF6B",
  "scheme": "default",
  "density": "default",
  "tone": "playful, dry, confident",
  "showThoughts": true
}/*EDITMODE-END*/;

function Tweaks({ open, tokens, setTokens }) {
  if (!open) return null;

  const set = (k, v) => {
    const next = { ...tokens, [k]: v };
    setTokens(next);
    window.APPLY_A_TOKENS(next);
    try { window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]: v}}, '*'); } catch {}
  };

  const accents = [
    ['#7CFF6B','acid'],['#FF7B3D','ember'],['#6BB7FF','ice'],
    ['#C478FF','amethyst'],['#FFDA47','sulfur'],['#FF5677','coral'],
    ['#EAEAEE','mono'],
  ];
  const schemes = [['default','onyx'],['graphite','graphite'],['ink','ink']];
  const densities = [['compact','cozy'],['default','default'],['loose','airy']];

  return (
    <div style={{
      position:'fixed', right:20, bottom:20, width: 320,
      background:'var(--a-surf)', border:'1px solid var(--a-line)',
      borderRadius: 3, padding:'18px 20px',
      fontFamily:'var(--a-mono)', fontSize:12, color:'var(--a-ink)',
      zIndex: 9999, boxShadow:'0 10px 40px rgba(0,0,0,0.5)',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--a-line)'}}>
        <strong style={{letterSpacing:'0.04em'}}>Tweaks</strong>
        <span style={{color:'var(--a-faint)', fontSize:10.5, letterSpacing:'0.08em'}}>TD-AGENT</span>
      </div>

      <Field label="ACCENT">
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {accents.map(([c, n]) => (
            <button key={c} onClick={() => set('accent', c)} title={n} style={{
              width:28, height:28, border: '2px solid ' + (tokens.accent === c ? 'var(--a-ink)' : 'transparent'),
              background: c, borderRadius: 2, cursor:'pointer', padding:0,
            }}/>
          ))}
        </div>
      </Field>

      <Field label="SCHEME">
        <Seg options={schemes} value={tokens.scheme} onChange={v => set('scheme', v)}/>
      </Field>

      <Field label="DENSITY">
        <Seg options={densities} value={tokens.density} onChange={v => set('density', v)}/>
      </Field>

      <Field label="AGENT TONE (CLAUDE FALLBACK)">
        <input type="text" value={tokens.tone} onChange={e => set('tone', e.target.value)}
          style={{
            width:'100%', background:'transparent', border:'1px solid var(--a-line)',
            color:'var(--a-ink)', fontFamily:'var(--a-mono)', fontSize:12,
            padding:'6px 10px', borderRadius: 2, outline: 'none',
          }}/>
      </Field>

      <Field label="SHOW INTERNAL THOUGHTS">
        <button onClick={() => set('showThoughts', !tokens.showThoughts)} style={{
          width:'100%', padding:'6px 10px', background:'transparent',
          border:'1px solid var(--a-line)', color: tokens.showThoughts ? 'var(--a-accent)' : 'var(--a-muted)',
          fontFamily:'var(--a-mono)', fontSize:11, cursor:'pointer', borderRadius: 2, letterSpacing:'0.04em',
          textTransform:'uppercase',
        }}>{tokens.showThoughts ? '● visible' : '○ hidden'}</button>
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10, color:'var(--a-faint)', letterSpacing:'0.1em', marginBottom:6}}>{label}</div>
      {children}
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:`repeat(${options.length}, 1fr)`, border:'1px solid var(--a-line)', borderRadius:2, overflow:'hidden'}}>
      {options.map(([k, lbl], i) => (
        <button key={k} onClick={() => onChange(k)} style={{
          padding:'7px 8px', background: value === k ? 'var(--a-accent)' : 'transparent',
          color: value === k ? 'var(--a-bg)' : 'var(--a-muted)',
          border:'none', borderLeft: i ? '1px solid var(--a-line)' : 'none',
          fontFamily:'var(--a-mono)', fontSize:11, cursor:'pointer', letterSpacing:'0.04em',
          textTransform:'uppercase',
        }}>{lbl}</button>
      ))}
    </div>
  );
}

window.Tweaks = Tweaks;
