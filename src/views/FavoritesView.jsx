import React from 'react';
import { Heart } from 'lucide-react';
import SongRow from '../components/music/SongRow';

const FavoritesView = ({ musiques, setCurrentSong, setIsPlaying, currentSong, toggleLike, addToQueue, token, isLoggedIn, userNom }) => {
  const favorites = musiques.filter(s => s.liked);
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end gap-4 md:gap-6 mb-8 bg-gradient-to-t from-zinc-900/50 to-red-900/40 p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-red-600/20 rounded-2xl shadow-2xl flex items-center justify-center border border-red-500/20">
          <Heart size={48} className="text-red-600" fill="red" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Collection</p>
          <h2 className="text-2xl md:text-5xl font-black mb-4">Coups de cœur</h2>
          <p className="text-zinc-400 text-sm">{favorites.length} titres aimés</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {favorites.length === 0
          ? <p className="p-8 text-zinc-500 italic">Aucun favori pour le moment...</p>
          : favorites.map((song, index) => (
            <SongRow key={song._id} song={song} index={index} currentSong={currentSong}
              setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
              toggleLike={toggleLike} addToQueue={addToQueue}
              token={token} isLoggedIn={isLoggedIn} userNom={userNom} />
          ))}
      </div>
    </div>
  );
};

export default FavoritesView;
