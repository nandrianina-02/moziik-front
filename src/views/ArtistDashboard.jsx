import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Users, CheckCircle, Star, Link2, Calendar, Music,
  Plus, Trash2, Edit2, Save, Loader2, Check, AlertCircle, X, Eye, Clock,
  Bell, BarChart2, ExternalLink, DollarSign
} from 'lucide-react';
import { API } from '../config/api';
import ConfirmDialog, { useConfirm } from '../components/ui/ConfirmDialog';
import { FaInstagram, FaYoutube, FaXTwitter, FaFacebook, FaTiktok } from 'react-icons/fa6';
import { RoyaltiesDashboard } from '../components/RevenueComponents';
import { TipButton } from '../components/MonetisationComponents';
import ArtistAnalyticsView from './ArtistAnalyticsView';

const Section = ({ icon, title, children }) => (
  <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/50">
      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-red-400 shrink-0">{icon}</div>
      <h3 className="font-black text-sm uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const ArtistDashboard = ({ token, userArtistId, userNom }) => {
  const [tab, setTab]             = useState('newsletter');
  const [followers, setFollowers] = useState({ count: 0, followers: [] });
  const [campaigns, setCampaigns] = useState([]);
  const [cert, setCert]           = useState(null);
  const [smartLink, setSmartLink] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [songs, setSongs]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');
  const { confirmDialog, ask, close } = useConfirm();
  

  // Newsletter form
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);

  // Smart link form
  const [slug, setSlug]         = useState('');
  const [customBio, setCustomBio] = useState('');
  const [socials, setSocials]   = useState({ instagram:'', youtube:'', tiktok:'', twitter:'', facebook:'' });
  const [savingLink, setSavingLink] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!userArtistId) return;
    Promise.all([
      fetch(`${API}/artists/${userArtistId}/followers`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/newsletter/history`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/certification`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/smart-link`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/artists/${userArtistId}/schedule`, { headers: h }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/songs?artisteId=${userArtistId}&limit=50`).then(r => r.json()),
    ]).then(([fol, camp, cer, sl, sched, songsData]) => {
      if (fol) setFollowers(fol);
      if (camp) setCampaigns(camp);
      if (cer) setCert(cer);
      if (sl) { setSmartLink(sl); setSlug(sl.slug||''); setCustomBio(sl.customBio||''); setSocials(sl.socialLinks||{}); }
      if (sched) setScheduled(Array.isArray(sched) ? sched : []);
      if (songsData?.songs) setSongs(songsData.songs);
    });
  }, [userArtistId]);

  const sendNewsletter = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return setError('Sujet et message requis');
    setSending(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/artists/${userArtistId}/newsletter`, {
        method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(`✅ Envoyé à ${data.sent} abonné${data.sent>1?'s':''}  !`);
      setSubject(''); setMessage('');
      setCampaigns(prev => [data.campaign, ...prev]);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) { setError(err.message); }
    setSending(false);
  };

  const saveSmartLink = async (e) => {
    e.preventDefault();
    setSavingLink(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/artists/${userArtistId}/smart-link`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, socialLinks: socials, customBio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSmartLink(data);
      setSuccess('Lien sauvegardé !');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    setSavingLink(false);
  };

  const requestCert = async () => {
    setLoading(true);
    const res = await fetch(`${API}/artists/${userArtistId}/certification`, {
      method: 'POST', headers: h
    }).then(r => r.json()).catch(() => null);
    if (res) setCert(res);
    setLoading(false);
  };

  const tabs = [
    { k: 'newsletter', icon: <Send size={14}/>,    label: 'Newsletter' },
    { k: 'smartlink',  icon: <Link2 size={14}/>,   label: 'Smart Link' },
    { k: 'schedule',   icon: <Calendar size={14}/>,label: 'Planning' },
    { k: 'cert',       icon: <CheckCircle size={14}/>, label: 'Certification' },
    { k: 'revenus', icon: <DollarSign size={14}/>, label: 'Revenus' },
    { k: 'analytics', icon: <BarChart2 size={14}/>, label: 'Analytics' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <ConfirmDialog config={confirmDialog} onClose={close} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center">
          <BarChart2 size={18} className="text-purple-400"/>
        </div>
        <div>
          <h1 className="text-xl font-black">Espace Artiste</h1>
          <p className="text-xs text-zinc-500">{userNom} · {followers.count} abonné{followers.count!==1?'s':''}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${tab===t.k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <ArtistAnalyticsView token={token} artistId={userArtistId} />
      )}

      {(success || error) && (
        <div className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {success ? <Check size={13}/> : <AlertCircle size={13}/>} {success || error}
        </div>
      )}

      {/* ── Newsletter ── */}
      {tab === 'newsletter' && (
        <div className="space-y-4">
          <Section icon={<Users size={15}/>} title={`Abonnés (${followers.count})`}>
            {followers.followers.length === 0
              ? <p className="text-sm text-zinc-600 text-center py-4">Aucun abonné pour le moment</p>
              : <div className="space-y-2 max-h-48 overflow-y-auto">
                  {followers.followers.slice(0,10).map(f => (
                    <div key={f._id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-400 shrink-0">
                        {(f.userId?.nom||'?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{f.userId?.nom || 'Utilisateur'}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{f.userId?.email}</p>
                      </div>
                    </div>
                  ))}
                  {followers.count > 10 && <p className="text-[10px] text-zinc-600 text-center">+{followers.count - 10} autres</p>}
                </div>
            }
            {tab === 'revenus' && (
                <RoyaltiesDashboard token={token} artistId={userArtistId} />
            )}
          </Section>

          <Section icon={<Send size={15}/>} title="Envoyer une newsletter">
            <form onSubmit={sendNewsletter} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Sujet *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="Nouveau single disponible !"
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
                  placeholder="Votre message pour vos fans..."
                  className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 resize-none" />
              </div>
              <button type="submit" disabled={sending || followers.count === 0}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {sending ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                {sending ? 'Envoi...' : `Envoyer à ${followers.count} abonné${followers.count!==1?'s':''}`}
              </button>
            </form>
          </Section>

          {campaigns.length > 0 && (
            <Section icon={<Bell size={15}/>} title="Historique des campagnes">
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c._id} className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.subject}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(c.sentAt).toLocaleDateString('fr-FR')} · {c.sentTo} envois
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">ENVOYÉ</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── Smart Link ── */}
      {tab === 'smartlink' && (
        <Section icon={<Link2 size={15}/>} title="Votre Smart Link">
          <form onSubmit={saveSmartLink} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Slug (URL) *</label>
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                <span className="text-zinc-500 text-sm shrink-0">moozik.app/a/</span>
                <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g,''))}
                  required placeholder="nom-artiste"
                  className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
              </div>
              {smartLink && <p className="text-[10px] text-green-400 mt-1 flex items-center gap-1"><Check size={9}/> Actif · {smartLink.views} vues · {smartLink.clicks} clics</p>}
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Bio personnalisée</label>
              <textarea value={customBio} onChange={e => setCustomBio(e.target.value)} rows={3}
                placeholder="Description affichée sur votre page publique..."
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600 resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Réseaux sociaux</label>
              <div className="space-y-2">
                {[
                  ['instagram', <FaInstagram size={14} />, 'https://instagram.com/...'],
                  ['youtube',   <FaYoutube size={14} />,   'https://youtube.com/...'],
                  ['tiktok',    <FaTiktok size={14} />, 'https://tiktok.com/@...'],
                  ['twitter',   <FaXTwitter size={14} />,   'https://twitter.com/...'],
                  ['facebook',  <FaFacebook size={14} />,  'https://facebook.com/...'],
                ].map(([k, icon, ph]) => (
                  <div key={k} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2">
                    <div className="text-zinc-500 shrink-0 w-5 flex items-center justify-center">{icon}</div>
                    <input value={socials[k]||''} onChange={e => setSocials(p => ({...p, [k]: e.target.value}))}
                      placeholder={ph} type="url"
                      className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingLink}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                {savingLink ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                Sauvegarder
              </button>
              {smartLink && (
                <a href={`/a/${smartLink.slug}`} target="_blank" rel="noreferrer"
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition flex items-center gap-1.5">
                  <ExternalLink size={13}/> Voir
                </a>
              )}
            </div>
          </form>
        </Section>
      )}

      {/* ── Planning ── */}
      {tab === 'schedule' && (
        <Section icon={<Calendar size={15}/>} title="Sorties programmées">
          {scheduled.length === 0
            ? <div className="text-center py-8 text-zinc-600">
                <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                <p className="text-sm">Aucune sortie programmée</p>
                <p className="text-[11px] mt-1">Lors d'un upload, choisissez une date future pour programmer</p>
              </div>
            : <div className="space-y-3">
                {scheduled.map(r => {
                  const future = new Date(r.releaseAt) > new Date();
                  return (
                    <div key={r._id} className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl">
                      {r.songId?.image && <img src={r.songId.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{r.songId?.titre}</p>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock size={9}/>
                          {new Date(r.releaseAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${future ? 'bg-orange-500/15 text-orange-400' : 'bg-green-500/15 text-green-400'}`}>
                        {future ? 'EN ATTENTE' : 'PUBLIÉ'}
                      </span>
                    </div>
                  );
                })}
              </div>
          }
        </Section>
      )}

      {/* ── Certification ── */}
      {tab === 'cert' && (
        <Section icon={<CheckCircle size={15}/>} title="Certification artiste">
          <div className="space-y-4">
            {cert?.status === 'approved' ? (
              <div className="text-center py-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${cert.level==='gold'?'bg-yellow-500/20':'bg-blue-500/20'}`}>
                  {cert.level==='gold' ? <Star size={32} className="text-yellow-400" fill="currentColor"/> : <CheckCircle size={32} className="text-blue-400"/>}
                </div>
                <p className="font-black text-lg">{cert.level==='gold' ? 'Certifié Or' : 'Artiste vérifié'}</p>
                <p className="text-zinc-500 text-sm mt-1">Badge affiché sur votre profil et vos sorties</p>
              </div>
            ) : cert?.status === 'pending' ? (
              <div className="text-center py-6 text-zinc-500">
                <Clock size={32} className="mx-auto mb-2 opacity-40"/>
                <p className="font-bold">Demande en cours de révision</p>
                <p className="text-sm mt-1">L'équipe MOOZIK examine votre demande</p>
              </div>
            ) : cert?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm font-bold text-red-400">Demande refusée</p>
                  {cert.note && <p className="text-xs text-zinc-400 mt-1">{cert.note}</p>}
                </div>
                <button onClick={requestCert} disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  Redemander la certification
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { level: 'blue', icon: <CheckCircle size={20} className="text-blue-400"/>, label: 'Badge Vérifié', desc: 'Confirme votre identité' },
                    { level: 'gold', icon: <Star size={20} className="text-yellow-400" fill="currentColor"/>, label: 'Badge Or', desc: 'Artiste professionnel' },
                  ].map(b => (
                    <div key={b.level} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 text-center">
                      <div className="flex justify-center mb-2">{b.icon}</div>
                      <p className="text-sm font-bold">{b.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{b.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 text-center">La certification est gratuite. L'équipe MOOZIK valide manuellement chaque demande.</p>
                <button onClick={requestCert} disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  Demander la certification
                </button>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
};

export default ArtistDashboard;