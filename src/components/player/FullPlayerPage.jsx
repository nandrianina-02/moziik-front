import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2,
  ListMusic, Sliders, X, Gauge, Timer,
  GripVertical, RotateCcw, Radio, Sparkles, Tag,
  Check, Zap
} from 'lucide-react';
import { LyricsDisplay, LyricsEditor } from '../music/LyricsDisplay';
import { API } from '../../config/api';

// ════════════════════════════════════════════
// FIX: EQ à 12 BANDES — unifié App.jsx + FullPlayerPage
// ════════════════════════════════════════════
export const EQ_BANDS_12 = [
  { hz: 32,    label: '32',   type: 'lowshelf',  color: '#ef4444' },
  { hz: 64,    label: '64',   type: 'peaking',   color: '#f97316' },
  { hz: 125,   label: '125',  type: 'peaking',   color: '#f59e0b' },
  { hz: 250,   label: '250',  type: 'peaking',   color: '#eab308' },
  { hz: 500,   label: '500',  type: 'peaking',   color: '#84cc16' },
  { hz: 1000,  label: '1k',   type: 'peaking',   color: '#22c55e' },
  { hz: 2000,  label: '2k',   type: 'peaking',   color: '#14b8a6' },
  { hz: 3500,  label: '3.5k', type: 'peaking',   color: '#06b6d4' },
  { hz: 6000,  label: '6k',   type: 'peaking',   color: '#3b82f6' },
  { hz: 8000,  label: '8k',   type: 'peaking',   color: '#6366f1' },
  { hz: 12000, label: '12k',  type: 'peaking',   color: '#8b5cf6' },
  { hz: 16000, label: '16k',  type: 'highshelf', color: '#ec4899' },
];

export const EQ_PRESETS_12 = {
  Flat:     [0,0,0,0,0,0,0,0,0,0,0,0],
  Bass:     [9,7,5,3,1,0,0,0,0,0,0,0],
  Treble:   [0,0,0,0,0,0,2,3,5,6,8,9],
  Vocal:    [-2,-1,0,2,5,6,5,3,1,0,-1,-2],
  Pop:      [-1,0,2,4,5,4,3,2,1,0,-1,-1],
  Rock:     [6,5,3,1,-1,0,1,3,5,6,6,5],
  Jazz:     [3,2,1,3,4,4,3,2,2,3,3,2],
  Club:     [0,0,5,5,4,3,3,4,5,5,0,0],
  Classical:[0,0,0,0,0,0,0,0,-2,-3,-4,-5],
  Dance:    [7,5,2,0,-1,-2,0,3,5,6,6,5],
  Latin:    [4,3,0,0,-1,-1,0,1,3,4,5,4],
  Lounge:   [-3,-2,0,2,3,2,1,0,-1,-2,-2,-3],
};

// ════════════════════════════════════════════
// INIT EQ 12 BANDES — à appeler dans App.jsx
// ════════════════════════════════════════════
export const initEQ12 = (audioRef, eqFiltersRef, audioContextRef) => {
  if (audioContextRef.current || !audioRef.current) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx.destination.channelCount = Math.min(2, ctx.destination.maxChannelCount);
    const src      = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    // Créer 12 filtres BiquadFilter
    const filters = EQ_BANDS_12.map(band => {
      const f = ctx.createBiquadFilter();
      f.type      = band.type;
      f.frequency.value = band.hz;
      f.gain.value      = 0;
      if (band.type === 'peaking') f.Q.value = 1.2;
      return f;
    });

    // Chaîner : src → f0 → f1 → ... → f11 → analyser → destination
    src.connect(filters[0]);
    filters.forEach((f, i) => { if (i < filters.length - 1) f.connect(filters[i + 1]); });
    filters[filters.length - 1].connect(analyser);
    analyser.connect(ctx.destination);

    eqFiltersRef.current = filters;

    // Visualizer canvas (appelé depuis draw loop dans App)
    audioContextRef.current = { ctx, analyser };
  } catch (e) { console.warn('AudioContext init failed:', e); }
};

