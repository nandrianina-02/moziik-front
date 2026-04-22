import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Flame, Sparkles, Heart, Compass, TrendingUp, X,
  Play, Pause, Disc3, ChevronRight, Check,
  Users, AlertTriangle, Share2, Clock, WifiOff,
  Star, Radio, Gem, Trophy, Zap, Sun, Bell,
  Section, Plus
} from 'lucide-react';
import SongRow from '../components/music/SongRow';
import GlobalSearchView from './GlobalSearchView';
import { API } from '../config/api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import useSubscription from '../hooks/useSubscription';
import { StoriesBar } from '../components/SocialComponents';
import { AudioAdPlayer } from '../components/MonetisationComponents';

// ════════════════════════════════════════════
// SOUS-COMPOSANTS UTILITAIRES
// ════════════════════════════════════════════

const SectionHeader = ({ icon, title, subtitle, noMargin }) => (
  <div className={`flex items-center gap-2.5 ${noMargin ? '' : 'mb-4'}`}>
    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 shrink-0">{icon}</div>
    <div>
      <h2 className="text-base font-black uppercase tracking-wide leading-tight">{title}</h2>
      {subtitle && <p className="text-[10px] text-zinc-600 leading-none mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const TopTrack = ({ song, rank, isActive, isPlaying, onClick }) => {
  const rankColors = ['text-yellow-400','text-zinc-300','text-amber-600','text-zinc-600','text-zinc-700'];
  return (
    <div onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition-all duration-200 ${isActive ? 'bg-white/8 ring-1 ring-white/10' : 'hover:bg-white/5'}`}>
      <span className={`font-black text-lg w-6 text-right shrink-0 tabular-nums ${rankColors[rank] || 'text-zinc-700'}`}>{rank + 1}</span>
      <div className="relative shrink-0">
        <img src={song.image} className="w-11 h-11 rounded-xl object-cover" alt="" />
        {isActive && isPlaying && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-3">
              {[1,2,3].map(i => <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height:`${(i%3+1)*4}px`, animationDelay:`${i*0.15}s` }}/>)}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-200'}`}>{song.titre}</p>
        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{song.artiste}</p>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <TrendingUp size={10} className="text-green-500"/> {song.plays || 0}
      </div>
    </div>
  );
};

const HorizontalCard = ({ song, isActive, isPlaying, onClick, badge, badgeColor }) => (
  <div onClick={onClick} className="shrink-0 w-28 md:w-32 group cursor-pointer">
    <div className="relative mb-2 aspect-square">
      <img src={song.image} className={`w-full h-full rounded-2xl object-cover shadow-lg transition-all duration-300 ${isActive ? 'ring-2 ring-white/30 scale-[0.98]' : ''}`} alt="" />
      <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 transition ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          {isActive && isPlaying ? <Pause fill="white" size={15}/> : <Play fill="white" size={15} className="ml-0.5"/>}
        </div>
      </div>
      {badge && <span className={`absolute top-2 left-2 ${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide`}>{badge}</span>}
    </div>
    <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
    <p className="text-[10px] text-zinc-600 truncate mt-0.5 uppercase tracking-wide">{song.artiste}</p>
  </div>
);

