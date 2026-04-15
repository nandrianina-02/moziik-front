import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import SongRow from '../components/music/SongRow';
import { API } from '../config/api';

const FavoritesView = ({
  setCurrentSong, setIsPlaying, currentSong,
  toggleLike, addToQueue, token, isLoggedIn, userNom,
  isAdmin, isArtist, userArtistId, userId,
  playlists, userPlaylists, onAddToUserPlaylist,
  ajouterAPlaylist, onDeleted, onRefresh, onTogglePlaylistVisibility
}) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(false);

  // Charger les favoris de l'utilisateur connecté depuis l'API
  useEffect(() => {
    if (!token || !isLoggedIn) { setFavorites([]); return; }
    setLoading(true);
    fetch(`${API}/songs/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [token, isLoggedIn]);

  // Quand l'utilisateur like/unlike depuis cette vue, on met à jour localement
  const handleToggleLike = async (id) => {
    await toggleLike(id);
    // Retirer de la vue si unliké
    setFavorites(prev => prev.filter(s => s._id !== id));
  };

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-3">
      <Heart size={40} className="opacity-20" />
      <p className="text-sm">Connectez-vous pour voir vos favoris</p>
    </div>
  );

  const songProps = {
    setCurrentSong, setIsPlaying, currentSong,
    toggleLike: handleToggleLike, addToQueue,
    token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId, userId,
    playlists, userPlaylists,
    onAddToUserPlaylist, ajouterAPlaylist,
    onDeleted, onRefresh, onTogglePlaylistVisibility,
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end gap-4 md:gap-6 mb-8 bg-linear-to-t from-zinc-900/50 to-red-900/40 p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-red-600/20 rounded-2xl shadow-2xl flex items-center justify-center border border-red-500/20">
          <Heart size={48} className="text-red-600" fill="red" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Collection</p>
          <h2 className="text-2xl md:text-5xl font-black mb-4">Coups de cœur</h2>
          <p className="text-zinc-400 text-sm">
            {loading ? '...' : `${favorites.length} titre${favorites.length !== 1 ? 's' : ''} aimé${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2" /> Chargement...
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {favorites.length === 0
            ? (
              <div className="flex flex-col items-center py-16 text-zinc-600 gap-3">
                <Heart size={40} className="opacity-20" />
                <p className="text-sm italic">Aucun favori pour le moment...</p>
                <p className="text-xs text-zinc-700">Appuyez sur ❤️ sur n'importe quelle musique</p>
              </div>
            )
            : favorites.map((song, index) => (
              <SongRow
                key={song._id}
                song={{ ...song, liked: true }}
                index={index}
                {...songProps}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};

export default FavoritesView;