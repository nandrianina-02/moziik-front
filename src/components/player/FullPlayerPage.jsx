import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart, Volume2,
  ListMusic, Sliders, X, Gauge, Timer,
  GripVertical, RotateCcw, Radio
} from 'lucide-react';
import { LyricsDisplay, LyricsEditor } from '../music/LyricsDisplay';

import { ListenPartyModal } from '../SocialComponents';
// (react-router-dom data import supprimé — non utilisé)



// ─── 10 bandes EQ ─────────────────────────────────────────────
const EQ_BANDS = [
  { hz: 32,    label: '32',   color: '#ef4444' },
  { hz: 64,    label: '64',   color: '#f97316' },
  { hz: 125,   label: '125',  color: '#eab308' },
  { hz: 250,   label: '250',  color: '#84cc16' },
  { hz: 500,   label: '500',  color: '#22c55e' },
  { hz: 1000,  label: '1k',   color: '#14b8a6' },
  { hz: 2000,  label: '2k',   color: '#3b82f6' },
  { hz: 4000,  label: '4k',   color: '#6366f1' },
  { hz: 8000,  label: '8k',   color: '#8b5cf6' },
  { hz: 16000, label: '16k',  color: '#ec4899' },
];

const EQ_PRESETS = {
  Flat:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Bass:   [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  Treble: [0, 0, 0, 0, 0, 2, 4, 6, 8, 8],
  Vocal:  [-2,-1, 0, 3, 5, 5, 3, 1, 0,-1],
  Pop:    [-1, 0, 2, 4, 4, 3, 2, 1, 0,-1],
  Rock:   [5, 4, 2, 0,-1, 0, 2, 4, 5, 5],
  Jazz:   [3, 2, 1, 3, 4, 3, 2, 1, 2, 3],
  Club:   [0, 0, 5, 4, 3, 3, 4, 5, 0, 0],
};

// ─────────────────────────────────────────────────────────────────


const FullPlayerPage = ({
  
  currentSong, isPlaying, setIsPlaying, currentTime, duration,
  handleNext, handlePrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
  toggleLike, volume, setVolume, queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef
}) => {
  const [activeTab, setActiveTab] = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const dragIdx = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [showParty, setShowParty] = useState(false);

  const isLoggedIn = !!localStorage.getItem('moozik_token');
  // setCurrentSong est passé en prop depuis App.jsx si besoin


  // ── Auto-queue à la première lecture ──
  useEffect(() => {
    if (!musiques?.length || !currentSong) return;
    if (queue.length > 0) return;
    const idx = musiques.findIndex(s => s._id === currentSong._id);
    if (idx !== -1) {
      const after = [...musiques.slice(idx + 1), ...musiques.slice(0, idx)];
      setQueue(after);
    }
  }, [currentSong?._id]);

  const setEqBand = useCallback((idx, value) => {
    setEqGains(prev => { const n = [...prev]; n[idx] = value; return n; });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, []);

  const applyPreset = (name) => {
    const gains = EQ_PRESETS[name];
    setEqGains(gains);
    setActivePreset(name);
    gains.forEach((v, i) => { if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v; });
  };

  const resetEQ = () => applyPreset('Flat');

  const token = localStorage.getItem('moozik_token');
  const role = localStorage.getItem('moozik_role');
  const isAdmin = role === 'admin';
  const isArtist = role === 'artist';
  const userArtistId = localStorage.getItem('moozik_artisteId');

  // ── Drag queue ──
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) { setDragOver(null); return; }
    const arr = [...queue];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    setQueue(arr);
    dragIdx.current = null;
    setDragOver(null);
  };

  // ── Seek ──
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
  };
  const seekTouch = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - r.left) / r.width)) * duration;
  };

  // ── Barre EQ verticale ──
  const EQBar = ({ band, idx, value }) => (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[8px] tabular-nums text-white/35 h-3.5 leading-none shrink-0">
        {value > 0 ? `+${value}` : value !== 0 ? value : ''}
      </span>
      <div className="relative w-full flex justify-center flex-1" style={{ minHeight: 80 }}>
        <div className="relative w-4 h-full bg-white/8 rounded-full overflow-visible flex items-center">
          {/* Ligne zéro */}
          <div className="absolute left-0 right-0 h-px bg-white/20 z-10" style={{ top: '50%' }} />
          {/* Rempli positif */}
          {value > 0 && (
            <div className="absolute left-0 right-0 rounded-t-full transition-all duration-150"
              style={{ background: band.color, opacity: 0.8, bottom: '50%', height: `${(value/12)*50}%` }} />
          )}
          {/* Rempli négatif */}
          {value < 0 && (
            <div className="absolute left-0 right-0 rounded-b-full transition-all duration-150"
              style={{ background: band.color, opacity: 0.5, top: '50%', height: `${(Math.abs(value)/12)*50}%` }} />
          )}
          {/* Curseur */}
          <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/80 bg-zinc-900 z-20 shadow transition-all duration-150"
            style={{ top: `calc(50% - ${(value/12)*50}% - 7px)` }} />
          {/* Input vertical invisible */}
          <input 
            type="range" 
            min="-12" 
            max="12" 
            step="1" 
            value={value}
            onChange={e => setEqBand(idx, parseInt(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ 
              writingMode: 'vertical-lr', 
              direction: 'rtl', 
              width: '100%', 
              height: '100%' 
            }}
          />
        </div>
      </div>
      <span className="text-[8px] text-white/30 shrink-0">{band.label}</span>
    </div>
  );

  // ── Panel EQ ──
  const EQContent = () => (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1.5">
          <Sliders size={12} className="text-blue-400"/> 10 bandes
        </p>
        <button onClick={resetEQ}
          className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition">
          <RotateCcw size={10}/> Reset
        </button>
      </div>
      {/* Préréglages */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.keys(EQ_PRESETS).map(name => (
          <button key={name} onClick={() => applyPreset(name)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition
              ${activePreset === name ? 'bg-blue-500 text-white' : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white'}`}>
            {name}
          </button>
        ))}
      </div>
      {/* 10 barres verticales */}
      <div className="flex gap-1 w-full" style={{ height: 160 }}>
        {EQ_BANDS.map((band, idx) => (
          <EQBar key={band.hz} band={band} idx={idx} value={eqGains[idx]} />
        ))}
      </div>
      {/* Vitesse */}
      <div className="border-t border-white/8 pt-3 space-y-3">
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-2 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Gauge size={10}/> Vitesse</span>
            <span>{playbackRate}×</span>
          </div>
          <div className="relative h-1.5 bg-white/10 rounded-full group">
            <div className="absolute top-0 left-0 h-full bg-purple-500/70 rounded-full"
              style={{ width: `${((playbackRate-0.5)/1.5)*100}%` }} />
            <input type="range" min="0.5" max="2" step="0.25" value={playbackRate}
              onChange={e => setPlaybackRate(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex justify-between text-[9px] text-white/15 mt-1">
            {['0.5×','1×','1.5×','2×'].map(v => <span key={v}>{v}</span>)}
          </div>
        </div>
        {/* Minuterie */}
        <div>
          <div className="flex justify-between text-[10px] text-white/40 mb-2 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Timer size={10}/> Minuterie</span>
            {sleepRemaining && <span className="text-green-400">{Math.floor(sleepRemaining/60)}:{String(sleepRemaining%60).padStart(2,'0')}</span>}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0,15,30,45,60].map(m => (
              <button key={m} onClick={() => setSleepTimer(m)}
                className={`py-1.5 rounded-xl text-[10px] font-bold transition
                  ${sleepTimer===m?'bg-blue-500 text-white':'bg-white/8 text-white/35 hover:bg-white/15'}`}>
                {m===0?'Off':`${m}'`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Panel Queue ──
  const QueueContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/8">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
          <ListMusic size={12} className="text-violet-400"/> File d'attente
          <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-white/40">{queue.length}</span>
        </p>
        {queue.length > 0 && (
          <button onClick={() => setQueue([])}
            className="text-[10px] text-white/25 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-500/10">
            Vider
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {queue.length === 0 ? (
          <div className="text-center py-10 text-white/20">
            <ListMusic size={28} className="mx-auto mb-2 opacity-30"/>
            <p className="text-sm">File vide</p>
          </div>
        ) : queue.map((s, i) => (
          <div key={`${s._id}-${i}`} draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl group transition cursor-grab active:cursor-grabbing
              ${dragOver === i ? 'bg-violet-500/20 ring-1 ring-violet-500/40' : 'bg-white/5 hover:bg-white/10'}`}>
            <GripVertical size={13} className="text-white/15 group-hover:text-white/35 shrink-0 transition"/>
            <img src={s.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt=""/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white/80">{s.titre}</p>
              <p className="text-[10px] text-white/30 truncate">{s.artiste}</p>
            </div>
            <button onClick={() => setQueue(prev => prev.filter((_,idx) => idx!==i))}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition text-white/25 hover:text-red-400 shrink-0">
              <X size={11}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const API = import.meta.env.VITE_API_URL;

  // Ref pour suivre les buckets déjà envoyés
  const sentBuckets = useRef(new Set());

  useEffect(() => {
    if (!currentSong || !duration) return;
    const bucketIndex = Math.floor((currentTime / duration) * 20); // 0-19
    if (bucketIndex >= 0 && bucketIndex < 20 && !sentBuckets.current.has(bucketIndex)) {
      sentBuckets.current.add(bucketIndex);
      fetch(`${API}/songs/${currentSong._id}/retention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: bucketIndex,
          totalTime: Math.round(currentTime),
          completed: currentTime / duration > 0.9,
          deviceId: localStorage.getItem('moozik_device_id') || '',
        }),
      }).catch(() => {});
    }
  }, [Math.floor(currentTime / 5)]); // vérifier toutes les 5 secondes

  // Reset quand la chanson change
  useEffect(() => { sentBuckets.current.clear(); }, [currentSong?._id]);


  return (
    <div className="fixed inset-0 z-[200] flex flex-col md:flex-row overflow-hidden select-none">

      {/* ══ FOND AMBIANT ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {currentSong?.image && (
          <img src={currentSong.image}
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50" alt=""/>
        )}
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/75 via-zinc-950/65 to-zinc-950/95"/>
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/40 via-transparent to-zinc-950/40"/>
      </div>

      {/* ══ COLONNE PRINCIPALE ══ */}
      <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Visualizer ultra-fin */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full z-10 pointer-events-none"
          style={{ height: 3, opacity: 0.85 }} width="1000" height="6"/>

        {/* ── Header avec boutons EQ/Queue ── */}
        <div className="flex items-center justify-between px-5 pt-12 pb-3 md:pt-6 shrink-0 z-10">
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur transition active:scale-90">
            <ChevronDown size={20} className="text-white"/>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35">Lecture en cours</p>
          </div>
          {/* EQ + Queue en haut à droite */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setActiveTab(t => t === 'eq' ? 'player' : 'eq')}
              title="Égaliseur"
              className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90
                ${activeTab === 'eq' ? 'bg-blue-500/25 text-blue-400 ring-1 ring-blue-500/40' : 'bg-white/10 hover:bg-white/18 text-white/55'}`}>
              <Sliders size={16}/>
            </button>
            <button onClick={() => setActiveTab(t => t === 'queue' ? 'player' : 'queue')}
              title="File d'attente"
              className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition active:scale-90
                ${activeTab === 'queue' ? 'bg-violet-500/25 text-violet-400 ring-1 ring-violet-500/40' : 'bg-white/10 hover:bg-white/18 text-white/55'}`}>
              <ListMusic size={16}/>
            </button>
          </div>
        </div>

        {/* ── CONTENU SELON TAB ── */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">

          {/* ── VUE PLAYER ── */}
          {activeTab === 'player' && (
            <div className="flex flex-col flex-1">
              {/* Cover */}
              <div className="flex items-center justify-center px-8 py-20 shrink-0">
                <div className="relative w-full max-w-60 md:max-w-70 aspect-square">
                  {currentSong?.image && (
                    <div className="absolute inset-3 rounded-3xl blur-2xl opacity-55 scale-95"
                      style={{ backgroundImage: `url(${currentSong.image})`, backgroundSize: 'cover' }}/>
                  )}
                  <img src={currentSong?.image} alt={currentSong?.titre}
                    className={`relative w-full h-full rounded-3xl object-cover shadow-2xl transition-all duration-700
                      ${isPlaying ? 'scale-100' : 'scale-88 opacity-70'}`}/>
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-white/15 animate-pulse pointer-events-none"/>
                  )}
                </div>
              </div>

              {/* Titre + Like */}
              <div className="flex items-center px-6 py-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-white truncate leading-tight">{currentSong?.titre}</h2>
                  <p className="text-sm text-white/45 mt-0.5 truncate font-medium">{currentSong?.artiste}</p>
                </div>
                <button onClick={() => toggleLike(currentSong?._id)} className="ml-4 p-2 shrink-0 active:scale-90 transition">
                  <Heart size={22} fill={currentSong?.liked?'#ef4444':'none'}
                    className={currentSong?.liked?'text-red-500':'text-white/35 hover:text-white/60 transition'}/>
                </button>
                
              </div>

              {/* Progression */}
              <div className="px-6 py-1 shrink-0">
                <div className="relative h-1.5 bg-white/12 rounded-full cursor-pointer group"
                  onClick={seek} onTouchMove={seekTouch}>
                  <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${prog}%` }}/>
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
                <button onClick={() => setShowParty(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-[11px] font-bold transition active:scale-90">
                  <Radio size={14} /> Party
                </button>
                {showParty && (
                  <ListenPartyModal
                    token={token} isLoggedIn={isLoggedIn}
                    currentSong={currentSong} setCurrentSong={setCurrentSong}
                    setIsPlaying={setIsPlaying} isPlaying={isPlaying}
                    onClose={() => setShowParty(false)}
                  />
                )}
                <button onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2.5 rounded-full transition active:scale-90
                    ${isShuffle?'bg-blue-500/20 text-blue-400':'text-white/35 hover:text-white'}`}>
                  <Shuffle size={20}/>
                </button>
                <button onClick={handlePrev} className="p-2 text-white hover:text-white/70 transition active:scale-90">
                  <SkipBack size={26} fill="white"/>
                </button>
                {/* Play/Pause — anneau gradient animé */}
                <button onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
                  className="relative flex items-center justify-center w-17 h-17 active:scale-95 transition" style={{ width: 68, height: 68 }}>
                  <div className="absolute inset-0 rounded-full"
                    style={{ background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #3b82f6, #6366f1)', padding: '2.5px' }}>
                    <div className="w-full h-full rounded-full bg-zinc-950"/>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-white/10">
                    {isPlaying ? <Pause fill="white" size={21}/> : <Play fill="white" size={21} className="ml-0.5"/>}
                  </div>
                </button>
                <button onClick={handleNext} className="p-2 text-white hover:text-white/70 transition active:scale-90">
                  <SkipForward size={26} fill="white"/>
                </button>
                <button onClick={() => setRepeatMode(m => (m+1)%3)}
                  className={`p-2.5 rounded-full transition active:scale-90
                    ${repeatMode>0?'bg-blue-500/20 text-blue-400':'text-white/35 hover:text-white'}`}>
                  {repeatMode===2?<Repeat1 size={20}/>:<Repeat size={20}/>}
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


              
            </div>
          )}
          {currentSong && activeTab === 'player' && (
            <div className="px-4 pb-4">
              <LyricsDisplay songId={currentSong._id} currentTime={currentTime} isPlaying={isPlaying} />
              <LyricsEditor
                songId={currentSong._id}
                songTitre={currentSong.titre}
                token={token}
                canEdit={isAdmin || (isArtist && String(currentSong.artisteId?._id || currentSong.artisteId) === String(userArtistId))}
              />
            </div>
          )}

          {/* ── VUE EQ mobile ── */}
          {activeTab === 'eq' && <EQContent/>}

          {/* ── VUE QUEUE mobile ── */}
          {activeTab === 'queue' && <QueueContent/>}

          
        </div>
      </div>

      {/* ══ COLONNE DROITE desktop ══ */}
      <div className="relative hidden md:flex w-85 lg:w-100 flex-col border-l border-white/8 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"/>
        <div className="relative flex flex-col h-full">
          <div className="flex border-b border-white/8 shrink-0">
            {[['eq',<Sliders size={13}/>,'Égaliseur'],['queue',<ListMusic size={13}/>,`File (${queue.length})`]].map(([key,icon,label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-[11px] font-bold uppercase tracking-wide transition
                  ${activeTab===key?'text-white border-b-2 border-blue-400':'text-white/30 hover:text-white/55'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'queue' ? <QueueContent/> : <div className="overflow-y-auto flex-1 pt-3"><EQContent/></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPlayerPage;