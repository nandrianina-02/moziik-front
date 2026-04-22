// ════════════════════════════════════════════════════════════════
// AdminLibraryView.jsx
// Bibliothèque complète admin — recherche, édition inline,
// notifications musiques incomplètes (sans artiste / sans album)
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, AlertTriangle, CheckCircle, Edit3, Save, X,
  Trash2, Music, Mic2, Disc3, RefreshCw, Filter,
  ChevronDown, Loader2, SortAsc, SortDesc, Bell,
  Image as ImageIcon, Tag, Play, Pause, Eye, EyeOff,
  ArrowUpDown, AlertCircle, Check, Globe, Lock,
  MoreVertical, Plus
} from 'lucide-react';
import { API } from '../config/api';

// ─── Badge statut musique ─────────────────────────────────────
const StatusBadge = ({ song }) => {
  const missing = [];
  if (!song.artiste && !song.artisteId) missing.push('artiste');
  if (!song.albumId) missing.push('album');

  if (missing.length === 0)
    return <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"><Check size={8}/> Complet</span>;
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
      <AlertCircle size={8}/> Manque : {missing.join(', ')}
    </span>
  );
};

// ─── Modal édition d'une chanson ──────────────────────────────
const EditSongModal = ({ song, token, artists, albums, onClose, onSaved }) => {
  const [titre, setTitre]       = useState(song.titre || '');
  const [artiste, setArtiste]   = useState(song.artiste || '');
  const [artisteId, setArtisteId] = useState(song.artisteId?._id || song.artisteId || '');
  const [albumId, setAlbumId]   = useState(song.albumId?._id || song.albumId || '');
  const [genre, setGenre]       = useState(song.genre || '');
  const [annee, setAnnee]       = useState(song.annee || '');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [showArtistDd, setShowArtistDd] = useState(false);

  const filteredArtists = useMemo(() =>
    artists.filter(a => !artistSearch || a.nom.toLowerCase().includes(artistSearch.toLowerCase())),
    [artists, artistSearch]
  );

  const artistAlbums = useMemo(() =>
    albums.filter(a => String(a.artisteId?._id || a.artisteId) === String(artisteId)),
    [albums, artisteId]
  );

  const handleSave = async () => {
    if (!titre.trim()) return setError('Le titre est requis');
    setSaving(true); setError('');
    try {
      const body = {
        titre: titre.trim(),
        artiste: artiste.trim(),
        ...(artisteId && { artisteId }),
        ...(albumId && { albumId }),
        ...(genre && { genre }),
        ...(annee && { annee }),
      };
      const res = await fetch(`${API}/songs/${song._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur');
      onSaved(data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const selectArtist = (a) => {
    setArtisteId(a._id);
    setArtiste(a.nom);
    setArtistSearch('');
    setShowArtistDd(false);
    setAlbumId('');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
              {song.image
                ? <img src={song.image} className="w-full h-full object-cover" alt=""/>
                : <Music size={18} className="text-zinc-600 m-auto mt-2.5"/>
              }
            </div>
            <div>
              <h3 className="font-black text-sm">Modifier la musique</h3>
              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{song.titre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={16}/>
          </button>
        </div>

        {/* Statut actuel */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <StatusBadge song={{ ...song, artiste: artiste || song.artiste, artisteId: artisteId || song.artisteId, albumId }} />
            {(!artiste && !artisteId) && (
              <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full animate-pulse">
                Artiste manquant — notification admin active
              </span>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-5 pt-0 space-y-4">
          {/* Titre */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
              <Tag size={9}/> Titre *
            </label>
            <input value={titre} onChange={e => setTitre(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"
              placeholder="Titre de la chanson"/>
          </div>

          {/* Artiste — sélecteur avec recherche */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
              <Mic2 size={9}/> Artiste
              {(!artiste && !artisteId) && <span className="text-orange-400 ml-1 flex items-center gap-0.5"><AlertCircle size={9}/> requis</span>}
            </label>
            {artisteId ? (
              <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-600/30 rounded-xl px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center text-[9px] font-black text-purple-300 shrink-0">
                  {artiste[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-bold text-purple-300 flex-1 truncate">{artiste}</span>
                <button onClick={() => { setArtisteId(''); setArtiste(''); setAlbumId(''); }}
                  className="text-zinc-500 hover:text-white">
                  <X size={12}/>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-zinc-500"/>
                  <input value={artistSearch}
                    onChange={e => { setArtistSearch(e.target.value); setArtiste(e.target.value); setShowArtistDd(true); }}
                    onFocus={() => setShowArtistDd(true)}
                    placeholder="Rechercher ou saisir un artiste..."
                    className="w-full bg-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
                </div>
                {showArtistDd && artistSearch && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                    {filteredArtists.length === 0 ? (
                      <button onClick={() => { setArtiste(artistSearch); setShowArtistDd(false); }}
                        className="w-full px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700 text-left flex items-center gap-2">
                        <Plus size={12} className="text-zinc-500"/> Utiliser "{artistSearch}" (libre)
                      </button>
                    ) : filteredArtists.slice(0,6).map(a => (
                      <button key={a._id} onClick={() => selectArtist(a)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-700 transition text-left">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {a.image ? <img src={a.image} className="w-full h-full object-cover" alt=""/> : <Mic2 size={11} className="text-zinc-500"/>}
                        </div>
                        <span className="text-sm text-zinc-200">{a.nom}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Album */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
              <Disc3 size={9}/> Album (optionnel)
            </label>
            <select value={albumId} onChange={e => setAlbumId(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white">
              <option value="">— Aucun album —</option>
              {(artisteId ? artistAlbums : albums).map(a => (
                <option key={a._id} value={a._id}>{a.titre} ({a.annee})</option>
              ))}
            </select>
          </div>

          {/* Genre + Année sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Genre</label>
              <input value={genre} onChange={e => setGenre(e.target.value)}
                placeholder="ex: Afrobeats"
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Année</label>
              <input value={annee} onChange={e => setAnnee(e.target.value)} type="number" min="1900" max="2099"
                placeholder={new Date().getFullYear().toString()}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle size={12}/> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              Enregistrer
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Panneau notifications musiques incomplètes ───────────────
const IncompleteNotificationsPanel = ({ songs, onEdit, onDismiss }) => {
  const incomplete = useMemo(() =>
    songs.filter(s => !s.artiste && !s.artisteId),
    [songs]
  );

  if (incomplete.length === 0) return null;

  return (
    <div className="bg-orange-500/8 border border-orange-500/25 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/15">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Bell size={13} className="text-orange-400"/>
          </div>
          <div>
            <p className="text-sm font-black text-orange-300">Musiques à compléter</p>
            <p className="text-[10px] text-orange-400/60">{incomplete.length} titre{incomplete.length > 1 ? 's' : ''} sans artiste assigné</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-zinc-600 hover:text-white p-1 transition">
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="max-h-60 overflow-y-auto divide-y divide-orange-500/10">
        {incomplete.map(song => (
          <div key={song._id}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-500/5 transition group cursor-pointer"
            onClick={() => onEdit(song)}>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              {song.image
                ? <img src={song.image} className="w-full h-full object-cover" alt=""/>
                : <Music size={14} className="text-zinc-600 m-auto mt-2.5"/>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white/90">{song.titre || 'Sans titre'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-orange-400/80 bg-orange-500/10 px-1.5 py-0.5 rounded-full">sans artiste</span>
                {!song.albumId && <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">sans album</span>}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onEdit(song); }}
              className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition opacity-0 group-hover:opacity-100">
              <Edit3 size={10}/> Compléter
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-orange-500/15 flex items-center justify-between">
        <p className="text-[10px] text-orange-400/50">Ces musiques ne sont pas notifiées dans l'accueil</p>
        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
          {incomplete.length} à traiter
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// ADMIN LIBRARY VIEW — composant principal
// ════════════════════════════════════════════════════════════════
const AdminLibraryView = ({ token, currentSong, setCurrentSong, setIsPlaying, isPlaying }) => {
  const [songs, setSongs]           = useState([]);
  const [artists, setArtists]       = useState([]);
  const [albums, setAlbums]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all'); // all | incomplete | complete
  const [sortBy, setSortBy]         = useState('createdAt'); // createdAt | titre | plays | artiste
  const [sortDir, setSortDir]       = useState('desc');
  const [editingSong, setEditingSong] = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 30;

  // Charger données
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [artistsData, albumsData] = await Promise.all([
        fetch(`${API}/artists`).then(r => r.json()),
        fetch(`${API}/albums`).then(r => r.json()),
      ]);

      // Charger TOUTES les chansons page par page pour dépasser la limite du serveur
      let allSongs = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await fetch(`${API}/songs?page=${page}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) break;
        const data = await res.json();
        const batch = Array.isArray(data) ? data : (data.songs || []);
        allSongs = [...allSongs, ...batch];
        totalPages = data.pagination?.pages || 1;
        // Si réponse directe (tableau), pas de pagination
        if (Array.isArray(data)) break;
        page++;
      } while (page <= totalPages);

      setSongs(allSongs);
      setArtists(Array.isArray(artistsData) ? artistsData : []);
      setAlbums(Array.isArray(albumsData) ? albumsData : []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let list = [...songs];

    // Filtre texte
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.titre || '').toLowerCase().includes(q) ||
        (s.artiste || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q)
      );
    }

    // Filtre statut
    if (filter === 'incomplete') list = list.filter(s => !s.artiste && !s.artisteId);
    if (filter === 'complete')   list = list.filter(s => s.artiste || s.artisteId);

    // Tri
    list.sort((a, b) => {
      let va = a[sortBy] || '';
      let vb = b[sortBy] || '';
      if (sortBy === 'createdAt') { va = new Date(va); vb = new Date(vb); }
      else if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [songs, search, filter, sortBy, sortDir]);

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const incompleteCount = useMemo(() => songs.filter(s => !s.artiste && !s.artisteId).length, [songs]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`Supprimer "${song.titre}" ?`)) return;
    setDeleting(song._id);
    await fetch(`${API}/songs/${song._id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
    setSongs(prev => prev.filter(s => s._id !== song._id));
    setDeleting(null);
  };

  const handleSaved = (updated) => {
    setSongs(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s));
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={11} className="text-zinc-700"/>;
    return sortDir === 'asc' ? <SortAsc size={11} className="text-red-400"/> : <SortDesc size={11} className="text-red-400"/>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Titre page ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-xl flex items-center justify-center">
              <Music size={18} className="text-red-400"/>
            </div>
            Bibliothèque Admin
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1">
            {songs.length} titre{songs.length > 1 ? 's' : ''} au total
            {incompleteCount > 0 && <span className="text-orange-400 ml-2">· {incompleteCount} incomplet{incompleteCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-xl transition disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
          Actualiser
        </button>
      </div>

      {/* ── Panneau notifications incomplètes ── */}
      {!notifDismissed && (
        <IncompleteNotificationsPanel
          songs={songs}
          onEdit={setEditingSong}
          onDismiss={() => setNotifDismissed(true)}
        />
      )}
      {notifDismissed && incompleteCount > 0 && (
        <button onClick={() => setNotifDismissed(false)}
          className="flex items-center gap-2 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 px-4 py-2 rounded-xl transition">
          <Bell size={12}/> {incompleteCount} musique{incompleteCount > 1 ? 's' : ''} incomplète{incompleteCount > 1 ? 's' : ''} — Voir
        </button>
      )}

      {/* ── Barre outils ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par titre, artiste, genre…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 ring-red-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
              <X size={13}/>
            </button>
          )}
        </div>

        {/* Filtre statut */}
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0">
          {[
            { key: 'all',        label: 'Tous' },
            { key: 'incomplete', label: `Incomplets ${incompleteCount > 0 ? `(${incompleteCount})` : ''}` },
            { key: 'complete',   label: 'Complets' },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-2 text-[11px] font-bold transition whitespace-nowrap ${
                filter === f.key
                  ? f.key === 'incomplete' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-600/20 text-red-300'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: songs.length, color: 'text-white', bg: 'bg-zinc-800/60' },
          { label: 'Complets', value: songs.length - incompleteCount, color: 'text-green-400', bg: 'bg-green-500/8' },
          { label: 'Sans artiste', value: incompleteCount, color: 'text-orange-400', bg: 'bg-orange-500/8' },
          { label: 'Écoutes totales', value: songs.reduce((acc, s) => acc + (s.plays || 0), 0).toLocaleString(), color: 'text-blue-400', bg: 'bg-blue-500/8' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border border-zinc-800/50 rounded-xl p-3`}>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tableau ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
        {/* En-têtes */}
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-2 px-4 py-3 bg-zinc-950/50 border-b border-zinc-800/50 text-[10px] font-bold text-zinc-600 uppercase tracking-widest items-center">
          <div className="w-10"></div>
          <button className="flex items-center gap-1 text-left hover:text-zinc-400 transition" onClick={() => toggleSort('titre')}>
            Titre <SortIcon col="titre"/>
          </button>
          <button className="flex items-center gap-1 text-left hover:text-zinc-400 transition" onClick={() => toggleSort('artiste')}>
            Artiste <SortIcon col="artiste"/>
          </button>
          <div>Album / Genre</div>
          <button className="flex items-center gap-1 hover:text-zinc-400 transition" onClick={() => toggleSort('plays')}>
            Écoutes <SortIcon col="plays"/>
          </button>
          <div>Actions</div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-600">
            <Loader2 size={22} className="animate-spin mr-2"/> Chargement...
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-600 gap-2">
            <Music size={32} className="opacity-20"/>
            <p className="text-sm">{search ? `Aucun résultat pour "${search}"` : 'Aucune musique'}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/30">
            {paginated.map(song => {
              const isActive = currentSong?._id === song._id;
              const isIncomplete = !song.artiste && !song.artisteId;

              return (
                <div key={song._id}
                  className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-2 px-4 py-3 items-center transition group
                    ${isActive ? 'bg-red-600/5' : 'hover:bg-zinc-800/30'}
                    ${isIncomplete ? 'border-l-2 border-orange-500/40' : ''}`}>

                  {/* Pochette + play */}
                  <div className="relative w-10 h-10 cursor-pointer shrink-0"
                    onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
                    {song.image
                      ? <img src={song.image} className="w-10 h-10 rounded-lg object-cover" alt=""/>
                      : <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><Music size={14} className="text-zinc-600"/></div>
                    }
                    <div className={`absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center transition ${isActive && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isActive && isPlaying ? <Pause fill="white" size={12}/> : <Play fill="white" size={12} className="ml-0.5"/>}
                    </div>
                  </div>

                  {/* Titre */}
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : 'text-zinc-200'}`}>
                      {song.titre || <span className="text-zinc-600 italic">Sans titre</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusBadge song={song}/>
                    </div>
                  </div>

                  {/* Artiste */}
                  <div className="min-w-0">
                    {song.artiste || song.artisteId ? (
                      <p className="text-xs text-zinc-400 truncate">{song.artiste}</p>
                    ) : (
                      <span className="text-[10px] text-orange-400/80 flex items-center gap-1">
                        <AlertCircle size={9}/> Non assigné
                      </span>
                    )}
                  </div>

                  {/* Album / Genre */}
                  <div className="min-w-0">
                    {song.albumId ? (
                      <p className="text-[11px] text-indigo-400/80 truncate flex items-center gap-1">
                        <Disc3 size={9}/> {typeof song.albumId === 'object' ? song.albumId.titre : 'Album'}
                      </p>
                    ) : (
                      <span className="text-[10px] text-zinc-600">—</span>
                    )}
                    {song.genre && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{song.genre}</p>}
                  </div>

                  {/* Écoutes */}
                  <div className="text-center">
                    <p className="text-xs font-bold text-zinc-400">{(song.plays || 0).toLocaleString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSong(song)}
                      title="Modifier"
                      className={`p-1.5 rounded-lg transition ${isIncomplete ? 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-700'}`}>
                      <Edit3 size={13}/>
                    </button>
                    <button
                      onClick={() => handleDelete(song)}
                      disabled={deleting === song._id}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50">
                      {deleting === song._id
                        ? <Loader2 size={13} className="animate-spin"/>
                        : <Trash2 size={13}/>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50 bg-zinc-950/30">
            <p className="text-[10px] text-zinc-600">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30 hover:bg-zinc-800 rounded-lg transition">
                ‹ Préc.
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 text-xs rounded-lg transition ${p === page ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-white disabled:opacity-30 hover:bg-zinc-800 rounded-lg transition">
                Suiv. ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal édition ── */}
      {editingSong && (
        <EditSongModal
          song={editingSong}
          token={token}
          artists={artists}
          albums={albums}
          onClose={() => setEditingSong(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminLibraryView;