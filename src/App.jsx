import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Home, Play, Pause, SkipBack, SkipForward, Volume2, Plus, Shuffle,
  Trash2, ListPlus, Search, Music, Heart, ListOrdered, Sliders,
  LogIn, LogOut, ShieldCheck, Repeat, Repeat1, Timer, Gauge, BarChart2,
  Users, Mic2, X, Disc3, Globe, Lock, ChevronDown, UserCircle, Settings,
  Maximize2, Minimize2, ChevronUp, Eye, TrendingUp, Flame, Sparkles, Dices, History
} from 'lucide-react';

import { API } from './config/api';

import LoginModal from './components/modals/LoginModal';
import UploadModal from './components/modals/UploadModal';
import CreatePlaylistModal from './components/modals/CreatePlaylistModal';
import LoadingScreen from './components/ui/LoadingScreen';

import HomeView from './views/HomeView';
import AlbumView from './views/AlbumView';
import ArtistView from './views/ArtistView';
import PlaylistView from './views/PlaylistView';
import UserPlaylistView from './views/UserPlaylistView';
import FavoritesView from './views/FavoritesView';
import DashboardView from './views/DashboardView';
import ArtistsAdminView from './views/ArtistsAdminView';
import MyAlbumsView from './views/MyAlbumsView';
import ArtistsListView from './views/ArtistsListView';
import AccountView from './views/AccountView';
import UsersAdminView from './views/UsersAdminView';
import PublicPlaylistsView from './views/PublicPlaylistsView';
import { NotificationsPanel } from './components/social/SocialFeatures';
import { HistoryView } from './components/social/SocialFeatures';
import { RecommendationsView } from './components/social/SocialFeatures';


