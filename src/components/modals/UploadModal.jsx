import React, { useState } from 'react';
import { X, Plus, Loader2, Upload, Music, Image, CheckCircle } from 'lucide-react';
import { API } from '../../config/api';

const UploadModal = ({ token, artists, albums, onClose, onSuccess, userRole, userArtistId, userNom }) => {
  const [titre, setTitre] = useState('');
  const [artisteId, setArtisteId] = useState(userRole === 'artist' ? userArtistId : '');
  const [albumId, setAlbumId] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  const myAlbums = userRole === 'artist'
    ? albums.filter(a => String(a.artisteId) === String(userArtistId))
    : albums;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return setError("Fichier audio requis");
    setLoading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('audio', audioFile);
    if (imageFile) formData.append('image', imageFile);
    if (titre) formData.append('titre', titre);
    if (artisteId) formData.append('artisteId', artisteId);
    if (albumId) formData.append('albumId', albumId);

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const d = JSON.parse(xhr.responseText);
              reject(new Error(d.message || 'Erreur upload'));
            } catch {
              reject(new Error('Erreur upload'));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau'));
        xhr.send(formData);
      });

      setUploadDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 900);
    } catch (err) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic flex items-center gap-2">
            <Upload size={20} className="text-red-500" /> Ajouter une musique
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Cover image preview */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
              <Image size={11} /> Image de couverture
            </label>
            <label className="cursor-pointer block">
              <div className={`w-full h-28 rounded-2xl border-2 border-dashed transition flex items-center justify-center overflow-hidden relative group
                ${imagePreview ? 'border-transparent' : 'border-zinc-700 hover:border-zinc-500'}`}>
                {imagePreview
                  ? <>
                    <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <p className="text-xs font-bold text-white">Changer</p>
                    </div>
                  </>
                  : <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <Image size={24} />
                    <p className="text-xs">Cliquer pour sélectionner</p>
                  </div>
                }
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Titre</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Nom de la musique"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
          </div>

          {/* Artist select (admin only) */}
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

          {/* Artist badge (artist role) */}
          {userRole === 'artist' && (
            <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl px-4 py-3 text-sm text-purple-300 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black">
                {(userNom || '?')[0]}
              </div>
              Publié sous : <span className="font-bold">{userNom}</span>
            </div>
          )}

          {/* Album select */}
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

          {/* Audio file */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
              <Music size={11} /> Fichier MP3 *
            </label>
            <label className="cursor-pointer block">
              <div className={`w-full rounded-xl border-2 border-dashed px-4 py-4 flex items-center gap-3 transition
                ${audioFile ? 'border-red-600/40 bg-red-600/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                <Music size={20} className={audioFile ? 'text-red-400' : 'text-zinc-600'} />
                <div className="min-w-0 flex-1">
                  {audioFile
                    ? <>
                      <p className="text-sm font-bold text-red-400 truncate">{audioFile.name}</p>
                      <p className="text-[10px] text-zinc-500">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </>
                    : <p className="text-sm text-zinc-500">Sélectionner un fichier MP3</p>
                  }
                </div>
              </div>
              <input type="file" accept="audio/mp3,audio/mpeg" className="hidden"
                onChange={e => setAudioFile(e.target.files[0])} required />
            </label>
          </div>

          {/* Upload progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-400">Upload en cours...</span>
                <span className="text-red-400">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 text-center">
                {uploadProgress < 100 ? 'Envoi du fichier...' : 'Traitement en cours...'}
              </p>
            </div>
          )}

          {uploadDone && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={16} /> Musique ajoutée avec succès !
            </div>
          )}

          {error && <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>}

          <button type="submit" disabled={loading || uploadDone}
            className="mt-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Envoi en cours ({uploadProgress}%)</>
              : uploadDone
                ? <><CheckCircle size={18} /> Terminé !</>
                : <><Plus size={18} /> Ajouter la musique</>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
