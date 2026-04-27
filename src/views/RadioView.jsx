/**
 * RadioView.jsx — Page Radio IA MOOZIK
 *
 * Fonctionnalités :
 *  - Choix de l'ambiance (mood) ou titre de départ
 *  - Démarrage de session via POST /radio/start
 *  - Lecture en continu avec GET /radio/:sessionId/next
 *  - Like / Skip avec feedback visuel
 *  - Commentaires DJ IA entre les titres
 *  - Timer de sommeil + affichage file d'attente
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, Play, Pause, SkipForward, Heart, X,
  Sparkles, Shuffle, Volume2, ChevronRight,
  Mic2, Zap, WifiOff, RefreshCw, StopCircle,
} from 'lucide-react';
import { API } from '../config/api';

// ════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════

const MOODS = [
  { id: 'chill',     label: 'Chill',     icon: '🌊', color: 'from-sky-600/30 to-sky-900/20',       border: 'border-sky-500/40',    text: 'text-sky-300'      },
  { id: 'energie',   label: 'Énergie',   icon: '⚡', color: 'from-yellow-600/30 to-yellow-900/20', border: 'border-yellow-500/40', text: 'text-yellow-300'   },
  { id: 'focus',     label: 'Focus',     icon: '🎯', color: 'from-violet-600/30 to-violet-900/20', border: 'border-violet-500/40', text: 'text-violet-300'   },
  { id: 'fete',      label: 'Fête',      icon: '🎉', color: 'from-pink-600/30 to-pink-900/20',     border: 'border-pink-500/40',   text: 'text-pink-300'     },
  { id: 'nostalgie', label: 'Nostalgie', icon: '🌅', color: 'from-amber-600/30 to-amber-900/20',   border: 'border-amber-500/40',  text: 'text-amber-300'    },
  { id: 'romance',   label: 'Romance',   icon: '💕', color: 'from-rose-600/30 to-rose-900/20',     border: 'border-rose-500/40',   text: 'text-rose-300'     },
  { id: 'gospel',    label: 'Gospel',    icon: '✝️',  color: 'from-emerald-600/30 to-emerald-900/20', border: 'border-emerald-500/40', text: 'text-emerald-300' },
  { id: 'surprise',  label: 'Surprise',  icon: '🎲', color: 'from-purple-600/30 to-purple-900/20', border: 'border-purple-500/40', text: 'text-purple-300'   },
];

// ════════════════════════════════════════════
// SOUS-COMPOSANTS
// ════════════════════════════════════════════

/** Visualiseur de barres animées style "en train de jouer" */
const WaveVisualizer = ({ isPlaying, color = '#ef4444' }) => (
  <div className="flex items-end gap-0.5 h-5" aria-hidden="true">
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-0.5 rounded-full transition-all duration-150 ${isPlaying ? 'animate-bounce' : ''}`}
        style={{
          height:          isPlaying ? `${(i % 3 + 1) * 5}px` : '3px',
          backgroundColor: color,
          animationDelay:  `${i * 0.12}s`,
          animationDuration: '0.8s',
        }}
      />
    ))}
  </div>
);

/** Badge animé "DJ parle" */
const DJBubble = ({ comment, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [comment, onDismiss]);

  if (!comment) return null;
  return (
    <div className="flex items-start gap-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
        <Mic2 size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-0.5">DJ MOOZIK IA</p>
        <p className="text-sm text-zinc-200 leading-relaxed italic">"{comment}"</p>
      </div>
      <button onClick={onDismiss} className="text-zinc-600 hover:text-zinc-400 transition shrink-0 p-1">
        <X size={12} />
      </button>
    </div>
  );
};

/** Card d'une piste dans la mini-file */
const QueueItem = ({ song, index }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition group">
    <span className="text-[10px] text-zinc-700 font-mono w-4 shrink-0 text-right">{index + 1}</span>
    <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold truncate text-zinc-200">{song.titre}</p>
      <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
    </div>
  </div>
);

// ════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════

const RadioView = ({
  token,
  currentSong,
  setCurrentSong,
  isPlaying,
  setIsPlaying,
  musiques = [],
  onClose,
}) => {
  // ── État radio ────────────────────────────────────────────
  const [phase, setPhase]             = useState('setup');   // 'setup' | 'active'
  const [sessionId, setSessionId]     = useState(null);
  const [radioName, setRadioName]     = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);   // titre de départ
  const [suggestions, setSuggestions]   = useState({ topSongs: [], recent: [], forYou: [] });
  const [queue, setQueue]             = useState([]);
  const [songsPlayed, setSongsPlayed] = useState(0);
  const [djIntro, setDjIntro]         = useState(null);
  const [djComment, setDjComment]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [error, setError]             = useState(null);
  const [showQueue, setShowQueue]     = useState(false);
  const [likedIds, setLikedIds]       = useState(new Set());
  const sessionRef = useRef(null);

  // ── Charger les suggestions au montage ───────────────────
  useEffect(() => {
    fetch(`${API}/radio/config/suggestions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : {})
      .then(d => setSuggestions({
        topSongs: d.topSongs || [],
        recent:   d.recent   || [],
        forYou:   d.forYou   || [],
      }))
      .catch(() => {});
  }, [token]);

  // ── Nettoyage à l'unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        fetch(`${API}/radio/${sessionRef.current}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => {});
      }
    };
  }, [token]);

  // ── Démarrer une session ──────────────────────────────────
  const startRadio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/radio/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mood:       selectedMood,
          seedSongId: selectedSeed?._id || null,
          djEnabled:  true,
        }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setSessionId(data.sessionId);
      sessionRef.current = data.sessionId;
      setRadioName(data.name);
      setQueue(data.queue || []);
      setDjIntro(data.djIntro);
      setSongsPlayed(0);

      // Lancer la lecture du titre de départ
      if (data.seedSong) {
        setCurrentSong(data.seedSong);
        setIsPlaying(true);
      }
      setPhase('active');
    } catch (e) {
      setError("Impossible de démarrer la radio. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [selectedMood, selectedSeed, token, setCurrentSong, setIsPlaying]);

  // ── Titre suivant ─────────────────────────────────────────
  const playNext = useCallback(async (isSkip = false) => {
    if (!sessionId || loadingNext) return;
    setLoadingNext(true);

    // Skip côté serveur si nécessaire
    if (isSkip && currentSong) {
      fetch(`${API}/radio/${sessionId}/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ songId: currentSong._id }),
      }).catch(() => {});
    }

    try {
      const res = await fetch(`${API}/radio/${sessionId}/next`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 204) {
        setError("Plus de titres disponibles pour cette session.");
        setLoadingNext(false);
        return;
      }
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setCurrentSong(data.song);
      setIsPlaying(true);
      setQueue(prev => prev.filter(s => String(s._id) !== String(data.song._id)));
      setSongsPlayed(data.songsPlayed || 0);
      if (data.djComment) setDjComment(data.djComment);
    } catch {
      setError("Erreur lors du chargement du titre suivant.");
    } finally {
      setLoadingNext(false);
    }
  }, [sessionId, currentSong, loadingNext, token, setCurrentSong, setIsPlaying]);

  // ── Like ─────────────────────────────────────────────────
  const likeCurrent = useCallback(async () => {
    if (!sessionId || !currentSong) return;
    const id = String(currentSong._id);
    setLikedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    if (!likedIds.has(id)) {
      fetch(`${API}/radio/${sessionId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ songId: id }),
      }).catch(() => {});
    }
  }, [sessionId, currentSong, likedIds, token]);

  // ── Arrêter la radio ──────────────────────────────────────
  const stopRadio = useCallback(() => {
    if (sessionId) {
      fetch(`${API}/radio/${sessionId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
      sessionRef.current = null;
    }
    setPhase('setup');
    setSessionId(null);
    setQueue([]);
    setDjIntro(null);
    setDjComment(null);
    setSongsPlayed(0);
    setLikedIds(new Set());
    setIsPlaying(false);
  }, [sessionId, token, setIsPlaying]);

  const isLiked = currentSong && likedIds.has(String(currentSong._id));

  // ════════════════════════════════════════════
  // RENDER — PHASE SETUP
  // ════════════════════════════════════════════
  if (phase === 'setup') {
    const suggestionList = [
      ...suggestions.forYou.slice(0, 3),
      ...suggestions.topSongs.slice(0, 3),
      ...suggestions.recent.slice(0, 3),
    ].filter((s, i, a) => a.findIndex(x => String(x._id) === String(s._id)) === i).slice(0, 6);

    return (
      <div className="flex flex-col gap-8 max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Radio size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white">Radio IA</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Propulsée par Claude</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Moods */}
        <section>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Choisir une ambiance</p>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(prev => prev === m.id ? null : m.id)}
                className={`relative overflow-hidden rounded-2xl p-3 border transition-all duration-200 flex flex-col items-center gap-1.5 ${
                  selectedMood === m.id
                    ? `bg-gradient-to-br ${m.color} ${m.border} scale-[0.97] shadow-lg`
                    : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15'
                }`}
              >
                <span className="text-xl leading-none">{m.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-wide ${selectedMood === m.id ? m.text : 'text-zinc-500'}`}>
                  {m.label}
                </span>
                {selectedMood === m.id && (
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Titre de départ */}
        {suggestionList.length > 0 && (
          <section>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Ou démarrer depuis un titre</p>
            <div className="flex flex-col gap-1">
              {suggestionList.map(song => (
                <button
                  key={song._id}
                  onClick={() => setSelectedSeed(prev => prev?._id === song._id ? null : song)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                    selectedSeed?._id === song._id
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/3 border-white/8 hover:bg-white/6'
                  }`}
                >
                  <img src={song.image} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-zinc-200">{song.titre}</p>
                    <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
                  </div>
                  {selectedSeed?._id === song._id && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <Zap size={10} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>
        )}

        {/* Bouton Lancer */}
        <button
          onClick={startRadio}
          disabled={loading || (!selectedMood && !selectedSeed)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              L'IA compose votre radio…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Lancer la Radio IA
              <ChevronRight size={16} />
            </>
          )}
        </button>

        {(!selectedMood && !selectedSeed) && (
          <p className="text-center text-[11px] text-zinc-600">Choisissez une ambiance ou un titre pour continuer</p>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════
  // RENDER — PHASE ACTIVE
  // ════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">

      {/* Header radio active */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 relative">
            <Radio size={18} className="text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-950 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-white truncate">{radioName}</h1>
            <p className="text-[10px] text-zinc-500">{songsPlayed} titre{songsPlayed > 1 ? 's' : ''} joué{songsPlayed > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQueue(q => !q)}
            className={`p-2 rounded-xl transition text-xs font-bold border ${showQueue ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'}`}
          >
            File ({queue.length})
          </button>
          <button onClick={stopRadio} className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-500 hover:text-red-400" title="Arrêter la radio">
            <StopCircle size={16} />
          </button>
        </div>
      </div>

      {/* Intro DJ */}
      {djIntro && (
        <DJBubble comment={djIntro} onDismiss={() => setDjIntro(null)} />
      )}

      {/* Titre en cours */}
      {currentSong && (
        <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-zinc-800/50">
          {/* Fond flou */}
          <div className="absolute inset-0">
            <img src={currentSong.image} className="w-full h-full object-cover blur-2xl scale-110 opacity-20" alt="" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-zinc-950/40" />

          <div className="relative p-6 flex flex-col items-center gap-5">
            {/* Pochette */}
            <div className="relative group">
              <img
                src={currentSong.image}
                className={`w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover shadow-2xl border border-white/10 transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95 opacity-70'}`}
                alt=""
              />
              <div className="absolute bottom-3 right-3">
                <WaveVisualizer isPlaying={isPlaying} />
              </div>
            </div>

            {/* Infos */}
            <div className="text-center min-w-0 w-full">
              <h2 className="text-xl font-black text-white truncate">{currentSong.titre}</h2>
              <p className="text-sm text-zinc-400 uppercase tracking-wide truncate mt-1">{currentSong.artiste}</p>
              {currentSong.moods?.length > 0 && (
                <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
                  {currentSong.moods.slice(0, 3).map(m => (
                    <span key={m} className="text-[9px] font-bold bg-white/8 border border-white/10 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contrôles */}
            <div className="flex items-center gap-4">
              {/* Like */}
              <button
                onClick={likeCurrent}
                className={`p-3 rounded-2xl border transition-all ${isLiked ? 'bg-red-500/15 border-red-500/40 text-red-400 scale-110' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-red-400 hover:border-red-500/30'}`}
              >
                <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause fill="white" size={24} /> : <Play fill="white" size={24} className="ml-1" />}
              </button>

              {/* Suivant */}
              <button
                onClick={() => playNext(true)}
                disabled={loadingNext}
                className="p-3 rounded-2xl border bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
              >
                {loadingNext ? <RefreshCw size={18} className="animate-spin" /> : <SkipForward size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commentaire DJ entre titres */}
      {djComment && (
        <DJBubble comment={djComment} onDismiss={() => setDjComment(null)} />
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <WifiOff size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => { setError(null); playNext(false); }} className="ml-auto text-xs text-red-400 hover:text-red-300 font-bold shrink-0">
            Réessayer
          </button>
        </div>
      )}

      {/* Mini file d'attente */}
      {showQueue && queue.length > 0 && (
        <section>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
            À venir · {queue.length} titre{queue.length > 1 ? 's' : ''}
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
            {queue.slice(0, 6).map((song, i) => (
              <QueueItem key={song._id} song={song} index={i} />
            ))}
            {queue.length > 6 && (
              <p className="text-center text-[10px] text-zinc-700 py-2 border-t border-zinc-800/50">
                + {queue.length - 6} autres titres
              </p>
            )}
          </div>
        </section>
      )}

      {/* Bouton Modifier la session */}
      <button
        onClick={stopRadio}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-xs font-bold transition"
      >
        <Shuffle size={13} />
        Changer d'ambiance
      </button>
    </div>
  );
};

export default RadioView;