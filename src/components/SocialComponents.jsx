import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame, TrendingUp, Play, Pause, ChevronRight, Trophy,
  Medal, Award, Star, Zap, Plus, Crown, Users, MessageCircle,
  Send, X, Copy, Check, Loader2, Clock, Heart, Share2,
  Music, Eye, Radio, Volume2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://moozik-gft1.onrender.com';

// ════════════════════════════════════════════
// TrendingView — Classement en temps réel
// ════════════════════════════════════════════
export const TrendingView = ({ setCurrentSong, setIsPlaying, currentSong, isPlaying, token }) => {
  const [tab, setTab]       = useState('songs');
  const [chart, setChart]   = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [fanBadges, setFanBadges] = useState({});
  const [loading, setLoading] = useState(true);

  // fetch(`${API}/charts/songs`).then(r => r.json()).then(console.log)


  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/charts/${tab}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/challenges`).then(r => r.ok ? r.json() : []),
    ]).then(([c, ch]) => {
      setChart(c); setChallenges(Array.isArray(ch) ? ch : []);
    }).finally(() => setLoading(false));
  }, [tab]);

  const rankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-zinc-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-zinc-600';
  };

  const changeIcon = (change) => {
    if (change > 0) return <span className="text-[9px] text-green-400 font-bold">▲{change}</span>;
    if (change < 0) return <span className="text-[9px] text-red-400 font-bold">▼{Math.abs(change)}</span>;
    return <span className="text-[9px] text-zinc-600">—</span>;
  };

  // console.log(entry);
  

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-600/20 rounded-2xl flex items-center justify-center">
          <Flame size={18} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black">Trending</h1>
          <p className="text-xs text-zinc-500">Mis à jour chaque heure · Score basé sur la vélocité</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50">
        {[['songs','🔥 Titres'],['new','✨ Nouveautés'],['artists','🎤 Artistes'],['viral','📈 Viral']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab===k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Challenges actifs */}
      {challenges.length > 0 && (
        <div className="space-y-2">
          {challenges.map(ch => (
            <div key={ch._id} className="bg-gradient-to-r from-purple-900/30 to-zinc-900/40 border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm">{ch.hashtag}</p>
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">CHALLENGE</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{ch.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-purple-300">{ch.entries} participants</p>
                  <p className="text-[10px] text-zinc-600">
                    {new Date(ch.endsAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                  </p>
                </div>
              </div>
              {ch.prize && <p className="text-[10px] text-yellow-400 mt-2 flex items-center gap-1"><Star size={9}/> Prix : {ch.prize}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Liste classement */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : !chart?.entries?.length ? (
        <div className="text-center py-16 text-zinc-600">
          <Flame size={36} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="space-y-2">
          {chart.entries.map((entry, i) => {
            const song     = entry.songId;
            const artist   = entry.artistId;
            const isActive = song && currentSong?._id === String(song._id || song);
            return (
              <div key={i}
                onClick={() => song && (setCurrentSong(song), setIsPlaying(true))}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition ${isActive ? 'bg-red-600/10 border border-red-600/20' : 'bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent'}`}>
                {/* Rang */}
                <div className="w-8 text-right shrink-0">
                  <span className={`font-black text-lg tabular-nums ${rankColor(entry.rank)}`}>{entry.rank}</span>
                </div>
                {/* Image */}
                <div className="relative shrink-0">
                  <img src={song?.image || artist?.image || '/icon-192.png'} className="w-11 h-11 rounded-xl object-cover" alt="" />
                  {isActive && isPlaying && (
                    <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                      <Pause fill="white" size={14} />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>
                    {song?.titre || artist?.nom || 'Inconnu'}
                    {entry.isNew && <span className="ml-1.5 text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate uppercase">{song?.artiste || 'Artiste'}</p>
                </div>
                {/* Score + change */}
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <TrendingUp size={9} className="text-green-500" />
                    {Math.round(entry.score).toLocaleString()}
                  </div>
                  {changeIcon(entry.change)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// StoriesBar — Barre de stories (style Instagram)
// ════════════════════════════════════════════
export const StoriesBar = ({ token, isLoggedIn, onArtistClick }) => {
  const [feed, setFeed]       = useState([]);
  const [active, setActive]   = useState(null); // { artistEntry, storyIndex }
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/stories/feed`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : []).then(d => setFeed(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  const openStory = (artistEntry, storyIndex = 0) => {
    setActive({ artistEntry, storyIndex });
    setProgress(0);
  };

  const closeStory = () => {
    clearInterval(timerRef.current);
    setActive(null); setProgress(0);
  };

  const nextStory = useCallback(() => {
    if (!active) return;
    const { artistEntry, storyIndex } = active;
    if (storyIndex < artistEntry.stories.length - 1) {
      setActive({ artistEntry, storyIndex: storyIndex + 1 });
      setProgress(0);
    } else {
      // Artiste suivant
      const nextArtistIdx = feed.findIndex(f => f.artist._id === artistEntry.artist._id) + 1;
      if (nextArtistIdx < feed.length) openStory(feed[nextArtistIdx], 0);
      else closeStory();
    }
  }, [active, feed]);

  // Timer progression story
  useEffect(() => {
    if (!active) return;
    const story = active.artistEntry.stories[active.storyIndex];
    const dur   = (story?.duration || 5) * 1000;
    const step  = 100;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { nextStory(); return 0; }
        return p + (step / dur) * 100;
      });
    }, step);
    // Marquer comme vue
    if (story?._id) fetch(`${API}/stories/${story._id}/view`, { method: 'PUT', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
    return () => clearInterval(timerRef.current);
  }, [active]);

  if (!feed.length) return null;

  const currentStory = active ? active.artistEntry.stories[active.storyIndex] : null;

  return (
    <>
      {/* Barre de bulles */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
        {feed.map(entry => {
          const hasUnviewed = entry.stories.some(s => !s.viewed);
          return (
            <button key={entry.artist._id} onClick={() => openStory(entry)} className="shrink-0 flex flex-col items-center gap-1.5">
              <div className={`w-14 h-14 rounded-full p-0.5 ${hasUnviewed ? 'bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500' : 'bg-zinc-700'}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border-2 border-zinc-900">
                  {entry.artist.image
                    ? <img src={entry.artist.image} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-lg font-black text-zinc-500">{entry.artist.nom[0]}</div>}
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 truncate w-14 text-center">{entry.artist.nom.split(' ')[0]}</p>
            </button>
          );
        })}
      </div>

      {/* Visionneuse plein écran */}
      {active && currentStory && (
        <div className="fixed inset-0 bg-black z-[500] flex items-center justify-center" onClick={nextStory}>
          {/* Barres de progression */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {active.artistEntry.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-none"
                  style={{ width: i < active.storyIndex ? '100%' : i === active.storyIndex ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>

          {/* Header artiste */}
          <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-10 mt-4">
            <img src={active.artistEntry.artist.image} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
            <p className="text-sm font-bold text-white">{active.artistEntry.artist.nom}</p>
            <p className="text-[10px] text-white/60 ml-auto">
              {new Date(currentStory.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button onClick={e => { e.stopPropagation(); closeStory(); }} className="ml-2 text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Contenu */}
          <div className="w-full max-w-sm mx-auto h-full flex items-center justify-center">
            {currentStory.type === 'image' && (
              <img src={currentStory.mediaUrl} className="max-h-[80vh] max-w-full object-contain rounded-xl" alt="" />
            )}
            {currentStory.type === 'audio' && (
              <div className="bg-zinc-900/80 rounded-2xl p-8 text-center space-y-4">
                <img src={active.artistEntry.artist.image} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-red-500/40" alt="" />
                <p className="font-bold">{active.artistEntry.artist.nom}</p>
                <div className="flex items-center justify-center gap-2 text-zinc-400">
                  <Volume2 size={16} /> <span className="text-sm">Extrait audio</span>
                </div>
                <audio src={currentStory.mediaUrl} autoPlay className="hidden" />
              </div>
            )}
            {currentStory.type === 'text' && (
              <div className="bg-gradient-to-br from-red-900/50 to-zinc-900 rounded-2xl p-8 text-center">
                <p className="text-xl font-black text-white">{currentStory.caption}</p>
              </div>
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && currentStory.type !== 'text' && (
            <div className="absolute bottom-8 left-4 right-4 z-10">
              <p className="text-sm text-white bg-black/40 backdrop-blur px-3 py-2 rounded-xl">{currentStory.caption}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ════════════════════════════════════════════
// ListenPartyModal — Écoute collaborative
// ════════════════════════════════════════════
export const ListenPartyModal = ({ token, isLoggedIn, currentSong, setCurrentSong, setIsPlaying, isPlaying, onClose }) => {
  const [mode, setMode]       = useState('menu'); // menu | create | join | party
  const [code, setCode]       = useState('');
  const [party, setParty]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const pollRef = useRef(null);
  const isHost  = party && token && party.hostId?._id && String(party.hostId._id) === String(party.hostId._id); // simplifié

  const h = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const createParty = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/listen-party`, { method: 'POST', headers: h, body: JSON.stringify({ songId: currentSong?._id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setParty(data); setMessages(data.messages || []); setMode('party');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const joinParty = async () => {
    setLoading(true); setError('');
    try {
      const joinRes = await fetch(`${API}/listen-party/${code.toUpperCase()}/join`, { method: 'POST', headers: h });
      if (!joinRes.ok) { const d = await joinRes.json(); throw new Error(d.message); }
      const getRes  = await fetch(`${API}/listen-party/${code.toUpperCase()}`);
      const data    = await getRes.json();
      setParty(data); setMessages(data.messages || []);
      if (data.songId) { setCurrentSong(data.songId); setIsPlaying(data.isPlaying); }
      setMode('party');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // Polling toutes les 3s pour les messages et la synchro
  useEffect(() => {
    if (mode !== 'party' || !party?.code) return;
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/listen-party/${party.code}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages.slice(-50));
        if (data.songId && String(data.songId._id || data.songId) !== String(currentSong?._id)) {
          setCurrentSong(data.songId); setIsPlaying(data.isPlaying);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [mode, party?.code]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    await fetch(`${API}/listen-party/${party.code}/message`, { method: 'POST', headers: h, body: JSON.stringify({ text: newMsg }) });
    setNewMsg('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(party.code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const leaveParty = async () => {
    await fetch(`${API}/listen-party/${party.code}`, { method: 'DELETE', headers: h });
    setParty(null); setMode('menu');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Radio size={15} className="text-blue-400" />
            </div>
            <h3 className="font-black text-sm">Listen Party</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Menu */}
          {mode === 'menu' && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 text-center mb-4">Écoutez en même temps que vos amis avec chat en direct</p>
              {!isLoggedIn && <p className="text-xs text-orange-400 text-center">Connectez-vous pour créer ou rejoindre une party</p>}
              <button onClick={() => setMode('create')} disabled={!isLoggedIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-40">
                <Plus size={15} /> Créer une party
              </button>
              <button onClick={() => setMode('join')} disabled={!isLoggedIn}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-40">
                <Users size={15} /> Rejoindre avec un code
              </button>
            </div>
          )}

          {/* Créer */}
          {mode === 'create' && (
            <div className="space-y-4">
              {currentSong && (
                <div className="flex items-center gap-3 bg-zinc-800/40 rounded-xl p-3">
                  <img src={currentSong.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{currentSong.titre}</p>
                    <p className="text-[10px] text-zinc-500">{currentSong.artiste}</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-zinc-500 text-center">Une party expire automatiquement après 4 heures</p>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={createParty} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Radio size={14}/>}
                Lancer la party
              </button>
              <button onClick={() => setMode('menu')} className="w-full text-zinc-500 text-sm py-2">← Retour</button>
            </div>
          )}

          {/* Rejoindre */}
          {mode === 'join' && (
            <div className="space-y-4">
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Code de la party (ex: A3F9B2)"
                maxLength={6}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600 text-center font-mono text-lg tracking-widest" />
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <button onClick={joinParty} disabled={loading || code.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Users size={14}/>}
                Rejoindre
              </button>
              <button onClick={() => setMode('menu')} className="w-full text-zinc-500 text-sm py-2">← Retour</button>
            </div>
          )}

          {/* Party active */}
          {mode === 'party' && party && (
            <div className="flex flex-col h-full space-y-3">
              {/* Code + participants */}
              <div className="bg-zinc-800/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-blue-400" />
                  <span className="text-xs text-zinc-400">{party.participants?.length || 1} participant{(party.participants?.length || 1) > 1 ? 's' : ''}</span>
                </div>
                <button onClick={copyCode} className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition">
                  {copied ? <Check size={11}/> : <Copy size={11}/>}
                  Code : <span className="font-mono">{party.code}</span>
                </button>
              </div>

              {/* Musique en cours */}
              {(party.songId || currentSong) && (() => {
                const s = party.songId || currentSong;
                return (
                  <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-600/20 rounded-xl p-3">
                    <img src={s.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.titre}</p>
                      <p className="text-[10px] text-zinc-500">{s.artiste}</p>
                    </div>
                    <div className="flex gap-0.5 items-end h-4 shrink-0">
                      {isPlaying && [1,2,3].map(i => <div key={i} className="w-0.5 bg-blue-400 rounded-full animate-bounce" style={{height:`${(i%3+1)*4}px`,animationDelay:`${i*0.15}s`}}/>)}
                    </div>
                  </div>
                );
              })()}

              {/* Chat */}
              <div className="flex-1 bg-zinc-800/20 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-4">Soyez le premier à écrire...</p>
                ) : messages.map((m, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-black shrink-0">
                      {m.nom?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-zinc-400">{m.nom} </span>
                      <span className="text-sm text-white">{m.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input message */}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  placeholder="Votre message..."
                  className="flex-1 bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600" />
                <button type="submit" disabled={!newMsg.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition disabled:opacity-40">
                  <Send size={14} />
                </button>
              </form>

              <button onClick={leaveParty} className="w-full text-xs text-red-400 hover:text-red-300 py-2 transition">
                {isHost ? 'Fermer la party' : 'Quitter la party'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// LoyaltyWidget — Points de fidélité
// ════════════════════════════════════════════
export const LoyaltyWidget = ({ token, isLoggedIn }) => {
  const [data, setData]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetch(`${API}/loyalty/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setData(d)).catch(() => {});
    fetch(`${API}/loyalty/leaderboard`)
      .then(r => r.ok ? r.json() : []).then(d => setLeaderboard(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isLoggedIn, token]);

  if (!isLoggedIn || !data) return null;

  const level = data.level || 'bronze';
  const levelColors = { bronze: 'text-amber-600', silver: 'text-zinc-300', gold: 'text-yellow-400', platinum: 'text-cyan-400' };
  const levelEmojis = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  const nextLevel = { bronze: { name: 'silver', min: 100 }, silver: { name: 'gold', min: 500 }, gold: { name: 'platinum', min: 2000 }, platinum: null };
  const next = nextLevel[level];
  const progressPct = next ? Math.min(100, Math.round((data.points / next.min) * 100)) : 100;

  return (
    <div className="space-y-3">
      {/* Badge niveau */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{levelEmojis[level]}</span>
            <div>
              <p className={`text-sm font-black uppercase ${levelColors[level]}`}>{level}</p>
              <p className="text-[10px] text-zinc-500">{data.points?.toLocaleString()} points</p>
            </div>
          </div>
          <button onClick={() => setShowBoard(!showBoard)} className="text-xs text-zinc-500 hover:text-white transition">
            Classement
          </button>
        </div>
        {next && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>{data.points} pts</span>
              <span>{next.min} pts pour {levelEmojis[nextLevel[level].name]} {next.name}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${levelColors[level].replace('text-','bg-')}`} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
        {/* Comment gagner des points */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['🎵','Écouter','+1'],['💬','Commenter','+5'],['↗️','Partager','+3']].map(([e,l,p]) => (
            <div key={l} className="bg-zinc-800/40 rounded-xl p-2">
              <p className="text-base">{e}</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">{l}</p>
              <p className="text-[9px] text-green-400 font-bold">{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {showBoard && leaderboard.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Top fans</p>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <div key={entry._id} className="flex items-center gap-2.5">
                <span className={`text-sm font-black w-5 text-center ${i===0?'text-yellow-400':i===1?'text-zinc-300':i===2?'text-amber-600':'text-zinc-600'}`}>{i+1}</span>
                <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                  {entry.userId?.avatar ? <img src={entry.userId.avatar} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-xs font-black text-zinc-500">{(entry.userId?.nom||'?')[0]}</div>}
                </div>
                <p className="flex-1 text-xs font-bold truncate">{entry.userId?.nom || 'Anonyme'}</p>
                <p className="text-xs font-black text-zinc-400">{entry.points?.toLocaleString()} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};