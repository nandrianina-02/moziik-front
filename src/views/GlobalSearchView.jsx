import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Music, Mic2, Disc3, Globe, Play, Pause,
  Loader2, X, TrendingUp
} from 'lucide-react';
import { API } from '../config/api';

/**
 * GlobalSearchView
 * Affiche les résultats de recherche globale : musiques, artistes, albums, playlists
 * Utilisée dans HomeView quand searchTerm est défini, ou en page dédiée
 */
const GlobalSearchView = ({
  searchTerm, currentSong, setCurrentSong, setIsPlaying, isPlaying,
  toggleLike, onClear,
}) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await fetch(`${API}/search/global?q=${encodeURIComponent(q.trim())}`).then(r => r.json());
      setResults(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm, doSearch]);

  const total = results
    ? (results.songs?.length || 0) + (results.artists?.length || 0) +
      (results.albums?.length || 0) + (results.playlists?.length || 0)
    : 0;

  if (!searchTerm) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-zinc-300">
            Résultats pour <span className="text-white">"{searchTerm}"</span>
          </h2>
          {results && !loading && (
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {total} résultat{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {onClear && (
          <button onClick={onClear} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <X size={15} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-600">
          <Loader2 size={22} className="animate-spin mr-2" /> Recherche...
        </div>
      )}

      {!loading && results && total === 0 && (
        <div className="flex flex-col items-center py-16 text-zinc-600 gap-3">
          <Search size={38} className="opacity-20" />
          <p className="text-sm">Aucun résultat pour "{searchTerm}"</p>
        </div>
      )}

      {!loading && results && total > 0 && (
        <>
          {/* ── Musiques ── */}
          {results.songs?.length > 0 && (
            <section>
              <SectionTitle icon={<Music size={15} className="text-red-400"/>} label="Musiques" count={results.songs.length} />
              <div className="flex flex-col gap-1">
                {results.songs.map((song, i) => {
                  const isActive = currentSong?._id === song._id;
                  return (
                    <div key={song._id}
                      onClick={() => { setCurrentSong(song); setIsPlaying(true); }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer group transition ${isActive ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'}`}>
                      <div className="relative shrink-0">
                        <img src={song.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        {isActive && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <Pause size={12} fill="white" className="text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play size={12} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-red-400' : ''}`}>{song.titre}</p>
                        <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
                      </div>
                      {song.plays > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-zinc-700 shrink-0">
                          <TrendingUp size={9} className="text-green-500/70" /> {song.plays}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Artistes ── */}
          {results.artists?.length > 0 && (
            <section>
              <SectionTitle icon={<Mic2 size={15} className="text-purple-400"/>} label="Artistes" count={results.artists.length} />
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {results.artists.map(a => (
                  <Link key={a._id} to={`/artist/${a._id}`}
                    className="shrink-0 w-24 text-center group">
                    <div className="w-20 h-20 rounded-full mx-auto mb-2 overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-purple-500/50 transition">
                      {a.image
                        ? <img src={a.image} className="w-full h-full object-cover" alt="" />
                        : <Mic2 size={26} className="text-zinc-600 m-auto mt-5" />}
                    </div>
                    <p className="text-xs font-bold truncate text-zinc-300 group-hover:text-purple-400 transition">{a.nom}</p>
                    {a.bio && <p className="text-[9px] text-zinc-600 truncate mt-0.5">{a.bio}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Albums ── */}
          {results.albums?.length > 0 && (
            <section>
              <SectionTitle icon={<Disc3 size={15} className="text-indigo-400"/>} label="Albums" count={results.albums.length} />
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {results.albums.map(album => (
                  <Link key={album._id} to={`/album/${album._id}`}
                    className="shrink-0 w-28 group">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 mb-2 group-hover:scale-105 transition">
                      {album.image
                        ? <img src={album.image} className="w-full h-full object-cover" alt="" />
                        : <Disc3 size={32} className="text-indigo-400 m-auto mt-10" />}
                    </div>
                    <p className="text-xs font-bold truncate text-zinc-200">{album.titre}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{album.artiste} · {album.annee}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Playlists ── */}
          {results.playlists?.length > 0 && (
            <section>
              <SectionTitle icon={<Globe size={15} className="text-green-400"/>} label="Playlists publiques" count={results.playlists.length} />
              <div className="flex flex-col gap-2">
                {results.playlists.map(pl => (
                  <Link key={pl._id} to={`/my-playlist/${pl._id}`}
                    className="flex items-center gap-3 p-3 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition group">
                    <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center shrink-0">
                      <Globe size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-green-400 transition">{pl.nom}</p>
                      <p className="text-[10px] text-zinc-600">par {pl.userId?.nom || 'Utilisateur'} · {pl.musiques?.length || 0} titre{pl.musiques?.length !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const SectionTitle = ({ icon, label, count }) => (
  <div className="flex items-center gap-2 mb-3">
    {icon}
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</h3>
    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">{count}</span>
  </div>
);

export default GlobalSearchView;