import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { TrendingUp, Music, Users, Eye, Flame, BarChart2, Play } from 'lucide-react';
import { API } from '../config/api';
import { DashboardSkeleton } from '../components/ui/Skeletons';

// ── Palette ────────────────────────────────────────────────────────────────────
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'text-red-400' }) => (
  <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50 flex items-start gap-4">
    <div className={`p-2.5 rounded-xl bg-zinc-800 ${color} shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{label}</p>
      <p className="text-2xl font-black mt-0.5">{value?.toLocaleString() ?? '—'}</p>
      {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const EnhancedDashboardView = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [playsHistory, setPlaysHistory] = useState([]);
  const [topSongs, setTopSongs] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const h = { Authorization: `Bearer ${token}` };
      try {
        const [statsRes, histRes, songsRes, artistsRes, usersRes] = await Promise.all([
          fetch(`${API}/admin/stats`, { headers: h }),
          fetch(`${API}/admin/stats/plays-history?period=${period}`, { headers: h }),
          fetch(`${API}/admin/stats/top-songs?limit=10`, { headers: h }),
          fetch(`${API}/admin/stats/top-artists?limit=6`, { headers: h }),
          fetch(`${API}/admin/stats/users-growth`, { headers: h }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (histRes.ok) setPlaysHistory(await histRes.json());
        if (songsRes.ok) setTopSongs(await songsRes.json());
        if (artistsRes.ok) setTopArtists(await artistsRes.json());
        if (usersRes.ok) setUserStats(await usersRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, [token, period]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart2 size={22} className="text-red-400" /> Dashboard
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Vue d'ensemble de votre plateforme</p>
        </div>
        {/* Sélecteur période */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                period === p ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'
              }`}>
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '3 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Music size={18} />} label="Titres" value={stats?.totalSongs} sub="dans la bibliothèque" color="text-red-400" />
        <StatCard icon={<Users size={18} />} label="Utilisateurs" value={stats?.totalUsers} sub={`+${stats?.newUsersThisWeek ?? 0} cette semaine`} color="text-blue-400" />
        <StatCard icon={<Eye size={18} />} label="Écoutes totales" value={stats?.totalPlays} sub="depuis le début" color="text-green-400" />
        <StatCard icon={<Flame size={18} />} label="Écoutes aujourd'hui" value={stats?.playsToday} sub="en temps réel" color="text-orange-400" />
      </div>

      {/* Graphique écoutes */}
      {playsHistory.length > 0 && (
        <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
          <h2 className="font-bold text-sm text-zinc-300 mb-5 flex items-center gap-2">
            <TrendingUp size={15} className="text-red-400" /> Écoutes dans le temps
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={playsHistory} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="playsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="plays" name="Écoutes" stroke="#ef4444" strokeWidth={2} fill="url(#playsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top songs + Top artists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top 10 songs */}
        {topSongs.length > 0 && (
          <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
            <h2 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
              <Flame size={15} className="text-orange-400" /> Top 10 titres
            </h2>
            <div className="space-y-2">
              {topSongs.map((song, i) => (
                <div key={song._id} className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-zinc-700 w-5 text-right shrink-0">{i + 1}</span>
                  <img src={song.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{song.titre}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{song.artiste}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
                    <Play size={9} /> {song.plays?.toLocaleString()}
                  </div>
                  {/* Mini bar */}
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-red-500 rounded-full"
                      style={{ width: `${topSongs[0].plays ? (song.plays / topSongs[0].plays) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top artistes pie + bar */}
        {topArtists.length > 0 && (
          <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
            <h2 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
              <Users size={15} className="text-blue-400" /> Top artistes
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topArtists} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nom" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="plays" name="Écoutes" radius={[0, 6, 6, 0]}>
                  {topArtists.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Croissance utilisateurs */}
      {userStats.length > 0 && (
        <div className="bg-zinc-900/60 rounded-2xl p-5 border border-zinc-800/50">
          <h2 className="font-bold text-sm text-zinc-300 mb-5 flex items-center gap-2">
            <Users size={15} className="text-blue-400" /> Croissance utilisateurs
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={userStats} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" name="Utilisateurs" stroke="#3b82f6" strokeWidth={2} fill="url(#usersGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboardView;
