import React, { useState } from 'react';
import { LogIn, X, UserCircle, Mic2, ShieldCheck, Loader2 } from 'lucide-react';
import { API } from '../../config/api';

const LoginModal = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    let endpoint = '';
    if (mode === 'admin') endpoint = '/admin/login';
    else if (mode === 'artist') endpoint = '/artists/login';
    else endpoint = isRegister ? '/users/register' : '/users/login';
    try {
      const body = mode === 'user' && isRegister ? { email, password, nom } : { email, password };
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Erreur de connexion');
      else {
        localStorage.setItem('moozik_token', data.token);
        localStorage.setItem('moozik_email', data.email);
        localStorage.setItem('moozik_role', data.role);
        if (data.nom) localStorage.setItem('moozik_nom', data.nom);
        if (data.artisteId) localStorage.setItem('moozik_artisteId', data.artisteId);
        if (data.userId) localStorage.setItem('moozik_userId', data.userId);
        onLogin(data);
      }
    } catch { setError('Impossible de contacter le serveur'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'user', label: 'Utilisateur', icon: <UserCircle size={14} /> },
    { key: 'artist', label: 'Artiste', icon: <Mic2 size={14} /> },
    { key: 'admin', label: 'Admin', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-300 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic flex items-center gap-2">
            <LogIn className="text-red-600" size={22} /> CONNEXION
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex bg-zinc-800 rounded-xl p-1 mb-6 gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setMode(t.key); setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${mode === t.key ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {mode === 'user' && (
          <div className="flex bg-zinc-800/50 rounded-lg p-0.5 mb-4">
            <button onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${!isRegister ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Se connecter</button>
            <button onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition ${isRegister ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Créer un compte</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'user' && isRegister && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Nom d'affichage</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom ou pseudo"
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" required />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.com"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" required />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'Connexion...' : (isRegister ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
