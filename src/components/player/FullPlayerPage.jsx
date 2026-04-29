import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2, VolumeX,
  ListMusic, Sliders, X, Gauge, Timer,
  GripVertical, RotateCcw, Radio, Sparkles, Tag,
  MessageCircle, Download, Share2, Moon,
  Mic2, Info, Zap, Music2, Plus, Search,
} from 'lucide-react';

// ════════════════════════════════════════════
// EQ CONFIG
// ════════════════════════════════════════════
export const EQ_BANDS_12 = [
  { hz: 32,    label: '32',   type: 'lowshelf'  },
  { hz: 64,    label: '64',   type: 'peaking'   },
  { hz: 125,   label: '125',  type: 'peaking'   },
  { hz: 250,   label: '250',  type: 'peaking'   },
  { hz: 500,   label: '500',  type: 'peaking'   },
  { hz: 1000,  label: '1k',   type: 'peaking'   },
  { hz: 2000,  label: '2k',   type: 'peaking'   },
  { hz: 3500,  label: '3.5k', type: 'peaking'   },
  { hz: 6000,  label: '6k',   type: 'peaking'   },
  { hz: 8000,  label: '8k',   type: 'peaking'   },
  { hz: 12000, label: '12k',  type: 'peaking'   },
  { hz: 16000, label: '16k',  type: 'highshelf' },
];

export const EQ_PRESETS_12 = {
  Flat:      [0,0,0,0,0,0,0,0,0,0,0,0],
  Bass:      [9,7,5,3,1,0,0,0,0,0,0,0],
  Treble:    [0,0,0,0,0,0,2,3,5,6,8,9],
  Vocal:     [-2,-1,0,2,5,6,5,3,1,0,-1,-2],
  Pop:       [-1,0,2,4,5,4,3,2,1,0,-1,-1],
  Rock:      [6,5,3,1,-1,0,1,3,5,6,6,5],
  Jazz:      [3,2,1,3,4,4,3,2,2,3,3,2],
  Club:      [0,0,5,5,4,3,3,4,5,5,0,0],
  Classical: [0,0,0,0,0,0,0,0,-2,-3,-4,-5],
  Dance:     [7,5,2,0,-1,-2,0,3,5,6,6,5],
  Latin:     [4,3,0,0,-1,-1,0,1,3,4,5,4],
  Lounge:    [-3,-2,0,2,3,2,1,0,-1,-2,-2,-3],
};

export const initEQ12 = (audioRef, eqFiltersRef, audioContextRef, onReady) => {
  if (audioContextRef.current || !audioRef.current) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const filters = EQ_BANDS_12.map(band => {
      const f = ctx.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.hz;
      f.gain.value = 0;
      if (band.type === 'peaking') f.Q.value = 1.2;
      return f;
    });
    src.connect(filters[0]);
    filters.forEach((f, i) => { if (i < filters.length - 1) f.connect(filters[i + 1]); });
    filters[filters.length - 1].connect(analyser);
    analyser.connect(ctx.destination);
    eqFiltersRef.current = filters;
    audioContextRef.current = { ctx, analyser };
    onReady?.();
  } catch (e) { console.warn('AudioContext init failed:', e); }
};

// ════════════════════════════════════════════
// COLOR EXTRACTOR — adapte les couleurs à la cover
// ════════════════════════════════════════════
const extractDominantColor = (imgSrc, callback) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        const pr = data[i], pg = data[i+1], pb = data[i+2];
        const brightness = (pr + pg + pb) / 3;
        const saturation = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
        if (brightness > 20 && brightness < 230 && saturation > 30) {
          r += pr; g += pg; b += pb; count++;
        }
      }
      if (count > 0) {
        callback({ r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) });
      } else {
        callback({ r: 180, g: 30, b: 30 });
      }
    } catch { callback({ r: 180, g: 30, b: 30 }); }
  };
  img.onerror = () => callback({ r: 180, g: 30, b: 30 });
  img.src = imgSrc;
};

// ════════════════════════════════════════════
// STYLES GLOBAUX
// ════════════════════════════════════════════
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    --fp-accent: 220, 38, 38;
    --fp-accent2: 239, 68, 68;
    --fp-glow: rgba(220, 38, 38, 0.35);
    --fp-font: 'Outfit', sans-serif;
    --fp-mono: 'JetBrains Mono', monospace;
  }

  .fp-root * { box-sizing: border-box; }
  .fp-root { font-family: var(--fp-font); }

  @keyframes fp-spin        { to { transform: rotate(360deg); } }
  @keyframes fp-float       { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.02)} }
  @keyframes fp-fade-in     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fp-fade-slide  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fp-pulse       { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
  @keyframes fp-eq-dance    { 0%,100%{height:3px} 50%{height:100%} }
  @keyframes fp-shimmer     { 0%{background-position:-400% 0} 100%{background-position:400% 0} }
  @keyframes fp-wave-bounce { 0%,100%{transform:scaleY(.35)} 40%{transform:scaleY(1)} }
  @keyframes fp-ripple      { to{transform:scale(2.5);opacity:0} }
  @keyframes fp-heartbeat   { 0%,100%{transform:scale(1)} 25%{transform:scale(1.35)} 50%{transform:scale(1.15)} }
  @keyframes fp-bg-shift    { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes fp-glow-pulse  { 0%,100%{opacity:.4} 50%{opacity:.8} }

  /* Cover animation */
  .fp-playing .fp-cover-wrap { animation: fp-float 7s ease-in-out infinite; }
  .fp-cover-shadow {
    position: absolute; inset: 20px; border-radius: 22px;
    background: rgba(var(--fp-accent), 0.5);
    filter: blur(40px); transform: scale(.95) translateY(16px);
    transition: all .8s ease; pointer-events: none;
  }
  .fp-playing .fp-cover-shadow { filter: blur(52px); opacity: .9; }

  /* Progress */
  .fp-prog-track {
    position: relative; height: 5px; background: rgba(255,255,255,.1);
    border-radius: 99px; cursor: pointer; overflow: visible;
    transition: height .2s;
  }
  .fp-prog-track:hover { height: 7px; }
  .fp-prog-fill {
    height: 100%; border-radius: 99px; position: relative;
    background: linear-gradient(90deg, rgba(var(--fp-accent),1), rgba(var(--fp-accent2),1));
    transition: width .08s linear;
  }
  .fp-prog-thumb {
    position: absolute; right: -7px; top: 50%;
    transform: translateY(-50%) scale(0);
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 14px var(--fp-glow);
    transition: transform .2s; pointer-events: none;
  }
  .fp-prog-track:hover .fp-prog-thumb { transform: translateY(-50%) scale(1); }

  /* Volume */
  .fp-vol-track { flex: 1; height: 3px; background: rgba(255,255,255,.1); border-radius: 99px; position: relative; cursor: pointer; }
  .fp-vol-fill  { height: 100%; border-radius: 99px; background: rgba(255,255,255,.45); pointer-events: none; transition: width .05s; }
  .fp-vol-input { position: absolute; inset: -12px 0; opacity: 0; cursor: pointer; width: 100%; height: calc(100% + 24px); }

  /* Play button */
  .fp-play-btn {
    position: relative; border-radius: 50%; border: none; cursor: pointer;
    background: rgba(var(--fp-accent), 1);
    box-shadow: 0 8px 32px rgba(var(--fp-accent), .55), 0 2px 8px rgba(0,0,0,.4);
    transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    display: flex; align-items: center; justify-content: center;
  }
  .fp-play-btn:hover { transform: scale(1.07); box-shadow: 0 12px 40px rgba(var(--fp-accent), .7); }
  .fp-play-btn:active { transform: scale(.94); }
  .fp-play-ring {
    position: absolute; inset: -3px; border-radius: 50%;
    border: 2px solid rgba(var(--fp-accent), .4);
    opacity: 0; transition: opacity .4s;
  }
  .fp-playing .fp-play-ring { opacity: 1; animation: fp-pulse 2.5s ease-in-out infinite; }

  /* EQ */
  .fp-eq-wrap { position: relative; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,.04); flex: 1; }
  .fp-eq-fill  { position: absolute; left: 0; right: 0; border-radius: 4px; }
  .fp-eq-zero  { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,.12); top: 50%; }
  .fp-eq-thumb {
    position: absolute; left: 50%; transform: translateX(-50%);
    width: 11px; height: 11px; border-radius: 50%;
    background: #fff; border: 2px solid rgba(255,255,255,.3);
    box-shadow: 0 2px 8px rgba(0,0,0,.5); pointer-events: none; z-index: 2;
    transition: top .1s;
  }
  .fp-eq-input { position: absolute; inset: 0; opacity: 0; cursor: ns-resize; writing-mode: vertical-lr; direction: rtl; width: 100%; height: 100%; }

  /* Tabs */
  .fp-tab {
    flex: 1; padding: 14px 4px; font-family: var(--fp-font);
    font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.3); transition: color .2s; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative;
  }
  .fp-tab.on { color: rgba(255,255,255,.92); }
  .fp-tab.on::after {
    content: ''; position: absolute; bottom: 0; left: 20%; right: 20%;
    height: 2px; border-radius: 99px;
    background: linear-gradient(90deg, rgba(var(--fp-accent),1), rgba(var(--fp-accent2),1));
  }

  /* Ctrl buttons */
  .fp-ctrl {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; border: none; background: transparent;
    cursor: pointer; transition: transform .15s, background .15s;
  }
  .fp-ctrl:hover  { background: rgba(255,255,255,.08); }
  .fp-ctrl:active { transform: scale(.85); }

  /* Queue items */
  .fp-qi {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 12px;
    background: rgba(255,255,255,.03); border: 1px solid transparent;
    cursor: grab; transition: background .15s, border-color .15s;
  }
  .fp-qi:hover     { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.07); }
  .fp-qi.active    { background: rgba(var(--fp-accent),.12); border-color: rgba(var(--fp-accent),.3); }
  .fp-qi.drop-over { background: rgba(var(--fp-accent),.2); border-color: rgba(var(--fp-accent),.5); }

  /* Preset pills */
  .fp-preset {
    padding: 5px 12px; border-radius: 99px; font-size: 10px; font-weight: 700;
    letter-spacing: .04em; border: 1px solid rgba(255,255,255,.09);
    background: rgba(255,255,255,.04); color: rgba(255,255,255,.35);
    cursor: pointer; transition: all .15s; font-family: var(--fp-font);
  }
  .fp-preset:hover  { background: rgba(255,255,255,.1); color: rgba(255,255,255,.8); }
  .fp-preset.on     { background: rgba(var(--fp-accent),.22); border-color: rgba(var(--fp-accent),.5); color: #fff; box-shadow: 0 2px 12px rgba(var(--fp-accent),.35); }

  /* Action pills */
  .fp-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 99px; font-size: 11px; font-weight: 600;
    border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05);
    color: rgba(255,255,255,.45); cursor: pointer; transition: all .15s;
    font-family: var(--fp-font);
  }
  .fp-pill:hover { background: rgba(255,255,255,.12); color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.18); }
  .fp-pill.liked { background: rgba(239,68,68,.15); border-color: rgba(239,68,68,.4); color: #fca5a5; }
  .fp-pill.sleep-on { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.35); color: #93c5fd; }

  /* Mood tag */
  .fp-mood {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 99px;
    background: rgba(var(--fp-accent),.14); color: rgba(var(--fp-accent2),1);
    border: 1px solid rgba(var(--fp-accent),.25);
  }

  /* Dancing bars */
  .fp-bar { width: 3px; border-radius: 2px; background: rgba(var(--fp-accent),1); transform-origin: bottom; }
  .fp-bar:nth-child(1) { animation: fp-eq-dance .7s ease-in-out infinite; }
  .fp-bar:nth-child(2) { animation: fp-eq-dance .7s ease-in-out infinite .14s; }
  .fp-bar:nth-child(3) { animation: fp-eq-dance .7s ease-in-out infinite .28s; }

  /* Waveform */
  .fp-wave { width: 100%; height: 52px; cursor: pointer; border-radius: 8px; }

  /* Info card */
  .fp-ic { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 11px 14px; }
  .fp-ic-label { font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.22); margin-bottom: 3px; }
  .fp-ic-val   { font-size: 14px; font-weight: 700; color: rgba(255,255,255,.8); font-family: var(--fp-mono); }

  /* Section label */
  .fp-sec { font-size: 9px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.22); display: flex; align-items: center; gap: 6px; }

  /* Scrollbar */
  .fp-scroll::-webkit-scrollbar { width: 3px; }
  .fp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }

  /* Desktop */
  .fp-right { display: none !important; }
  @media(min-width: 768px) { .fp-right { display: flex !important; } .fp-mobile-tabs { display: none !important; } }

  /* Cover number badge */
  .fp-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 9px; font-weight: 800; letter-spacing: .08em;
    padding: 3px 8px; border-radius: 5px;
    background: rgba(var(--fp-accent),1); color: #fff;
  }

  /* Smart banner */
  .fp-smart-banner {
    background: rgba(var(--fp-accent),.1); border: 1px solid rgba(var(--fp-accent),.22);
    border-radius: 12px; padding: 10px 14px;
  }

  /* Comment item */
  .fp-comment {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,.05);
    animation: fp-fade-slide .2s ease both;
  }
  .fp-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; background: rgba(var(--fp-accent),.25);
    color: rgba(var(--fp-accent2),1); border: 1px solid rgba(var(--fp-accent),.3);
  }
  .fp-ts-pill {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
    background: rgba(var(--fp-accent),.18); color: rgba(var(--fp-accent2),1);
    cursor: pointer; font-family: var(--fp-mono);
  }

  /* Ts markers on progress */
  .fp-ts-marker {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    border-radius: 50%; cursor: pointer; z-index: 5;
    transition: all .15s;
  }
  .fp-ts-marker:hover { box-shadow: 0 0 8px rgba(var(--fp-accent),.8); }

  /* EQ value */
  .fp-eq-val { font-size: 8px; font-family: var(--fp-mono); color: rgba(255,255,255,.3); text-align: center; height: 13px; }
  .fp-eq-label { font-size: 8px; font-family: var(--fp-mono); color: rgba(255,255,255,.22); text-align: center; margin-top: 3px; }

  .fp-fade { animation: fp-fade-in .25s ease both; }
  .fp-slide { animation: fp-fade-slide .2s ease both; }
