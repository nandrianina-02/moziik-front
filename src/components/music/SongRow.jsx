import React, { useState, useRef, useEffect } from 'react';
import { Heart, ListPlus, Eye, MoreHorizontal, Trash2, Edit2, Plus, Check, X, Play, Pause, Globe, Lock } from 'lucide-react';
import ReactionsBar from './ReactionsBar.jsx';
import CommentsSection from './CommentsSection.jsx';
import { API } from '../../config/api.js';
import { ShareButton } from '../social/SocialFeatures.jsx';

const EditSongModal = ({ song, token, onClose, onSaved }) => {
  const [titre, setTitre] = useState(song.titre || '');
  const [artiste, setArtiste] = useState(song.artiste || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`${API}/songs/${song._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ titre, artiste })
    });
    setLoading(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[350] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-black text-base flex items-center gap-2">
            <Edit2 size={16} className="text-red-400" /> Modifier le titre
          </h4>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Titre</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} required
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Artiste</label>
            <input value={artiste} onChange={e => setArtiste(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
          </div>
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              {loading ? 'Sauvegarde...' : <><Check size={14} /> Sauvegarder</>}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SongRow = ({
  song, index, currentSong, setCurrentSong, setIsPlaying, toggleLike,
  addToQueue, token, isLoggedIn, userNom, isAdmin, isArtist, userArtistId,
  userId,
  playlists, userPlaylists, onAddToUserPlaylist, ajouterAPlaylist,
  onDeleted, onRefresh, isPlaying,
  onTogglePlaylistVisibility,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const menuRef = useRef();
  const isActive = currentSong?._id === song._id;
  const canManage = isAdmin || (isArtist && String(song.artisteId) === String(userArtistId));

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${song.titre}" ?`)) return;
    setMenuOpen(false);
    await fetch(`${API}/songs/${song._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (onDeleted) onDeleted(song._id);
  };

  const handleToggleVisibility = async (playlist) => {
    try {
      const res = await fetch(`${API}/user-playlists/${playlist._id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isPublic: !playlist.isPublic })
      });
      if (res.ok && onTogglePlaylistVisibility) onTogglePlaylistVisibility();
    } catch {}
  };

  // /user-playlists/mine retourne déjà seulement les playlists de l'user connecté
  // Pas besoin de filtrer côté frontend
  const myPlaylists = userPlaylists || [];
  const adminPlaylists = isAdmin ? (playlists || []) : [];
  const allMyPlaylists = [...myPlaylists, ...adminPlaylists];


  return (
    <>
      {showEditModal && (
        <EditSongModal
          song={song} token={token}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { if (onRefresh) onRefresh(); }}
        />
      )}

      <div className={`p-3 rounded-xl transition-all duration-200 group relative ${
        isActive ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'
      }`}>
        <div className="flex items-center gap-3">

          {/* Index / Play indicator */}
          <div className="w-5 shrink-0 flex items-center justify-center">
            {isActive && isPlaying
              ? <div className="flex gap-0.5 items-end h-4">
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_infinite]" style={{ height: '60%' }} />
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_0.15s_infinite]" style={{ height: '100%' }} />
                  <div className="w-0.5 bg-red-500 rounded-full animate-[bounce_0.8s_0.3s_infinite]" style={{ height: '40%' }} />
                </div>
              : <span className="text-zinc-600 font-mono text-xs group-hover:hidden">{index + 1}</span>
            }
            {!isActive && (
              <button
                className="hidden group-hover:flex items-center justify-center text-white"
                onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
                <Play size={12} fill="white" />
              </button>
            )}
          </div>

          {/* Cover */}
          <div className="relative shrink-0 cursor-pointer" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
            <img src={song.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
            {isActive && isPlaying && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Pause size={12} fill="white" className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
            <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
            <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
          </div>

          {/* Actions — toujours visibles sur mobile, au hover sur desktop */}
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0">
            <button
              onClick={e => { e.stopPropagation(); toggleLike(song._id); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <Heart
                size={14}
                fill={song.liked ? 'red' : 'none'}
                className={song.liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'}
              />
            </button>
            <button
              onClick={e => { e.stopPropagation(); addToQueue(song); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <ListPlus size={14} className="text-zinc-400 hover:text-white" />
            </button>
            <div
              onClick={e => e.stopPropagation()}
              className="p-1.5 hover:bg-white/10 rounded-lg transition flex items-center justify-center">
              <ShareButton song={song} size={14} />
            </div>
          </div>

          {/* Play count */}
          {song.plays > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[10px] text-zinc-700 shrink-0 group-hover:opacity-0 transition">
              <Eye size={9} /> {song.plays}
            </div>
          )}

          {/* Context menu */}
          {(canManage || isLoggedIn) && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <MoreHorizontal size={14} className="text-zinc-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-[100] bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl py-1 min-w-[200px] overflow-hidden">

                  {/* Ajouter à une playlist — propriétaire uniquement */}
                  {isLoggedIn && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); setShowPlaylistPicker(!showPlaylistPicker); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                        <Plus size={13} /> Ajouter à une playlist
                      </button>

                      {showPlaylistPicker && (
                        <div className="border-t border-zinc-800 py-1 max-h-48 overflow-y-auto">
                          {allMyPlaylists.length === 0
                            ? <p className="px-4 py-2 text-[11px] text-zinc-600 italic">Aucune playlist</p>
                            : allMyPlaylists.map(p => {
                              const isUserPl = myPlaylists.some(up => up._id === p._id);
                              return (
                                <div key={p._id} className="flex items-center gap-1 pr-2">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (isUserPl) {
                                        onAddToUserPlaylist?.(p._id, song._id);
                                      } else {
                                        ajouterAPlaylist?.(p._id, song._id);
                                      }
                                      setMenuOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-2 px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition text-left">
                                    {p.isPublic !== undefined
                                      ? p.isPublic
                                        ? <Globe size={10} className="text-green-500 shrink-0" />
                                        : <Lock size={10} className="text-zinc-600 shrink-0" />
                                      : <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                                    }
                                    <span className="truncate">{p.nom}</span>
                                  </button>

                                  {/* Toggle public/privé */}
                                  {isUserPl && (
                                    <button
                                      onClick={e => { e.stopPropagation(); handleToggleVisibility(p); }}
                                      title={p.isPublic ? 'Rendre privée' : 'Rendre publique'}
                                      className="p-1.5 rounded-lg hover:bg-white/10 transition shrink-0">
                                      {p.isPublic
                                        ? <Globe size={11} className="text-green-500" />
                                        : <Lock size={11} className="text-zinc-600 hover:text-zinc-400" />
                                      }
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </>
                  )}

                  {/* Admin/artiste actions */}
                  {canManage && (
                    <div className="border-t border-zinc-800 mt-1 pt-1">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowEditModal(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition">
                        <Edit2 size={13} /> Modifier
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={13} /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reactions + Comments */}
        <div className="pl-8 mt-0.5">
          <ReactionsBar songId={song._id} token={token} isLoggedIn={isLoggedIn} />
          <CommentsSection songId={song._id} token={token} userNom={userNom} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </>
  );
};

export default SongRow;