import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  Home, Play, Pause, SkipBack, SkipForward, Volume2, Plus, Shuffle,
  Loader2, Trash2, ListPlus, Search, Music, Heart, ListOrdered, Sliders,
  LogIn, LogOut, ShieldCheck, Repeat, Repeat1, Timer, Gauge, BarChart2,
  Users, Mic2, X, Disc3, Globe, Lock, ChevronDown
} from 'lucide-react';

import { API } from './config/api';

// Modals
import LoginModal from './components/modals/LoginModal';
import UploadModal from './components/modals/UploadModal';
import CreatePlaylistModal from './components/modals/CreatePlaylistModal';

// Views
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

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
const App = () => {
  // ── Data ──
  const [musiques, setMusiques] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  // ── Player ──
  const [queue, setQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);

  // ── UI ──
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showEQ, setShowEQ] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragSongId, setDragSongId] = useState(null);

  // ── EQ / Playback ──
  const [bassGain, setBassGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [trebleGain, setTrebleGain] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(null);

  // ── Auth ──
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

  // ── Refs ──
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

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────
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
          if (role === 'artist') { setIsArtist(true); setUserNom(data.nom || localStorage.getItem('moozik_nom')); setUserArtistId(data.id || localStorage.getItem('moozik_artisteId')); }
          if (role === 'user') { setIsUser(true); setUserNom(data.nom || localStorage.getItem('moozik_nom')); setUserId(data.id || localStorage.getItem('moozik_userId')); }
        } else {
          ['moozik_token', 'moozik_email', 'moozik_role', 'moozik_nom', 'moozik_artisteId', 'moozik_userId'].forEach(k => localStorage.removeItem(k));
        }
      }).catch(() => {});
  }, []);

  const handleLogin = (data) => {
    setToken(data.token); setUserRole(data.role); setUserEmail(data.email);
    if (data.role === 'admin') setIsAdmin(true);
    if (data.role === 'artist') { setIsArtist(true); setUserNom(data.nom); setUserArtistId(data.artisteId); }
    if (data.role === 'user') { setIsUser(true); setUserNom(data.nom); setUserId(data.userId); chargerUserPlaylists(data.token); }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    ['moozik_token', 'moozik_email', 'moozik_role', 'moozik_nom', 'moozik_artisteId', 'moozik_userId'].forEach(k => localStorage.removeItem(k));
    setToken(''); setIsAdmin(false); setIsArtist(false); setIsUser(false);
    setUserRole(''); setUserEmail(''); setUserNom(''); setUserArtistId(''); setUserId('');
    setUserPlaylists([]);
  };

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────
  const chargerMusiques = async () => {
    try {
      const res = await fetch(`${API}/songs`);
      const data = await res.json();
      setMusiques(data);
      if (data.length > 0) setCurrentSong(prev => prev ?? data[0]);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
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

  // ─────────────────────────────────────────────
  // ACTIONS MUSIQUES
  // ─────────────────────────────────────────────
  const toggleLike = async (id) => {
    try {
      const res = await fetch(`${API}/songs/${id}/like`, { method: 'PUT' });
      const updated = await res.json();
      setMusiques(prev => prev.map(s => s._id === id ? updated : s));
      if (currentSong?._id === id) setCurrentSong(updated);
    } catch {}
  };
  const addToQueue = (song) => { setQueue(prev => [...prev, song]); setActiveMenu(null); };
  const deleteSong = async (id) => {
    if (!window.confirm("Supprimer cette musique ?")) return;
    await fetch(`${API}/songs/${id}`, { method: 'DELETE', headers: authHeaders() });
    setMusiques(prev => prev.filter(s => s._id !== id));
    if (currentSong?._id === id) setCurrentSong(null);
    setActiveMenu(null);
  };
  const editSong = async (id) => {
    const song = musiques.find(s => s._id === id);
    const nouveauTitre = prompt("Nouveau titre :", song?.titre);
    if (!nouveauTitre) return;
    const nouvelArtiste = isAdmin ? (prompt("Artiste :", song?.artiste) || song?.artiste) : song?.artiste;
    await fetch(`${API}/songs/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ titre: nouveauTitre, artiste: nouvelArtiste }) });
    chargerMusiques(); setActiveMenu(null);
  };

  // ─────────────────────────────────────────────
  // PLAYLISTS ADMIN
  // ─────────────────────────────────────────────
  const creerPlaylist = async () => {
    const nom = prompt("Nom de la playlist ?");
    if (!nom) return;
    await fetch(`${API}/playlists`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ nom }) });
    chargerPlaylists();
  };
  const supprimerPlaylist = async (id) => {
    if (!window.confirm("Supprimer cette playlist ?")) return;
    await fetch(`${API}/playlists/${id}`, { method: 'DELETE', headers: authHeaders() });
    chargerPlaylists();
  };
  const ajouterAPlaylist = async (playlistId, songId) => {
    await fetch(`${API}/playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: authHeaders() });
    chargerPlaylists(); setActiveMenu(null);
  };

  // ─────────────────────────────────────────────
  // PLAYLISTS USER
  // ─────────────────────────────────────────────
  const supprimerUserPlaylist = async (id) => {
    if (!window.confirm("Supprimer cette playlist ?")) return;
    await fetch(`${API}/user-playlists/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    chargerUserPlaylists(token);
  };
  const ajouterAUserPlaylist = async (playlistId, songId) => {
    await fetch(`${API}/user-playlists/${playlistId}/add/${songId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    chargerUserPlaylists(token); setActiveMenu(null);
  };

  // ─────────────────────────────────────────────
  // DRAG & DROP
  // ─────────────────────────────────────────────
  const handleDragStart = (e, id) => { setDragSongId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, id) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (dragSongId === targetId) return;
    const oldIndex = musiques.findIndex(s => s._id === dragSongId);
    const newIndex = musiques.findIndex(s => s._id === targetId);
    const reordered = [...musiques];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setMusiques(reordered);
    setDragSongId(null); setDragOverId(null);
    await fetch(`${API}/songs/reorder`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ orderedIds: reordered.map(s => s._id) }) });
  };

  // ─────────────────────────────────────────────
  // AUDIO ENGINE
  // ─────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
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
    analyser.fftSize = 128;
    audioContextRef.current = { audioCtx, analyser };
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      requestAnimationFrame(draw);
      if (!canvasRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      dataArray.forEach(val => {
        ctx.fillStyle = `rgb(${val + 100},50,50)`;
        ctx.fillRect(x, canvas.height - (val / 255) * canvas.height, barWidth, (val / 255) * canvas.height);
        x += barWidth + 1;
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
      const nextIdx = isShuffle ? Math.floor(Math.random() * musiques.length) : (idx + 1) % musiques.length;
      setCurrentSong(musiques[nextIdx]);
    }
    setIsPlaying(true);
  }, [queue, musiques, currentSong, isShuffle, repeatMode]);

  const handlePrev = () => {
    if (!musiques.length) return;
    const idx = musiques.findIndex(s => s._id === currentSong?._id);
    setCurrentSong(musiques[(idx - 1 + musiques.length) % musiques.length]);
    setIsPlaying(true);
  };

  // ── Audio event listeners ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => { if (repeatMode === 2) { audio.currentTime = 0; audio.play(); } else handleNext(); };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentSong, musiques, isShuffle, queue, repeatMode, handleNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong?.src) return;
    audio.src = currentSong.src.replace(/^http:\/\//, 'https://');
    audio.playbackRate = playbackRate;
    audio.load();
    playCountedRef.current = false;
    if (isPlaying) { audioContextRef.current?.audioCtx.resume(); audio.play().catch(console.error); }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audioContextRef.current?.audioCtx?.resume(); audio.play().catch(console.error); }
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (currentTime > 30 && !playCountedRef.current && currentSong) {
      playCountedRef.current = true;
      fetch(`${API}/songs/${currentSong._id}/play`, { method: 'PUT' }).catch(() => {});
    }
  }, [currentTime, currentSong]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);

  // ── Sleep timer ──
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

  // ─────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────
  if (isLoading && musiques.length === 0) {
    return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-red-600 mr-2" size={32} /> MOOZIK...</div>;
  }

  // ─────────────────────────────────────────────
  // NAV LINKS
  // ─────────────────────────────────────────────
  const navLinks = [
    { to: '/', icon: <Home size={17} />, label: 'Accueil' },
    { to: '/favorites', icon: <Heart size={17} className={musiques.some(s => s.liked) ? 'text-red-500' : ''} fill={musiques.some(s => s.liked) ? 'red' : 'none'} />, label: 'Favoris' },
    { to: '/artists-list', icon: <Mic2 size={17} />, label: 'Artistes' },
    ...(isArtist ? [{ to: '/my-albums', icon: <Disc3 size={17} />, label: 'Mes Albums' }] : []),
    ...(isAdmin ? [
      { to: '/dashboard', icon: <BarChart2 size={17} />, label: 'Dashboard' },
      { to: '/admin-artists', icon: <Users size={17} />, label: 'Gérer artistes' }
    ] : [])
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <Router>
      <div className="flex h-screen bg-black text-white font-sans overflow-hidden">

        {/* ── MODALS ── */}
        {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
        {showUpload && <UploadModal token={token} artists={artists} albums={albums} onClose={() => setShowUpload(false)} onSuccess={chargerMusiques} userRole={userRole} userArtistId={userArtistId} userNom={userNom} />}
        {showCreatePlaylist && <CreatePlaylistModal token={token} onClose={() => setShowCreatePlaylist(false)} onSuccess={() => chargerUserPlaylists(token)} />}

        {/* ── SIDEBAR DESKTOP ── */}
        <nav className="hidden md:flex w-64 bg-zinc-950 p-5 flex-col gap-4 border-r border-zinc-800/60 shrink-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tight text-white">MOOZIK</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={15} />
            <input type="text" placeholder="Rechercher..." onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 rounded-full py-2 pl-9 text-xs focus:ring-1 ring-red-600 outline-none placeholder-zinc-600" />
          </div>

          <div className="flex flex-col gap-0.5 text-sm">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition px-3 py-2 rounded-lg hover:bg-zinc-900">
                {link.icon} {link.label}
              </Link>
            ))}
            {canUpload && (
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-3 text-zinc-400 hover:text-red-400 transition px-3 py-2 border border-dashed border-zinc-800 rounded-lg hover:border-red-600/50 mt-1">
                <Plus size={17} /> <span className="text-xs font-bold">Ajouter musique</span>
              </button>
            )}
          </div>

          {/* Playlists admin */}
          {isAdmin && (
            <div className="border-t border-zinc-800/60 pt-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Playlists</span>
                <button onClick={creerPlaylist} className="text-zinc-500 hover:text-white"><Plus size={13} /></button>
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto max-h-32">
                {playlists.map(p => (
                  <div key={p._id} className="flex items-center group">
                    <Link to={`/playlist/${p._id}`} className="flex-1 text-xs text-zinc-400 hover:text-white truncate py-1.5 px-3 rounded-lg hover:bg-zinc-900"># {p.nom}</Link>
                    <button onClick={() => supprimerPlaylist(p._id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 mr-1"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mes playlists user */}
          {isUser && (
            <div className="border-t border-zinc-800/60 pt-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mes playlists</span>
                <button onClick={() => setShowCreatePlaylist(true)} className="text-zinc-500 hover:text-white"><Plus size={13} /></button>
              </div>
              <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40">
                {userPlaylists.length === 0
                  ? <p className="text-[10px] text-zinc-700 px-3 italic">Aucune playlist...</p>
                  : userPlaylists.map(p => (
                    <div key={p._id} className="flex items-center group">
                      <Link to={`/my-playlist/${p._id}`} className="flex-1 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white truncate py-1.5 px-3 rounded-lg hover:bg-zinc-900">
                        {p.isPublic ? <Globe size={9} className="text-green-400 shrink-0" /> : <Lock size={9} className="text-zinc-600 shrink-0" />}
                        {p.nom}
                      </Link>
                      <button onClick={() => supprimerUserPlaylist(p._id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 mr-1"><Trash2 size={11} /></button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AUTH */}
          <div className="mt-auto border-t border-zinc-800/60 pt-4 shrink-0">
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isAdmin ? 'bg-red-600' : isArtist ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {(userNom || userEmail || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isAdmin ? 'text-red-400' : isArtist ? 'text-purple-400' : 'text-blue-400'}`}>{userNom || userEmail}</p>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{userRole}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white px-1 py-1 rounded-lg hover:bg-zinc-900 transition">
                  <LogOut size={13} /> Déconnexion
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-zinc-800 hover:bg-red-600 transition px-4 py-2.5 rounded-xl">
                <LogIn size={16} /> Se connecter
              </button>
            )}
          </div>
        </nav>

        {/* ── HEADER MOBILE ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950/98 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-0 flex flex-col">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                <Music size={14} className="text-white" />
              </div>
              <span className="text-lg font-black italic tracking-tight">MOOZIK</span>
            </div>
            <div className="flex-1 mx-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
              <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-8 pr-3 text-xs focus:ring-1 ring-red-600 outline-none placeholder-zinc-600" />
            </div>
            <div className="flex items-center gap-1">
              {isLoggedIn ? (
                <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full px-2 py-1.5 transition">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isAdmin ? 'bg-red-600' : isArtist ? 'bg-purple-600' : 'bg-blue-600'}`}>
                    {(userNom || '?')[0].toUpperCase()}
                  </div>
                  <ChevronDown size={12} className={`text-zinc-400 transition ${showMobileMenu ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 rounded-full px-3 py-1.5 text-xs font-bold transition">
                  <LogIn size={13} /> Connexion
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { to: '/', icon: <Home size={14} />, label: 'Accueil' },
              { to: '/favorites', icon: <Heart size={14} />, label: 'Favoris' },
              { to: '/artists-list', icon: <Mic2 size={14} />, label: 'Artistes' },
              ...(isArtist ? [{ to: '/my-albums', icon: <Disc3 size={14} />, label: 'Albums' }] : []),
              ...(isAdmin ? [
                { to: '/dashboard', icon: <BarChart2 size={14} />, label: 'Stats' },
                { to: '/admin-artists', icon: <Users size={14} />, label: 'Artistes' }
              ] : []),
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white shrink-0 px-3 py-1 rounded-full text-[11px] font-bold hover:bg-zinc-800 transition">
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── MOBILE DROPDOWN MENU ── */}
        {showMobileMenu && (
          <div className="md:hidden fixed top-[100px] left-4 right-4 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black ${isAdmin ? 'bg-red-600' : isArtist ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {(userNom || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold">{userNom || userEmail}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{userRole}</p>
              </div>
            </div>
            {canUpload && (
              <button onClick={() => { setShowUpload(true); setShowMobileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition border-b border-zinc-800">
                <Plus size={16} className="text-red-400" /> Ajouter une musique
              </button>
            )}
            {isUser && (
              <div className="border-b border-zinc-800">
                <div className="flex items-center justify-between px-4 py-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mes playlists</p>
                  <button onClick={() => { setShowCreatePlaylist(true); setShowMobileMenu(false); }} className="text-zinc-500 hover:text-white"><Plus size={14} /></button>
                </div>
                {userPlaylists.map(p => (
                  <Link key={p._id} to={`/my-playlist/${p._id}`} onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                    {p.isPublic ? <Globe size={11} className="text-green-400" /> : <Lock size={11} className="text-zinc-500" />}
                    {p.nom}
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => { handleLogout(); setShowMobileMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        )}
        {showMobileMenu && <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />}

        {/* ── MAIN ── */}
        <main
          className={`flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black p-4 lg:pb-40 md:pb-40 md:p-8 pb-40 pt-28 md:pt-8 transition-all ${showQueue ? 'md:mr-72' : ''}`}
          onClick={() => setActiveMenu(null)}
        >
          <Routes>
            <Route path="/favorites" element={<FavoritesView musiques={musiques} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} toggleLike={toggleLike} addToQueue={addToQueue} token={token} isLoggedIn={isLoggedIn} userNom={userNom} />} />
            <Route path="/playlist/:id" element={<PlaylistView playlists={playlists} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} toggleLike={toggleLike} addToQueue={addToQueue} token={token} isLoggedIn={isLoggedIn} userNom={userNom} />} />
            <Route path="/my-playlist/:id" element={<UserPlaylistView token={token} setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} toggleLike={toggleLike} addToQueue={addToQueue} isOwner={isUser || isAdmin} isLoggedIn={isLoggedIn} userNom={userNom} />} />
            <Route path="/artist/:id" element={<ArtistView setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} toggleLike={toggleLike} addToQueue={addToQueue} token={token} isLoggedIn={isLoggedIn} userNom={userNom} />} />
            <Route path="/album/:id" element={<AlbumView setCurrentSong={setCurrentSong} setIsPlaying={setIsPlaying} currentSong={currentSong} toggleLike={toggleLike} addToQueue={addToQueue} token={token} isLoggedIn={isLoggedIn} userNom={userNom} isArtist={isArtist} isAdmin={isAdmin} userArtistId={userArtistId} />} />
            <Route path="/my-albums" element={<MyAlbumsView token={token} userArtistId={userArtistId} userNom={userNom} />} />
            <Route path="/artists-list" element={<ArtistsListView artists={artists} />} />
            <Route path="/dashboard" element={isAdmin ? <DashboardView token={token} /> : <div className="p-8 text-zinc-500">Accès refusé</div>} />
            <Route path="/admin-artists" element={isAdmin ? <ArtistsAdminView token={token} /> : <div className="p-8 text-zinc-500">Accès refusé</div>} />
            <Route path="/" element={
              <HomeView
                musiques={musiques} currentSong={currentSong} setCurrentSong={setCurrentSong}
                setIsPlaying={setIsPlaying} isPlaying={isPlaying} toggleLike={toggleLike}
                addToQueue={addToQueue} isAdmin={isAdmin} isArtist={isArtist} isUser={isUser}
                userArtistId={userArtistId} playlists={playlists} userPlaylists={userPlaylists}
                token={token} activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                ajouterAPlaylist={ajouterAPlaylist} deleteSong={deleteSong} editSong={editSong}
                dragOverId={dragOverId} dragSongId={dragSongId}
                handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
                setShowEQ={setShowEQ} initAudioEngine={initAudioEngine}
                searchTerm={searchTerm} setShowUpload={setShowUpload}
                onAddToUserPlaylist={ajouterAUserPlaylist}
                isLoggedIn={isLoggedIn} userNom={userNom}
              />
            } />
          </Routes>
        </main>

        {/* ── FILE D'ATTENTE ── */}
        {showQueue && (
          <aside className="w-72 bg-zinc-950 border-l border-zinc-800 p-6 fixed right-0 top-0 h-full z-60">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-sm">File d'attente</h2>
              <button onClick={() => setShowQueue(false)} className="text-zinc-500 hover:text-white text-xs">Fermer</button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto h-[80vh]">
              {queue.length === 0
                ? <p className="text-xs text-zinc-600 italic">Vide...</p>
                : queue.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group">
                    <img src={s.image} className="w-8 h-8 rounded object-cover" alt="" />
                    <div className="truncate flex-1 text-xs font-bold">{s.titre}</div>
                    <button onClick={() => setQueue(prev => prev.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                ))}
            </div>
          </aside>
        )}

        {/* ── MODAL ÉGALISEUR ── */}
        {showEQ && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic flex items-center gap-2"><Sliders className="text-red-600" /> ÉGALISEUR</h3>
                <button onClick={() => setShowEQ(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Graves', value: bassGain, set: (v) => { setBassGain(v); if (bassFilterRef.current) bassFilterRef.current.gain.value = v; }, color: 'accent-red-600' },
                  { label: 'Médiums', value: midGain, set: (v) => { setMidGain(v); if (midFilterRef.current) midFilterRef.current.gain.value = v; }, color: 'accent-yellow-500' },
                  { label: 'Aigus', value: trebleGain, set: (v) => { setTrebleGain(v); if (trebleFilterRef.current) trebleFilterRef.current.gain.value = v; }, color: 'accent-blue-500' },
                ].map(band => (
                  <div key={band.label}>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                      <span>{band.label}</span><span className="text-zinc-400">{band.value} dB</span>
                    </div>
                    <input type="range" min="-12" max="12" step="1" value={band.value}
                      className={`w-full h-1 ${band.color} bg-zinc-800 rounded-lg appearance-none cursor-pointer`}
                      onChange={(e) => band.set(parseInt(e.target.value))} />
                  </div>
                ))}
                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Gauge size={12} /> Vitesse</span>
                    <span className="text-zinc-400">{playbackRate}x</span>
                  </div>
                  <input type="range" min="0.5" max="2" step="0.25" value={playbackRate}
                    className="w-full h-1 accent-purple-500 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} />
                </div>
                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Timer size={12} /> Timer d'arrêt</span>
                    {sleepRemaining && <span className="text-green-400">{Math.floor(sleepRemaining / 60)}:{String(sleepRemaining % 60).padStart(2, '0')}</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 15, 30, 45, 60].map(m => (
                      <button key={m} onClick={() => setSleepTimer(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sleepTimer === m ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                        {m === 0 ? 'Off' : `${m} min`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYER BAR ── */}
        {currentSong && (
          <footer className="
            fixed bottom-0 left-0 right-0
            md:bottom-4 md:left-[calc(256px+16px)] md:right-4 md:rounded-2xl
            bg-zinc-950/98 border-t border-zinc-800
            md:border md:border-zinc-800
            h-24 md:h-28 px-4 md:px-6
            flex items-center justify-between
            backdrop-blur-md shadow-2xl z-50
          ">
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-1 opacity-60" width="1000" height="20" />

            {/* Info */}
            <div className="flex items-center gap-3 w-1/3 min-w-0">
              <img src={currentSong.image} className="w-11 h-11 md:w-14 md:h-14 rounded-lg shadow-lg shrink-0 object-cover" alt="" />
              <div className="min-w-0 hidden sm:block">
                <div className="text-xs md:text-sm font-bold truncate">{currentSong.titre}</div>
                <div className="text-[10px] text-zinc-400 truncate">{currentSong.artiste}</div>
              </div>
              <button onClick={() => toggleLike(currentSong._id)} className="ml-1 shrink-0">
                <Heart size={16} fill={currentSong.liked ? '#ef4444' : 'none'} className={currentSong.liked ? 'text-red-500' : 'text-zinc-500'} />
              </button>
            </div>

            {/* Contrôles */}
            <div className="flex flex-col items-center w-1/3 gap-2">
              <div className="flex items-center gap-3 md:gap-6">
                <Shuffle onClick={() => setIsShuffle(!isShuffle)} size={16} className={`cursor-pointer ${isShuffle ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`} />
                <SkipBack onClick={handlePrev} size={20} className="text-zinc-400 cursor-pointer hover:text-white" />
                <button onClick={() => { initAudioEngine(); setIsPlaying(p => !p); }}
                  className="p-2.5 md:p-3 bg-white rounded-full text-black hover:scale-110 active:scale-95 transition">
                  {isPlaying ? <Pause fill="black" size={18} /> : <Play fill="black" size={18} />}
                </button>
                <SkipForward onClick={handleNext} size={20} className="text-zinc-400 cursor-pointer hover:text-white" />
                <button onClick={() => setRepeatMode(m => (m + 1) % 3)} className={`cursor-pointer ${repeatMode > 0 ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}>
                  {repeatMode === 2 ? <Repeat1 size={16} /> : <Repeat size={16} />}
                </button>
              </div>
              <div className="w-full flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-8 text-right shrink-0">{formatTime(currentTime)}</span>
                <div className="h-1 bg-zinc-800 flex-1 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (audioRef.current) audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration; }}>
                  <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500 w-8 shrink-0">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume + Queue + EQ */}
            <div className="flex items-center justify-end gap-2 md:gap-4 w-1/3">
              <Sliders onClick={() => { initAudioEngine(); setShowEQ(true); }} size={16} className="text-zinc-400 hover:text-red-500 cursor-pointer hidden sm:block" />
              <ListOrdered onClick={() => setShowQueue(!showQueue)} size={16} className={`cursor-pointer hidden sm:block ${showQueue ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`} />
              <Volume2 size={16} className="text-zinc-400 hidden md:block" />
              <input type="range" value={volume} className="w-16 md:w-20 accent-red-600 h-1 cursor-pointer bg-zinc-800 rounded-lg appearance-none hidden md:block"
                onChange={(e) => setVolume(parseInt(e.target.value))} />
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
};

export default App;
