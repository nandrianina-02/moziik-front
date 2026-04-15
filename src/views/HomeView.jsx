import React, { useState, useMemo } from 'react';
import {
  Flame, Sparkles, Heart, Compass, Music, Plus, TrendingUp,
  Play, Pause, Disc3, ChevronRight
} from 'lucide-react';
import SongRow from '../components/music/SongRow';

const HomeView = ({
  musiques, currentSong, setCurrentSong, setIsPlaying, isPlaying,
  toggleLike, addToQueue, isAdmin, isArtist, isUser,
  userArtistId, playlists, userPlaylists, token, activeMenu,
  setActiveMenu, ajouterAPlaylist, deleteSong, editSong,
  dragOverId, dragSongId, handleDragStart, handleDragOver, handleDrop,
  setShowEQ, initAudioEngine, searchTerm, setShowUpload,
  onAddToUserPlaylist, isLoggedIn, userNom,
  userId, onDeleted, onRefresh, onTogglePlaylistVisibility
}) => {
  const canUpload = isAdmin || isArtist;
  const songs = Array.isArray(musiques) ? musiques : [];

  // ── Sections calculées — STABLES (useMemo sans dépendance isPlaying) ──
  const topMusiques = useMemo(() =>
    [...songs].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5),
    [songs]
  );

  const recentMusiques = useMemo(() =>
    [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    [songs]
  );

  // ── Découverte du jour — calculée UNE SEULE FOIS par session ──
  const discoveryToday = useMemo(() => {
    if (!songs.length) return [];
    // Seed basé sur la date du jour → même résultat toute la journée
    const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    const shuffled = [...songs].sort((a, b) => {
      const ha = ((seed ^ a._id.charCodeAt(0)) * 2654435761) >>> 0;
      const hb = ((seed ^ b._id.charCodeAt(0)) * 2654435761) >>> 0;
      return ha - hb;
    });
    return shuffled.slice(0, 4);
  }, [songs]); // recalculé seulement si songs change, PAS quand isPlaying change

  const favorites = useMemo(() => songs.filter(s => s.liked).slice(0, 5), [songs]);

  const filteredMusiques = useMemo(() =>
    songs.filter(s =>
      s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artiste.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [songs, searchTerm]
  );

  const songRowProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists,
    onAddToUserPlaylist, ajouterAPlaylist,
    onDeleted, onRefresh, onTogglePlaylistVisibility,
  };

  // ── Recherche ──
  if (searchTerm) return (
    <section className="max-w-3xl mx-auto">
      <h2 className="text-base font-bold mb-4 text-zinc-400">
        Résultats pour <span className="text-white">"{searchTerm}"</span>
      </h2>
      <div className="flex flex-col gap-1">
        {filteredMusiques.length === 0
          ? <p className="text-zinc-600 italic p-4 text-sm">Aucun résultat...</p>
          : filteredMusiques.map((song, i) => (
            <SongRow key={song._id} song={song} index={i} {...songRowProps}/>
          ))}
      </div>
    </section>
  );

  return (
    <div className="flex flex-col gap-10 md:gap-14">

      {/* ══ HERO — TOP ÉCOUTES ══ */}
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

      {/* ══ FAVORIS ══ */}
      {isLoggedIn && favorites.length > 0 && (
        <section>
          <SectionHeader icon={<Heart size={18} className="text-red-500" fill="red"/>} title="Aimés"/>
          <div className="flex flex-col gap-1">
            {favorites.map((song, i) => (
              <SongRow key={song._id} song={song} index={i} {...songRowProps}/>
            ))}
          </div>
        </section>
      )}

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
              onDragStart={isAdmin?(e)=>handleDragStart(e,song._id):undefined}
              onDragOver={isAdmin?(e)=>handleDragOver(e,song._id):undefined}
              onDrop={isAdmin?(e)=>handleDrop(e,song._id):undefined}
              className={dragOverId===song._id?'ring-1 ring-red-500 rounded-xl':''}>
              <SongRow song={song} index={i} {...songRowProps}/>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// ── Sous-composants ────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle, noMargin }) => (
  <div className={`flex items-center gap-2.5 ${noMargin ? '' : 'mb-4'}`}>
    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 shrink-0">
      {icon}
    </div>
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
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer group transition-all duration-200
        ${isActive ? 'bg-white/8 ring-1 ring-white/10' : 'hover:bg-white/5'}`}>
      <span className={`font-black text-lg w-6 text-right shrink-0 tabular-nums ${rankColors[rank] || 'text-zinc-700'}`}>
        {rank + 1}
      </span>
      <div className="relative shrink-0">
        <img src={song.image} className="w-11 h-11 rounded-xl object-cover" alt=""/>
        {isActive && isPlaying && (
          <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-3">
              {[1,2,3].map(i=>(
                <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${(i%3+1)*4}px`, animationDelay: `${i*0.15}s` }}/>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isActive?'text-white':'text-zinc-200'}`}>{song.titre}</p>
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
      <img src={song.image}
        className={`w-full h-full rounded-2xl object-cover shadow-lg transition-all duration-300
          ${isActive?'ring-2 ring-white/30 scale-[0.98]':''}`} alt=""/>
      <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 transition
        ${isActive&&isPlaying?'opacity-100':'opacity-0 group-hover:opacity-100'}`}>
        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          {isActive&&isPlaying?<Pause fill="white" size={15}/>:<Play fill="white" size={15} className="ml-0.5"/>}
        </div>
      </div>
      {badge && (
        <span className={`absolute top-2 left-2 ${badgeColor} text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide`}>
          {badge}
        </span>
      )}
    </div>
    <p className="text-xs font-bold truncate text-zinc-200">{song.titre}</p>
    <p className="text-[10px] text-zinc-600 truncate mt-0.5 uppercase tracking-wide">{song.artiste}</p>
  </div>
);

const DiscoveryCard = ({ song, isActive, isPlaying, onClick }) => (
  <div onClick={onClick}
    className={`relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-200 aspect-square
      ${isActive?'ring-2 ring-white/25':''}`}>
    {/* Image fond */}
    <img src={song.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt=""/>
    {/* Overlay gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
    {/* Play indicator */}
    {isActive && isPlaying ? (
      <div className="absolute top-3 right-3 flex gap-0.5 items-end h-4">
        {[1,2,3].map(i=>(
          <div key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${(i%3+1)*4}px`, animationDelay: `${i*0.15}s` }}/>
        ))}
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <Play fill="white" size={18} className="ml-0.5"/>
        </div>
      </div>
    )}
    {/* Titre en bas */}
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-xs font-bold text-white truncate leading-tight">{song.titre}</p>
      <p className="text-[10px] text-white/55 truncate mt-0.5">{song.artiste}</p>
    </div>
  </div>
);

export default HomeView;