// ── GRANDE PAGE PLAYER ────────────────────────────────────────────────────────
const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying, currentTime, duration,
  handleNext, handlePrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
  toggleLike, volume, setVolume, queue, setQueue, audioRef, initAudioEngine,
  bassGain, setBassGain, midGain, setMidGain, trebleGain, setTrebleGain,
  bassFilterRef, midFilterRef, trebleFilterRef,
  playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, onClose, canvasRef,
}) => {
  const [activeTab, setActiveTab] = useState('eq'); // 'eq' | 'queue'
  const prog = (currentTime / duration) * 100 || 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col md:flex-row overflow-hidden">

      {/* ── Fond dynamique flou ── */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {currentSong && (
          <img src={currentSong.image} className="w-full h-full object-cover blur-3xl scale-110" alt="" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 pointer-events-none" />

      {/* ── Bouton fermer ── */}
      <button onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition text-zinc-400 hover:text-white">
        <ChevronDown size={20} />
      </button>

      {/* ── Colonne gauche: cover + contrôles ── */}
      <div className="relative flex flex-col items-center justify-center flex-1 p-6 md:p-12 gap-6 md:gap-8 min-h-0">
        {/* Visualizer canvas en haut */}
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-16 opacity-50" width="1000" height="60" />

        {/* Cover artwork */}
        <div className="relative w-48 h-48 md:w-72 md:h-72 lg:w-80 lg:h-80 shrink-0">
          <img src={currentSong?.image} alt=""
            className={`w-full h-full rounded-3xl object-cover shadow-2xl shadow-black/80 transition-all duration-500 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`} />
          {isPlaying && (
            <div className="absolute inset-0 rounded-3xl ring-2 ring-red-500/40 animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Titre + artiste */}
        <div className="text-center max-w-sm">
          <h2 className="text-xl md:text-2xl font-black truncate">{currentSong?.titre}</h2>
          <p className="text-zinc-400 text-sm mt-1">{currentSong?.artiste}</p>
        </div>

        {/* Barre de progression */}
        <div className="w-full max-w-sm flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 w-8 text-right shrink-0">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer group relative"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (audioRef.current) audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
            }}>
            <div className="h-full bg-red-600 rounded-full group-hover:bg-red-500 transition-all" style={{ width: `${prog}%` }} />
          </div>
          <span className="text-[11px] text-zinc-500 w-8 shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-5 md:gap-8">
          <button onClick={() => setIsShuffle(!isShuffle)} className={`transition ${isShuffle ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}>
            <Shuffle size={20} />
          </button>
          <button onClick={handlePrev} className="text-zinc-300 hover:text-white transition hover:scale-110 active:scale-95">
            <SkipBack size={28} />
          </button>
          <button onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
            className="w-16 h-16 bg-white rounded-full text-black flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-xl shadow-black/50">
            {isPlaying ? <Pause fill="black" size={26} /> : <Play fill="black" size={26} />}
          </button>
          <button onClick={handleNext} className="text-zinc-300 hover:text-white transition hover:scale-110 active:scale-95">
            <SkipForward size={28} />
          </button>
          <button onClick={() => setRepeatMode(m => (m + 1) % 3)} className={`transition ${repeatMode > 0 ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}>
            {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Volume + Like */}
        <div className="flex items-center gap-4 w-full max-w-sm">
          <button onClick={() => toggleLike(currentSong._id)}>
            <Heart size={20} fill={currentSong?.liked ? '#ef4444' : 'none'} className={currentSong?.liked ? 'text-red-500' : 'text-zinc-500 hover:text-white transition'} />
          </button>
          <Volume2 size={16} className="text-zinc-500 shrink-0" />
          <input type="range" value={volume} min="0" max="100"
            className="flex-1 h-1 accent-red-600 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            onChange={e => setVolume(parseInt(e.target.value))} />
          <span className="text-[11px] text-zinc-500 w-6 text-right">{volume}%</span>
        </div>
      </div>

      {/* ── Colonne droite: EQ + File d'attente ── */}
      <div className="relative w-full md:w-80 lg:w-96 bg-zinc-950/80 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {[['eq', <Sliders size={14} />, 'Égaliseur'], ['queue', <ListOrdered size={14} />, `File (${queue.length})`]].map(([key, icon, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold uppercase tracking-wider transition ${activeTab === key ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'eq' ? (
            <div className="space-y-5">
              {[
                { label: 'Graves', value: bassGain, set: (v) => { setBassGain(v); if (bassFilterRef.current) bassFilterRef.current.gain.value = v; }, color: 'accent-red-600' },
                { label: 'Médiums', value: midGain, set: (v) => { setMidGain(v); if (midFilterRef.current) midFilterRef.current.gain.value = v; }, color: 'accent-yellow-500' },
                { label: 'Aigus', value: trebleGain, set: (v) => { setTrebleGain(v); if (trebleFilterRef.current) trebleFilterRef.current.gain.value = v; }, color: 'accent-blue-500' },
              ].map(band => (
                <div key={band.label}>
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-zinc-400">
                    <span>{band.label}</span><span className="text-zinc-500">{band.value > 0 ? '+' : ''}{band.value} dB</span>
                  </div>
                  <input type="range" min="-12" max="12" step="1" value={band.value}
                    className={`w-full h-1.5 ${band.color} bg-zinc-700 rounded-lg appearance-none cursor-pointer`}
                    onChange={e => band.set(parseInt(e.target.value))} />
                  <div className="flex justify-between text-[9px] text-zinc-700 mt-0.5"><span>-12</span><span>0</span><span>+12</span></div>
                </div>
              ))}

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-1"><Gauge size={12} /> Vitesse</span>
                  <span className="text-zinc-500">{playbackRate}×</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.25" value={playbackRate}
                  className="w-full h-1.5 accent-purple-500 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  onChange={e => setPlaybackRate(parseFloat(e.target.value))} />
                <div className="flex justify-between text-[9px] text-zinc-700 mt-0.5"><span>0.5×</span><span>1×</span><span>1.5×</span><span>2×</span></div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between text-xs font-bold mb-3 uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-1"><Timer size={12} /> Minuterie</span>
                  {sleepRemaining && <span className="text-green-400 text-[11px]">{Math.floor(sleepRemaining / 60)}:{String(sleepRemaining % 60).padStart(2, '0')}</span>}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 15, 30, 45, 60].map(m => (
                    <button key={m} onClick={() => setSleepTimer(m)}
                      className={`py-2 rounded-lg text-xs font-bold transition ${sleepTimer === m ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                      {m === 0 ? 'Off' : `${m}'`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset EQ */}
              <button onClick={() => {
                setBassGain(0); setMidGain(0); setTrebleGain(0); setPlaybackRate(1);
                if (bassFilterRef.current) bassFilterRef.current.gain.value = 0;
                if (midFilterRef.current) midFilterRef.current.gain.value = 0;
                if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 0;
              }} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition">
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.length === 0
                ? <div className="text-center py-12 text-zinc-600">
                    <ListOrdered size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">File vide</p>
                  </div>
                : queue.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl group transition">
                    <img src={s.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{s.titre}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{s.artiste}</p>
                    </div>
                    <button onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/20 rounded-lg transition text-zinc-500 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
const MoozikWeb = () => {
  const [musiques, setMusiques] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  const [queue, setQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showEQ, setShowEQ] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragSongId, setDragSongId] = useState(null);

  const [bassGain, setBassGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [trebleGain, setTrebleGain] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isArtist, setIsArtist] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userNom, setUserNom] = useState('');
  const [userArtistId, setUserArtistId] = useState('');
  const [userId, setUserId] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('moozik_token') || '');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('moozik_avatar') || null);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const bassFilterRef = useRef(null);
  const midFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const sleepRef = useRef(null);
  const playCountedRef = useRef(false);

  const isLoggedIn = isAdmin || isArtist || isUser;
  const canUpload = isAdmin || isArtist;
  const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  // ── AUTH ──
  useEffect(() => {
    const savedToken = localStorage.getItem('moozik_token');
    const savedRole = localStorage.getItem('moozik_role');
    if (!savedToken) return;
    let endpoint = '/users/verify';
    if (savedRole === 'admin') endpoint = '/admin/verify';
    else if (savedRole === 'artist') endpoint = '/artists/verify';
    fetch(`${API}${endpoint}`, { headers: { 'Authorization': `Bearer ${savedToken}` } })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setToken(savedToken);
          const role = data.role || savedRole;
          setUserRole(role);
          setUserEmail(data.email || localStorage.getItem('moozik_email'));
          if (role === 'admin') setIsAdmin(true);
          if (role === 'artist') {
            setIsArtist(true);
            setUserNom(data.nom || localStorage.getItem('moozik_nom'));
            const aid = data.artisteId || data.artistId || data.id || data._id || localStorage.getItem('moozik_artisteId');
            setUserArtistId(aid);
            if (aid) localStorage.setItem('moozik_artisteId', aid);
          }
          if (role === 'user') {
            setIsUser(true);
            setUserNom(data.nom || localStorage.getItem('moozik_nom'));
            const uid = data.userId || data.id || data._id || localStorage.getItem('moozik_userId');
            setUserId(uid);
            if (uid) localStorage.setItem('moozik_userId', uid);
          }
        } else {
          ['moozik_token', 'moozik_email', 'moozik_role', 'moozik_nom', 'moozik_artisteId', 'moozik_userId'].forEach(k => localStorage.removeItem(k));
        }
      }).catch(() => {});
  }, []);

  const handleLogin = (data) => {
    setToken(data.token); setUserRole(data.role); setUserEmail(data.email);
    if (data.role === 'admin') setIsAdmin(true);
    if (data.role === 'artist') {
      setIsArtist(true); setUserNom(data.nom);
      const aid = data.artisteId || data.artistId || data.id || data._id;
      setUserArtistId(aid); if (aid) localStorage.setItem('moozik_artisteId', aid);
    }
    if (data.role === 'user') {
      setIsUser(true); setUserNom(data.nom);
      const uid = data.userId || data.id || data._id;
      setUserId(uid); if (uid) localStorage.setItem('moozik_userId', uid);
      chargerUserPlaylists(data.token);
    }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    ['moozik_token', 'moozik_email', 'moozik_role', 'moozik_nom', 'moozik_artisteId', 'moozik_userId'].forEach(k => localStorage.removeItem(k));
    setToken(''); setIsAdmin(false); setIsArtist(false); setIsUser(false);
    setUserRole(''); setUserEmail(''); setUserNom(''); setUserArtistId(''); setUserId('');
    setUserPlaylists([]);
  };

  const handleUpdateProfile = ({ nom }) => {
    if (nom) setUserNom(nom);
    setUserAvatar(localStorage.getItem('moozik_avatar'));
  };

  // ── DATA ──
  const chargerMusiques = async () => {
    try {
      const data = await fetch(`${API}/songs`).then(r => r.json());
      setMusiques(data.songs || data);
      if (data.length > 0) setCurrentSong(prev => prev ?? data[0]);
    } catch {} finally { setIsLoading(false); }
  };
  const chargerPlaylists = async () => {
    try { setPlaylists(await fetch(`${API}/playlists`).then(r => r.json())); } catch {}
  };
  const chargerArtists = async () => {
    try { setArtists(await fetch(`${API}/artists`).then(r => r.json())); } catch {}
  };
  const chargerAlbums = async () => {
    try { const d = await fetch(`${API}/albums`).then(r => r.json()); setAlbums(Array.isArray(d) ? d : []); } catch {}
  };
  const chargerUserPlaylists = async (t) => {
    if (!t) return;
    try {
      const data = await fetch(`${API}/user-playlists/mine`, { headers: { 'Authorization': `Bearer ${t}` } }).then(r => r.json());
      setUserPlaylists(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { chargerMusiques(); chargerPlaylists(); chargerArtists(); chargerAlbums(); }, []);
  useEffect(() => { if (token && isUser) chargerUserPlaylists(token); }, [token, isUser]);

  // ── ACTIONS ──
  const toggleLike = async (id) => {
    try {
      const updated = await fetch(`${API}/songs/${id}/like`, { method: 'PUT' }).then(r => r.json());
      setMusiques(prev => prev.map(s => s._id === id ? updated : s));
      if (currentSong?._id === id) setCurrentSong(updated);
    } catch {}
  };
  const addToQueue = (song) => { setQueue(prev => [...prev, song]); setActiveMenu(null); };
  const deleteSong = (id) => {
    setMusiques(prev => prev.filter(s => s._id !== id));
    if (currentSong?._id === id) setCurrentSong(null);
  };
  const creerPlaylist = async () => {
    const nom = prompt('Nom de la playlist ?'); if (!nom) return;
    await fetch(`${API}/playlists`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ nom }) });
    chargerPlaylists();
  };
  const supprimerPlaylist = async (id) => {
    if (!window.confirm('Supprimer cette playlist ?')) return;
    await fetch(`${API}/playlists/${id}`, { method: 'DELETE', headers: authHeaders() });
    chargerPlaylists();
  };
  const ajouterAPlaylist = async (playlistId, songId) => {
    await fetch(`${API}/playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: authHeaders() });
    chargerPlaylists(); setActiveMenu(null);
  };
  const supprimerUserPlaylist = async (id) => {
    if (!window.confirm('Supprimer cette playlist ?')) return;
    await fetch(`${API}/user-playlists/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    chargerUserPlaylists(token);
  };
  const ajouterAUserPlaylist = async (playlistId, songId) => {
    await fetch(`${API}/user-playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    chargerUserPlaylists(token); setActiveMenu(null);
  };

  const handleDragStart = (e, id) => { setDragSongId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (e, targetId) => {
    e.preventDefault(); if (dragSongId === targetId) return;
    const oi = musiques.findIndex(s => s._id === dragSongId);
    const ni = musiques.findIndex(s => s._id === targetId);
    const r = [...musiques]; const [m] = r.splice(oi, 1); r.splice(ni, 0, m);
    setMusiques(r); setDragSongId(null); setDragOverId(null);
    await fetch(`${API}/songs/reorder`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ orderedIds: r.map(s => s._id) }) });
  };

  // ── AUDIO ENGINE ──
  useEffect(() => {
    const audio = new Audio(); audio.crossOrigin = 'anonymous'; audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  const initAudioEngine = () => {
    if (audioContextRef.current || !audioRef.current) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioRef.current);
    const analyser = audioCtx.createAnalyser();
    const bass = audioCtx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 200;
    const mid = audioCtx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000;
    const treble = audioCtx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
    bassFilterRef.current = bass; midFilterRef.current = mid; trebleFilterRef.current = treble;
    source.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(analyser); analyser.connect(audioCtx.destination);
    analyser.fftSize = 128; audioContextRef.current = { audioCtx, analyser };
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      requestAnimationFrame(draw);
      if (!canvasRef.current) return;
      analyser.getByteFrequencyData(buf);
      const c = canvasRef.current; const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const bw = (c.width / buf.length) * 2.5;
      let x = 0;
      buf.forEach(v => {
        ctx.fillStyle = `rgb(${v + 100},40,40)`;
        ctx.fillRect(x, c.height - (v / 255) * c.height, bw, (v / 255) * c.height);
        x += bw + 1;
      });
    };
    draw();
  };

  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0]; setQueue(prev => prev.slice(1)); setCurrentSong(next);
    } else {
      if (!musiques.length) return;
      if (repeatMode === 2) { audioRef.current?.play(); return; }
      const idx = musiques.findIndex(s => s._id === currentSong?._id);
      setCurrentSong(musiques[isShuffle ? Math.floor(Math.random() * musiques.length) : (idx + 1) % musiques.length]);
    }
    setIsPlaying(true);
  }, [queue, musiques, currentSong, isShuffle, repeatMode]);

  const handlePrev = () => {
    if (!musiques.length) return;
    const idx = musiques.findIndex(s => s._id === currentSong?._id);
    setCurrentSong(musiques[(idx - 1 + musiques.length) % musiques.length]);
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => { if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } else handleNext(); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMeta); audio.removeEventListener('ended', onEnd); };
  }, [currentSong, musiques, isShuffle, queue, repeatMode, handleNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.src) return;
    audio.src = currentSong.src.replace(/^http:\/\//, 'https://');
    audio.playbackRate = playbackRate; audio.load(); playCountedRef.current = false;
    if (isPlaying) { audioContextRef.current?.audioCtx.resume(); audio.play().catch(console.error); }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    if (isPlaying) { audioContextRef.current?.audioCtx?.resume(); audio.play().catch(console.error); }
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (currentTime > 30 && !playCountedRef.current && currentSong) {
      playCountedRef.current = true;
      fetch(`${API}/songs/${currentSong._id}/play`, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {});
    }
  }, [currentTime, currentSong]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

  useEffect(() => {
    if (sleepRef.current) clearInterval(sleepRef.current);
    if (sleepTimer > 0) {
      setSleepRemaining(sleepTimer * 60);
      sleepRef.current = setInterval(() => {
        setSleepRemaining(prev => {
          if (prev <= 1) { clearInterval(sleepRef.current); setIsPlaying(false); setSleepTimer(0); return null; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(sleepRef.current);
  }, [sleepTimer]);

  const formatTime = (t) => { if (isNaN(t)) return '0:00'; return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`; };

  if (isLoading && musiques.length === 0) return <LoadingScreen message="Chargement de votre musique" />;

  const navLinks = [
    { to: '/', icon: <Home size={17} />, label: 'Accueil' },
    { to: '/favorites', icon: <Heart size={17} className={musiques.some(s => s.liked) ? 'text-red-500' : ''} fill={musiques.some(s => s.liked) ? 'red' : 'none'} />, label: 'Favoris' },
    { to: '/public-playlists', icon: <Globe size={17} />, label: 'Playlists' },
    { to: '/artists-list', icon: <Mic2 size={17} />, label: 'Artistes' },
    ...(isArtist ? [{ to: '/my-albums', icon: <Disc3 size={17} />, label: 'Mes Albums' }] : []),
    ...(isAdmin ? [
      { to: '/dashboard', icon: <BarChart2 size={17} />, label: 'Dashboard' },
      { to: '/admin-artists', icon: <Mic2 size={17} />, label: 'Gérer artistes' },
      { to: '/admin-users', icon: <Users size={17} />, label: 'Utilisateurs' },
    ] : []),
    ...(isLoggedIn ? [{ to: '/account', icon: <Settings size={17} />, label: 'Mon compte' }] : []),
    ...(isLoggedIn ? [
      { to: '/history', icon: <History size={17}/>, label: 'Historique' }
    ] : []),
    ...(isLoggedIn ? [
      { to: '/recommendations', icon: <Sparkles size={17}/>, label: 'Pour vous' }
    ] : []),
  ];

  const songProps = {
    currentSong, setCurrentSong, setIsPlaying, isPlaying,
    toggleLike, addToQueue, token, isLoggedIn, userNom,
    isAdmin, isArtist, userArtistId,
    playlists, userPlaylists,
    onAddToUserPlaylist: ajouterAUserPlaylist,
    ajouterAPlaylist,
    onDeleted: deleteSong,
    onRefresh: chargerMusiques,
  };

  const roleColor = isAdmin ? 'bg-red-600' : isArtist ? 'bg-zinc-600' : 'bg-zinc-700';
  const avatarDisplay = userAvatar || localStorage.getItem('moozik_avatar');

  const fullPlayerProps = {
    currentSong, isPlaying, setIsPlaying, currentTime, duration,
    handleNext, handlePrev, isShuffle, setIsShuffle, repeatMode, setRepeatMode,
    toggleLike, volume, setVolume, queue, setQueue, audioRef, initAudioEngine,
    bassGain, setBassGain, midGain, setMidGain, trebleGain, setTrebleGain,
    bassFilterRef, midFilterRef, trebleFilterRef,
    playbackRate, setPlaybackRate, sleepTimer, setSleepTimer, sleepRemaining,
    formatTime, canvasRef,
    onClose: () => setShowFullPlayer(false),
  };

  return (
    <Router>
      <div className="flex h-screen bg-black text-white font-sans overflow-hidden">

        {/* ── MODALS ── */}
        {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
        {showUpload && <UploadModal token={token} artists={artists} albums={albums} onClose={() => setShowUpload(false)} onSuccess={chargerMusiques} userRole={userRole} userArtistId={userArtistId} userNom={userNom} />}
        {showCreatePlaylist && <CreatePlaylistModal token={token} onClose={() => setShowCreatePlaylist(false)} onSuccess={() => chargerUserPlaylists(token)} />}

        {/* ── GRANDE PAGE PLAYER ── */}
        {showFullPlayer && currentSong && <FullPlayerPage {...fullPlayerProps} />}

        {/* ── SIDEBAR DESKTOP ── */}
        <nav className="hidden md:flex w-60 bg-zinc-950 p-5 flex-col gap-3 border-r border-zinc-800/50 shrink-0 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
              <Music size={16} className="text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tight">MOOZIK</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-600" size={14} />
            <input type="text" placeholder="Rechercher..." onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 rounded-full py-2 pl-8 pr-3 text-xs focus:ring-1 ring-red-600 outline-none placeholder-zinc-600" />
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-0.5">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition px-3 py-2 rounded-xl hover:bg-zinc-900/80 text-sm">
                {link.icon} {link.label}
              </Link>
            ))}
            {canUpload && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-3 text-zinc-500 hover:text-red-400 transition px-3 py-2 border border-dashed border-zinc-800 rounded-xl hover:border-red-900/60 mt-1 text-sm">
                <Plus size={16} /> <span className="text-xs font-semibold">Ajouter musique</span>
              </button>
            )}
          </div>

          {/* Playlists admin */}
          {isAdmin && playlists.length > 0 && (
            <div className="border-t border-zinc-800/50 pt-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Playlists admin</span>
                <button onClick={creerPlaylist} className="text-zinc-600 hover:text-white p-0.5 hover:bg-zinc-800 rounded transition"><Plus size={12} /></button>
              </div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {playlists.map(p => (
                  <div key={p._id} className="flex items-center group">
                    <Link to={`/playlist/${p._id}`} className="flex-1 text-xs text-zinc-500 hover:text-white truncate py-1.5 px-3 rounded-lg hover:bg-zinc-900"># {p.nom}</Link>
                    <button onClick={() => supprimerPlaylist(p._id)} className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 mr-1 transition"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mes playlists (user) */}
          {isUser && (
            <div className="border-t border-zinc-800/50 pt-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mes playlists</span>
                <button onClick={() => setShowCreatePlaylist(true)} className="text-zinc-600 hover:text-white p-0.5 hover:bg-zinc-800 rounded transition"><Plus size={12} /></button>
              </div>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {userPlaylists.length === 0
                  ? <p className="text-[10px] text-zinc-700 px-3 italic">Aucune playlist...</p>
                  : userPlaylists.map(p => (
                    <div key={p._id} className="flex items-center group">
                      <Link to={`/my-playlist/${p._id}`} className="flex-1 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white truncate py-1.5 px-3 rounded-lg hover:bg-zinc-900">
                        {p.isPublic ? <Globe size={9} className="text-green-500 shrink-0" /> : <Lock size={9} className="text-zinc-700 shrink-0" />}
                        {p.nom}
                      </Link>
                      <button onClick={() => supprimerUserPlaylist(p._id)} className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 mr-1 transition"><Trash2 size={10} /></button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Auth */}
          <div className="mt-auto border-t border-zinc-800/50 pt-3 shrink-0">
            {isLoggedIn ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ${roleColor}`}>
                    {avatarDisplay ? <img src={avatarDisplay} className="w-full h-full object-cover" alt="" /> : (userNom || userEmail || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-zinc-300">{userNom || userEmail}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{userRole}</p>
                  </div>
                </div>
                <NotificationsPanel
                  token={token}
                  onPlaySong={(songId) => {
                    const song = musiques.find(s => s._id === songId);
                    if (song) { setCurrentSong(song); setIsPlaying(true); }
                  }}
                />
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-zinc-600 hover:text-white px-1 py-1 rounded-lg hover:bg-zinc-900 transition w-full">
                  <LogOut size={12} /> Déconnexion
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-zinc-900 hover:bg-red-600 transition px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-red-600">
                <LogIn size={15} /> Se connecter
              </button>
            )}
          </div>
        </nav>

        {/* ── HEADER MOBILE ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950/98 backdrop-blur-xl border-b border-zinc-800/60 flex flex-col">
          <div className="flex items-center h-13 px-4 py-2.5 gap-3">
            {/* Logo */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                <Music size={12} className="text-white" />
              </div>
              <span className="text-base font-black italic">MOOZIK</span>
            </div>
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
              <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-7 pr-3 text-xs focus:ring-1 ring-red-600 outline-none placeholder-zinc-600" />
            </div>
            {/* Auth button */}
            {isLoggedIn ? (
              <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1.5 transition shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black overflow-hidden ${roleColor}`}>
                  {avatarDisplay ? <img src={avatarDisplay} className="w-full h-full object-cover" alt="" /> : (userNom || '?')[0].toUpperCase()}
                </div>
                <ChevronDown size={11} className={`text-zinc-500 transition ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)}
                className="bg-red-600 hover:bg-red-500 rounded-full px-3 py-1.5 text-xs font-bold transition shrink-0 flex items-center gap-1">
                <LogIn size={12} /> Se connecter
              </button>
            )}
          </div>
          {/* Nav tabs */}
          <div className="flex gap-0.5 px-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { to: '/', label: 'Accueil' },
              { to: '/favorites', label: 'Favoris' },
              { to: '/public-playlists', label: 'Playlists' },
              { to: '/artists-list', label: 'Artistes' },
              ...(isArtist ? [{ to: '/my-albums', label: 'Albums' }] : []),
              ...(isAdmin ? [{ to: '/dashboard', label: 'Stats' }, { to: '/admin-users', label: 'Users' }] : []),
              ...(isLoggedIn ? [{ to: '/account', label: 'Compte' }] : []),
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setShowMobileMenu(false)}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile dropdown */}
        {showMobileMenu && (
          <>
            <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
            <div className="md:hidden fixed top-[96px] left-3 right-3 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black overflow-hidden ${roleColor}`}>
                  {avatarDisplay ? <img src={avatarDisplay} className="w-full h-full object-cover" alt="" /> : (userNom || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{userNom || userEmail}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{userRole}</p>
                </div>
                <Link to="/account" onClick={() => setShowMobileMenu(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-500 hover:text-white">
                  <Settings size={14} />
                </Link>
              </div>
              {canUpload && (
                <button onClick={() => { setShowUpload(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition border-b border-zinc-800">
                  <Plus size={15} className="text-red-500" /> Ajouter une musique
                </button>
              )}
              {isUser && userPlaylists.length > 0 && (
                <div className="border-b border-zinc-800">
                  <div className="flex items-center justify-between px-4 py-2">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mes playlists</p>
                    <button onClick={() => { setShowCreatePlaylist(true); setShowMobileMenu(false); }} className="text-zinc-600 hover:text-white transition"><Plus size={13} /></button>
                  </div>
                  {userPlaylists.map(p => (
                    <Link key={p._id} to={`/my-playlist/${p._id}`} onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                      {p.isPublic ? <Globe size={11} className="text-green-500" /> : <Lock size={11} className="text-zinc-600" />}
                      {p.nom}
                    </Link>
                  ))}
                </div>
              )}
              {/* Notifications mobile */}
              <div className="px-4 py-2 border-b border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Notifications</p>
                <NotificationsPanel
                  token={token}
                  onPlaySong={(songId) => {
                    const song = musiques.find(s => s._id === songId);
                    if (song) { setCurrentSong(song); setIsPlaying(true); }
                    setShowMobileMenu(false);
                  }}
                  isMobile={true}
                />
              </div>
              <button onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition">
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          </>
        )}

        {/* ── MAIN ── */}
        <main className={`flex-1 overflow-y-auto bg-black lg:pb-40 md:pb-40 p-4 md:p-7 pb-40 pt-28 md:pt-7 transition-all ${showQueue ? 'md:mr-72' : ''}`}
          onClick={() => setActiveMenu(null)}>
          <Routes>
            <Route path="/favorites" element={<FavoritesView musiques={musiques} {...songProps} />} />
            <Route path="/playlist/:id" element={<PlaylistView playlists={playlists} {...songProps} />} />
            <Route path="/my-playlist/:id" element={<UserPlaylistView token={token} {...songProps} isOwner={isUser || isAdmin} />} />
            <Route path="/artist/:id" element={<ArtistView {...songProps} />} />
            <Route path="/album/:id" element={<AlbumView {...songProps} isArtist={isArtist} isAdmin={isAdmin} userArtistId={userArtistId} />} />
            <Route path="/my-albums" element={<MyAlbumsView token={token} userArtistId={userArtistId} userNom={userNom} />} />
            <Route path="/artists-list" element={<ArtistsListView artists={artists} />} />
            <Route path="/public-playlists" element={<PublicPlaylistsView {...songProps} />} />
            <Route path="/dashboard" element={isAdmin ? <DashboardView token={token} /> : <div className="p-8 text-zinc-600">Accès refusé</div>} />
            <Route path="/admin-artists" element={isAdmin ? <ArtistsAdminView token={token} /> : <div className="p-8 text-zinc-600">Accès refusé</div>} />
            <Route path="/history" element={
              isLoggedIn
                ? <HistoryView token={token} currentSong={currentSong}
                    setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} />
                : <div className="p-8 text-zinc-500">Connectez-vous</div>
            } />
            <Route path="/recommendations" element={
              <RecommendationsView
                token={token}
                currentSong={currentSong}
                setCurrentSong={setCurrentSong}
                setIsPlaying={setIsPlaying}
                isPlaying={isPlaying}
              />
            } />
            <Route path="/admin-users" element={isAdmin ? <UsersAdminView token={token} musiques={musiques} /> : <div className="p-8 text-zinc-600">Accès refusé</div>} />
            <Route path="/account" element={
              isLoggedIn
                ? <AccountView token={token} userNom={userNom} userEmail={userEmail} userRole={userRole}
                    userId={userId} userArtistId={userArtistId}
                    isAdmin={isAdmin} isArtist={isArtist} isUser={isUser}
                    musiques={musiques} userPlaylists={userPlaylists}
                    onUpdateProfile={handleUpdateProfile} />
                : <div className="p-8 text-zinc-600">Connectez-vous pour accéder à votre compte.</div>
            } />
            <Route path="/" element={
              <HomeView
                musiques={musiques} {...songProps}
                isAdmin={isAdmin} isArtist={isArtist} isUser={isUser}
                userArtistId={userArtistId} playlists={playlists} userPlaylists={userPlaylists}
                token={token} activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                ajouterAPlaylist={ajouterAPlaylist}
                dragOverId={dragOverId} dragSongId={dragSongId}
                handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
                setShowEQ={setShowEQ} initAudioEngine={initAudioEngine}
                searchTerm={searchTerm} setShowUpload={setShowUpload}
                onAddToUserPlaylist={ajouterAUserPlaylist}
              />
            } />
          </Routes>
        </main>

        {/* ── FILE D'ATTENTE DESKTOP ── */}
        {showQueue && (
          <aside className="w-72 bg-zinc-950 border-l border-zinc-800/50 p-5 fixed right-0 top-0 h-full z-60 flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="font-bold text-sm text-zinc-300">File d'attente</h2>
              <button onClick={() => setShowQueue(false)} className="text-xs text-zinc-600 hover:text-white px-2 py-1 hover:bg-zinc-800 rounded-lg transition">Fermer</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {queue.length === 0
                ? <p className="text-xs text-zinc-700 italic text-center mt-8">Vide...</p>
                : queue.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-zinc-900 rounded-xl group transition">
                    <img src={s.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{s.titre}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{s.artiste}</p>
                    </div>
                    <button onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded-lg transition text-zinc-600 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </aside>
        )}

        {/* ── PLAYER BAR ── */}
        {currentSong && (
          <footer className="
            fixed bottom-0 left-0 right-0
            md:bottom-3 md:left-[calc(240px+12px)] md:right-3 md:rounded-2xl
            bg-zinc-950/98 border-t border-zinc-800/60
            md:border md:border-zinc-800/60
            h-20 md:h-24 px-3 md:px-5
            flex items-center justify-between
            backdrop-blur-xl shadow-2xl z-50
          ">
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-0.5 opacity-70 pointer-events-none" width="1000" height="4" />

            {/* Info — cliquable → grande page */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="flex items-center gap-3 w-1/3 min-w-0 hover:opacity-80 transition text-left">
              <div className="relative shrink-0">
                <img src={currentSong.image} className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg object-cover" alt="" />
                {isPlaying && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />}
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="text-xs font-bold truncate text-zinc-200">{currentSong.titre}</div>
                <div className="text-[10px] text-zinc-500 truncate">{currentSong.artiste}</div>
              </div>
            </button>

            {/* Contrôles */}
            <div className="flex flex-col items-center w-1/3 gap-1.5">
              <div className="flex items-center gap-3 md:gap-5">
                <Shuffle onClick={() => setIsShuffle(!isShuffle)} size={15} className={`cursor-pointer transition ${isShuffle ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`} />
                <SkipBack onClick={handlePrev} size={19} className="text-zinc-400 cursor-pointer hover:text-white transition" />
                <button onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
                  className="p-2 md:p-2.5 bg-white rounded-full text-black hover:scale-110 active:scale-95 transition shadow-md">
                  {isPlaying ? <Pause fill="black" size={16} /> : <Play fill="black" size={16} />}
                </button>
                <SkipForward onClick={handleNext} size={19} className="text-zinc-400 cursor-pointer hover:text-white transition" />
                <button onClick={() => setRepeatMode(m => (m + 1) % 3)} className={`cursor-pointer transition ${repeatMode > 0 ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}>
                  {repeatMode === 2 ? <Repeat1 size={15} /> : <Repeat size={15} />}
                </button>
              </div>
              <div className="w-full flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 w-7 text-right shrink-0">{formatTime(currentTime)}</span>
                <div className="h-1 bg-zinc-800 flex-1 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (audioRef.current) audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration; }}>
                  <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
                </div>
                <span className="text-[9px] text-zinc-600 w-7 shrink-0">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Droite */}
            <div className="flex items-center justify-end gap-2 md:gap-3 w-1/3">
              <button onClick={() => toggleLike(currentSong._id)} className="hidden sm:block">
                <Heart size={15} fill={currentSong.liked ? '#ef4444' : 'none'} className={currentSong.liked ? 'text-red-500' : 'text-zinc-600 hover:text-white transition'} />
              </button>
              <button onClick={() => { initAudioEngine(); setShowFullPlayer(true); }}
                className="hidden sm:block p-1.5 hover:bg-zinc-800 rounded-lg transition text-zinc-600 hover:text-white"
                title="Ouvrir le lecteur">
                <Maximize2 size={15} />
              </button>
              <ListOrdered onClick={() => setShowQueue(!showQueue)} size={15} className={`cursor-pointer hidden sm:block transition ${showQueue ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`} />
              <Volume2 size={15} className="text-zinc-600 hidden md:block" />
              <input type="range" value={volume} className="w-14 md:w-18 accent-red-600 h-0.5 cursor-pointer bg-zinc-800 rounded-lg appearance-none hidden md:block"
                onChange={e => setVolume(parseInt(e.target.value))} />
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
};

export default MoozikWeb;
