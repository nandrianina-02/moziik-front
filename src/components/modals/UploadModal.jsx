import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { API } from '../../config/api';

const UploadModal = ({ token, artists, albums, onClose, onSuccess, userRole, userArtistId, userNom }) => {
  const [titre, setTitre] = useState('');
  const [artisteId, setArtisteId] = useState(userRole === 'artist' ? userArtistId : '');
  const [albumId, setAlbumId] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const myAlbums = userRole === 'artist'
    ? albums.filter(a => String(a.artisteId) === String(userArtistId))
    : albums;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return setError("Fichier audio requis");
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (imageFile) formData.append('image', imageFile);
    if (titre) formData.append('titre', titre);
    if (artisteId) formData.append('artisteId', artisteId);
    if (albumId) formData.append('albumId', albumId);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.message || "Erreur upload"); }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic">Ajouter une musique</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Titre</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Nom de la musique (optionnel)"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
          </div>
          {userRole === 'admin' && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Artiste</label>
              <select value={artisteId} onChange={e => setArtisteId(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white">
                <option value="">Artiste Local</option>
                {artists.map(a => <option key={a._id} value={a._id}>{a.nom}</option>)}
              </select>
            </div>
          )}
          {userRole === 'artist' && (
            <div className="bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400">
              Publié sous : <span className="text-white font-bold">{userNom}</span>
            </div>
          )}
          {myAlbums.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Album (optionnel)</label>
              <select value={albumId} onChange={e => setAlbumId(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white">
                <option value="">Aucun album</option>
                {myAlbums.map(a => <option key={a._id} value={a._id}>{a.titre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Fichier MP3 *</label>
            <input type="file" accept="audio/mp3,audio/mpeg" onChange={e => setAudioFile(e.target.files[0])}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white cursor-pointer" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Image de couverture (optionnel)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-700 file:text-white cursor-pointer" />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? 'Upload...' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