const DiscoveryCard = ({ song, isActive, isPlaying, onClick }) => (
  <div onClick={onClick} className={`relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-200 aspect-square ${isActive ? 'ring-2 ring-white/25' : ''}`}>
    <img src={song.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
    {isActive && isPlaying ? (
      <div className="absolute top-3 right-3 flex gap-0.5 items-end h-4">
        {[1,2,3].map(i => <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height:`${(i%3+1)*4}px`, animationDelay:`${i*0.15}s`}}/>)}
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play fill="white" size={18} className="ml-0.5"/>
        </div>
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-xs font-bold text-white truncate leading-tight">{song.titre}</p>
      <p className="text-[10px] text-white/55 truncate mt-0.5">{song.artiste}</p>
    </div>
  </div>
);

// ── Bannière alertes admin ──────────────────
const AdminAlertBanner = ({ token, isAdmin }) => {
  const [unassigned, setUnassigned] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;
    fetch(`${API}/admin/unassigned-songs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setUnassigned(d.count || 0)).catch(() => {});
    fetch(`${API}/admin/active-users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setActiveUsers(d.count || 0)).catch(() => {});
  }, [isAdmin, token]);

  if (!isAdmin || dismissed || (unassigned === 0 && activeUsers === 0)) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-orange-300">Alertes administration</p>
        <div className="flex flex-wrap gap-3 mt-1.5">
          {unassigned > 0 && <a href="/admin-library" className="text-[11px] text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full hover:bg-orange-500/20 transition cursor-pointer">{unassigned} musique{unassigned > 1 ? 's' : ''} sans artiste — Cliquer pour corriger</a>}
          {activeUsers > 0 && <span className="text-[11px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>{activeUsers} actif{activeUsers > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="text-zinc-500 hover:text-white shrink-0 p-1">×</button>
    </div>
  );
};