// ════════════════════════════════════════════
// FULL PLAYER PAGE
// ════════════════════════════════════════════
const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying, setCurrentSong, currentTime, duration,
  handleNext, handlePrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
  toggleLike, volume, setVolume, queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  // FIX: eqGains doit avoir 12 éléments (pas 10)
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef,
  token, isLoggedIn,
  onOpenListenParty,
  // FIX: mode intelligent par moods
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

  // FIX: S'assurer que eqGains a bien 12 éléments
  const safeEqGains = useMemo(() => {
    if (!eqGains || eqGains.length < 12) return Array(12).fill(0);
    return eqGains;
  }, [eqGains]);

  // ── Bucket rétention ──
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

  // ── Auto-queue initial ──
  useEffect(() => {
    if (!musiques?.length || !currentSong) return;
    if (queue.length > 0) return;
    const idx = musiques.findIndex(s => s._id === currentSong._id);
    if (idx !== -1) setQueue([...musiques.slice(idx + 1), ...musiques.slice(0, idx)]);
  }, [currentSong?._id]);

  // ── EQ handlers ──
  const setEqBand = useCallback((idx, value) => {
    setEqGains(prev => {
      const n = prev.length === 12 ? [...prev] : Array(12).fill(0);
      n[idx] = value;
      return n;
    });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = (name) => {
    const gains = EQ_PRESETS_12[name] || Array(12).fill(0);
    setEqGains(gains);
    setActivePreset(name);
    gains.forEach((v, i) => { if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v; });
  };

  const resetEQ = () => applyPreset('Flat');

  // ── Drag queue ──
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const arr = [...queue]; const [moved] = arr.splice(dragIdx.current, 1); arr.splice(i, 0, moved);
    setQueue(arr); dragIdx.current = null; setDragOver(null);
  };

  // ── Seek ──
  const seek      = (e) => { const r = e.currentTarget.getBoundingClientRect(); if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration; };
  const seekTouch = (e) => { const r = e.currentTarget.getBoundingClientRect(); if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - r.left) / r.width)) * duration; };

  // ── Mode intelligent (smart mode par moods) ──
  const currentMoods = currentSong?.moods || [];
  const smartQueueCount = useMemo(() => {
    if (!smartMode || !musiques?.length || !currentMoods.length) return 0;
    return musiques.filter(s => s._id !== currentSong?._id && s.moods?.some(m => currentMoods.includes(m))).length;
  }, [smartMode, musiques, currentSong, currentMoods]);

  // ── EQ Bar verticale (12 bandes) ──
  const EQBar = ({ band, idx, value }) => {
    const clampedValue = Math.max(-12, Math.min(12, isNaN(value) ? 0 : value));
    return (
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
        <span className="text-[7px] tabular-nums text-white/35 h-3 leading-none shrink-0 font-mono">
          {clampedValue > 0 ? `+${clampedValue}` : clampedValue !== 0 ? clampedValue : '·'}
        </span>
        <div className="relative w-full flex justify-center flex-1" style={{ minHeight: 72 }}>
          <div className="relative w-3.5 h-full bg-white/8 rounded-full overflow-visible flex items-center">
            {/* Ligne zéro */}
            <div className="absolute left-0 right-0 h-px bg-white/20 z-10" style={{ top: '50%' }}/>
            {/* Rempli positif */}
            {clampedValue > 0 && (
              <div className="absolute left-0 right-0 rounded-t-sm transition-all duration-150"
                style={{ background: band.color, opacity: 0.75, bottom: '50%', height: `${(clampedValue / 12) * 50}%` }}/>
            )}
            {/* Rempli négatif */}
            {clampedValue < 0 && (
              <div className="absolute left-0 right-0 rounded-b-sm transition-all duration-150"
                style={{ background: band.color, opacity: 0.45, top: '50%', height: `${(Math.abs(clampedValue) / 12) * 50}%` }}/>
            )}
            {/* Curseur */}
            <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white/70 bg-zinc-900 z-20 shadow transition-all duration-150"
              style={{ top: `calc(50% - ${(clampedValue / 12) * 50}% - 6px)` }}/>
            {/* Input vertical */}
            <input type="range" min="-12" max="12" step="1" value={clampedValue}
              onChange={e => setEqBand(idx, parseInt(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '100%', height: '100%' }}/>
          </div>
        </div>
        <span className="text-[7px] text-white/25 shrink-0 font-mono">{band.label}</span>
      </div>
    );
  };

  // ── EQ Content ──
  const EQContent = () => (
    <div className="flex flex-col gap-3 px-3 pb-4 pt-2">
      {/* Header + mode intelligent */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
          <Sliders size={11} className="text-blue-400"/> 12 bandes
        </p>
        <div className="flex items-center gap-2">
          {/* FIX: Mode intelligent par moods */}
          <button
            onClick={() => setSmartMode?.(v => !v)}
            title="Mode intelligent — joue des titres similaires par mood"
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg transition ${
              smartMode
                ? 'bg-violet-500/25 text-violet-300 ring-1 ring-violet-400/40'
                : 'bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'
            }`}>
            <Sparkles size={9}/> Smart {smartMode && currentMoods.length > 0 && `(${smartQueueCount})`}
          </button>
          <button onClick={resetEQ}
            className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <RotateCcw size={9}/> Reset
          </button>
        </div>
      </div>

      {/* Mode intelligent info */}
      {smartMode && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
          <p className="text-[10px] text-violet-300 font-bold flex items-center gap-1.5">
            <Sparkles size={10}/> Mode intelligent actif
          </p>
          {currentMoods.length > 0 ? (
            <p className="text-[9px] text-violet-400/60 mt-0.5">
              Moods : {currentMoods.join(', ')} · {smartQueueCount} titres similaires disponibles
            </p>
          ) : (
            <p className="text-[9px] text-violet-400/40 mt-0.5">
              Ce titre n'a pas de moods — ajoutez-en dans la bibliothèque admin
            </p>
          )}
        </div>
      )}

      {/* Préréglages — 2 lignes sur mobile */}
      <div className="flex gap-1 flex-wrap">
        {Object.keys(EQ_PRESETS_12).map(name => (
          <button key={name} onClick={() => applyPreset(name)}
            className={`px-2 py-1 rounded-full text-[9px] font-bold transition ${
              activePreset === name ? 'bg-blue-500 text-white' : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {/* FIX: 12 barres EQ verticales */}
      <div className="flex gap-1 w-full" style={{ height: 130 }}>
        {EQ_BANDS_12.map((band, idx) => (
          <EQBar key={band.hz} band={band} idx={idx} value={safeEqGains[idx] ?? 0}/>
        ))}
      </div>

      {/* Vitesse + Timer */}
      <div className="border-t border-white/8 pt-3 space-y-3">
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-2 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Gauge size={10}/> Vitesse</span>
            <span className="text-white/60">{playbackRate}×</span>
          </div>
          <div className="relative h-1.5 bg-white/10 rounded-full group">
            <div className="absolute top-0 left-0 h-full bg-purple-500/70 rounded-full"
              style={{ width: `${((playbackRate - 0.5) / 1.5) * 100}%` }}/>
            <input type="range" min="0.5" max="2" step="0.25" value={playbackRate}
              onChange={e => setPlaybackRate(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
          </div>
          <div className="flex justify-between text-[9px] text-white/15 mt-1">
            {['0.5×','1×','1.5×','2×'].map(v => <span key={v}>{v}</span>)}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-2 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Timer size={10}/> Minuterie</span>
            {sleepRemaining && <span className="text-green-400">{Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}</span>}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0,15,30,45,60].map(m => (
              <button key={m} onClick={() => setSleepTimer(m)}
                className={`py-1.5 rounded-xl text-[10px] font-bold transition ${
                  sleepTimer === m ? 'bg-blue-500 text-white' : 'bg-white/8 text-white/35 hover:bg-white/15'
                }`}>
                {m === 0 ? 'Off' : `${m}'`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Queue Content ──
  // FIX: overflow-y-auto isolé sur la liste, pas sur le conteneur global
  const QueueContent = () => (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/8">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
          <ListMusic size={12} className="text-violet-400"/> File d'attente
          <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{queue.length}</span>
        </p>
        {queue.length > 0 && (
          <button onClick={() => setQueue([])}
            className="text-[10px] text-white/25 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10">
            Vider
          </button>
        )}
      </div>
      {/* FIX: overflow-y-auto uniquement sur cet élément avec flex-1 */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-1"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        {queue.length === 0 ? (
          <div className="text-center py-10 text-white/20">
            <ListMusic size={28} className="mx-auto mb-2 opacity-30"/>
            <p className="text-sm">File vide</p>
            {smartMode && currentMoods.length > 0 && (
              <p className="text-[10px] text-violet-400/50 mt-2">
                Mode intelligent : les titres similaires s'ajouteront automatiquement
              </p>
            )}
          </div>
        ) : queue.map((s, i) => (
          <div key={`${s._id}-${i}`} draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl group transition cursor-grab active:cursor-grabbing ${
              dragOver === i ? 'bg-violet-500/20 ring-1 ring-violet-500/40' : 'bg-white/5 hover:bg-white/10'
            }`}>
            <GripVertical size={13} className="text-white/15 group-hover:text-white/35 shrink-0 transition"/>
            <img src={s.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt=""/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white/80">{s.titre}</p>
              <p className="text-[10px] text-white/30 truncate">{s.artiste}</p>
              {s.moods?.length > 0 && (
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {s.moods.slice(0, 2).map(m => (
                    <span key={m} className="text-[7px] bg-white/10 text-white/30 px-1 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition text-white/25 hover:text-red-400 shrink-0">
              <X size={11}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-200 flex flex-col md:flex-row overflow-hidden select-none">

      {/* ══ FOND AMBIANT ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {currentSong?.image && (
          <img src={currentSong.image} className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50" alt=""/>
        )}
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/75 via-zinc-950/65 to-zinc-950/95"/>
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/40 via-transparent to-zinc-950/40"/>
      </div>

      {/* ══ COLONNE PRINCIPALE ══ */}
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Visualizer */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full z-10 pointer-events-none"
          style={{ height: 3, opacity: 0.85 }} width="1000" height="6"/>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-3 md:pt-6 shrink-0 z-10">
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition active:scale-90">
            <ChevronDown size={20} className="text-white"/>
          </button>
          <div className="text-center flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35">Lecture en cours</p>
            {/* Indicateur mode intelligent */}
            {smartMode && (
              <span className="flex items-center gap-1 text-[9px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                <Sparkles size={8}/> Smart
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setActiveTab(t => t === 'eq' ? 'player' : 'eq')}
              className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 ${
                activeTab === 'eq' ? 'bg-blue-500/25 text-blue-400 ring-1 ring-blue-500/40' : 'bg-white/10 hover:bg-white/18 text-white/55'
              }`}>
              <Sliders size={16}/>
            </button>
            <button onClick={() => setActiveTab(t => t === 'queue' ? 'player' : 'queue')}
              className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90 ${
                activeTab === 'queue' ? 'bg-violet-500/25 text-violet-400 ring-1 ring-violet-500/40' : 'bg-white/10 hover:bg-white/18 text-white/55'
              }`}>
              <ListMusic size={16}/>
            </button>
          </div>
        </div>

        {/* Contenu onglets */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">

          {/* ── VUE PLAYER ── */}
          {activeTab === 'player' && (
            <div className="flex flex-col flex-1">
              {/* Cover */}
              <div className="flex items-center justify-center px-8 py-6 md:py-10 shrink-0">
                <div className="relative w-full max-w-55 md:max-w-70 aspect-square">
                  {currentSong?.image && (
                    <div className="absolute inset-3 rounded-3xl blur-2xl opacity-55 scale-95"
                      style={{ backgroundImage: `url(${currentSong.image})`, backgroundSize: 'cover' }}/>
                  )}
                  <img src={currentSong?.image} alt={currentSong?.titre}
                    className={`relative w-full h-full rounded-3xl object-cover shadow-2xl transition-all duration-700 ${
                      isPlaying ? 'scale-100' : 'scale-95 opacity-70'
                    }`}/>
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-white/15 animate-pulse pointer-events-none"/>
                  )}
                </div>
              </div>

              {/* Titre + moods + like */}
              <div className="flex items-start px-6 py-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-white truncate leading-tight">{currentSong?.titre}</h2>
                  <p className="text-sm text-white/45 mt-0.5 truncate font-medium">{currentSong?.artiste}</p>
                  {/* Moods du titre en cours */}
                  {currentSong?.moods?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {currentSong.moods.map(m => (
                        <span key={m} className="text-[8px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Tag size={7}/> {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => toggleLike(currentSong?._id)} className="ml-4 p-2 shrink-0 active:scale-90 transition mt-1">
                  <Heart size={22} fill={currentSong?.liked ? '#ef4444' : 'none'}
                    className={currentSong?.liked ? 'text-red-500' : 'text-white/35 hover:text-white/60 transition'}/>
                </button>
              </div>

              {/* Progression */}
              <div className="px-6 py-1 shrink-0">
                <div className="relative h-1.5 bg-white/12 rounded-full cursor-pointer group"
                  onClick={seek} onTouchMove={seekTouch}>
                  <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100" style={{ width: `${prog}%` }}/>
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-black/50 opacity-0 group-hover:opacity-100 transition"
                    style={{ left: `calc(${prog}% - 8px)` }}/>
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-white/30 tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-[11px] text-white/30 tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Contrôles */}
              <div className="flex items-center justify-between px-6 py-2 shrink-0">
                <button onClick={() => onOpenListenParty?.()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-[11px] font-bold transition active:scale-90">
                  <Radio size={14}/> Party
                </button>
                <button onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2.5 rounded-full transition active:scale-90 ${isShuffle ? 'bg-blue-500/20 text-blue-400' : 'text-white/35 hover:text-white'}`}>
                  <Shuffle size={20}/>
                </button>
                <button onClick={handlePrev} className="p-2 text-white hover:text-white/70 transition active:scale-90">
                  <SkipBack size={26} fill="white"/>
                </button>
                {/* Bouton Play/Pause */}
                <button onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
                  className="relative flex items-center justify-center w-16 h-16 md:w-17 md:h-17 active:scale-95 transition">
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #3b82f6, #6366f1)', padding: '2.5px' }}>
                    <div className="w-full h-full rounded-full bg-zinc-950"/>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/10">
                    {isPlaying ? <Pause fill="white" size={21}/> : <Play fill="white" size={21} className="ml-0.5"/>}
                  </div>
                </button>
                <button onClick={handleNext} className="p-2 text-white hover:text-white/70 transition active:scale-90">
                  <SkipForward size={26} fill="white"/>
                </button>
                <button onClick={() => setRepeatMode(m => (m+1)%3)}
                  className={`p-2.5 rounded-full transition active:scale-90 ${repeatMode > 0 ? 'bg-blue-500/20 text-blue-400' : 'text-white/35 hover:text-white'}`}>
                  {repeatMode === 2 ? <Repeat1 size={20}/> : <Repeat size={20}/>}
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 px-7 py-2 shrink-0">
                <Volume2 size={13} className="text-white/25 shrink-0"/>
                <div className="relative flex-1 h-1.5 bg-white/10 rounded-full group">
                  <div className="absolute top-0 left-0 h-full bg-white/50 rounded-full" style={{ width: `${volume}%` }}/>
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition"
                    style={{ left: `calc(${volume}% - 7px)` }}/>
                  <input type="range" min="0" max="100" value={volume}
                    onChange={e => setVolume(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>
                <span className="text-[10px] text-white/25 w-7 text-right tabular-nums">{volume}%</span>
              </div>

              {/* Paroles */}
              {currentSong && (
                <div className="px-4 pb-4">
                  <LyricsDisplay songId={currentSong._id} currentTime={currentTime} isPlaying={isPlaying}/>
                  <LyricsEditor
                    songId={currentSong._id} songTitre={currentSong.titre} token={token}
                    canEdit={isAdmin || (isArtist && String(currentSong.artisteId?._id || currentSong.artisteId) === String(userArtistId))}/>
                </div>
              )}
            </div>
          )}

          {/* ── EQ mobile ── */}
          {activeTab === 'eq' && <EQContent/>}

          {/* ── Queue mobile — FIX: flex-1 pour scroll isolé ── */}
          {activeTab === 'queue' && (
            <div className="flex-1 flex flex-col min-h-0">
              <QueueContent/>
            </div>
          )}
        </div>
      </div>

      {/* ══ COLONNE DROITE desktop ══ */}
      <div className="relative hidden md:flex w-85 lg:w-100 flex-col border-l border-white/8 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"/>
        <div className="relative flex flex-col h-full">
          <div className="flex border-b border-white/8 shrink-0">
            {[
              ['eq', <Sliders size={13}/>, 'Égaliseur'],
              ['queue', <ListMusic size={13}/>, `File (${queue.length})`],
            ].map(([key, icon, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-[11px] font-bold uppercase tracking-wide transition ${
                  activeTab === key ? 'text-white border-b-2 border-blue-400' : 'text-white/30 hover:text-white/55'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>
          {/* FIX: overflow isolé sur chaque contenu */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeTab === 'queue'
              ? <QueueContent/>
              : <div className="flex-1 overflow-y-auto"><EQContent/></div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPlayerPage;