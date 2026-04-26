import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2,
  ListMusic, Sliders, X, Gauge, Timer,
  GripVertical, RotateCcw, Radio, Sparkles, Tag,
} from 'lucide-react';
import { LyricsDisplay, LyricsEditor } from '../music/LyricsDisplay';
import { API } from '../../config/api';

// ════════════════════════════════════════════
// EQ 12 BANDES
// ════════════════════════════════════════════
export const EQ_BANDS_12 = [
  { hz: 32,    label: '32',   type: 'lowshelf',  color: '#ff6b6b' },
  { hz: 64,    label: '64',   type: 'peaking',   color: '#ff8e53' },
  { hz: 125,   label: '125',  type: 'peaking',   color: '#ffd93d' },
  { hz: 250,   label: '250',  type: 'peaking',   color: '#c8f557' },
  { hz: 500,   label: '500',  type: 'peaking',   color: '#6bcb77' },
  { hz: 1000,  label: '1k',   type: 'peaking',   color: '#4dd9ac' },
  { hz: 2000,  label: '2k',   type: 'peaking',   color: '#4dc9f6' },
  { hz: 3500,  label: '3.5k', type: 'peaking',   color: '#4d79f6' },
  { hz: 6000,  label: '6k',   type: 'peaking',   color: '#7c6df6' },
  { hz: 8000,  label: '8k',   type: 'peaking',   color: '#a06df6' },
  { hz: 12000, label: '12k',  type: 'peaking',   color: '#c56ef6' },
  { hz: 16000, label: '16k',  type: 'highshelf', color: '#f06ef6' },
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
    ctx.destination.channelCount = Math.min(2, ctx.destination.maxChannelCount);
    const src      = ctx.createMediaElementSource(audioRef.current);
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
// STYLES INJECTÉS (glass morphism + animations)
// ════════════════════════════════════════════
const STYLES = `
  @keyframes fp-spin { to { transform: rotate(360deg); } }
  @keyframes fp-pulse-ring { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.35;transform:scale(1.04)} }
  @keyframes fp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes fp-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes fp-bar-in { from{transform:scaleY(0)} to{transform:scaleY(1)} }

  .fp-glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .fp-glass-strong {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.12);
  }
  .fp-cover-glow {
    animation: fp-pulse-ring 3s ease-in-out infinite;
  }
  .fp-playing .fp-cover-img {
    animation: fp-float 6s ease-in-out infinite;
  }
  .fp-btn-play {
    position: relative;
    transition: transform .15s cubic-bezier(.34,1.56,.64,1);
  }
  .fp-btn-play:active { transform: scale(.9); }
  .fp-btn-play::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: conic-gradient(from var(--a,0deg), #6366f1, #a855f7, #ec4899, #f97316, #6366f1);
    animation: fp-spin 4s linear infinite;
    opacity: 0;
    transition: opacity .3s;
  }
  .fp-playing .fp-btn-play::before { opacity: 1; }
  .fp-progress-bar {
    position: relative;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 99px;
    cursor: pointer;
    overflow: hidden;
  }
  .fp-progress-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.05);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform .1s;
  }
  .fp-progress-bar:hover::after { transform: scaleX(1); }
  .fp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,.6), rgba(255,255,255,1));
    border-radius: 99px;
    transition: width .1s linear;
    position: relative;
  }
  .fp-progress-fill::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%) scale(0);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 8px rgba(255,255,255,.6);
    transition: transform .2s;
  }
  .fp-progress-bar:hover .fp-progress-fill::after { transform: translateY(-50%) scale(1); }
  .fp-vol-track {
    position: relative;
    flex: 1;
    height: 3px;
    background: rgba(255,255,255,0.1);
    border-radius: 99px;
    cursor: pointer;
  }
  .fp-vol-fill {
    height: 100%;
    background: rgba(255,255,255,.45);
    border-radius: 99px;
    pointer-events: none;
  }
  .fp-vol-input {
    position: absolute;
    inset: -8px 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }
  .fp-eq-bar-wrap {
    position: relative;
    width: 100%;
    border-radius: 99px;
    overflow: hidden;
    background: rgba(255,255,255,0.06);
  }
  .fp-eq-fill {
    position: absolute;
    left: 0;
    right: 0;
    border-radius: 2px;
    transition: height .12s, top .12s, background .3s;
  }
  .fp-eq-zero {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255,255,255,0.2);
    top: 50%;
  }
  .fp-eq-thumb {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid rgba(255,255,255,0.3);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    transition: top .12s;
    pointer-events: none;
    z-index: 2;
  }
  .fp-eq-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: ns-resize;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 100%;
    height: 100%;
  }
  .fp-tab-btn {
    position: relative;
    flex: 1;
    padding: 14px 0;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    transition: color .2s;
    border: none;
    background: none;
    cursor: pointer;
  }
  .fp-tab-btn.active { color: rgba(255,255,255,0.9); }
  .fp-tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    border-radius: 99px;
    background: linear-gradient(90deg,#6366f1,#a855f7,#ec4899);
  }
  .fp-ctrl-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    transition: transform .15s, background .15s;
    cursor: pointer;
    background: none; border: none;
  }
  .fp-ctrl-btn:hover { background: rgba(255,255,255,0.08); }
  .fp-ctrl-btn:active { transform: scale(.88); }
  .fp-queue-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid transparent;
    transition: background .15s, border-color .15s;
    cursor: grab;
  }
  .fp-queue-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.08); }
  .fp-queue-item.drag-over { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.4); }
  .fp-preset-btn {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: all .15s;
  }
  .fp-preset-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
  .fp-preset-btn.active {
    background: linear-gradient(135deg,#6366f1,#a855f7);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 2px 12px rgba(99,102,241,.4);
  }
  .fp-mood-tag {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 9px; font-weight: 600; letter-spacing: .05em;
    padding: 3px 8px; border-radius: 99px;
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.4);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .fp-smart-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 10px; font-size: 10px; font-weight: 700;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.35);
    cursor: pointer; transition: all .2s;
  }
  .fp-smart-btn.active {
    background: rgba(139,92,246,0.2);
    border-color: rgba(139,92,246,0.4);
    color: #c4b5fd;
    box-shadow: 0 0 16px rgba(139,92,246,0.15);
  }
  .fp-section-label {
    font-size: 9px; font-weight: 800; letter-spacing: .15em;
    text-transform: uppercase; color: rgba(255,255,255,0.2);
  }
`;

// ════════════════════════════════════════════
// FULL PLAYER PAGE — VERSION PRO
// ════════════════════════════════════════════
const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying, setCurrentSong, currentTime, duration,
  handleNext, handlePrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
  toggleLike, volume, setVolume, queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef,
  token, isLoggedIn,
  onOpenListenParty,
  smartMode, setSmartMode,
}) => {
  const [activeTab, setActiveTab] = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;

  const role         = localStorage.getItem('moozik_role');
  const isAdmin      = role === 'admin';
  const isArtist     = role === 'artist';
  const userArtistId = localStorage.getItem('moozik_artisteId');

  const safeEqGains = useMemo(() => {
    if (!eqGains || eqGains.length < 12) return Array(12).fill(0);
    return eqGains;
  }, [eqGains]);

  // Injecter styles une seule fois
  useEffect(() => {
    const id = 'fp-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id;
      s.textContent = STYLES;
      document.head.appendChild(s);
    }
  }, []);

  // Bucket rétention
  const sentBuckets = useRef(new Set());
  useEffect(() => {
    if (!currentSong || !duration) return;
    const bucketIndex = Math.floor((currentTime / duration) * 20);
    if (bucketIndex >= 0 && bucketIndex < 20 && !sentBuckets.current.has(bucketIndex)) {
      sentBuckets.current.add(bucketIndex);
      fetch(`${API}/songs/${currentSong._id}/retention`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: bucketIndex, totalTime: Math.round(currentTime), completed: currentTime / duration > 0.9, deviceId: localStorage.getItem('moozik_device_id') || '' }),
      }).catch(() => {});
    }
  }, [Math.floor(currentTime / 5)]);
  useEffect(() => { sentBuckets.current.clear(); }, [currentSong?._id]);

  // Auto-queue
  useEffect(() => {
    if (!musiques?.length || !currentSong || queue.length > 0) return;
    const idx = musiques.findIndex(s => s._id === currentSong._id);
    if (idx !== -1) setQueue([...musiques.slice(idx + 1), ...musiques.slice(0, idx)]);
  }, [currentSong?._id]);

  // EQ handlers
  const setEqBand = useCallback((idx, value) => {
    setEqGains(prev => {
      const n = prev.length === 12 ? [...prev] : Array(12).fill(0);
      n[idx] = value;
      return n;
    });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = useCallback((name) => {
    const gains = EQ_PRESETS_12[name] || Array(12).fill(0);
    setEqGains(gains);
    setActivePreset(name);
    gains.forEach((v, i) => { if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v; });
  }, [setEqGains, eqFiltersRef]);

  const resetEQ = useCallback(() => applyPreset('Flat'), [applyPreset]);

  // Drag queue
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const arr = [...queue];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    setQueue(arr); dragIdx.current = null; setDragOver(null);
  };

  // Seek
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
  };
  const seekTouch = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - r.left) / r.width)) * duration;
  };

  const currentMoods = currentSong?.moods || [];
  const smartQueueCount = useMemo(() => {
    if (!smartMode || !musiques?.length || !currentMoods.length) return 0;
    return musiques.filter(s => s._id !== currentSong?._id && s.moods?.some(m => currentMoods.includes(m))).length;
  }, [smartMode, musiques, currentSong, currentMoods]);

  // ── EQ Bar ──
  const EQBar = ({ band, idx, value }) => {
    const v = Math.max(-12, Math.min(12, isNaN(value) ? 0 : value));
    const positivePct = v > 0 ? (v / 12) * 50 : 0;
    const negativePct = v < 0 ? (Math.abs(v) / 12) * 50 : 0;
    const thumbTop = `calc(50% - ${(v / 12) * 50}% - 6px)`;
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, minWidth:0 }}>
        <span style={{ fontSize:8, fontFamily:'monospace', color:'rgba(255,255,255,0.3)', height:14, lineHeight:'14px', flexShrink:0 }}>
          {v > 0 ? `+${v}` : v !== 0 ? v : '·'}
        </span>
        <div className="fp-eq-bar-wrap" style={{ flex:1, minHeight:80 }}>
          <div className="fp-eq-zero"/>
          {v > 0 && (
            <div className="fp-eq-fill" style={{
              background: `${band.color}cc`,
              bottom: '50%',
              height: `${positivePct}%`,
              boxShadow: `0 0 8px ${band.color}66`,
            }}/>
          )}
          {v < 0 && (
            <div className="fp-eq-fill" style={{
              background: `${band.color}77`,
              top: '50%',
              height: `${negativePct}%`,
            }}/>
          )}
          <div className="fp-eq-thumb" style={{ top: thumbTop }}/>
          <input
            type="range" min="-12" max="12" step="1" value={v}
            onChange={e => setEqBand(idx, parseInt(e.target.value))}
            className="fp-eq-input"
          />
        </div>
        <span style={{ fontSize:8, fontFamily:'monospace', color:'rgba(255,255,255,0.2)', flexShrink:0 }}>{band.label}</span>
      </div>
    );
  };

  // ── EQ Content ──
  const EQContent = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'12px 16px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Sliders size={11} color="#818cf8"/>
          <span className="fp-section-label">Égaliseur 12 bandes</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button
            onClick={() => setSmartMode?.(v => !v)}
            className={`fp-smart-btn ${smartMode ? 'active' : ''}`}
          >
            <Sparkles size={9}/> Smart
            {smartMode && currentMoods.length > 0 && ` (${smartQueueCount})`}
          </button>
          <button onClick={resetEQ} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>
            <RotateCcw size={9}/> Reset
          </button>
        </div>
      </div>

      {smartMode && (
        <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:12, padding:'10px 14px' }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#c4b5fd', display:'flex', alignItems:'center', gap:5 }}>
            <Sparkles size={10}/> Mode intelligent actif
          </p>
          <p style={{ fontSize:9, color:'rgba(196,181,253,0.5)', marginTop:3 }}>
            {currentMoods.length > 0
              ? `Moods : ${currentMoods.join(', ')} · ${smartQueueCount} titres similaires`
              : 'Aucun mood — ajoutez-en dans la bibliothèque admin'}
          </p>
        </div>
      )}

      {/* Presets */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {Object.keys(EQ_PRESETS_12).map(name => (
          <button
            key={name}
            onClick={() => applyPreset(name)}
            className={`fp-preset-btn ${activePreset === name ? 'active' : ''}`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Barres EQ */}
      <div style={{ display:'flex', gap:4, height:130 }}>
        {EQ_BANDS_12.map((band, idx) => (
          <EQBar key={band.hz} band={band} idx={idx} value={safeEqGains[idx] ?? 0}/>
        ))}
      </div>

      {/* Vitesse + Timer */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16, display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span className="fp-section-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Gauge size={10}/> Vitesse
            </span>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{playbackRate}×</span>
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${((playbackRate-0.5)/1.5)*100}%`, background:'linear-gradient(90deg,#818cf8,#a855f7)', borderRadius:99 }}/>
            </div>
            <input type="range" min="0.5" max="2" step="0.25" value={playbackRate}
              onChange={e => setPlaybackRate(parseFloat(e.target.value))}
              style={{ position:'absolute', inset:'-8px 0', opacity:0, cursor:'pointer', width:'100%' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:'monospace' }}>
            {['0.5×','1×','1.5×','2×'].map(v => <span key={v}>{v}</span>)}
          </div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span className="fp-section-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
              <Timer size={10}/> Minuterie
            </span>
            {sleepRemaining && (
              <span style={{ fontSize:11, fontWeight:700, color:'#4ade80', fontFamily:'monospace' }}>
                {Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}
              </span>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
            {[0,15,30,45,60].map(m => (
              <button key={m} onClick={() => setSleepTimer(m)} style={{
                padding:'8px 0', borderRadius:10, fontSize:10, fontWeight:700, cursor:'pointer',
                border: sleepTimer===m ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)',
                background: sleepTimer===m ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                color: sleepTimer===m ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                transition: 'all .15s',
              }}>
                {m === 0 ? 'Off' : `${m}'`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Queue Content ──
  const QueueContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ListMusic size={13} color="#a78bfa"/>
          <span className="fp-section-label">File d'attente</span>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.4)' }}>{queue.length}</span>
        </div>
        {queue.length > 0 && (
          <button onClick={() => setQueue([])} style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', border:'none', background:'none', cursor:'pointer', padding:'4px 8px', borderRadius:8, transition:'color .15s' }}
            onMouseEnter={e => e.target.style.color='#f87171'}
            onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.25)'}>
            Vider
          </button>
        )}
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:4, overscrollBehavior:'contain' }}>
        {queue.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,0.15)' }}>
            <ListMusic size={28} style={{ margin:'0 auto 8px', opacity:.3, display:'block' }}/>
            <p style={{ fontSize:13 }}>File vide</p>
          </div>
        ) : queue.map((s, i) => (
          <div key={`${s._id}-${i}`} draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            className={`fp-queue-item ${dragOver === i ? 'drag-over' : ''}`}>
            <GripVertical size={13} style={{ color:'rgba(255,255,255,0.15)', flexShrink:0 }}/>
            <img src={s.image} style={{ width:34, height:34, borderRadius:8, objectFit:'cover', flexShrink:0 }} alt=""/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{s.titre}</p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.artiste}</p>
            </div>
            <button onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent', color:'rgba(255,255,255,0.2)', cursor:'pointer', flexShrink:0, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.15)'; e.currentTarget.style.color='#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.2)'; }}>
              <X size={12}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════
  return (
    <div className='bg-red-950' style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'row', overflow:'hidden', userSelect:'none' }}>

      {/* ── FOND AMBIANT ── */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        {currentSong?.image && (
          <img src={currentSong.image} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:'scale(1.3)', filter:'blur(60px) saturate(1.4)', opacity:.45 }} alt=""/>
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(5,5,10,0.7) 0%, rgba(5,5,10,0.55) 40%, rgba(5,5,10,0.92) 100%)' }}/>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(5,5,10,0.5) 0%, transparent 30%, transparent 70%, rgba(5,5,10,0.5) 100%)' }}/>
        {/* Grain subtil */}
        <div style={{ position:'absolute', inset:0, opacity:.025, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:'128px' }}/>
      </div>

      {/* ══ COLONNE PRINCIPALE ══ */}
      <div className={isPlaying ? 'fp-playing' : ''} style={{ position:'relative', display:'flex', flexDirection:'column', flex:1, minHeight:0, overflow:'hidden' }}>

        {/* Visualizer canvas */}
        <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:3, zIndex:10, pointerEvents:'none', opacity:.9 }} width="1000" height="6"/>

        {/* ── HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'48px 20px 12px', flexShrink:0, zIndex:10 }}>
          <button onClick={onClose} className="fp-ctrl-btn" style={{ width:38, height:38 }}>
            <ChevronDown size={20} color="rgba(255,255,255,0.7)"/>
          </button>

          <div style={{ textAlign:'center', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>En cours</span>
            {smartMode && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, background:'rgba(139,92,246,0.2)', color:'#c4b5fd', padding:'3px 8px', borderRadius:99, border:'1px solid rgba(139,92,246,0.3)' }}>
                <Sparkles size={8}/> Smart
              </span>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button
              onClick={() => setActiveTab(t => t === 'eq' ? 'player' : 'eq')}
              className="fp-ctrl-btn"
              style={{ width:38, height:38, background: activeTab==='eq' ? 'rgba(99,102,241,0.2)' : undefined, color: activeTab==='eq' ? '#818cf8' : 'rgba(255,255,255,0.4)', border: activeTab==='eq' ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent' }}>
              <Sliders size={16}/>
            </button>
            <button
              onClick={() => setActiveTab(t => t === 'queue' ? 'player' : 'queue')}
              className="fp-ctrl-btn"
              style={{ width:38, height:38, background: activeTab==='queue' ? 'rgba(139,92,246,0.2)' : undefined, color: activeTab==='queue' ? '#a78bfa' : 'rgba(255,255,255,0.4)', border: activeTab==='queue' ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent' }}>
              <ListMusic size={16}/>
            </button>
          </div>
        </div>

        {/* ── CONTENU SCROLLABLE ── */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* ── VUE PLAYER ── */}
          {activeTab === 'player' && (
            <div style={{ display:'flex', flexDirection:'column', flex:1 }}>

              {/* Cover */}
              <div style={{ display:'flex', justifyContent:'center', padding:'16px 32px 20px', flexShrink:0 }}>
                <div style={{ position:'relative', width:'100%', maxWidth:240 }}>
                  {/* Glow derrière la pochette */}
                  {currentSong?.image && (
                    <div className="fp-cover-glow" style={{
                      position:'absolute', inset:12, borderRadius:24,
                      backgroundImage:`url(${currentSong.image})`, backgroundSize:'cover',
                      filter:'blur(28px)', opacity:.55,
                    }}/>
                  )}
                  <div style={{ position:'relative', aspectRatio:'1/1' }}>
                    <img
                      src={currentSong?.image}
                      alt={currentSong?.titre}
                      className="fp-cover-img"
                      style={{
                        width:'100%', height:'100%', borderRadius:20,
                        objectFit:'cover',
                        boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
                        transition:'transform .6s cubic-bezier(.34,1.56,.64,1), opacity .4s',
                        opacity: isPlaying ? 1 : .75,
                        transform: isPlaying ? 'scale(1)' : 'scale(.95)',
                      }}
                    />
                    {isPlaying && (
                      <div style={{ position:'absolute', inset:0, borderRadius:20, border:'1px solid rgba(255,255,255,0.15)', animation:'fp-pulse-ring 3s ease-in-out infinite', pointerEvents:'none' }}/>
                    )}
                  </div>
                </div>
              </div>

              {/* Titre + Like */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'0 24px 8px', flexShrink:0 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                    {currentSong?.titre}
                  </h2>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {currentSong?.artiste}
                  </p>
                  {currentSong?.moods?.length > 0 && (
                    <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
                      {currentSong.moods.map(m => (
                        <span key={m} className="fp-mood-tag"><Tag size={7}/>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleLike(currentSong?._id)}
                  style={{ marginLeft:16, padding:8, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', flexShrink:0, transition:'transform .2s cubic-bezier(.34,1.56,.64,1)' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <Heart
                    size={22}
                    fill={currentSong?.liked ? '#ef4444' : 'none'}
                    color={currentSong?.liked ? '#ef4444' : 'rgba(255,255,255,0.3)'}
                  />
                </button>
              </div>

              {/* Progress bar */}
              <div style={{ padding:'4px 24px 2px', flexShrink:0 }}>
                <div className="fp-progress-bar" onClick={seek} onTouchMove={seekTouch}>
                  <div className="fp-progress-fill" style={{ width:`${prog}%` }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Contrôles */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', flexShrink:0 }}>
                <button onClick={() => onOpenListenParty?.()} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:99, fontSize:11, fontWeight:700, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
                  <Radio size={13}/> Party
                </button>

                <button onClick={() => setIsShuffle(!isShuffle)} className="fp-ctrl-btn" style={{ width:40, height:40, color: isShuffle ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>
                  <Shuffle size={19}/>
                </button>

                <button onClick={handlePrev} className="fp-ctrl-btn" style={{ width:44, height:44, color:'rgba(255,255,255,0.85)' }}>
                  <SkipBack size={24} fill="rgba(255,255,255,0.85)"/>
                </button>

                {/* Bouton play principal */}
                <button
                  className="fp-btn-play"
                  onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
                  style={{ width:64, height:64, borderRadius:'50%', border:'none', cursor:'pointer', background:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'relative', zIndex:1, width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s' }}>
                    {isPlaying
                      ? <Pause fill="white" size={22} color="white"/>
                      : <Play  fill="white" size={22} color="white" style={{ marginLeft:2 }}/>
                    }
                  </div>
                </button>

                <button onClick={handleNext} className="fp-ctrl-btn" style={{ width:44, height:44, color:'rgba(255,255,255,0.85)' }}>
                  <SkipForward size={24} fill="rgba(255,255,255,0.85)"/>
                </button>

                <button onClick={() => setRepeatMode(m => (m+1)%3)} className="fp-ctrl-btn" style={{ width:40, height:40, color: repeatMode > 0 ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>
                  {repeatMode === 2 ? <Repeat1 size={19}/> : <Repeat size={19}/>}
                </button>

                {/* Placeholder droit */}
                <div style={{ width:60 }}/>
              </div>

              {/* Volume */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'4px 28px 16px', flexShrink:0 }}>
                <Volume2 size={13} color="rgba(255,255,255,0.2)"/>
                <div className="fp-vol-track">
                  <div className="fp-vol-fill" style={{ width:`${volume}%` }}/>
                  <input type="range" min="0" max="100" value={volume}
                    onChange={e => setVolume(parseInt(e.target.value))}
                    className="fp-vol-input"/>
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'monospace', minWidth:28, textAlign:'right' }}>{volume}%</span>
              </div>

              {/* Paroles */}
              {currentSong && (
                <div style={{ padding:'0 16px 24px' }}>
                  <LyricsDisplay songId={currentSong._id} currentTime={currentTime} isPlaying={isPlaying}/>
                  <LyricsEditor
                    songId={currentSong._id} songTitre={currentSong.titre} token={token}
                    canEdit={isAdmin || (isArtist && String(currentSong.artisteId?._id || currentSong.artisteId) === String(userArtistId))}/>
                </div>
              )}
            </div>
          )}

          {activeTab === 'eq' && <EQContent/>}

          {activeTab === 'queue' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
              <QueueContent/>
            </div>
          )}
        </div>
      </div>

      {/* ══ COLONNE DROITE DESKTOP ══ */}
      <div style={{ position:'relative', display:'none', width:340, flexDirection:'column', borderLeft:'1px solid rgba(255,255,255,0.07)', overflow:'hidden' }} className="md-col-right">
        <style>{`.md-col-right { display: none !important; } @media(min-width:768px){.md-col-right{display:flex!important}}`}</style>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', backdropFilter:'blur(30px)' }}/>
        <div style={{ position:'relative', display:'flex', flexDirection:'column', height:'100%' }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
            {[['eq', <Sliders size={12}/>, 'Égaliseur'], ['queue', <ListMusic size={12}/>, `File (${queue.length})`]].map(([key, icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`fp-tab-btn ${activeTab===key?'active':''}`}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>{icon}{label}</span>
              </button>
            ))}
          </div>
          <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {activeTab === 'queue'
              ? <QueueContent/>
              : <div style={{ flex:1, overflowY:'auto' }}><EQContent/></div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPlayerPage;