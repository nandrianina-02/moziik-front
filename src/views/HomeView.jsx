import React from 'react';
import { Flame, Sparkles, Heart, Dices, Music, Plus, Sliders, TrendingUp, Play, Pause } from 'lucide-react';
import SongRow from '../components/music/SongRow';

const HomeView = ({
  musiques, currentSong, setCurrentSong, setIsPlaying, isPlaying,
  toggleLike, addToQueue, isAdmin, isArtist, isUser,
  userArtistId, playlists, userPlaylists, token, activeMenu,
  setActiveMenu, ajouterAPlaylist, deleteSong, editSong,
  dragOverId, dragSongId, handleDragStart, handleDragOver, handleDrop,
  setShowEQ, initAudioEngine, searchTerm, setShowUpload,
  onAddToUserPlaylist, isLoggedIn, userNom
}) => {
  const canUpload = isAdmin || isArtist;
  const topMusiques = [...(Array.isArray(musiques) ? musiques : [])]
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 5);

  const recentMusiques = [...(Array.isArray(musiques) ? musiques : [])]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 10);
  const shuffled = [...(Array.isArray(musiques) ? musiques : [])]
  .sort(() => Math.random() - 0.5)
  .slice(0, 4);

  const filteredMusiques = (Array.isArray(musiques) ? musiques : []).filter(s =>
  s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
  s.artiste.toLowerCase().includes(searchTerm.toLowerCase())
);

  if (searchTerm) {
    return (
      <section>
        <h2 className="text-lg font-bold mb-4 text-zinc-400">Résultats pour "{searchTerm}"</h2>
        <div className="flex flex-col gap-1">
          {filteredMusiques.length === 0
            ? <p className="text-zinc-600 italic p-4">Aucun résultat...</p>
            : filteredMusiques.map((song, i) => (
              <SongRow key={song._id} song={song} index={i} currentSong={currentSong}
                setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
                toggleLike={toggleLike} addToQueue={addToQueue}
                token={token} isLoggedIn={isLoggedIn} userNom={userNom} />
            ))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-10 md:gap-12">

      {/* TOP ÉCOUTES */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Flame size={20} className="text-orange-500" />
          <h2 className="text-lg font-black uppercase tracking-wide">Top écoutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {topMusiques.map((song, i) => (
            <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition ${currentSong?._id === song._id ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5'}`}>
              <span className={`font-black text-lg w-6 shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-700'}`}>{i + 1}</span>
              <img src={song.image} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${currentSong?._id === song._id ? 'text-red-400' : ''}`}>{song.titre}</p>
                <p className="text-[10px] text-zinc-500 uppercase truncate">{song.artiste}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                <TrendingUp size={11} className="text-green-500" /> {song.plays || 0}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NOUVEAUTÉS */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={20} className="text-blue-400" />
          <h2 className="text-lg font-black uppercase tracking-wide">Nouveautés</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {recentMusiques.map(song => (
            <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              className="shrink-0 w-32 md:w-36 group cursor-pointer transition">
              <div className="relative w-32 h-32 md:w-36 md:h-36 mb-2">
                <img src={song.image} className="w-full h-full rounded-2xl object-cover shadow-lg" alt="" />
                <div className={`absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 transition ${currentSong?._id === song._id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="p-2.5 bg-red-600 rounded-full">
                    {currentSong?._id === song._id && isPlaying ? <Pause fill="white" size={16} /> : <Play fill="white" size={16} />}
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">NEW</div>
              </div>
              <p className="text-xs font-bold truncate">{song.titre}</p>
              <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAVORIS (si connecté) */}
      {isLoggedIn && musiques.filter(s => s.liked).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Heart size={20} className="text-red-500" fill="red" />
            <h2 className="text-lg font-black uppercase tracking-wide">Aimés récemment</h2>
          </div>
          <div className="flex flex-col gap-1">
            {musiques.filter(s => s.liked).slice(0, 5).map((song, i) => (
              <SongRow key={song._id} song={song} index={i} currentSong={currentSong}
                setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
                toggleLike={toggleLike} addToQueue={addToQueue}
                token={token} isLoggedIn={isLoggedIn} userNom={userNom} />
            ))}
          </div>
        </section>
      )}

      {/* DÉCOUVERTE */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Dices size={20} className="text-purple-400" />
          <h2 className="text-lg font-black uppercase tracking-wide">Découverte du jour</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shuffled.map(song => (
            <div key={song._id} onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
              className={`p-3 rounded-2xl cursor-pointer group transition ${currentSong?._id === song._id ? 'bg-zinc-800' : 'bg-zinc-900/40 hover:bg-zinc-800'}`}>
              <div className="relative aspect-square mb-2">
                <img src={song.image} className="w-full h-full rounded-xl object-cover" alt="" />
                <div className={`absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 transition ${currentSong?._id === song._id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="p-2 bg-red-600 rounded-full">
                    {currentSong?._id === song._id && isPlaying ? <Pause fill="white" size={14} /> : <Play fill="white" size={14} />}
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold truncate">{song.titre}</p>
              <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BIBLIOTHÈQUE */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Music size={20} className="text-zinc-400" />
            <h2 className="text-lg font-black uppercase tracking-wide">Bibliothèque</h2>
          </div>
          <div className="flex items-center gap-2">
            {canUpload && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                <Plus size={14} /> Ajouter
              </button>
            )}
            <button onClick={() => { initAudioEngine(); setShowEQ(true); }}>
              <Sliders size={18} className="text-zinc-500 hover:text-white cursor-pointer" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {(Array.isArray(musiques) ? musiques : []).map((song, i) => (
            <div
              key={song._id}
              draggable={isAdmin}
              onDragStart={isAdmin ? (e) => handleDragStart(e, song._id) : undefined}
              onDragOver={isAdmin ? (e) => handleDragOver(e, song._id) : undefined}
              onDrop={isAdmin ? (e) => handleDrop(e, song._id) : undefined}
              className={`${dragOverId === song._id ? 'ring-2 ring-red-500 rounded-xl' : ''}`}
            >
              <SongRow
                song={song}
                index={i}
                currentSong={currentSong}
                setCurrentSong={setCurrentSong}
                setIsPlaying={setIsPlaying}
                toggleLike={toggleLike}
                addToQueue={addToQueue}
                token={token}
                isLoggedIn={isLoggedIn}
                userNom={userNom}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomeView;
