import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Loader2, Mic2, Trash2, ChevronRight } from 'lucide-react';
import { API } from '../config/api';

const ArtistsAdminView = ({ token }) => {
  const [artists, setArtists] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', bio: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const load = () => fetch(`${API}/artists`).then(r => r.json()).then(setArtists);
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setLoading(true);
    await fetch(`${API}/artists`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setForm({ nom: '', bio: '', email: '', password: '' }); setShowForm(false); load(); setLoading(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer cet artiste ?")) return;
    await fetch(`${API}/artists/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    load();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-2"><Users size={24} className="text-red-500" /> Artistes</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition">
          <Plus size={14} /> Nouvel artiste
        </button>
      </div>
      {showForm && (
        <form onSubmit={create} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Nom *', 'nom', 'text', true], ['Email', 'email', 'email', false], ['Mot de passe', 'password', 'password', false], ['Bio', 'bio', 'text', false]].map(([label, key, type, req]) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
              <input type={type} value={form[key]} required={req} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 ring-red-600 text-white" />
            </div>
          ))}
          <div className="col-span-1 md:col-span-2 flex gap-3">
            <button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition disabled:opacity-50">
              {loading ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white text-sm px-4 py-2">Annuler</button>
          </div>
        </form>
      )}
      <div className="flex flex-col gap-3">
        {artists.map(a => (
          <div key={a._id} className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl group">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {a.image ? <img src={a.image} className="w-full h-full object-cover" alt="" /> : <Mic2 size={20} className="text-red-600" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{a.nom}</p>
              {a.bio && <p className="text-xs text-zinc-500">{a.bio}</p>}
            </div>
            <Link to={`/artist/${a._id}`} className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition"><ChevronRight size={16} /></Link>
            <button onClick={() => remove(a._id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtistsAdminView;
