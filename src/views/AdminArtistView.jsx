import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Users, CheckCircle, Star, Link2, Calendar, Music,
  Plus, Trash2, Save, Loader2, Check, AlertCircle, X, Eye, Clock,
  Bell, BarChart2, ExternalLink, DollarSign, Image as ImageIcon,
  Ticket, Camera, MapPin, Video, Volume2, FileText, Mic2,
  ChevronRight, Globe, Shield, Zap, Crown, Settings, Search,
  Filter, RefreshCw, TrendingUp, Play, Pause, SkipForward,
  Award, Radio, UserCheck, Ban, Edit3, Download, Upload,
  ChevronDown, ChevronUp, Hash, Layers, Activity, Target,
  Database, Server, Lock, Unlock, Flag, Mail, Phone
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaXTwitter, FaFacebook, FaTiktok } from 'react-icons/fa6';
import { API } from '../config/api';

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Feedback hook ─────────────────────────────────────────────
const useFeedback = () => {
  const [msg, setMsg] = useState(null); // { text, type: 'success'|'error' }
  const show = (text, isError = false) => {
    setMsg({ text, type: isError ? 'error' : 'success' });
    setTimeout(() => setMsg(null), 4500);
  };
  return { msg, show };
};

// ── Section wrapper ───────────────────────────────────────────
const Section = ({ icon, title, badge, children, accent = 'red' }) => {
  const colors = {
    red:    'text-red-400 bg-red-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    blue:   'text-blue-400 bg-blue-500/10',
    green:  'text-green-400 bg-green-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
  };
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800/50">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colors[accent]}`}>{icon}</div>
        <h3 className="font-black text-xs uppercase tracking-widest flex-1">{title}</h3>
        {badge !== undefined && (
          <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'red' }) => {
  const colors = {
    red:    'from-red-600/20 to-red-600/5 border-red-500/20 text-red-400',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    green:  'from-green-600/20 to-green-600/5 border-green-500/20 text-green-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/20 text-orange-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
        <div className={`${colors[color].split(' ').slice(-1)[0]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-black">{value}</p>
      {sub && <p className="text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const AdminArtistView = ({ token, adminId, adminNom }) => {

  // ── Tab principal ─────────────────────────────────────────
  const [tab, setTab] = useState('overview');

  // ── État partagé ─────────────────────────────────────────
  const [artists, setArtists]     = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null); // artiste choisi pour agir en son nom
  const [songs, setSongs]         = useState([]);
  const [events, setEvents]       = useState([]);
  const [stories, setStories]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [stats, setStats]         = useState({});
  const [certReqs, setCertReqs]   = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // ── Newsletter ────────────────────────────────────────────
  const [nlSubject, setNlSubject] = useState('');
  const [nlMessage, setNlMessage] = useState('');
  const [nlSending, setNlSending] = useState(false);
  const [nlTarget, setNlTarget]   = useState('all'); // 'all' | artistId

  // ── Smart Link ───────────────────────────────────────────
  const [slSlug, setSlSlug]       = useState('');
  const [slBio, setSlBio]         = useState('');
  const [slSocials, setSlSocials] = useState({ instagram:'', youtube:'', tiktok:'', twitter:'', facebook:'' });
  const [slSaving, setSlSaving]   = useState(false);

  // ── Story ────────────────────────────────────────────────
  const [storyFile, setStoryFile]       = useState(null);
  const [storyPreview, setStoryPreview] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyDuration, setStoryDuration] = useState(30);
  const [storyArtistId, setStoryArtistId] = useState('');
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyFileRef = useRef();

  // ── Événements ───────────────────────────────────────────
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventArtistId, setEventArtistId] = useState('');
  const [eventImg, setEventImg]   = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title:'', description:'', venue:'', city:'', country:'',
    date:'', ticketPrice:'', ticketCapacity:'', ticketCurrency:'EUR'
  });
  const eventImgRef = useRef();

  // ── Certification ────────────────────────────────────────
  const [certLoading, setCertLoading] = useState({});

  // ── Search / filter ───────────────────────────────────────
  const [artistSearch, setArtistSearch] = useState('');
  const [userSearch, setUserSearch]     = useState('');

  const { msg, show } = useFeedback();
  const h = { Authorization: `Bearer ${token}` };
  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  // ── Chargement initial ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingInit(true);
      try {
        const [artRes, usrRes, sngRes, evtRes, cerRes] = await Promise.all([
          fetch(`${API}/artists`, { headers: h }).then(r => r.json()),
          fetch(`${API}/admin/users`, { headers: h }).then(r => r.ok ? r.json() : []),
          fetch(`${API}/songs?limit=200`).then(r => r.json()),
          fetch(`${API}/events`).then(r => r.ok ? r.json() : []),
          fetch(`${API}/admin/certifications`, { headers: h }).then(r => r.ok ? r.json() : []),
        ]);
        setArtists(Array.isArray(artRes) ? artRes : []);
        setUsers(Array.isArray(usrRes) ? usrRes : []);
        setSongs(sngRes?.songs || (Array.isArray(sngRes) ? sngRes : []));
        setEvents(Array.isArray(evtRes) ? evtRes : []);
        setCertReqs(Array.isArray(cerRes) ? cerRes : []);
        // Stats globales agrégées
        setStats({
          totalArtists: (Array.isArray(artRes) ? artRes : []).length,
          totalUsers: (Array.isArray(usrRes) ? usrRes : []).length,
          totalSongs: sngRes?.pagination?.total || (Array.isArray(sngRes) ? sngRes.length : 0),
          totalEvents: (Array.isArray(evtRes) ? evtRes : []).length,
          pendingCerts: (Array.isArray(cerRes) ? cerRes : []).filter(c => c.status === 'pending').length,
          totalPlays: (sngRes?.songs || []).reduce((a, s) => a + (s.plays || 0), 0),
        });
      } catch (e) { show('Erreur chargement données', true); }
      setLoadingInit(false);
    };
    load();
  }, []);

  // ── Charger stories quand on arrive sur l'onglet stories ──
  useEffect(() => {
    if (tab !== 'stories' || !selectedArtist) return;
    fetch(`${API}/artists/${selectedArtist._id}/stories`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setStories(Array.isArray(d) ? d : []));
  }, [tab, selectedArtist]);

  // ── Charger smart link de l'artiste sélectionné ───────────
  useEffect(() => {
    if (!selectedArtist) return;
    fetch(`${API}/artists/${selectedArtist._id}/smart-link`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setSlSlug(d.slug || ''); setSlBio(d.customBio || ''); setSlSocials(d.socialLinks || {}); }
        else   { setSlSlug(''); setSlBio(''); setSlSocials({ instagram:'', youtube:'', tiktok:'', twitter:'', facebook:'' }); }
      });
    fetch(`${API}/artists/${selectedArtist._id}/newsletter/history`, { headers: h })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCampaigns(Array.isArray(d) ? d : []));
  }, [selectedArtist]);

  // ════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════

  // Newsletter globale OU ciblée artiste
  const sendNewsletter = async (e) => {
    e.preventDefault();
    if (!nlSubject.trim() || !nlMessage.trim()) return show('Sujet et message requis', true);
    const targetId = nlTarget === 'all' ? null : nlTarget;
    if (!targetId && !window.confirm('Envoyer à TOUS les utilisateurs de la plateforme ?')) return;
    setNlSending(true);
    try {
      const endpoint = targetId
        ? `${API}/artists/${targetId}/newsletter`
        : `${API}/admin/broadcast`;
      const res  = await fetch(endpoint, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: nlSubject.trim(), message: nlMessage.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      show(`✅ Envoyé à ${data.sent ?? '?'} destinataire(s) !`);
      setNlSubject(''); setNlMessage('');
      if (targetId) setCampaigns(prev => [data.campaign, ...prev]);
    } catch (err) { show(err.message, true); }
    setNlSending(false);
  };

  // Smart link
  const saveSmartLink = async (e) => {
    e.preventDefault();
    if (!selectedArtist) return show('Sélectionnez un artiste', true);
    setSlSaving(true);
    try {
      const res  = await fetch(`${API}/artists/${selectedArtist._id}/smart-link`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slSlug, socialLinks: slSocials, customBio: slBio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      show('Smart Link sauvegardé !');
    } catch (err) { show(err.message, true); }
    setSlSaving(false);
  };

  // Story upload
  const handleStoryFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setStoryFile(f);
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => setStoryPreview(r.result);
      r.readAsDataURL(f);
    } else setStoryPreview('');
  };

  const uploadStory = async (e) => {
    e.preventDefault();
    const aid = storyArtistId || selectedArtist?._id;
    if (!storyFile) return show('Sélectionnez un fichier', true);
    if (!aid) return show('Sélectionnez un artiste', true);
    setUploadingStory(true);
    try {
      const fd = new FormData();
      fd.append('media', storyFile);
      fd.append('caption', storyCaption);
      fd.append('duration', String(storyDuration));
      const res  = await fetch(`${API}/artists/${aid}/stories`, { method: 'POST', headers: h, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStories(prev => [data, ...prev]);
      setStoryFile(null); setStoryPreview(''); setStoryCaption(''); setStoryDuration(30);
      show('Story publiée ! 🎉');
    } catch (err) { show(err.message, true); }
    setUploadingStory(false);
  };

  const deleteStory = async (storyId) => {
    if (!window.confirm('Supprimer cette story ?')) return;
    try {
      const res = await fetch(`${API}/stories/${storyId}`, { method: 'DELETE', headers: h });
      if (!res.ok) throw new Error((await res.json()).message);
      setStories(prev => prev.filter(s => s._id !== storyId));
      show('Story supprimée');
    } catch (err) { show(err.message, true); }
  };

  // Événement créer
  const createEvent = async (e) => {
    e.preventDefault();
    const aid = eventArtistId || selectedArtist?._id;
    if (!aid) return show('Sélectionnez un artiste', true);
    if (!eventForm.title || !eventForm.venue || !eventForm.date || !eventForm.ticketPrice)
      return show('Titre, lieu, date et prix requis', true);
    setSavingEvent(true);
    try {
      const fd = new FormData();
      Object.entries(eventForm).forEach(([k, v]) => fd.append(k, v));
      fd.append('artistId', aid);
      if (eventImg) fd.append('image', eventImg);
      const res  = await fetch(`${API}/events`, { method: 'POST', headers: h, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(prev => [data, ...prev]);
      setEventForm({ title:'', description:'', venue:'', city:'', country:'', date:'', ticketPrice:'', ticketCapacity:'', ticketCurrency:'EUR' });
      setEventImg(null); setShowEventForm(false);
      show('Événement créé ! 🎫');
    } catch (err) { show(err.message, true); }
    setSavingEvent(false);
  };

  const deleteEvent = async (evId, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    await fetch(`${API}/events/${evId}`, { method: 'DELETE', headers: h }).catch(() => {});
    setEvents(prev => prev.filter(e => e._id !== evId));
    show('Événement supprimé');
  };

  // Certifications
  const handleCert = async (certId, action, note = '') => {
    setCertLoading(p => ({ ...p, [certId]: true }));
    try {
      const res  = await fetch(`${API}/admin/certifications/${certId}`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCertReqs(prev => prev.map(c => c._id === certId ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c));
      show(`Certification ${action === 'approve' ? 'approuvée' : 'rejetée'} !`);
    } catch (err) { show(err.message, true); }
    setCertLoading(p => ({ ...p, [certId]: false }));
  };

  // Ban/unban user
  const toggleBan = async (uid, banned) => {
    try {
      const res = await fetch(`${API}/admin/users/${uid}/ban`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !banned })
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(u => u._id === uid ? { ...u, banned: !banned } : u));
      show(!banned ? 'Utilisateur banni' : 'Utilisateur débanni');
    } catch { show('Erreur', true); }
  };

  // Delete song (admin)
  const deleteSong = async (sid, title) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    await fetch(`${API}/songs/${sid}`, { method: 'DELETE', headers: h }).catch(() => {});
    setSongs(prev => prev.filter(s => s._id !== sid));
    show('Musique supprimée');
  };

  // ── Artistes filtrés ──────────────────────────────────────
  const filteredArtists = artists.filter(a =>
    !artistSearch || a.nom?.toLowerCase().includes(artistSearch.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    !userSearch || u.nom?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Tabs config ───────────────────────────────────────────
  const tabs = [
    { k: 'overview',     icon: <BarChart2 size={13}/>,    label: 'Vue d\'ensemble' },
    { k: 'newsletter',   icon: <Send size={13}/>,          label: 'Newsletter'      },
    { k: 'stories',      icon: <Camera size={13}/>,        label: 'Stories'         },
    { k: 'events',       icon: <Ticket size={13}/>,        label: 'Événements'      },
    { k: 'smartlink',    icon: <Link2 size={13}/>,         label: 'Smart Links'     },
    { k: 'certif',       icon: <CheckCircle size={13}/>,   label: 'Certifications'  },
    { k: 'artists',      icon: <Mic2 size={13}/>,          label: 'Artistes'        },
    { k: 'users',        icon: <Users size={13}/>,         label: 'Utilisateurs'    },
    { k: 'library',      icon: <Music size={13}/>,         label: 'Bibliothèque'    },
  ];

  // ── Artist picker inline ─────────────────────────────────
  const ArtistPicker = ({ value, onChange, label = 'Artiste cible *' }) => (
    <div>
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white">
        <option value="">— Sélectionner un artiste —</option>
        {artists.map(a => <option key={a._id} value={a._id}>{a.nom}</option>)}
      </select>
    </div>
  );

  if (loadingInit) return (
    <div className="flex items-center justify-center h-64 text-zinc-500">
      <Loader2 size={28} className="animate-spin mr-3"/> Chargement...
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center shrink-0">
          <Shield size={22} className="text-red-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black">Admin Studio</h1>
          <p className="text-xs text-zinc-500">
            Panneau complet · {adminNom || 'Administrateur'} ·{' '}
            {fmt(stats.totalArtists)} artistes · {fmt(stats.totalUsers)} users
          </p>
        </div>
        {stats.pendingCerts > 0 && (
          <button onClick={() => setTab('certif')}
            className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse">
            <Bell size={12}/> {stats.pendingCerts} certif. en attente
          </button>
        )}
      </div>

      {/* ── Feedback ── */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.type === 'success' ? <Check size={13}/> : <AlertCircle size={13}/>} {msg.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition ${tab === t.k ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/60'}`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.k === 'certif' && stats.pendingCerts > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{stats.pendingCerts}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard icon={<Mic2 size={16}/>} label="Artistes" value={fmt(stats.totalArtists)} color="purple"/>
            <StatCard icon={<Users size={16}/>} label="Utilisateurs" value={fmt(stats.totalUsers)} color="blue"/>
            <StatCard icon={<Music size={16}/>} label="Musiques" value={fmt(stats.totalSongs)} color="red"/>
            <StatCard icon={<Ticket size={16}/>} label="Événements" value={fmt(stats.totalEvents)} color="orange"/>
            <StatCard icon={<Play size={16}/>} label="Écoutes totales" value={fmt(stats.totalPlays)} color="green"/>
            <StatCard icon={<Award size={16}/>} label="Certif. en attente" value={fmt(stats.pendingCerts)} sub="Nécessitent une action" color="orange"/>
          </div>

          {/* Top songs */}
          <Section icon={<TrendingUp size={15}/>} title="Top 10 musiques" badge={songs.length} accent="red">
            <div className="space-y-2">
              {[...songs].sort((a,b) => (b.plays||0)-(a.plays||0)).slice(0,10).map((s,i) => (
                <div key={s._id} className="flex items-center gap-3 p-2.5 bg-zinc-800/40 rounded-xl hover:bg-zinc-800/70 transition">
                  <span className="text-[10px] font-black text-zinc-600 w-5 text-center shrink-0">#{i+1}</span>
                  {s.image && <img src={s.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt=""/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{s.titre}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{s.artiste}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-red-400">{fmt(s.plays)}</p>
                    <p className="text-[9px] text-zinc-600">écoutes</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Artistes récents */}
          <Section icon={<Mic2 size={15}/>} title="Artistes récents" badge={artists.length} accent="purple">
            <div className="grid grid-cols-2 gap-2">
              {artists.slice(0,6).map(a => (
                <div key={a._id} className="flex items-center gap-2.5 p-2.5 bg-zinc-800/40 rounded-xl">
                  {a.image ? <img src={a.image} className="w-9 h-9 rounded-full object-cover shrink-0" alt=""/>
                    : <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-black text-sm shrink-0">{(a.nom||'?')[0]}</div>}
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{a.nom}</p>
                    <p className="text-[10px] text-zinc-500">{fmt(a.followers || a.followersCount || 0)} fans</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: NEWSLETTER
      ════════════════════════════════════════════ */}
      {tab === 'newsletter' && (
        <div className="space-y-4">
          <Section icon={<Send size={15}/>} title="Envoyer une newsletter" accent="red">
            <form onSubmit={sendNewsletter} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Cible *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNlTarget('all')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${nlTarget === 'all' ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                    <Globe size={12} className="inline mr-1.5"/>Toute la plateforme
                  </button>
                  <button type="button" onClick={() => setNlTarget('artist')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${nlTarget !== 'all' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
                    <Mic2 size={12} className="inline mr-1.5"/>Fans d'un artiste
                  </button>
                </div>
              </div>

              {nlTarget !== 'all' && (
                <ArtistPicker value={nlTarget === 'artist' ? '' : nlTarget}
                  onChange={v => setNlTarget(v || 'artist')} label="Artiste"/>
              )}

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Sujet *</label>
                <input value={nlSubject} onChange={e => setNlSubject(e.target.value)} required
                  placeholder="Mise à jour de la plateforme / Nouveau drop..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Message *</label>
                <textarea value={nlMessage} onChange={e => setNlMessage(e.target.value)} required rows={5}
                  placeholder="Contenu de la newsletter..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 resize-none"/>
              </div>
              <button type="submit" disabled={nlSending}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                {nlSending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                {nlSending ? 'Envoi en cours...' : nlTarget === 'all' ? 'Diffuser à toute la plateforme' : 'Envoyer aux fans de l\'artiste'}
              </button>
            </form>
          </Section>

          {/* Historique campagnes artiste sélectionné */}
          {campaigns.length > 0 && (
            <Section icon={<Bell size={15}/>} title="Historique campagnes" badge={campaigns.length} accent="orange">
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.subject}</p>
                      <p className="text-[10px] text-zinc-500">{fmtDate(c.sentAt)} · {c.sentTo} envois</p>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">ENVOYÉ</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: STORIES
      ════════════════════════════════════════════ */}
      {tab === 'stories' && (
        <div className="space-y-4">
          <Section icon={<Camera size={15}/>} title="Publier une story (au nom d'un artiste)" accent="purple">
            <form onSubmit={uploadStory} className="space-y-4">
              <ArtistPicker value={storyArtistId} onChange={v => { setStoryArtistId(v); setSelectedArtist(artists.find(a => a._id === v) || null); }}/>

              <div onClick={() => storyFileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${storyFile ? 'border-green-500/40 bg-green-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'}`}>
                {storyPreview ? (
                  <img src={storyPreview} className="w-24 h-24 object-cover rounded-xl mx-auto mb-2" alt=""/>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      {storyFile?.type?.startsWith('audio') ? <Volume2 size={20}/> : storyFile?.type?.startsWith('video') ? <Video size={20}/> : <ImageIcon size={20}/>}
                    </div>
                    <p className="text-xs font-bold">Cliquer pour choisir</p>
                    <p className="text-[10px]">Image, Audio ou Vidéo</p>
                  </div>
                )}
                {storyFile && !storyPreview && <p className="text-xs text-green-400 font-bold mt-2">✓ {storyFile.name}</p>}
                <input ref={storyFileRef} type="file" className="hidden" accept="image/*,audio/*,video/*" onChange={handleStoryFile}/>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Légende</label>
                <input value={storyCaption} onChange={e => setStoryCaption(e.target.value)} maxLength={150}
                  placeholder="Message affiché sur la story..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600"/>
              </div>

              {storyFile?.type?.startsWith('audio') && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Durée (sec)</label>
                  <input type="number" value={storyDuration} min={5} max={60} onChange={e => setStoryDuration(parseInt(e.target.value))}
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white"/>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-[10px] text-blue-400">
                ⏳ Expire automatiquement dans 24h · Publiée sur le profil de l'artiste sélectionné
              </div>

              <button type="submit" disabled={uploadingStory || !storyFile}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                {uploadingStory ? <Loader2 size={15} className="animate-spin"/> : <Camera size={15}/>}
                {uploadingStory ? 'Publication...' : 'Publier la story'}
              </button>
            </form>
          </Section>

          {/* Stories actives */}
          {selectedArtist && (
            <Section icon={<Eye size={15}/>} title={`Stories actives — ${selectedArtist.nom}`} badge={stories.length} accent="purple">
              {stories.length === 0 ? (
                <div className="text-center py-6 text-zinc-600">
                  <Camera size={28} className="mx-auto mb-2 opacity-20"/>
                  <p className="text-sm">Aucune story active</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stories.map(s => {
                    const hoursLeft = Math.max(0, Math.floor((new Date(s.expiresAt) - Date.now()) / 3600000));
                    return (
                      <div key={s._id} className="relative bg-zinc-800/40 rounded-2xl overflow-hidden">
                        {s.type === 'image' ? <img src={s.mediaUrl} className="w-full aspect-square object-cover" alt=""/>
                          : <div className="w-full aspect-square bg-zinc-800 flex flex-col items-center justify-center gap-2">
                              {s.type === 'audio' ? <Volume2 size={24} className="text-zinc-500"/> : <Video size={24} className="text-zinc-500"/>}
                              <span className="text-[10px] text-zinc-500 capitalize">{s.type}</span>
                            </div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2">
                          {s.caption && <p className="text-[10px] text-white font-bold truncate">{s.caption}</p>}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] text-white/60 flex items-center gap-1"><Eye size={8}/> {s.views || 0}</span>
                            <span className={`text-[9px] font-bold ${hoursLeft < 4 ? 'text-red-400' : 'text-orange-400'}`}>{hoursLeft < 1 ? '< 1h' : `${hoursLeft}h`}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteStory(s._id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition">
                          <X size={10} className="text-white"/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: ÉVÉNEMENTS
      ════════════════════════════════════════════ */}
      {tab === 'events' && (
        <div className="space-y-4">
          {!showEventForm ? (
            <button onClick={() => setShowEventForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-[0.98]">
              <Plus size={15}/> Créer un nouvel événement
            </button>
          ) : (
            <Section icon={<Ticket size={15}/>} title="Nouvel événement" accent="orange">
              <form onSubmit={createEvent} className="space-y-4">
                <ArtistPicker value={eventArtistId} onChange={setEventArtistId}/>

                {/* Image */}
                <div onClick={() => eventImgRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${eventImg ? 'border-orange-500/40 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
                  {eventImg ? <img src={URL.createObjectURL(eventImg)} className="w-full h-32 object-cover rounded-xl" alt=""/>
                    : <div className="text-zinc-600 py-3"><ImageIcon size={22} className="mx-auto mb-1.5"/><p className="text-xs">Photo de l'événement (optionnel)</p></div>}
                  <input ref={eventImgRef} type="file" accept="image/*" className="hidden" onChange={e => setEventImg(e.target.files[0])}/>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Titre *</label>
                  <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} required
                    placeholder="Concert, showcase, festival..."
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} rows={2}
                    placeholder="Programme, détails..."
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600 resize-none"/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Lieu / Salle *</label>
                    <input value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))} required
                      placeholder="Palais du peuple"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Ville</label>
                    <input value={eventForm.city} onChange={e => setEventForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Antananarivo"
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Pays</label>
                  <input value={eventForm.country} onChange={e => setEventForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="Madagascar, France, RDC..."
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Date et heure *</label>
                  <input type="datetime-local" value={eventForm.date} min={minDate} required
                    onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white"/>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Prix du billet *</label>
                    <input type="number" min="0" step="0.01" value={eventForm.ticketPrice} required placeholder="5000"
                      onChange={e => setEventForm(p => ({ ...p, ticketPrice: e.target.value }))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Devise</label>
                    <select value={eventForm.ticketCurrency} onChange={e => setEventForm(p => ({ ...p, ticketCurrency: e.target.value }))}
                      className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white">
                      {[['EUR','€'],['USD','$'],['MGA','Ar'],['CDF','FC'],['XAF','FCFA']].map(([c,s]) => (
                        <option key={c} value={c}>{c} ({s})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Capacité (0 = illimitée)</label>
                  <input type="number" min="0" value={eventForm.ticketCapacity} placeholder="500"
                    onChange={e => setEventForm(p => ({ ...p, ticketCapacity: e.target.value }))}
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-orange-600 text-white placeholder-zinc-600"/>
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={savingEvent}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                    {savingEvent ? <Loader2 size={14} className="animate-spin"/> : <Ticket size={14}/>}
                    {savingEvent ? 'Création...' : 'Créer l\'événement'}
                  </button>
                  <button type="button" onClick={() => setShowEventForm(false)}
                    className="px-4 py-2.5 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">
                    Annuler
                  </button>
                </div>
              </form>
            </Section>
          )}

          {/* Liste événements */}
          <Section icon={<Calendar size={15}/>} title="Tous les événements" badge={events.length} accent="orange">
            {events.length === 0 ? (
              <div className="text-center py-8 text-zinc-600"><Ticket size={32} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Aucun événement</p></div>
            ) : (
              <div className="space-y-3">
                {events.map(ev => {
                  const isPast    = new Date(ev.date) < new Date();
                  const isSoldOut = ev.ticketCapacity > 0 && ev.ticketsSold >= ev.ticketCapacity;
                  return (
                    <div key={ev._id} className="bg-zinc-800/40 rounded-2xl overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {ev.image ? <img src={ev.image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt=""/>
                          : <div className="w-14 h-14 bg-zinc-700 rounded-xl flex items-center justify-center shrink-0"><Ticket size={20} className="text-zinc-500"/></div>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold truncate">{ev.title}</p>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isPast ? 'bg-zinc-700 text-zinc-500' : isSoldOut ? 'bg-red-500/20 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                              {isPast ? 'PASSÉ' : isSoldOut ? 'COMPLET' : 'EN VENTE'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5"><MapPin size={9}/> {ev.venue}{ev.city ? `, ${ev.city}` : ''}</p>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1"><Calendar size={9}/> {fmtDateTime(ev.date)}</p>
                        </div>
                      </div>
                      <div className="border-t border-zinc-700/50 px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1"><Ticket size={9}/> {ev.ticketsSold || 0}{ev.ticketCapacity > 0 ? `/${ev.ticketCapacity}` : ''}</span>
                          <span className="flex items-center gap-1 text-green-400 font-bold"><DollarSign size={9}/> {((ev.ticketsSold||0)*(ev.ticketPrice||0)/100).toFixed(2)} {ev.ticketCurrency}</span>
                        </div>
                        <button onClick={() => deleteEvent(ev._id, ev.title)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: SMART LINKS
      ════════════════════════════════════════════ */}
      {tab === 'smartlink' && (
        <div className="space-y-4">
          <Section icon={<Link2 size={15}/>} title="Gérer le Smart Link d'un artiste" accent="blue">
            <div className="space-y-4">
              <ArtistPicker value={selectedArtist?._id || ''} onChange={v => setSelectedArtist(artists.find(a => a._id === v) || null)} label="Artiste"/>

              {selectedArtist && (
                <form onSubmit={saveSmartLink} className="space-y-4 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Slug (URL) *</label>
                    <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                      <span className="text-zinc-500 text-sm shrink-0">moozik.app/a/</span>
                      <input value={slSlug} onChange={e => setSlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} required
                        placeholder="nom-artiste"
                        className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600"/>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Bio personnalisée</label>
                    <textarea value={slBio} onChange={e => setSlBio(e.target.value)} rows={3}
                      placeholder="Description affichée sur la page publique..."
                      className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600 resize-none"/>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Réseaux sociaux</label>
                    <div className="space-y-2">
                      {[
                        ['instagram', <FaInstagram size={14}/>, 'https://instagram.com/...'],
                        ['youtube',   <FaYoutube size={14}/>,   'https://youtube.com/...'],
                        ['tiktok',    <FaTiktok size={14}/>,    'https://tiktok.com/@...'],
                        ['twitter',   <FaXTwitter size={14}/>,  'https://twitter.com/...'],
                        ['facebook',  <FaFacebook size={14}/>,  'https://facebook.com/...'],
                      ].map(([k, icon, ph]) => (
                        <div key={k} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2">
                          <div className="text-zinc-500 shrink-0 w-5 flex items-center justify-center">{icon}</div>
                          <input value={slSocials[k] || ''} onChange={e => setSlSocials(p => ({ ...p, [k]: e.target.value }))}
                            placeholder={ph} type="url"
                            className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600"/>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" disabled={slSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {slSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                      Sauvegarder
                    </button>
                    {slSlug && (
                      <a href={`/a/${slSlug}`} target="_blank" rel="noreferrer"
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition flex items-center gap-1.5">
                        <ExternalLink size={13}/> Voir
                      </a>
                    )}
                  </div>
                </form>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: CERTIFICATIONS
      ════════════════════════════════════════════ */}
      {tab === 'certif' && (
        <div className="space-y-4">
          {/* Pending */}
          <Section icon={<Clock size={15}/>} title="En attente de validation"
            badge={certReqs.filter(c => c.status === 'pending').length} accent="orange">
            {certReqs.filter(c => c.status === 'pending').length === 0 ? (
              <div className="text-center py-6 text-zinc-600">
                <CheckCircle size={28} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucune demande en attente 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certReqs.filter(c => c.status === 'pending').map(cert => (
                  <div key={cert._id} className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-black text-zinc-400 shrink-0">
                        {(cert.artistId?.nom || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{cert.artistId?.nom || 'Artiste inconnu'}</p>
                        <p className="text-[10px] text-zinc-500">{cert.artistId?.email}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Demande le {fmtDate(cert.requestedAt || cert.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400"/>
                        <span className="text-[10px] text-zinc-400 capitalize">{cert.level || 'standard'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCert(cert._id, 'approve')} disabled={certLoading[cert._id]}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                        {certLoading[cert._id] ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                        Approuver
                      </button>
                      <button onClick={() => { const note = prompt('Raison du refus (optionnel):') || ''; handleCert(cert._id, 'reject', note); }}
                        disabled={certLoading[cert._id]}
                        className="flex-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <X size={12}/> Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Approuvées */}
          {certReqs.filter(c => c.status === 'approved').length > 0 && (
            <Section icon={<CheckCircle size={15}/>} title="Certifications accordées"
              badge={certReqs.filter(c => c.status === 'approved').length} accent="green">
              <div className="space-y-2">
                {certReqs.filter(c => c.status === 'approved').map(cert => (
                  <div key={cert._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cert.level === 'gold' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                      {cert.level === 'gold' ? <Star size={14} className="text-yellow-400" fill="currentColor"/> : <CheckCircle size={14} className="text-blue-400"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{cert.artistId?.nom}</p>
                      <p className="text-[10px] text-zinc-500">Approuvé le {fmtDate(cert.approvedAt)}</p>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">APPROUVÉ</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: ARTISTES
      ════════════════════════════════════════════ */}
      {tab === 'artists' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/>
            <input value={artistSearch} onChange={e => setArtistSearch(e.target.value)}
              placeholder={`Rechercher parmi ${artists.length} artistes...`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-purple-600 text-white placeholder-zinc-600"/>
          </div>

          <div className="space-y-2">
            {filteredArtists.map(a => (
              <div key={a._id} className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  {a.image ? <img src={a.image} className="w-12 h-12 rounded-xl object-cover shrink-0" alt=""/>
                    : <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 font-black text-lg shrink-0">{(a.nom||'?')[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{a.nom}</p>
                      {a.certification?.status === 'approved' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.certification?.level === 'gold' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {a.certification?.level === 'gold' ? '★ OR' : '✓ VÉRIFIÉ'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500">{a.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500">{fmt(a.followers || a.followersCount || 0)} fans</span>
                      <span className="text-[10px] text-zinc-500">{a.genre || '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { setSelectedArtist(a); setStoryArtistId(a._id); setTab('stories'); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-600 px-2 py-1 rounded-lg transition">
                      <Camera size={10}/> Story
                    </button>
                    <button onClick={() => { setEventArtistId(a._id); setShowEventForm(true); setTab('events'); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-600 px-2 py-1 rounded-lg transition">
                      <Ticket size={10}/> Événement
                    </button>
                    <button onClick={() => { setSelectedArtist(a); setTab('smartlink'); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 px-2 py-1 rounded-lg transition">
                      <Link2 size={10}/> Smart Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: UTILISATEURS
      ════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={14}/>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
              placeholder={`Rechercher parmi ${users.length} utilisateurs...`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-1 ring-blue-600 text-white placeholder-zinc-600"/>
          </div>

          <Section icon={<Users size={15}/>} title="Utilisateurs" badge={filteredUsers.length} accent="blue">
            <div className="space-y-2">
              {filteredUsers.slice(0, 50).map(u => (
                <div key={u._id} className={`flex items-center gap-3 p-3 rounded-xl transition ${u.banned ? 'bg-red-500/5 border border-red-500/20' : 'bg-zinc-800/40 hover:bg-zinc-800/70'}`}>
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" alt=""/> : (u.nom || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{u.nom || 'Utilisateur'}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.banned && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">BANNI</span>}
                    <button onClick={() => toggleBan(u._id, u.banned)}
                      className={`p-1.5 rounded-lg transition text-xs ${u.banned ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'}`}
                      title={u.banned ? 'Débannir' : 'Bannir'}>
                      {u.banned ? <Unlock size={12}/> : <Lock size={12}/>}
                    </button>
                    <button onClick={() => { setNlTarget(u._id); setTab('newsletter'); }}
                      className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                      title="Envoyer un message">
                      <Mail size={12}/>
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length > 50 && <p className="text-[10px] text-zinc-600 text-center">+{filteredUsers.length - 50} autres</p>}
            </div>
          </Section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: BIBLIOTHÈQUE
      ════════════════════════════════════════════ */}
      {tab === 'library' && (
        <div className="space-y-4">
          <Section icon={<Music size={15}/>} title="Bibliothèque musicale" badge={songs.length} accent="red">
            <div className="space-y-1.5">
              {songs.map(s => (
                <div key={s._id} className="flex items-center gap-3 p-2.5 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-xl transition group">
                  {s.image && <img src={s.image} className="w-9 h-9 rounded-lg object-cover shrink-0" alt=""/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{s.titre}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{s.artiste} · {fmt(s.plays || 0)} écoutes</p>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {s.src && (
                      <a href={s.src} target="_blank" rel="noreferrer"
                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                        <ExternalLink size={12}/>
                      </a>
                    )}
                    <button onClick={() => deleteSong(s._id, s.titre)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-zinc-400">{fmt(s.plays || 0)}</p>
                    <p className="text-[9px] text-zinc-600">plays</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default AdminArtistView;