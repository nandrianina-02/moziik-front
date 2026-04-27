import React from 'react';
import { useParams } from 'react-router-dom';
import { Music } from 'lucide-react';
import SongRow from '../components/music/SongRow';

const PlaylistView = ({ playlists, setCurrentSong, setIsPlaying, currentSong, toggleLike, addToQueue, token, isLoggedIn, userNom }) => {
  const { id } = useParams();
  const playlist = playlists.find(p => p._id === id);
  if (!playlist) return <div className="p-8 text-zinc-500">Playlist introuvable...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end gap-4 md:gap-6 mb-8 bg-gradient-to-t from-zinc-900/50 to-red-900/20 p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-zinc-800 rounded-2xl shadow-2xl flex items-center justify-center border border-white/5">
          <Music size={48} className="text-red-600" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Playlist</p>
          <h2 className="text-2xl md:text-5xl font-black mb-4">{playlist.nom}</h2>
          <p className="text-zinc-400 text-sm">{playlist.musiques.length} titres</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {playlist.musiques.map((song, index) => (
          <SongRow key={song._id} song={song} index={index} currentSong={currentSong}
            setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
            toggleLike={toggleLike} addToQueue={addToQueue}
            token={token} isLoggedIn={isLoggedIn} userNom={userNom} />
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