// ── Section partages récents ─────────────────
const RecentSharesSection = ({ token, setCurrentSong, setIsPlaying, currentSong }) => {
  const [shares, setShares] = useState([]);
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/my-shares`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => setShares(Array.isArray(d) ? d.slice(0, 6) : [])).catch(() => {});
  }, [token]);
  if (!shares.length) return null;
  return (
    <section>
      <SectionHeader icon={<Share2 size={18} className="text-blue-400"/>} title="Mes partages récents" subtitle={`${shares.length} lien${shares.length > 1 ? 's' : ''} actif${shares.length > 1 ? 's' : ''}`}/>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {shares.map(share => {
          if (!share.songId) return null;
          const song = share.songId;
          const expired = new Date(share.expiresAt) < new Date();
          return (
            <div key={share._id} onClick={() => { if (!expired) { setCurrentSong(song); setIsPlaying(true); } }}
              className={`shrink-0 w-32 group cursor-pointer ${expired ? 'opacity-40' : ''}`}>
              <div className="relative aspect-square mb-2">
                <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
                {expired && <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center"><span className="text-[9px] text-red-400 font-bold">Expiré</span></div>}
              </div>
              <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
              <p className="text-[10px] text-zinc-600">{share.playCount || 0} écoute{share.playCount !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── Section hors-ligne ───────────────────────
const OfflineSection = ({ musiques, setCurrentSong, setIsPlaying, currentSong, isPlaying, isAudioCached }) => {
  const cached = useMemo(() => musiques.filter(s => isAudioCached && isAudioCached(s._id)), [musiques, isAudioCached]);
  if (!cached.length) return null;
  return (
    <section>
      <SectionHeader icon={<WifiOff size={18} className="text-green-400"/>} title="Disponible hors-ligne" subtitle={`${cached.length} titre${cached.length > 1 ? 's' : ''} téléchargé${cached.length > 1 ? 's' : ''}`}/>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {cached.map(song => (
          <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }} className="shrink-0 w-28 group cursor-pointer">
            <div className="relative aspect-square mb-2">
              <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow"><Check size={10} className="text-white"/></div>
            </div>
            <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
            <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ════════════════════════════════════════════
// HOME VIEW
// ════════════════════════════════════════════
const HomeView = ({
  musiques, currentSong, setCurrentSong, setIsPlaying, isPlaying,
  toggleLike, addToQueue, isAdmin, isArtist, isUser,
  userArtistId, playlists, userPlaylists, token, activeMenu,
  setActiveMenu, ajouterAPlaylist, dragOverId, dragSongId,
  handleDragStart, handleDragOver, handleDrop,
  setShowEQ, initAudioEngine, searchTerm, setShowUpload,
  onAddToUserPlaylist, isLoggedIn, userNom, userId,
  onDeleted, onRefresh, onTogglePlaylistVisibility,
  isAudioCached, cachedIds,
  // Radio infinie
  onInfiniteRadio,
}) => {
  const canUpload = isAdmin || isArtist;
  const songs     = Array.isArray(musiques) ? musiques : [];

  // ── TOUS les hooks AVANT tout return conditionnel ──
  // FIX: ces hooks étaient déclarés après le return conditionnel searchTerm → React rules violation

  const { isPremium } = useSubscription(token);
  const { subscribed, subscribe, unsubscribe, loading: pushLoading } = usePushNotifications(token);

  // Pub audio
  const [showAd, setShowAd]   = useState(false);
  const [adCount, setAdCount] = useState(0);
  const adCountRef = useRef(adCount);
  adCountRef.current = adCount;

  // Mood filter
  const [selectedMood, setSelectedMood] = useState(null);

  // "Reprendre où vous en étiez"
  const [lastPlayed, setLastPlayed] = useState(null);

  // Hero "Titre du jour"
  const [heroSong, setHeroSong] = useState(null);

  // Top 24h
  const [top24h, setTop24h] = useState([]);

  // Artistes tendance
  const [trendingArtists, setTrendingArtists] = useState([]);

  // Albums récents
  const [recentAlbums, setRecentAlbums] = useState([]);

  // Classement amis
  const [friendRanking, setFriendRanking] = useState([]);

  // Charge la dernière écoute depuis localStorage
  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      const raw = localStorage.getItem('moozik_last_played');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.song?._id) setLastPlayed(parsed);
      }
    } catch {}
  }, [isLoggedIn]);

  // Hero : chanson la plus écoutée des dernières 24h, ou seed du jour
  useEffect(() => {
    fetch(`${API}/songs/meta`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.heroSong) { setHeroSong(d.heroSong); return; }
      // Fallback : seed du jour parmi les top plays
      if (songs.length) {
        const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
        const top  = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
        setHeroSong(top[seed % top.length]);
      }
    }).catch(() => {
      if (songs.length) {
        const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
        const top  = [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
        setHeroSong(top[seed % top.length]);
      }
    });
  }, [songs.length]);

  // Top 24h depuis l'API trending
  useEffect(() => {
    fetch(`${API}/trending?limit=5`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const list = Array.isArray(d) ? d.filter(s => s.songId).map(s => s.songId) : [];
        setTop24h(list.length ? list : [...songs].sort((a, b) => (b.plays||0)-(a.plays||0)).slice(0, 5));
      })
      .catch(() => setTop24h([...songs].sort((a,b) => (b.plays||0)-(a.plays||0)).slice(0,5)));
  }, [songs.length]);

  // Albums récents
  useEffect(() => {
    fetch(`${API}/albums?limit=8`).then(r => r.ok ? r.json() : []).then(d => setRecentAlbums(Array.isArray(d) ? d.slice(0, 8) : [])).catch(() => {});
  }, []);

  // Classement amis
  useEffect(() => {
    if (!token) return;
    // Utilise les followers/following pour comparer les écoutes
    fetch(`${API}/loyalty/leaderboard`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setFriendRanking(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, [token]);

  // Sauvegarder la lecture en cours pour "Reprendre où vous en étiez"
  useEffect(() => {
    if (!currentSong || !isLoggedIn) return;
    const save = () => {
      const audio = document.querySelector('audio');
      const ts    = audio?.currentTime || 0;
      localStorage.setItem('moozik_last_played', JSON.stringify({ song: currentSong, timestamp: ts, savedAt: new Date().toISOString() }));
    };
    const t = setInterval(save, 5000);
    return () => clearInterval(t);
  }, [currentSong, isLoggedIn]);

  // ── Mémos ──
  const recentMusiques = useMemo(() =>
    [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12), [songs]);

  const isNewSong = (song) => {
    const diff = Date.now() - new Date(song.createdAt).getTime();
    return diff < 7 * 86400000;
  };

  const discoveryToday = useMemo(() => {
    if (!songs.length) return null;
    // Chanson peu connue (< 100 plays), seed du jour
    const lowPlays = songs.filter(s => (s.plays || 0) < 100);
    const pool     = lowPlays.length > 0 ? lowPlays : songs;
    const seed     = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    return pool[seed % pool.length];
  }, [songs]);

  const trendingArtistsMemo = useMemo(() => {
    const counts = {};
    songs.forEach(s => { if (s.artiste) counts[s.artiste] = (counts[s.artiste] || 0) + (s.plays || 0); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([nom, plays]) => ({ nom, plays, song: songs.find(s => s.artiste === nom) }));
  }, [songs]);

  const hiddenGems = useMemo(() =>
    songs.filter(s => (s.plays || 0) < 100 && s.liked)
      .sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 6),
  [songs]);

  // Filtre par mood
  // Mots-clés associés à chaque mood pour le filtrage par champs texte
  const MOOD_KEYWORDS = {
    'Chill':     ['chill','calme','doux','relax','slow','lounge','ambient','soir'],
    'Énergie':   ['énergie','energie','energy','fast','rapide','power','boost','dance','danse'],
    'Focus':     ['focus','concentration','study','travail','work','deep','instrumental'],
    'Fête':      ['fête','fete','party','club','festif','nuit','afrobeats','dancehall'],
    'Nostalgie': ['nostalgie','nostalgia','retro','oldschool','old','classic','souvenir'],
    'Romance':   ['romance','amour','love','romantique','tendresse','coeur'],
    'Motivant':  ['motivant','motivation','inspire','gospel','victoire','triumph','champion'],
    'Gospel':    ['gospel','dieu','jesus','christ','praise','worship','gloire','seigneur'],
  };

  const moodFiltered = useMemo(() => {
    if (!selectedMood) return songs;
    // 1. Chercher d'abord dans le champ moods si disponible
    const hasMoodsField = songs.some(s => Array.isArray(s.moods) && s.moods.length > 0);
    if (hasMoodsField) {
      const tagged = songs.filter(s => s.moods?.includes(selectedMood));
      if (tagged.length > 0) return tagged;
    }
    // 2. Fallback: filtrage par mots-clés dans titre/artiste/genre/description
    const keywords = MOOD_KEYWORDS[selectedMood] || [selectedMood.toLowerCase()];
    return songs.filter(s => {
      const text = [s.titre, s.artiste, s.genre, s.description, s.album]
        .filter(Boolean).join(' ').toLowerCase();
      return keywords.some(kw => text.includes(kw));
    });
  }, [songs, selectedMood]);

  const favorites = useMemo(() => songs.filter(s => s.liked).slice(0, 5), [songs]);

  const filteredMusiques = useMemo(() =>
    songs.filter(s =>
      s.titre?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
      s.artiste?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
    ), [songs, searchTerm]);

  const songRowProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
    onDeleted, onRefresh, onTogglePlaylistVisibility,
    onInfiniteRadio,
  };

  const MOODS = [
    { label: 'Chill',     color: 'bg-sky-500/20 border-sky-500/30 text-sky-300',         activeColor: 'bg-sky-500/30 border-sky-400 text-sky-200'     },
    { label: 'Énergie',   color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300', activeColor: 'bg-yellow-500/30 border-yellow-400 text-yellow-200' },
    { label: 'Focus',     color: 'bg-violet-500/20 border-violet-500/30 text-violet-300', activeColor: 'bg-violet-500/30 border-violet-400 text-violet-200' },
    { label: 'Fête',      color: 'bg-pink-500/20 border-pink-500/30 text-pink-300',       activeColor: 'bg-pink-500/30 border-pink-400 text-pink-200'     },
    { label: 'Nostalgie', color: 'bg-amber-500/20 border-amber-500/30 text-amber-300',    activeColor: 'bg-amber-500/30 border-amber-400 text-amber-200'   },
    { label: 'Romance',   color: 'bg-rose-500/20 border-rose-500/30 text-rose-300',       activeColor: 'bg-rose-500/30 border-rose-400 text-rose-200'     },
    { label: 'Motivant',  color: 'bg-orange-500/20 border-orange-500/30 text-orange-300', activeColor: 'bg-orange-500/30 border-orange-400 text-orange-200' },
    { label: 'Gospel',    color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', activeColor: 'bg-emerald-500/30 border-emerald-400 text-emerald-200' },
  ];

  // ── Recherche globale — return ici mais hooks déjà déclarés au-dessus ──
  if (searchTerm) return (
    <GlobalSearchView
      searchTerm={searchTerm} currentSong={currentSong}
      setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
      isPlaying={isPlaying} toggleLike={toggleLike} />
  );

  return (
    <div className="flex flex-col gap-10 md:gap-14">

      {/* ══ ALERTES ADMIN ══ */}
      {isAdmin && <AdminAlertBanner token={token} isAdmin={isAdmin} />}

      {/* ══ NOTIFICATIONS PUSH ══ */}
      {isLoggedIn && !subscribed && (
        <button onClick={subscribe} disabled={pushLoading}
          className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition disabled:opacity-50">
          <Bell size={14} />
          Activer les notifications
        </button>
      )}

      {/* ══ 1. HERO "TITRE DU JOUR" ══ */}
      {heroSong && (
        <section>
          <SectionHeader icon={<Sun size={18} className="text-yellow-400"/>} title="Titre du jour" subtitle="Sélectionné pour vous aujourd'hui"/>
          <div
            onClick={() => { setCurrentSong(heroSong); setIsPlaying(true); }}
            className="relative overflow-hidden rounded-3xl cursor-pointer group">
            <div className="absolute inset-0">
              <img src={heroSong.image} className="w-full h-full object-cover scale-110 blur-xl opacity-40" alt="" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="relative flex items-center gap-5 p-6 md:p-8">
              <div className="relative shrink-0">
                <img src={heroSong.image} className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-2xl border border-white/10 transition-transform group-hover:scale-105 ${currentSong?._id === heroSong._id && isPlaying ? 'ring-2 ring-white/30' : ''}`} alt="" />
                <div className={`absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center transition ${currentSong?._id === heroSong._id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {currentSong?._id === heroSong._id && isPlaying ? <Pause fill="white" size={22}/> : <Play fill="white" size={22} className="ml-1"/>}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">⭐ DU JOUR</span>
                  {heroSong.plays > 0 && <span className="text-[9px] text-zinc-500">{heroSong.plays.toLocaleString()} écoutes</span>}
                </div>
                <h2 className="text-xl md:text-3xl font-black text-white truncate">{heroSong.titre}</h2>
                <p className="text-zinc-400 text-sm mt-1 uppercase tracking-wide">{heroSong.artiste}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ STORIES ══ */}
      <section className="pt-2"> 
        <div className='flex items-center gap-2 mb-4'>
          <div className="w-10 h-10 rounded-full border-2 border-pink-500 flex items-center justify-center">
            <Plus />
          </div>
          <h1 className='text-2xl font-bold text-white p-2' >Stories</h1>

        </div>
        <StoriesBar token={token} isLoggedIn={isLoggedIn} />
      </section>

      {/* ══ 2. REPRENDRE OÙ VOUS EN ÉTIEZ ══ */}
      {isLoggedIn && lastPlayed && currentSong?._id !== lastPlayed.song._id && (
        <section>
          <SectionHeader icon={<Clock size={18} className="text-blue-400"/>} title="Reprendre où vous en étiez"/>
          <div onClick={() => {
            setCurrentSong(lastPlayed.song);
            setIsPlaying(true);
            // Reprendre au bon timestamp
            setTimeout(() => {
              const audio = document.querySelector('audio');
              if (audio && lastPlayed.timestamp > 0) audio.currentTime = lastPlayed.timestamp;
            }, 500);
          }}
            className="flex items-center gap-4 p-4 bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/50 hover:border-zinc-700 rounded-2xl cursor-pointer group transition">
            <div className="relative shrink-0">
              <img src={lastPlayed.song.image} className="w-14 h-14 rounded-xl object-cover" alt="" />
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Play fill="white" size={16} className="ml-0.5"/>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{lastPlayed.song.titre}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{lastPlayed.song.artiste}</p>
              {lastPlayed.timestamp > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[120px]">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (lastPlayed.timestamp / (lastPlayed.song.duration || 180)) * 100)}%` }}/>
                  </div>
                  <span className="text-[9px] text-zinc-600">
                    arrêté à {Math.floor(lastPlayed.timestamp / 60)}:{String(Math.floor(lastPlayed.timestamp % 60)).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition shrink-0"/>
          </div>
        </section>
      )}

      {/* ══ 3. AMBIANCES / MOODS ══ */}
      <section>
        <SectionHeader icon={<Zap size={18} className="text-purple-400"/>} title="Ambiances" subtitle="Filtrez par mood"/>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MOODS.map(m => (
            <button key={m.label}
              onClick={() => setSelectedMood(selectedMood === m.label ? null : m.label)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition border ${
                selectedMood === m.label ? m.activeColor : m.color
              }`}>
              {m.label}
            </button>
          ))}
          {selectedMood && (
            <button onClick={() => setSelectedMood(null)}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-700">
              <X size={10}/> Tout
            </button>
          )}
        </div>
        {selectedMood && moodFiltered.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {moodFiltered.slice(0, 10).map((song, i) => <SongRow key={song._id} song={song} index={i} {...songRowProps}/>)}
          </div>
        )}
        {selectedMood && moodFiltered.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-6 italic">Aucun titre avec ce mood — ajoutez des tags depuis le menu d'édition</p>
        )}
      </section>

      {/* ══ 4. TOP DU MOMENT (dernières 24h) ══ */}
      {top24h.length > 0 && (
        <section>
          <SectionHeader icon={<Flame size={18} className="text-orange-500"/>} title="Top du moment" subtitle="Mis à jour toutes les heures"/>
          <div className="flex flex-col gap-1">
            {top24h.map((song, i) => (
              <TopTrack key={song._id} song={song} rank={i}
                isActive={currentSong?._id === song._id} isPlaying={isPlaying}
                onClick={() => { setCurrentSong(song); setIsPlaying(true); }}/>
            ))}
          </div>
        </section>
      )}

      {/* ══ 5. DÉCOUVERTE DU JOUR ══ */}
      {discoveryToday && (
        <section>
          <SectionHeader icon={<Compass size={18} className="text-violet-400"/>} title="Découverte du jour" subtitle="Un artiste émergent · change chaque jour"/>
          <div onClick={() => { setCurrentSong(discoveryToday); setIsPlaying(true); }}
            className="relative overflow-hidden rounded-2xl cursor-pointer group">
            <div className="absolute inset-0">
              <img src={discoveryToday.image} className="w-full h-full object-cover opacity-30 blur-lg scale-110" alt="" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/30"/>
            <div className="relative flex items-center gap-4 p-5">
              <img src={discoveryToday.image} className="w-16 h-16 rounded-2xl object-cover shadow-lg shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Découverte</span>
                <p className="text-base font-black text-white truncate mt-1">{discoveryToday.titre}</p>
                <p className="text-[11px] text-zinc-400 uppercase truncate">{discoveryToday.artiste}</p>
                <p className="text-[9px] text-zinc-600 mt-0.5">{discoveryToday.plays || 0} écoutes · talents émergents</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition">
                {currentSong?._id === discoveryToday._id && isPlaying ? <Pause fill="white" size={16}/> : <Play fill="white" size={16} className="ml-0.5"/>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ 6. NOUVEAUTÉS (scroll horizontal + badge NEW 7j) ══ */}
      <section>
        <SectionHeader icon={<Sparkles size={18} className="text-blue-400"/>} title="Nouveautés"/>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {recentMusiques.map(song => (
            <HorizontalCard key={song._id} song={song}
              isActive={currentSong?._id === song._id} isPlaying={isPlaying}
              onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              badge={isNewSong(song) ? 'NEW' : null} badgeColor="bg-blue-500"/>
          ))}
        </div>
      </section>

      {/* ══ PUB AUDIO (free users) ══ */}
      {showAd && (
        <AudioAdPlayer isPremium={isPremium} token={token} onAdEnd={() => setShowAd(false)} />
      )}

      {/* ══ 7. ARTISTES TENDANCE ══ */}
      {trendingArtistsMemo.length > 0 && (
        <section>
          <SectionHeader icon={<Users size={18} className="text-pink-400"/>} title="Artistes tendance" subtitle="Classés par vélocité d'écoutes"/>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {trendingArtistsMemo.map(({ nom, plays, song }) => (
              <div key={nom} className="shrink-0 w-24 text-center group cursor-pointer"
                onClick={() => { if (song) { setCurrentSong(song); setIsPlaying(true); } }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-red-500/50 transition">
                  {song?.image ? <img src={song.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xl font-black text-zinc-600">{nom[0]}</div>}
                </div>
                <p className="text-xs font-bold truncate text-zinc-300">{nom}</p>
                <p className="text-[10px] text-zinc-600">{plays.toLocaleString()} écoutes</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ 8. ALBUMS RÉCENTS ══ */}
      {recentAlbums.length > 0 && (
        <section>
          <SectionHeader icon={<Disc3 size={18} className="text-indigo-400"/>} title="Albums récents"/>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {recentAlbums.map(album => (
              <div key={album._id} className="shrink-0 w-28 md:w-32 group cursor-pointer">
                <div className="relative mb-2 aspect-square">
                  <img src={album.image || '/icon-192.png'} className="w-full h-full rounded-2xl object-cover shadow-lg group-hover:scale-105 transition" alt="" />
                </div>
                <p className="text-xs font-bold truncate text-zinc-200">{album.titre}</p>
                <p className="text-[10px] text-zinc-600 truncate">{album.artiste || album.annee}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ INCONNUS MAIS EXCELLENTS ══ */}
      {hiddenGems.length > 0 && (
        <section>
          <SectionHeader icon={<Gem size={18} className="text-cyan-400"/>} title="Inconnus mais excellents" subtitle="Moins de 100 écoutes · très aimés"/>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {hiddenGems.map(song => (
              <DiscoveryCard key={song._id} song={song}
                isActive={currentSong?._id === song._id} isPlaying={isPlaying}
                onClick={() => { setCurrentSong(song); setIsPlaying(true); }}/>
            ))}
          </div>
        </section>
      )}

      {/* ══ CLASSEMENT ENTRE AMIS ══ */}
      {isLoggedIn && friendRanking.length > 0 && (
        <section>
          <SectionHeader icon={<Trophy size={18} className="text-yellow-400"/>} title="Classement des fans" subtitle="Les plus actifs cette semaine"/>
          <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4 space-y-2">
            {friendRanking.map((entry, i) => (
              <div key={entry._id} className="flex items-center gap-3">
                <span className={`text-sm font-black w-5 ${i===0?'text-yellow-400':i===1?'text-zinc-300':i===2?'text-amber-600':'text-zinc-600'}`}>{i+1}</span>
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                  {entry.userId?.avatar ? <img src={entry.userId.avatar} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-sm font-black text-zinc-500">{(entry.userId?.nom||'?')[0]}</div>}
                </div>
                <p className="flex-1 text-sm font-bold truncate">{entry.userId?.nom || 'Anonyme'}</p>
                <span className="text-xs text-zinc-500 shrink-0">{entry.points?.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ FAVORIS ══ */}
      {isLoggedIn && favorites.length > 0 && (
        <section>
          <SectionHeader icon={<Heart size={18} className="text-red-500" fill="red"/>} title="Aimés"/>
          <div className="flex flex-col gap-1">
            {favorites.map((song, i) => <SongRow key={song._id} song={song} index={i} {...songRowProps}/>)}
          </div>
        </section>
      )}

      {/* ══ HORS-LIGNE ══ */}
      <OfflineSection musiques={songs} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
        currentSong={currentSong} isPlaying={isPlaying} isAudioCached={isAudioCached}/>

      {/* ══ MES PARTAGES ══ */}
      {isLoggedIn && (
        <RecentSharesSection token={token} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong}/>
      )}

    </div>
  );
};

export default HomeView;