`;

// ════════════════════════════════════════════
// EQ BAR
// ════════════════════════════════════════════
const EQBar = React.memo(({ band, idx, value, onChange, accent }) => {
  const v = Math.max(-12, Math.min(12, isNaN(value) ? 0 : value));
  const thumbPct = 50 - (v / 12) * 47;
  const fillH = `${(Math.abs(v) / 12) * 47}%`;
  const color = accent || '#e02222';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1, minWidth:0 }}>
      <div className="fp-eq-val">{v !== 0 ? (v > 0 ? `+${v}` : String(v)) : '·'}</div>
      <div className="fp-eq-wrap" style={{ width:'100%', minHeight:88 }}>
        <div className="fp-eq-zero"/>
        {v > 0 && <div className="fp-eq-fill" style={{ background:`linear-gradient(to top,${color}cc,${color}44)`, bottom:'50%', height:fillH, boxShadow:`0 0 8px ${color}40` }}/>}
        {v < 0 && <div className="fp-eq-fill" style={{ background:`linear-gradient(to bottom,${color}66,${color}11)`, top:'50%', height:fillH }}/>}
        <div className="fp-eq-thumb" style={{ top:`${thumbPct}%`, borderColor:`${color}44` }}/>
        <input type="range" min="-12" max="12" step="1" value={v} onChange={e => onChange(idx, parseInt(e.target.value,10))} className="fp-eq-input"/>
      </div>
      <div className="fp-eq-label">{band.label}</div>
    </div>
  );
});

// ════════════════════════════════════════════
// EQ PANEL
// ════════════════════════════════════════════
const EQPanel = React.memo(({ safeEqGains, activePreset, applyPreset, smartMode, setSmartMode, smartQueueCount, currentMoods, playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining, handleEqBand, accentColor }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:20, padding:'16px 18px 28px' }}>

    {/* Header */}
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div className="fp-sec"><Sliders size={11} color={accentColor}/> Égaliseur 12 bandes</div>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={() => setSmartMode?.(v => !v)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:10, fontSize:10, fontWeight:700, border:`1px solid ${smartMode ? `rgba(${accentColor.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',')}, .4)` : 'rgba(255,255,255,.07)'}`, background: smartMode ? `rgba(${accentColor.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',')}, .15)` : 'rgba(255,255,255,.04)', color: smartMode ? accentColor : 'rgba(255,255,255,.35)', cursor:'pointer', fontFamily:'var(--fp-font)' }}>
          <Sparkles size={9}/> Smart{smartMode && smartQueueCount > 0 ? ` (${smartQueueCount})` : ''}
        </button>
        <button onClick={() => applyPreset('Flat')} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.35)', cursor:'pointer', fontFamily:'var(--fp-font)' }}>
          <RotateCcw size={9}/> Reset
        </button>
      </div>
    </div>

    {/* Presets */}
    <div>
      <div className="fp-sec" style={{ marginBottom:8 }}><Zap size={10} color={accentColor}/> Presets</div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {Object.keys(EQ_PRESETS_12).map(name => (
          <button key={name} onClick={() => applyPreset(name)} className={`fp-preset${activePreset===name?' on':''}`}>{name}</button>
        ))}
      </div>
    </div>

    {/* Bars */}
    <div>
      <div className="fp-sec" style={{ marginBottom:10 }}><Music2 size={10} color={accentColor}/> Fréquences</div>
      <div style={{ display:'flex', gap:3, height:130 }}>
        {EQ_BANDS_12.map((band, idx) => (
          <EQBar key={band.hz} band={band} idx={idx} value={safeEqGains[idx]??0} onChange={handleEqBand} accent={accentColor}/>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, fontFamily:'var(--fp-mono)', color:'rgba(255,255,255,.15)', marginTop:4, padding:'0 2px' }}>
        <span>+12 dB</span><span>0</span><span>−12 dB</span>
      </div>
    </div>

    {/* Speed */}
    <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div className="fp-sec"><Gauge size={10} color="#4dc9f6"/> Vitesse</div>
        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.55)', fontFamily:'var(--fp-mono)' }}>{playbackRate}×</span>
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ height:3, background:'rgba(255,255,255,.07)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${((playbackRate-.5)/1.5)*100}%`, background:'linear-gradient(90deg,#4dc9f6,#4d79f6)', borderRadius:99 }}/>
        </div>
        <input type="range" min=".5" max="2" step=".25" value={playbackRate} onChange={e=>setPlaybackRate(parseFloat(e.target.value))} style={{ position:'absolute', inset:'-9px 0', opacity:0, cursor:'pointer', width:'100%' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:9, color:'rgba(255,255,255,.15)', fontFamily:'var(--fp-mono)' }}>
        {['0.5×','0.75×','1×','1.25×','1.5×','1.75×','2×'].map(v=><span key={v}>{v}</span>)}
      </div>
    </div>

    {/* Sleep */}
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div className="fp-sec"><Timer size={10} color="#ffd93d"/> Minuterie veille</div>
        {sleepRemaining > 0 && <span style={{ fontSize:13, fontWeight:700, color:'#4ade80', fontFamily:'var(--fp-mono)' }}>{Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}</span>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
        {[0,15,30,45,60].map(m=>(
          <button key={m} onClick={()=>setSleepTimer(m)} style={{ padding:'9px 0', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'var(--fp-font)', border:sleepTimer===m?'1px solid rgba(var(--fp-accent),.55)':'1px solid rgba(255,255,255,.07)', background:sleepTimer===m?'rgba(var(--fp-accent),.22)':'rgba(255,255,255,.04)', color:sleepTimer===m?accentColor:'rgba(255,255,255,.3)', transition:'all .15s' }}>
            {m===0?'Off':`${m}'`}
          </button>
        ))}
      </div>
    </div>
  </div>
));

