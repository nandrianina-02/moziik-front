import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame, Sparkles, Heart, Compass, Music, Plus, TrendingUp,
  Play, Pause, Disc3, ChevronRight, Download, Check,
  Users, AlertTriangle, Share2, Clock, WifiOff
} from 'lucide-react';
import SongRow from '../components/music/SongRow';
import GlobalSearchView from './GlobalSearchView';
import { API } from '../config/api';
import { usePushNotifications } from '../hooks/usePushNotifications';

                

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
          {unassigned > 0 && (
            <span className="text-[11px] text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">
              ⚠️ {unassigned} musique{unassigned > 1 ? 's' : ''} sans artiste assigné
            </span>
          )}
          {activeUsers > 0 && (
            <span className="text-[11px] text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {activeUsers} utilisateur{activeUsers > 1 ? 's' : ''} actif{activeUsers > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="text-zinc-500 hover:text-white shrink-0 p-1">×</button>
    </div>
  );
};

// ── Section partages récents ─────────────────
const RecentSharesSection = ({ token, musiques, setCurrentSong, setIsPlaying, currentSong }) => {


  const [shares, setShares] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/my-shares`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(d => setShares(Array.isArray(d) ? d.slice(0,6) : [])).catch(() => {});
  }, [token]);

  if (shares.length === 0) return null;

  return (
    <section>
      <SectionHeader icon={<Share2 size={18} className="text-blue-400"/>} title="Mes partages récents"
        subtitle={`${shares.length} lien${shares.length > 1 ? 's' : ''} actif${shares.length > 1 ? 's' : ''}`} />
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {shares.map(share => {
          if (!share.songId) return null;
          const song = share.songId;
          const isActive = currentSong?._id === song._id;
          const expired = new Date(share.expiresAt) < new Date();
          return (
            <div key={share._id}
              onClick={() => { if (!expired) { setCurrentSong(song); setIsPlaying(true); } }}
              className={`shrink-0 w-32 group cursor-pointer ${expired ? 'opacity-40' : ''}`}>
              <div className="relative aspect-square mb-2">
                <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
                <div className={`absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 transition ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <Play fill="white" size={15} className="ml-0.5" />
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <Share2 size={8} className="text-blue-300" />
                  <span className="text-[9px] text-blue-300">{share.viewCount || 0}</span>
                </div>
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
const OfflineSection = ({ musiques, setCurrentSong, setIsPlaying, currentSong, isPlaying, isAudioCached, cachedIds }) => {
  const cached = useMemo(() =>
    musiques.filter(s => isAudioCached && isAudioCached(s._id)),
    [musiques, cachedIds]
  );
  if (cached.length === 0) return null;
  return (
    <section>
      <SectionHeader icon={<WifiOff size={18} className="text-green-400"/>} title="Disponible hors-ligne"
        subtitle={`${cached.length} titre${cached.length > 1 ? 's' : ''} téléchargé${cached.length > 1 ? 's' : ''}`}/>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {cached.map(song => {
          const isActive = currentSong?._id === song._id;
          return (
            <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              className="shrink-0 w-28 group cursor-pointer">
              <div className="relative aspect-square mb-2">
                <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
                <div className={`absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 transition ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isActive && isPlaying ? <Pause fill="white" size={15}/> : <Play fill="white" size={15} className="ml-0.5"/>}
                </div>
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                  <Check size={10} className="text-white" />
                </div>
              </div>
              <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
              <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
            </div>
          );
        })}
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
  onAddToUserPlaylist, isLoggedIn, userNom,
  userId, onDeleted, onRefresh, onTogglePlaylistVisibility,
  // Cache hors-ligne
  isAudioCached, cachedIds,
}) => {
  const canUpload = isAdmin || isArtist;
  const songs = Array.isArray(musiques) ? musiques : [];

  const topMusiques = useMemo(() =>
    [...songs].sort((a, b) => (b.plays||0) - (a.plays||0)).slice(0, 5), [songs]);

  const recentMusiques = useMemo(() =>
    [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12), [songs]);

  const discoveryToday = useMemo(() => {
    if (!songs.length) return [];
    const seed = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,''));
    const shuffled = [...songs].sort((a, b) => {
      const ha = ((seed ^ a._id.charCodeAt(0)) * 2654435761) >>> 0;
      const hb = ((seed ^ b._id.charCodeAt(0)) * 2654435761) >>> 0;
      return ha - hb;
    });
    return shuffled.slice(0, 4);
  }, [songs]);

  // Albums avec le plus de musiques
  const popularArtists = useMemo(() => {
    const counts = {};
    songs.forEach(s => { if (s.artiste) counts[s.artiste] = (counts[s.artiste]||0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6)
      .map(([nom, count]) => ({ nom, count, song: songs.find(s => s.artiste === nom) }));
  }, [songs]);

  const favorites = useMemo(() => songs.filter(s => s.liked).slice(0,5), [songs]);

  const filteredMusiques = useMemo(() =>
    songs.filter(s =>
      s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artiste.toLowerCase().includes(searchTerm.toLowerCase())
    ), [songs, searchTerm]);

  const songRowProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
    onDeleted, onRefresh, onTogglePlaylistVisibility,
  };

  // ── Recherche globale ──────────────────────
  if (searchTerm) return (
    <GlobalSearchView
      searchTerm={searchTerm}
      currentSong={currentSong}
      setCurrentSong={setCurrentSong}
      setIsPlaying={setIsPlaying}
      isPlaying={isPlaying}
      toggleLike={toggleLike}
    />
  );

const { subscribed, subscribe, unsubscribe, loading } = usePushNotifications(token);
// console.log('subscribed:', subscribed); // ← ajoute ça




  return (
    <div className="flex flex-col gap-10 md:gap-14">

      {/* ══ ALERTES ADMIN ══ */}
      {isAdmin && <AdminAlertBanner token={token} isAdmin={isAdmin} />}
      {isLoggedIn && !subscribed && (

        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`relative flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-200 text-sm font-medium ${
            subscribed
              ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white/80 hover:border-white/20'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${subscribed ? 'bg-violet-500' : 'bg-white/20'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${subscribed ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          Notifications
        </button>
      )}

      {/* ══ HERO WELCOME ══ */}
      {isLoggedIn && (
        <section className="bg-gradient-to-br from-red-900/30 via-zinc-900/20 to-zinc-900/0 rounded-3xl p-5 md:p-7 border border-red-900/20">
          <p className="text-zinc-500 text-sm mb-0.5">Bonne écoute,</p>
          <h1 className="text-2xl md:text-3xl font-black mb-4">{userNom || 'Mélomane'} 🎵</h1>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-black/30 rounded-xl px-3 py-2 text-xs">
              <span className="text-zinc-500">Bibliothèque</span>
              <p className="font-black text-white text-lg">{songs.length}</p>
            </div>
            {favorites.length > 0 && (
              <div className="bg-black/30 rounded-xl px-3 py-2 text-xs">
                <span className="text-zinc-500">Favoris</span>
                <p className="font-black text-red-400 text-lg">{favorites.length}</p>
              </div>
            )}
            <div className="bg-black/30 rounded-xl px-3 py-2 text-xs">
              <span className="text-zinc-500">Top écoutes</span>
              <p className="font-black text-orange-400 text-lg">{topMusiques[0]?.plays || 0}</p>
            </div>
          </div>
        </section>
      )}

      {/* ══ TOP ÉCOUTES ══ */}
      <section>
        <SectionHeader icon={<Flame size={18} className="text-orange-500"/>} title="Top écoutes" />
        <div className="flex flex-col gap-1">
          {topMusiques.map((song, i) => (
            <TopTrack key={song._id} song={song} rank={i}
              isActive={currentSong?._id === song._id} isPlaying={isPlaying}
              onClick={() => { setCurrentSong(song); setIsPlaying(true); }}/>
          ))}
        </div>
      </section>

      {/* ══ NOUVEAUTÉS ══ */}
      <section>
        <SectionHeader icon={<Sparkles size={18} className="text-blue-400"/>} title="Nouveautés"/>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {recentMusiques.map(song => (
            <HorizontalCard key={song._id} song={song}
              isActive={currentSong?._id === song._id} isPlaying={isPlaying}
              onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              badge="NEW" badgeColor="bg-blue-500"/>
          ))}
        </div>
      </section>

      {/* ══ DÉCOUVERTE DU JOUR ══ */}
      <section>
        <SectionHeader icon={<Compass size={18} className="text-violet-400"/>} title="Découverte du jour"
          subtitle="Renouvelée chaque jour"/>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {discoveryToday.map(song => (
            <DiscoveryCard key={song._id} song={song}
              isActive={currentSong?._id === song._id} isPlaying={isPlaying}
              onClick={() => { setCurrentSong(song); setIsPlaying(true); }}/>
          ))}
        </div>
      </section>

      {/* ══ ARTISTES POPULAIRES ══ */}
      {popularArtists.length > 0 && (
        <section>
          <SectionHeader icon={<Users size={18} className="text-pink-400"/>} title="Artistes populaires"/>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {popularArtists.map(({ nom, count, song }) => (
              <div key={nom} className="shrink-0 w-24 text-center group cursor-pointer"
                onClick={() => { if (song) { setCurrentSong(song); setIsPlaying(true); } }}>
                <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-red-500/50 transition">
                  {song?.image ? <img src={song.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-xl font-black text-zinc-600">{nom[0]}</div>}
                </div>
                <p className="text-xs font-bold truncate text-zinc-300">{nom}</p>
                <p className="text-[10px] text-zinc-600">{count} titre{count > 1 ? 's' : ''}</p>
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
      <OfflineSection
        musiques={songs}
        setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
        currentSong={currentSong} isPlaying={isPlaying}
        isAudioCached={isAudioCached} cachedIds={cachedIds}
      />

      {/* ══ MES PARTAGES ══ */}
      {isLoggedIn && (
        <RecentSharesSection token={token} musiques={songs}
          setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong}/>
      )}

      {/* ══ BIBLIOTHÈQUE ══ */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <SectionHeader icon={<Music size={18} className="text-zinc-400"/>} title="Bibliothèque"
            subtitle={`${songs.length} titres`} noMargin/>
          {canUpload && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition active:scale-95 shadow-sm shadow-red-900/40">
              <Plus size={13}/> Ajouter
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {songs.map((song, i) => (
            <div key={song._id}
              draggable={isAdmin}
              onDragStart={isAdmin ? e => handleDragStart(e, song._id) : undefined}
              onDragOver={isAdmin ? e => handleDragOver(e, song._id) : undefined}
              onDrop={isAdmin ? e => handleDrop(e, song._id) : undefined}
              className={dragOverId === song._id ? 'ring-1 ring-red-500 rounded-xl' : ''}>
              <SongRow song={song} index={i} {...songRowProps}/>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

// ── Sous-composants ──────────────────────────
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
      <span className={`font-black text-lg w-6 text-right shrink-0 tabular-nums ${rankColors[rank]||'text-zinc-700'}`}>{rank+1}</span>
      <div className="relative shrink-0">
        <img src={song.image} className="w-11 h-11 rounded-xl object-cover" alt=""/>
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
        <TrendingUp size={10} className="text-green-500"/> {song.plays||0}
      </div>
    </div>
  );
};

const HorizontalCard = ({ song, isActive, isPlaying, onClick, badge, badgeColor }) => (
  <div onClick={onClick} className="shrink-0 w-28 md:w-32 group cursor-pointer">
    <div className="relative mb-2 aspect-square">
      <img src={song.image} className={`w-full h-full rounded-2xl object-cover shadow-lg transition-all duration-300 ${isActive ? 'ring-2 ring-white/30 scale-[0.98]' : ''}`} alt=""/>
      <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 transition ${isActive&&isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          {isActive&&isPlaying ? <Pause fill="white" size={15}/> : <Play fill="white" size={15} className="ml-0.5"/>}
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
    <img src={song.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt=""/>
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

export default HomeView;