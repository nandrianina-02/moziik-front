import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, User, Mail, Key, Loader2, CheckCircle, ShieldCheck, Mic2, UserCircle, Trash2, Music, Heart, ListOrdered, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API } from '../config/api';
import { LoyaltyWidget } from '../components/SocialComponents';


const AccountView = ({ token, userNom, userEmail, userRole, userId: userIdProp, userArtistId: userArtistIdProp, isAdmin, isArtist, isUser, musiques, userPlaylists, onUpdateProfile, isLoggedIn }) => {
  // Fallback localStorage si les props arrivent vides (refresh avant verify)
  const userId      = userIdProp      || localStorage.getItem('moozik_userId')   || '';
  const userArtistId = userArtistIdProp || localStorage.getItem('moozik_artisteId') || '';

  const [nom, setNom]                 = useState(userNom || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd]   = useState(false);
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [avatarFile, setAvatarFile]   = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarKey = `moozik_avatar_${userId || userArtistId || 'guest'}`;
  const [savedAvatar, setSavedAvatar] = useState(localStorage.getItem(avatarKey) || null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [successProfile, setSuccessProfile]   = useState('');
  const [successPassword, setSuccessPassword] = useState('');
  const [errorProfile, setErrorProfile]       = useState('');
  const [errorPassword, setErrorPassword]     = useState('');
  const fileRef = useRef();

  useEffect(() => { setNom(userNom || ''); }, [userNom]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true); setErrorProfile(''); setSuccessProfile('');
    try {
      if (avatarFile) {
        // Envoyer l'avatar AU SERVEUR (Cloudinary) pour persistance multi-appareils
        let endpoint = '';
        if (isArtist && userArtistId) endpoint = `${API}/artists/${userArtistId}`;
        else if (userId)              endpoint = `${API}/users/${userId}`;
        if (endpoint) {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          const res = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
          if (res.ok) {
            const data = await res.json();
            const cloudUrl = data.avatar || data.image || avatarPreview;
            localStorage.setItem(avatarKey, cloudUrl);
            setSavedAvatar(cloudUrl); setAvatarFile(null);
            if (onUpdateProfile) onUpdateProfile({ avatar: cloudUrl });
          }
        } else {
          localStorage.setItem(avatarKey, avatarPreview);
          setSavedAvatar(avatarPreview); setAvatarFile(null);
          if (onUpdateProfile) onUpdateProfile({ avatar: avatarPreview });
        }
      }
      const trimmed = nom.trim();
      if (trimmed && trimmed !== userNom) {
        let endpoint = '';
        if (isArtist && userArtistId)        endpoint = `${API}/artists/${userArtistId}`;
        else if (userId)                      endpoint = `${API}/users/${userId}`;
        else if (isAdmin)                     endpoint = `${API}/admin/profile`;
        if (!endpoint) throw new Error('ID de profil introuvable — veuillez vous reconnecter.');
        const res = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nom: trimmed }) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Erreur serveur (${res.status})`); }
        localStorage.setItem('moozik_nom', trimmed);
        if (onUpdateProfile) onUpdateProfile({ nom: trimmed });
      }
      setSuccessProfile('Profil mis à jour !');
      setTimeout(() => setSuccessProfile(''), 4000);
    } catch (err) { setErrorProfile(err.message || 'Une erreur est survenue'); }
    finally { setLoadingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorPassword(''); setSuccessPassword('');
    if (!currentPassword)           return setErrorPassword('Mot de passe actuel requis');
    if (newPassword.length < 6)     return setErrorPassword('Minimum 6 caractères');
    if (currentPassword === newPassword) return setErrorPassword('Doit être différent');
    setLoadingPassword(true);
    try {
      let endpoint = '';
      if (isArtist && userArtistId)  endpoint = `${API}/artists/${userArtistId}/password`;
      else if (userId)               endpoint = `${API}/users/${userId}/password`;
      else if (isAdmin)              endpoint = `${API}/admin/password`;
      if (!endpoint) throw new Error('ID de profil introuvable.');
      const res = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 404) throw new Error('Fonctionnalité non disponible sur ce serveur');
        const msg = d.message || '';
        throw new Error(msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong') ? 'Mot de passe actuel incorrect' : msg || `Erreur (${res.status})`);
      }
      setSuccessPassword('Mot de passe changé !');
      setCurrentPassword(''); setNewPassword('');
      setTimeout(() => setSuccessPassword(''), 4000);
    } catch (err) { setErrorPassword(err.message); }
    finally { setLoadingPassword(false); }
  };

  const removeAvatar = () => {
    localStorage.removeItem(avatarKey);
    setSavedAvatar(null); setAvatarPreview(null); setAvatarFile(null);
    if (onUpdateProfile) onUpdateProfile({ avatar: null });
  };

  const roleConfig = isAdmin
    ? { label: 'Administrateur', color: 'from-red-600 to-red-800', Icon: ShieldCheck, badge: 'bg-red-600/20 text-red-400 border-red-600/30' }
    : isArtist
    ? { label: 'Artiste', color: 'from-purple-600 to-purple-800', Icon: Mic2, badge: 'bg-purple-600/20 text-purple-400 border-purple-600/30' }
    : { label: 'Utilisateur', color: 'from-blue-600 to-blue-800', Icon: UserCircle, badge: 'bg-blue-600/20 text-blue-400 border-blue-600/30' };

  const [favCount, setFavCount] = React.useState(0);
  React.useEffect(() => {
    if (!token) return;
    fetch(`${API}/songs/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setFavCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [token]);

  const stats = [
    { label: 'Musiques',  value: musiques?.length || 0,  icon: <Music size={16} />,       color: 'text-red-400' },
    { label: 'Favoris',   value: favCount,                icon: <Heart size={16} />,       color: 'text-pink-400' },
    { label: 'Playlists', value: userPlaylists?.length || 0, icon: <ListOrdered size={16} />, color: 'text-blue-400' },
  ];

  const displayAvatar = avatarPreview || savedAvatar;
  const pwdStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 1 : newPassword.length < 8 ? 2 : newPassword.length < 12 ? 3 : 4;
  const pwdColors  = ['bg-zinc-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const pwdLabels  = ['', 'Trop court', 'Faible', 'Correct', 'Fort'];

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-5">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${roleConfig.color} rounded-3xl p-6 md:p-8 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"><div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full translate-x-24 -translate-y-24" /></div>
        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-black/30 border-2 border-white/20 flex items-center justify-center">
              {displayAvatar ? <img src={displayAvatar} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl md:text-4xl font-black select-none">{(nom || userEmail || '?')[0].toUpperCase()}</span>}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-xl"><Camera size={14} /></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border mb-1.5 ${roleConfig.badge}`}><roleConfig.Icon size={11} /> {roleConfig.label}</span>
            <h2 className="text-2xl md:text-3xl font-black truncate">{nom || userEmail}</h2>
            <p className="text-sm text-white/60 truncate">{userEmail}</p>
            {!userId && !userArtistId && !isAdmin && (
              <p className="text-[10px] text-yellow-200/80 mt-1.5 bg-yellow-500/15 rounded-lg px-2 py-1">⚠️ Reconnectez-vous pour activer la modification du nom</p>
            )}
          </div>
        </div>
        {(isUser || isArtist) && (
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {stats.map(s => (
              <div key={s.label} className="bg-black/20 backdrop-blur rounded-xl p-3 text-center">
                <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">
        <LoyaltyWidget token={token} isLoggedIn={isLoggedIn} />
      </div>

      {/* Profile form */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8">
        <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 text-zinc-300"><User size={16} className="text-zinc-500" /> Informations du profil</h3>
        {displayAvatar && (
          <div className="flex items-center gap-3 mb-5 p-3 bg-zinc-800/60 rounded-xl">
            <img src={displayAvatar} className="w-10 h-10 rounded-lg object-cover border border-zinc-700" alt="" />
            <p className="text-xs text-zinc-400 flex-1">Photo de profil active</p>
            <button type="button" onClick={removeAvatar} className="text-zinc-500 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={13} /></button>
          </div>
        )}
        {avatarPreview && avatarPreview !== savedAvatar && (
          <div className="flex items-center gap-3 mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <img src={avatarPreview} className="w-10 h-10 rounded-lg object-cover" alt="" />
            <p className="text-xs text-blue-400 flex-1">Nouvelle photo — sauvegardez pour appliquer</p>
          </div>
        )}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Nom d'affichage</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom ou pseudo"
              disabled={!userId && !userArtistId && !isAdmin}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 flex items-center gap-1"><Mail size={10} /> Email</label>
            <input value={userEmail} readOnly className="w-full bg-zinc-800/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed" />
          </div>
          {errorProfile   && <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{errorProfile}</span></div>}
          {successProfile && <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-xl"><CheckCircle size={14} /> {successProfile}</div>}
          <button type="submit" disabled={loadingProfile} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
            {loadingProfile ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} {loadingProfile ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 md:p-8">
        <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 text-zinc-300"><Key size={16} className="text-zinc-500" /> Changer le mot de passe</h3>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Mot de passe actuel</label>
            <div className="relative">
              <input type={showCurrentPwd ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
              <button type="button" onClick={() => setShowCurrentPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition p-1">
                {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <input type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères" autoComplete="new-password"
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
              <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition p-1">
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 flex items-center gap-1.5">
                {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwdStrength ? pwdColors[pwdStrength] : 'bg-zinc-700'}`} />)}
                <span className="text-[10px] text-zinc-500 ml-1 w-16 shrink-0">{pwdLabels[pwdStrength]}</span>
              </div>
            )}
          </div>
          {errorPassword   && <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{errorPassword}</span></div>}
          {successPassword && <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-xl"><CheckCircle size={14} /> {successPassword}</div>}
          <button type="submit" disabled={loadingPassword || !currentPassword || !newPassword}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 active:scale-[0.98]">
            {loadingPassword ? <Loader2 size={17} className="animate-spin" /> : <Key size={17} />} {loadingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountView;