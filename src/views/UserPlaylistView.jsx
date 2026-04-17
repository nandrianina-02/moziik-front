import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Globe, Lock, Heart, ListPlus, Trash2 } from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';

const UserPlaylistView = ({ token, setCurrentSong, setIsPlaying, currentSong, toggleLike, addToQueue, isOwner, isLoggedIn, userNom }) => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmDialog, ask, close } = useConfirm();

  useEffect(() => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API}/user-playlists/${id}`, { headers })
      .then(r => r.json())
      .then(data => { setPlaylist(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div className="p-8 text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Chargement...</div>;
  if (!playlist) return <div className="p-8 text-zinc-500">Playlist introuvable ou accès refusé.</div>;

  const removeFromPlaylist = (songId, titre) => {
    ask({
      title: `Retirer "${titre}" de la playlist ?`,
      confirmLabel: 'Retirer',
      variant: 'warning',
      onConfirm: async () => {
        await fetch(`${API}/user-playlists/${id}/remove/${songId}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        setPlaylist(prev => ({ ...prev, musiques: prev.musiques.filter(s => s._id !== songId) }));
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ConfirmDialog config={confirmDialog} onClose={close} />
      <div className="flex items-end gap-4 md:gap-6 mb-8 bg-gradient-to-t from-zinc-900/50 to-purple-900/20 p-4 md:p-6 rounded-3xl">
        <div className="w-28 h-28 md:w-48 md:h-48 bg-purple-900/30 rounded-2xl shadow-2xl flex items-center justify-center border border-purple-500/20">
          {playlist.isPublic ? <Globe size={48} className="text-purple-400" /> : <Lock size={48} className="text-purple-400" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Ma Playlist</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${playlist.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
              {playlist.isPublic ? 'Publique' : 'Privée'}
            </span>
          </div>
          <h2 className="text-2xl md:text-5xl font-black mb-2">{playlist.nom}</h2>
          <p className="text-zinc-500 text-xs">{playlist.musiques?.length || 0} titres</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {(!playlist.musiques || playlist.musiques.length === 0)
          ? <p className="p-8 text-zinc-500 italic">Playlist vide. Ajoutez des musiques depuis la bibliothèque.</p>
          : playlist.musiques.map((song, index) => (
            <div key={song._id}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition ${currentSong?._id === song._id ? 'bg-purple-600/10' : 'hover:bg-white/5'}`}
              onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
              <div className="flex items-center gap-4">
                <span className="text-zinc-600 font-mono text-xs w-4">{index + 1}</span>
                <img src={song.image} className="w-10 h-10 rounded-md object-cover" alt="" />
                <div>
                  <p className={`text-sm font-bold ${currentSong?._id === song._id ? 'text-purple-400' : ''}`}>{song.titre}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">{song.artiste}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                <button onClick={e => { e.stopPropagation(); toggleLike(song._id); }}>
                  <Heart size={16} fill={song.liked ? 'red' : 'none'} className={song.liked ? 'text-red-500' : 'text-zinc-500'} />
                </button>
                <button onClick={e => { e.stopPropagation(); addToQueue(song); }}>
                  <ListPlus size={16} className="text-zinc-500 hover:text-white" />
                </button>
                {isOwner && (
                  <button onClick={e => { e.stopPropagation(); removeFromPlaylist(song._id, song.titre); }}>
                    <Trash2 size={14} className="text-zinc-600 hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default UserPlaylistView;