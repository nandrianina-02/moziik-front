import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Mic2, Disc3, Music } from 'lucide-react';
import { API } from '../config/api';
import SongRow from '../components/music/SongRow';

const ArtistView = ({ setCurrentSong, setIsPlaying, currentSong, toggleLike, addToQueue, token, isLoggedIn, userNom }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/artists/${id}`).then(r => r.json()),
      fetch(`${API}/albums?artisteId=${id}`).then(r => r.json()).catch(() => [])
    ]).then(([artistData, albumData]) => {
      setData(artistData);
      setAlbums(Array.isArray(albumData) ? albumData : []);
    });
  }, [id]);

  if (!data) return <div className="p-8 text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Chargement...</div>;
  const { artist, songs } = data;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-end gap-4 md:gap-6 mb-8 bg-gradient-to-t from-zinc-900/50 to-red-900/20 p-4 md:p-6 rounded-3xl">
        <div className="w-24 h-24 md:w-48 md:h-48 bg-zinc-800 rounded-full shadow-2xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
          {artist.image ? <img src={artist.image} className="w-full h-full object-cover" alt="" /> : <Mic2 size={48} className="text-red-600" />}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Artiste</p>
          <h2 className="text-2xl md:text-5xl font-black mb-2">{artist.nom}</h2>
          {artist.bio && <p className="text-zinc-400 text-sm mb-2 max-w-xl">{artist.bio}</p>}
          <p className="text-zinc-500 text-xs">{songs.length} titre{songs.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {albums.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Disc3 size={18} className="text-indigo-400" />
            <h3 className="font-black text-base uppercase tracking-wide">Albums</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {albums.map(album => (
              <Link key={album._id} to={`/album/${album._id}`} className="shrink-0 w-32 group">
                <div className="w-32 h-32 bg-zinc-800 rounded-xl overflow-hidden shadow-lg mb-2 group-hover:scale-105 transition">
                  {album.image ? <img src={album.image} className="w-full h-full object-cover" alt="" /> : <Disc3 size={32} className="text-indigo-400 m-auto mt-12" />}
                </div>
                <p className="text-xs font-bold truncate">{album.titre}</p>
                <p className="text-[10px] text-zinc-500">{album.annee}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Music size={18} className="text-zinc-400" />
        <h3 className="font-black text-base uppercase tracking-wide">Tous les titres</h3>
      </div>
      <div className="flex flex-col gap-1">
        {songs.map((song, index) => (
          <SongRow key={song._id} song={song} index={index} currentSong={currentSong}
            setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying}
            toggleLike={toggleLike} addToQueue={addToQueue}
            token={token} isLoggedIn={isLoggedIn} userNom={userNom} />
        ))}
      </div>
    </div>
  );
};

export default ArtistView;