// ════════════════════════════════════════════
// QUEUE PANEL
// ════════════════════════════════════════════
const QueuePanel = React.memo(({ queue, setQueue, currentSong, setCurrentSong, setIsPlaying, dragOver, onDragStart, onDragOver, onDrop, accentColor }) => (
  <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <ListMusic size={13} color={accentColor}/>
        <span className="fp-sec">File d'attente</span>
        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.4)' }}>{queue.length}</span>
      </div>
      {queue.length > 0 && (
        <button onClick={()=>setQueue([])} style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.22)', border:'none', background:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'color .15s', fontFamily:'var(--fp-font)' }}
          onMouseEnter={e=>e.currentTarget.style.color='#f87171'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.22)'}>
          Vider
        </button>
      )}
    </div>
    <div className="fp-scroll" style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:4, overscrollBehavior:'contain' }}>
      {queue.length===0 ? (
        <div style={{ textAlign:'center', padding:'52px 16px', color:'rgba(255,255,255,.12)' }}>
          <ListMusic size={36} style={{ margin:'0 auto 12px', display:'block', opacity:.2 }}/>
          <p style={{ fontSize:14, margin:0, fontWeight:600 }}>File vide</p>
          <p style={{ fontSize:11, margin:'4px 0 0', opacity:.5 }}>Les titres à venir apparaîtront ici</p>
        </div>
      ) : queue.map((s,i)=>(
        <div key={`${s._id}-${i}`} draggable onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDrop={()=>onDrop(i)}
          onClick={()=>{ setQueue(prev=>prev.filter((_,j)=>j!==i)); setCurrentSong(s); setIsPlaying(true); }}
          className={`fp-qi${dragOver===i?' drop-over':''}`}>
          <GripVertical size={12} style={{ color:'rgba(255,255,255,.12)', flexShrink:0 }}/>
          <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}>
            <img src={s.image} style={{ width:36, height:36, borderRadius:8, objectFit:'cover', display:'block' }} alt=""/>
            <div style={{ position:'absolute', top:0, left:0, width:36, height:36, borderRadius:8, background:`rgba(${0},${0},${0},.0)` }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.82)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 2px' }}>{s.titre}</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{s.artiste}</p>
          </div>
          <button onClick={e=>{ e.stopPropagation(); setQueue(prev=>prev.filter((_,j)=>j!==i)); }}
            style={{ padding:5, borderRadius:7, border:'none', background:'transparent', color:'rgba(255,255,255,.18)', cursor:'pointer', flexShrink:0, transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(239,68,68,.12)'; e.currentTarget.style.color='#f87171'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.18)'; }}>
            <X size={12}/>
          </button>
        </div>
      ))}
    </div>
  </div>
));

// ════════════════════════════════════════════
// INFOS PANEL
// ════════════════════════════════════════════
const InfosPanel = React.memo(({ currentSong, currentTime, duration, audioRef, accentColor }) => {
  const waveRef = useRef(null);
  const [waveData] = useState(() => Array.from({ length:80 }, (_,i) => .12 + Math.abs(Math.sin(i*.3 + .5)) * .55 * Math.random() + .1));

  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.clearRect(0,0,W,H);
    const bw = W / waveData.length;
    const p = duration > 0 ? currentTime/duration : 0;
    // Parse accent color for canvas
    const parsed = accentColor.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)) || [220,38,38];
    waveData.forEach((v,i) => {
      const x = i*bw, h = v*H*.82;
      const played = i/waveData.length < p;
      ctx.fillStyle = played ? `rgba(${parsed[0]},${parsed[1]},${parsed[2]},${.55+v*.45})` : `rgba(255,255,255,${.06+v*.08})`;
      ctx.beginPath();
      ctx.roundRect(x+1,(H-h)/2,Math.max(2,bw-2),h,2);
      ctx.fill();
    });
  }, [currentTime, duration, waveData, accentColor]);

  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef?.current) audioRef.current.currentTime = ((e.clientX-r.left)/r.width)*duration;
  };

  const tags = [
    { label:'Format', value: currentSong?.format||'MP3' },
    { label:'Débit',  value: currentSong?.bitrate||'320 kbps' },
    { label:'Freq.',  value: currentSong?.sampleRate||'44.1 kHz' },
    { label:'Plays',  value: currentSong?.plays ? currentSong.plays.toLocaleString() : '—' },
    { label:'Sortie', value: currentSong?.annee||'—' },
    { label:'Label',  value: currentSong?.label||'—' },
  ];

  return (
    <div style={{ padding:'16px 18px 28px', display:'flex', flexDirection:'column', gap:16 }}>
      <div className="fp-sec"><Info size={10} color={accentColor}/> Informations audio</div>
      <div className="fp-ic">
        <div className="fp-ic-label">Forme d'onde</div>
        <canvas ref={waveRef} className="fp-wave" onClick={seek} style={{ marginTop:6 }}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {tags.map(t=>(
          <div key={t.label} className="fp-ic">
            <div className="fp-ic-label">{t.label}</div>
            <div className="fp-ic-val" style={{ fontSize:12 }}>{t.value}</div>
          </div>
        ))}
      </div>
      {currentSong?.moods?.length > 0 && (
        <div className="fp-ic">
          <div className="fp-ic-label" style={{ marginBottom:8 }}>Moods</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {currentSong.moods.map(m=><span key={m} className="fp-mood"><Tag size={8}/>{m}</span>)}
          </div>
        </div>
      )}
    </div>
  );
});

