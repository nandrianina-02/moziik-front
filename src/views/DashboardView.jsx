import React, { useState, useEffect } from 'react';
import { Loader2, BarChart2, Music, Mic2, ListOrdered, Eye, Heart } from 'lucide-react';
import { API } from '../config/api';

const DashboardView = ({ token }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(setStats);
  }, [token]);

  if (!stats) return <div className="p-8 text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Chargement...</div>;

  const cards = [
    { label: 'Musiques', value: stats.totalSongs, icon: <Music size={20} />, color: 'text-red-400' },
    { label: 'Artistes', value: stats.totalArtists, icon: <Mic2 size={20} />, color: 'text-purple-400' },
    { label: 'Playlists', value: stats.totalPlaylists, icon: <ListOrdered size={20} />, color: 'text-blue-400' },
    { label: 'Écoutes', value: stats.totalPlays, icon: <Eye size={20} />, color: 'text-green-400' },
    { label: 'Favoris', value: stats.totalLikes, icon: <Heart size={20} />, color: 'text-pink-400' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><BarChart2 size={24} className="text-red-500" /> Tableau de bord</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 md:p-5">
            <div className={`mb-3 ${c.color}`}>{c.icon}</div>
            <div className="text-2xl font-black">{c.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Top 5 musiques</h3>
      <div className="flex flex-col gap-2">
        {stats.topSongs.map((song, i) => (
          <div key={song._id} className="flex items-center gap-4 p-3 bg-zinc-900/40 rounded-xl">
            <span className="text-zinc-600 font-mono text-xs w-4">{i + 1}</span>
            <img src={song.image} className="w-10 h-10 rounded-md object-cover" alt="" />
            <div className="flex-1">
              <p className="text-sm font-bold">{song.titre}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{song.artiste}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400"><Eye size={12} /> {song.plays}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