// ════════════════════════════════════════════
// COMMENTS PANEL (inline, lightweight)
// ════════════════════════════════════════════
const CommentsPanel = React.memo(({ songId, currentTime, duration, onSeek, token, isLoggedIn, userId, isAdmin, userNom, onMarkersReady, accentColor, API }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    fetch(`${API}/songs/${songId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(Array.isArray(d) ? d : []); onMarkersReady?.(Array.isArray(d) ? d : []); })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [songId]);

  const post = async () => {
    if (!text.trim() || !token) return;
    try {
      const r = await fetch(`${API}/songs/${songId}/comments`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), timestamp: Math.floor(currentTime) }),
      });
      if (r.ok) { const c = await r.json(); setComments(p=>[c,...p]); setText(''); }
    } catch {}
  };

  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Input */}
      {isLoggedIn && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&post()}
              placeholder={`Commenter à ${fmt(currentTime)}…`}
              style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:10, padding:'9px 13px', fontSize:12, color:'rgba(255,255,255,.85)', outline:'none', fontFamily:'var(--fp-font)' }}
            />
            <button onClick={post} style={{ width:36, height:36, borderRadius:10, background:`rgba(var(--fp-accent),1)`, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
      {/* List */}
      <div className="fp-scroll" style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.18)', fontSize:12 }}>Chargement…</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign:'center', padding:'52px 16px', color:'rgba(255,255,255,.12)' }}>
            <MessageCircle size={36} style={{ margin:'0 auto 12px', display:'block', opacity:.2 }}/>
            <p style={{ fontSize:14, margin:0, fontWeight:600 }}>Aucun commentaire</p>
            <p style={{ fontSize:11, margin:'4px 0 0', opacity:.5 }}>Soyez le premier à commenter</p>
          </div>
        ) : comments.map(c => (
          <div key={c._id} className="fp-comment" style={{ padding:'10px 16px' }}>
            <div className="fp-avatar">{(c.userNom||'?').slice(0,2).toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.75)' }}>{c.userNom||'Anonyme'}</span>
                {c.timestamp != null && (
                  <button className="fp-ts-pill" onClick={()=>onSeek?.(c.timestamp)}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {fmt(c.timestamp)}
                  </button>
                )}
                <span style={{ fontSize:10, color:'rgba(255,255,255,.22)', marginLeft:'auto' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.6)', margin:0, lineHeight:1.5 }}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════
const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  toggleLike,
  volume, setVolume,
  queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef,
  token, isLoggedIn, userId, isAdmin,
  onOpenListenParty,
  smartMode, setSmartMode,
  API: apiBase,
}) => {
  const [activeTab, setActiveTab] = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const [tsComments, setTsComments] = useState([]);
  const [heartAnim, setHeartAnim] = useState(false);
  const [accentRGB, setAccentRGB] = useState({ r:220, g:38, b:38 });
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const prevImgRef = useRef('');

  const prog = duration > 0 ? (currentTime/duration)*100 : 0;
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('moozik_role') : null;
  const isAdminLocal = isAdmin || role === 'admin';
  const isArtist = role === 'artist';
  const userArtistId = typeof localStorage !== 'undefined' ? localStorage.getItem('moozik_artisteId') : null;
  const userNom = typeof localStorage !== 'undefined' ? localStorage.getItem('moozik_nom') || '' : '';

  // Derive accent color
  const accentHex = useMemo(() => {
    const { r,g,b } = accentRGB;
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }, [accentRGB]);

  const accentCSS = `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`;

  // Extract cover color
  useEffect(() => {
    if (!currentSong?.image || currentSong.image === prevImgRef.current) return;
    prevImgRef.current = currentSong.image;
    extractDominantColor(currentSong.image, (col) => setAccentRGB(col));
  }, [currentSong?.image]);

  // Inject styles + update CSS vars
  useEffect(() => {
    if (!document.getElementById('fp-styles')) {
      const el = document.createElement('style');
      el.id = 'fp-styles'; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Update CSS vars dynamically
  const rootRef = useRef(null);
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--fp-accent', accentCSS);
    const r2 = Math.min(255, accentRGB.r+30), g2 = Math.min(255, accentRGB.g+30), b2 = Math.min(255, accentRGB.b+30);
    rootRef.current.style.setProperty('--fp-accent2', `${r2}, ${g2}, ${b2}`);
    rootRef.current.style.setProperty('--fp-glow', `rgba(${accentCSS}, 0.4)`);
  }, [accentCSS]);

  const safeEqGains = useMemo(() => eqGains?.length===12 ? eqGains : Array(12).fill(0), [eqGains]);
  const currentMoods = currentSong?.moods || [];
  const smartQueueCount = useMemo(() => {
    if (!smartMode||!musiques?.length||!currentMoods.length) return 0;
    return musiques.filter(s=>s._id!==currentSong?._id&&s.moods?.some(m=>currentMoods.includes(m))).length;
  }, [smartMode, musiques, currentSong, currentMoods]);

  // Analytics retention
  const sentBuckets = useRef(new Set());
  useEffect(() => {
    if (!currentSong||!duration) return;
    const bucket = Math.floor((currentTime/duration)*20);
    if (bucket>=0&&bucket<20&&!sentBuckets.current.has(bucket)) {
      sentBuckets.current.add(bucket);
      fetch(`${apiBase}/songs/${currentSong._id}/retention`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bucket, totalTime:Math.round(currentTime), completed:currentTime/duration>.9, deviceId:typeof localStorage!=='undefined'?localStorage.getItem('moozik_device_id')||'':'' }) }).catch(()=>{});
    }
  }, [Math.floor(currentTime/5)]);
  useEffect(() => { sentBuckets.current.clear(); }, [currentSong?._id]);

  // Auto-queue
  useEffect(() => {
    if (!musiques?.length||!currentSong||queue.length>0) return;
    const idx = musiques.findIndex(s=>s._id===currentSong._id);
    if (idx!==-1) setQueue([...musiques.slice(idx+1),...musiques.slice(0,idx)]);
  }, [currentSong?._id]);

  // EQ handlers
  const handleEqBand = useCallback((idx, value) => {
    setEqGains(prev=>{ const n=prev?.length===12?[...prev]:Array(12).fill(0); n[idx]=value; return n; });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value=value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = useCallback((name) => {
    const gains=EQ_PRESETS_12[name]||Array(12).fill(0);
    setEqGains([...gains]); setActivePreset(name);
    gains.forEach((v,i)=>{ if(eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value=v; });
  }, [setEqGains, eqFiltersRef]);

  // Seek
  const seek = useCallback((e) => {
    const r=e.currentTarget.getBoundingClientRect();
    if(audioRef.current) audioRef.current.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration;
  }, [audioRef, duration]);

  const seekTouch = useCallback((e) => {
    e.preventDefault();
    const r=e.currentTarget.getBoundingClientRect();
    if(audioRef.current) audioRef.current.currentTime=Math.max(0,Math.min(1,(e.touches[0].clientX-r.left)/r.width))*duration;
  }, [audioRef, duration]);

  const seekToTimestamp = useCallback((ts) => {
    if(audioRef.current){ audioRef.current.currentTime=ts; if(!isPlaying) setIsPlaying(true); }
    setActiveTab('player');
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleLike = useCallback(() => {
    setHeartAnim(true); toggleLike(currentSong?._id);
    setTimeout(()=>setHeartAnim(false),450);
  }, [toggleLike, currentSong]);

  const onDragStart = useCallback((i)=>{ dragIdx.current=i; },[]);
  const onDragOver  = useCallback((e,i)=>{ e.preventDefault(); setDragOver(i); },[]);
  const onDrop      = useCallback((i)=>{
    if(dragIdx.current===null||dragIdx.current===i){ setDragOver(null); return; }
    setQueue(prev=>{ const a=[...prev]; const [m]=a.splice(dragIdx.current,1); a.splice(i,0,m); return a; });
    dragIdx.current=null; setDragOver(null);
  },[setQueue]);

  const eqProps = useMemo(()=>({ safeEqGains, activePreset, applyPreset, smartMode, setSmartMode, smartQueueCount, currentMoods, playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining, handleEqBand, accentColor:accentHex }),[safeEqGains,activePreset,applyPreset,smartMode,setSmartMode,smartQueueCount,currentMoods,playbackRate,setPlaybackRate,sleepTimer,setSleepTimer,sleepRemaining,handleEqBand,accentHex]);
  const queueProps = useMemo(()=>({ queue, setQueue, currentSong, setCurrentSong:()=>{}, setIsPlaying, dragOver, onDragStart, onDragOver, onDrop, accentColor:accentHex }),[queue,setQueue,currentSong,setIsPlaying,dragOver,onDragStart,onDragOver,onDrop,accentHex]);

  const TABS_MOBILE = [
    { key:'player',   icon:<Play size={13}/>,         label:'Lecture' },
    { key:'eq',       icon:<Sliders size={13}/>,      label:'EQ' },
    { key:'queue',    icon:<ListMusic size={13}/>,    label:`File${queue.length>0?` (${queue.length})`:''}` },
    { key:'comments', icon:<MessageCircle size={13}/>,label:`Comms${tsComments.length>0?` (${tsComments.length})`:''}` },
    { key:'infos',    icon:<Info size={13}/>,         label:'Infos' },
  ];

  const TABS_DESKTOP = [
    { key:'eq',       icon:<Sliders size={12}/>,      label:'Égaliseur' },
    { key:'queue',    icon:<ListMusic size={12}/>,    label:`File (${queue.length})` },
    { key:'comments', icon:<MessageCircle size={12}/>,label:`Comms${tsComments.length>0?` (${tsComments.length})`:''}` },
    { key:'infos',    icon:<Info size={12}/>,         label:'Infos' },
  ];

  // ──────────────── PLAYER VIEW ────────────────
  const renderPlayer = () => (
    <div className="fp-fade" style={{ display:'flex', flexDirection:'column', flex:1 }}>

      {/* COVER */}
      <div style={{ display:'flex', justifyContent:'center', padding:'12px 32px 16px', flexShrink:0 }}>
        <div style={{ position:'relative', width:'100%', maxWidth:240 }}>
          {/* Multi-layer glow */}
          {currentSong?.image && (<>
            <div style={{ position:'absolute', inset:10, borderRadius:28, backgroundImage:`url(${currentSong.image})`, backgroundSize:'cover', filter:'blur(48px) saturate(1.6)', opacity:.65, transform:'scale(.92) translateY(18px)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', inset:20, borderRadius:28, background:`rgba(${accentCSS},.35)`, filter:'blur(30px)', transform:'scale(.9) translateY(22px)', pointerEvents:'none' }}/>
          </>)}
          <div className="fp-cover-wrap" style={{ position:'relative', aspectRatio:'1/1' }}>
            <img
              src={currentSong?.image} alt={currentSong?.titre}
              style={{
                width:'100%', height:'100%', borderRadius:24,
                objectFit:'cover', display:'block',
                boxShadow:`0 24px 72px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,${isPlaying?.07:.04})`,
                transition:'transform .6s cubic-bezier(.34,1.56,.64,1), opacity .4s, box-shadow .4s',
                opacity:isPlaying?1:.68, transform:isPlaying?'scale(1)':'scale(.9)',
              }}
            />
            {/* Format badge */}
            {currentSong?.format && (
              <div className="fp-badge" style={{ position:'absolute', bottom:10, left:10 }}>
                {currentSong.format}
              </div>
            )}
            {/* Playing overlay ring */}
            {isPlaying && (
              <div style={{ position:'absolute', inset:0, borderRadius:24, border:`1.5px solid rgba(${accentCSS},.3)`, animation:'fp-pulse 3s ease-in-out infinite', pointerEvents:'none' }}/>
            )}
          </div>
        </div>
      </div>

      {/* TITLE + META */}
      <div style={{ padding:'0 22px 12px', flexShrink:0 }}>
        {/* Stats row */}
        {(currentSong?.plays||currentSong?.favorites||currentSong?.duree) && (
          <div style={{ display:'flex', gap:20, marginBottom:10 }}>
            {currentSong.plays && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, color:`rgba(${accentCSS},1)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{(currentSong.plays/1000).toFixed(1)}K</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginTop:2 }}>Écoutes</div>
              </div>
            )}
            {currentSong.favorites && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, color:`rgba(${accentCSS},1)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{(currentSong.favorites/1000).toFixed(1)}K</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginTop:2 }}>Favoris</div>
              </div>
            )}
            {duration > 0 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:15, fontWeight:900, color:`rgba(${accentCSS},1)`, fontFamily:'var(--fp-mono)', lineHeight:1 }}>{formatTime(duration)}</div>
                <div style={{ fontSize:8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.25)', marginTop:2 }}>Durée</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-.025em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 4px', lineHeight:1.1 }}>
              {currentSong?.titre}
            </h2>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:14, color:`rgba(${accentCSS},1)`, fontWeight:700 }}>{currentSong?.artiste}</span>
              {currentSong?.album && <span style={{ fontSize:12, color:'rgba(255,255,255,.25)' }}>· {currentSong.album}</span>}
              {currentSong?.annee && <span style={{ fontSize:11, color:'rgba(255,255,255,.18)' }}>· {currentSong.annee}</span>}
            </div>
            {currentSong?.moods?.length > 0 && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {currentSong.moods.map(m=><span key={m} className="fp-mood"><Tag size={7}/>{m}</span>)}
              </div>
            )}
          </div>
          {/* Like heart */}
          <button onClick={handleLike} style={{ marginLeft:12, padding:10, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', flexShrink:0, animation:heartAnim?'fp-heartbeat .4s ease':'none' }}>
            <Heart size={24} fill={currentSong?.liked?'#ef4444':'none'} color={currentSong?.liked?'#ef4444':'rgba(255,255,255,.28)'} style={{ transition:'fill .2s, color .2s' }}/>
          </button>
        </div>
      </div>

      {/* TAGS ROW (format, bitrate, etc.) */}
      <div style={{ padding:'0 22px 10px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
        {currentSong?.genre && (
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:6, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.45)', border:'1px solid rgba(255,255,255,.1)' }}>{currentSong.genre}</span>
        )}
        {currentSong?.format && (
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:6, background:`rgba(${accentCSS},.15)`, color:`rgba(${accentCSS},1)`, border:`1px solid rgba(${accentCSS},.3)` }}>{currentSong.format}</span>
        )}
        {currentSong?.bitrate && (
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:6, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', border:'1px solid rgba(255,255,255,.08)', fontFamily:'var(--fp-mono)' }}>{currentSong.bitrate}</span>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div style={{ padding:'0 22px 4px', flexShrink:0 }}>
        <div className="fp-prog-track" onClick={seek} onTouchMove={seekTouch}>
          <div className="fp-prog-fill" style={{ width:`${prog}%` }}>
            <div className="fp-prog-thumb"/>
          </div>
          {/* Timestamp markers */}
          {duration > 0 && tsComments.map(c => {
            const pct = Math.min(97, Math.max(2, (c.timestamp/duration)*100));
            const near = Math.abs(currentTime - c.timestamp) < 3;
            return (
              <div key={c._id} className="fp-ts-marker"
                style={{ left:`${pct}%`, width:near?10:7, height:near?10:7, background:near?`rgba(${accentCSS},1)`:'rgba(255,255,255,.5)', boxShadow:near?`0 0 8px rgba(${accentCSS},.8)`:'' }}
                onClick={e=>{ e.stopPropagation(); seekToTimestamp(c.timestamp); setActiveTab('comments'); }}
              />
            );
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, fontSize:10, color:'rgba(255,255,255,.22)', fontFamily:'var(--fp-mono)' }}>
          <span>{formatTime(currentTime)}</span>
          {tsComments.length > 0 && (
            <button onClick={()=>setActiveTab('comments')} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:`rgba(${accentCSS},.6)`, border:'none', background:'none', cursor:'pointer', transition:'color .15s', fontFamily:'var(--fp-font)' }}
              onMouseEnter={e=>e.currentTarget.style.color=`rgba(${accentCSS},1)`} onMouseLeave={e=>e.currentTarget.style.color=`rgba(${accentCSS},.6)`}>
              <MessageCircle size={9}/> {tsComments.length}
            </button>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px 6px', flexShrink:0 }}>
        {/* Party */}
        <button onClick={()=>onOpenListenParty?.()}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:99, fontSize:11, fontWeight:700, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)', cursor:'pointer', transition:'all .15s', fontFamily:'var(--fp-font)' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,.1)'; e.currentTarget.style.color='rgba(255,255,255,.85)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='rgba(255,255,255,.4)'; }}>
          <Radio size={13}/> Party
        </button>

        {/* Shuffle */}
        <button onClick={()=>setIsShuffle(v=>!v)} className="fp-ctrl"
          style={{ width:42, height:42, color:isShuffle?accentHex:'rgba(255,255,255,.3)', background:isShuffle?`rgba(${accentCSS},.14)`:'' }}>
          <Shuffle size={20}/>
        </button>

        {/* Prev */}
        <button onClick={handlePrev} className="fp-ctrl" style={{ width:46, height:46, color:'rgba(255,255,255,.85)' }}>
          <SkipBack size={26} fill="rgba(255,255,255,.85)"/>
        </button>

        {/* Play */}
        <button className={`fp-play-btn${isPlaying?' fp-playing':''}`}
          onClick={()=>{ initAudioEngine(); setIsPlaying(p=>!p); }}
          style={{ width:68, height:68 }}>
          <div className="fp-play-ring"/>
          {isPlaying ? <Pause fill="white" size={26} color="white"/> : <Play fill="white" size={26} color="white" style={{ marginLeft:3 }}/>}
        </button>

        {/* Next */}
        <button onClick={handleNext} className="fp-ctrl" style={{ width:46, height:46, color:'rgba(255,255,255,.85)' }}>
          <SkipForward size={26} fill="rgba(255,255,255,.85)"/>
        </button>

        {/* Repeat */}
        <button onClick={()=>setRepeatMode(m=>(m+1)%3)} className="fp-ctrl"
          style={{ width:42, height:42, color:repeatMode>0?accentHex:'rgba(255,255,255,.3)', background:repeatMode>0?`rgba(${accentCSS},.14)`:'' }}>
          {repeatMode===2?<Repeat1 size={20}/>:<Repeat size={20}/>}
        </button>

        <div style={{ width:68 }}/>
      </div>

      {/* VOLUME */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 28px 14px', flexShrink:0 }}>
        <Volume2 size={15} color="rgba(255,255,255,.22)"/>
        <div className="fp-vol-track">
          <div className="fp-vol-fill" style={{ width:`${volume}%` }}/>
          <input type="range" min="0" max="100" value={volume} onChange={e=>setVolume(parseInt(e.target.value,10))} className="fp-vol-input"/>
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,.22)', fontFamily:'var(--fp-mono)', minWidth:32, textAlign:'right' }}>{volume}%</span>
      </div>

      {/* ACTION PILLS */}
      <div style={{ padding:'0 22px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          <button onClick={handleLike} className={`fp-pill${currentSong?.liked?' liked':''}`}>
            <Heart size={12} fill={currentSong?.liked?'#f87171':'none'}/> {currentSong?.liked?'Aimé':'Aimer'}
          </button>
          <button className="fp-pill"><Download size={12}/> Télécharger</button>
          <button className="fp-pill"><Share2 size={12}/> Partager</button>
          <button className={`fp-pill${sleepTimer>0?' sleep-on':''}`} onClick={()=>setSleepTimer(sleepTimer>0?0:30)}>
            <Moon size={12}/> {sleepTimer>0?`Veille ${sleepTimer}'`:'Veille'}
          </button>
        </div>
      </div>

      {/* LYRICS placeholder */}
      {currentSong && (
        <div style={{ padding:'0 16px 32px', flexShrink:0 }}>
          {/* LyricsDisplay and LyricsEditor would be injected here */}
        </div>
      )}
    </div>
  );

  // ──────────────── MAIN RENDER ────────────────
  return (
    <div ref={rootRef} className="fp-root" style={{ '--fp-accent':accentCSS, position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'row', overflow:'hidden', userSelect:'none', background:'#080808' }}>

      {/* BACKGROUND */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {currentSong?.image && (
          <img src={currentSong.image} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:'scale(1.4)', filter:`blur(80px) saturate(2)`, opacity:.3, transition:'opacity 1s' }}/>
        )}
        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, rgba(8,8,8,.75) 0%, rgba(8,8,8,.45) 35%, rgba(8,8,8,.88) 75%, rgba(8,8,8,.98) 100%)` }}/>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, rgba(8,8,8,.6) 0%, transparent 25%, transparent 75%, rgba(8,8,8,.6) 100%)` }}/>
        {/* Accent glow at bottom */}
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'60%', height:200, background:`radial-gradient(ellipse at center, rgba(${accentCSS},.18) 0%, transparent 70%)`, transition:'background 1s', pointerEvents:'none' }}/>
        {/* Noise grain */}
        <div style={{ position:'absolute', inset:0, opacity:.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'100px' }}/>
      </div>

      {/* ═══ MAIN COLUMN ═══ */}
      <div className={isPlaying?'fp-playing':''} style={{ position:'relative', display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>

        {/* Frequency canvas */}
        <canvas ref={canvasRef} width="1000" height="6" style={{ position:'absolute', top:0, left:0, width:'100%', height:3, zIndex:10, pointerEvents:'none', opacity:.9 }}/>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'46px 18px 8px', flexShrink:0, zIndex:10 }}>
          <button onClick={onClose} className="fp-ctrl" style={{ width:40, height:40 }}>
            <ChevronDown size={21} color="rgba(255,255,255,.6)"/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.3em', textTransform:'uppercase', color:'rgba(255,255,255,.22)' }}>En cours</span>
            {smartMode && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, background:`rgba(${accentCSS},.18)`, color:accentHex, padding:'3px 8px', borderRadius:99, border:`1px solid rgba(${accentCSS},.3)` }}>
                <Sparkles size={8}/> Smart
              </span>
            )}
            {isPlaying && (
              <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:15 }}>
                <div className="fp-bar" style={{ height:5 }}/>
                <div className="fp-bar" style={{ height:10 }}/>
                <div className="fp-bar" style={{ height:5 }}/>
              </div>
            )}
          </div>
          {/* Quick action buttons */}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            {[
              { key:'eq',       icon:<Sliders size={15}/>,      color:accentHex },
              { key:'queue',    icon:<ListMusic size={15}/>,    color:accentHex, badge:queue.length },
              { key:'comments', icon:<MessageCircle size={15}/>,color:accentHex, badge:tsComments.length },
            ].map(({ key, icon, color, badge }) => (
              <div key={key} style={{ position:'relative' }}>
                <button onClick={()=>setActiveTab(t=>t===key?'player':key)} className="fp-ctrl"
                  style={{ width:38, height:38, color:activeTab===key?color:'rgba(255,255,255,.38)', background:activeTab===key?`rgba(${accentCSS},.18)`:undefined, border:`1px solid ${activeTab===key?`rgba(${accentCSS},.32)`:'transparent'}` }}>
                  {icon}
                </button>
                {badge > 0 && (
                  <span style={{ position:'absolute', top:-3, right:-3, width:15, height:15, background:`rgba(${accentCSS},1)`, borderRadius:'50%', fontSize:8, fontWeight:900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                    {badge>9?'9+':badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="fp-mobile-tabs" style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          {TABS_MOBILE.map(({ key, icon, label }) => (
            <button key={key} className={`fp-tab${activeTab===key?' on':''}`} onClick={()=>setActiveTab(key)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="fp-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch' }}>

          {activeTab==='player' && renderPlayer()}

          {activeTab==='eq' && (
            <div className="fp-fade" style={{ flex:1 }}>
              <EQPanel {...eqProps}/>
            </div>
          )}

          {activeTab==='queue' && (
            <div className="fp-fade" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
              <QueuePanel {...queueProps}/>
            </div>
          )}

          {activeTab==='comments' && currentSong && (
            <div className="fp-fade" style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, overscrollBehavior:'contain' }}>
              <CommentsPanel
                songId={currentSong._id} currentTime={currentTime} duration={duration}
                onSeek={seekToTimestamp} token={token} isLoggedIn={isLoggedIn}
                userId={userId} isAdmin={isAdminLocal} userNom={userNom}
                onMarkersReady={setTsComments} accentColor={accentHex}
                API={apiBase||''}
              />
            </div>
          )}

          {activeTab==='infos' && (
            <div className="fp-fade" style={{ flex:1 }}>
              <InfosPanel currentSong={currentSong} currentTime={currentTime} duration={duration} audioRef={audioRef} accentColor={accentHex}/>
            </div>
          )}

        </div>
      </div>

      {/* ═══ RIGHT COLUMN — DESKTOP ═══ */}
      <div className="fp-right" style={{ position:'relative', width:380, flexDirection:'column', borderLeft:`1px solid rgba(${accentCSS},.1)`, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.32)', backdropFilter:'blur(40px)' }}/>
        <div style={{ position:'relative', display:'flex', flexDirection:'column', height:'100%' }}>

          {/* Desktop tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
            {TABS_DESKTOP.map(({ key, icon, label }) => (
              <button key={key} onClick={()=>setActiveTab(key)} className={`fp-tab${activeTab===key?' on':''}`}>
                {icon}<span style={{ fontSize:9 }}>{label}</span>
              </button>
            ))}
          </div>

          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {activeTab==='eq' && (
              <div className="fp-scroll" style={{ flex:1, overflowY:'auto' }}>
                <EQPanel {...eqProps}/>
              </div>
            )}
            {(activeTab==='queue'||activeTab==='player') && <QueuePanel {...queueProps}/>}
            {activeTab==='comments' && currentSong && (
              <div className="fp-scroll" style={{ flex:1, overflowY:'auto', overscrollBehavior:'contain' }}>
                <CommentsPanel
                  songId={currentSong._id} currentTime={currentTime} duration={duration}
                  onSeek={seekToTimestamp} token={token} isLoggedIn={isLoggedIn}
                  userId={userId} isAdmin={isAdminLocal} userNom={userNom}
                  onMarkersReady={setTsComments} accentColor={accentHex}
                  API={apiBase||''}
                />
              </div>
            )}
            {activeTab==='infos' && (
              <div className="fp-scroll" style={{ flex:1, overflowY:'auto' }}>
                <InfosPanel currentSong={currentSong} currentTime={currentTime} duration={duration} audioRef={audioRef} accentColor={accentHex}/>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default FullPlayerPage;
export { extractDominantColor };