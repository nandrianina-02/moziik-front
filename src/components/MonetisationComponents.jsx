import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, Loader2, Check, X, Smartphone, CreditCard,
  Gift, ChevronRight, Star, CheckCircle, MapPin,
  Calendar, Ticket, Play, Pause, Volume2, VolumeX,
  ExternalLink, Crown, Clock, Users, AlertTriangle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://moozik-gft1.onrender.com';
const toEuros = (c) => (c / 100).toFixed(2);

// ════════════════════════════════════════════
// TipButton — "Soutenir cet artiste"
// ════════════════════════════════════════════
export const TipButton = ({ artistId, artistNom, token, isLoggedIn }) => {
  const [open, setOpen]         = useState(false);
  const [amount, setAmount]     = useState(5);
  const [custom, setCustom]     = useState('');
  const [message, setMessage]   = useState('');
  const [provider, setProvider] = useState('stripe');
  const [phone, setPhone]       = useState('');
  const [anonymous, setAnon]    = useState(false);
  const [loading, setLoading]   = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  const AMOUNTS = [1, 2, 5, 10, 20];
  const finalAmount = custom ? parseFloat(custom) : amount;

  const handleTip = async () => {
    if (!isLoggedIn) return alert('Connectez-vous pour envoyer un pourboire');
    if (finalAmount < 0.5) return setError('Montant minimum 0,50 €');
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/artists/${artistId}/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: finalAmount, currency: 'EUR', message, provider, anonymous, phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (provider === 'stripe' && data.clientSecret) {
        // En production : utiliser Stripe.js pour confirmer le paiement
        // Pour l'instant, rediriger vers la checkout session si URL disponible
        setClientSecret(data.clientSecret);
        setDone(true); // Simulé — en prod, attendre la confirmation Stripe
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setDone(true);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (done) return (
    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-2xl font-bold">
      <Check size={16}/> Merci pour votre soutien à {artistNom} 💚
    </div>
  );

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gradient-to-r from-pink-600/20 to-red-600/20 border border-pink-500/30 hover:border-pink-500/60 text-pink-300 font-bold text-sm px-5 py-2.5 rounded-xl transition active:scale-95">
        <Gift size={15}/> Soutenir {artistNom}
        <ChevronRight size={13} className={`transition ${open ? 'rotate-90' : ''}`}/>
      </button>

      {open && (
        <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-zinc-300">Choisir un montant</p>

          {/* Montants rapides */}
          <div className="flex gap-2 flex-wrap">
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition border ${
                  amount === a && !custom ? 'bg-pink-600/20 border-pink-500/40 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}>
                {a} €
              </button>
            ))}
            <input value={custom} onChange={e => { setCustom(e.target.value); setAmount(0); }}
              placeholder="Autre" type="number" min="0.5" step="0.5"
              className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-pink-500" />
          </div>

          {/* Message */}
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            placeholder={`Message pour ${artistNom} (optionnel)`}
            className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 ring-pink-500 resize-none" />

          {/* Provider */}
          <div className="flex gap-2">
            {[{ k:'stripe', icon:<CreditCard size={13}/>, l:'Carte' }, { k:'paydunya', icon:<Smartphone size={13}/>, l:'Mobile Money' }].map(p => (
              <button key={p.k} onClick={() => setProvider(p.k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${provider===p.k?'bg-pink-600/20 border-pink-500/40 text-white':'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`}>
                {p.icon} {p.l}
              </button>
            ))}
          </div>
          {provider === 'paydunya' && (
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Numéro de téléphone (+237...)"
              className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 ring-pink-500" />
          )}

          {/* Anonyme */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setAnon(!anonymous)}
              className={`w-8 h-4 rounded-full transition-colors relative ${anonymous ? 'bg-pink-600' : 'bg-zinc-700'} cursor-pointer`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${anonymous ? 'translate-x-4' : 'translate-x-0.5'}`}/>
            </div>
            <span className="text-xs text-zinc-400">Rester anonyme</span>
          </label>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button onClick={handleTip} disabled={loading || !finalAmount}
            className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
            {loading ? <Loader2 size={15} className="animate-spin"/> : <Heart size={15}/>}
            {loading ? 'Traitement...' : `Envoyer ${finalAmount} €`}
          </button>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// AudioAdPlayer — pub audio entre les titres
// Pour utilisateurs free uniquement
// ════════════════════════════════════════════
export const AudioAdPlayer = ({ onAdEnd, isPremium, token }) => {
  const [ad, setAd]             = useState(null);
  const [playing, setPlaying]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [skippable, setSkippable] = useState(false);
  const [muted, setMuted]       = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const SKIP_AFTER = 5; // secondes avant de pouvoir skipper

  const loadAd = useCallback(async () => {
    if (isPremium) { onAdEnd?.(); return; }
    try {
      const res = await fetch(`${API}/ads/next`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!data) { onAdEnd?.(); return; } // Pas de pub disponible
      setAd(data); setElapsed(0); setSkippable(false);
    } catch { onAdEnd?.(); }
  }, [isPremium, token]);

  useEffect(() => { loadAd(); }, [loadAd]);

  useEffect(() => {
    if (!ad || !audioRef.current) return;
    audioRef.current.src = ad.audioUrl;
    audioRef.current.muted = muted;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => onAdEnd?.());

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= SKIP_AFTER) setSkippable(true);
        if (next >= ad.duration) { handleEnd(true); }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [ad]);

  const handleEnd = async (full = false) => {
    clearInterval(timerRef.current);
    if (ad?._id) {
      await fetch(`${API}/ads/${ad._id}/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ listenedFull: full, skipped: !full }),
      }).catch(() => {});
    }
    onAdEnd?.();
  };

  const handleClick = async () => {
    if (ad?.clickUrl) {
      await fetch(`${API}/ads/${ad._id}/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clicked: true }),
      }).catch(() => {});
      window.open(ad.clickUrl, '_blank');
    }
  };

  if (!ad) return null;

  const progress = ad.duration > 0 ? (elapsed / ad.duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 md:bottom-28 left-0 right-0 md:left-[268px] md:right-3 z-40">
      <div className="bg-zinc-950/98 border border-zinc-800 rounded-2xl p-4 mx-3 md:mx-0 shadow-2xl">
        {/* Barre de progression */}
        <div className="h-0.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-3">
          {/* Visuel */}
          {ad.imageUrl && (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={handleClick}>
              <img src={ad.imageUrl} className="w-full h-full object-cover" alt="" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">PUB</span>
              {ad.clickUrl && <ExternalLink size={9} className="text-zinc-600"/>}
            </div>
            <p className="text-xs font-bold text-zinc-200 truncate">{ad.title}</p>
            <p className="text-[10px] text-zinc-500 truncate">{ad.advertiser}</p>
          </div>

          {/* Mute */}
          <button onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition shrink-0">
            {muted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
          </button>

          {/* Timer / Skip */}
          {skippable ? (
            <button onClick={() => handleEnd(false)}
              className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shrink-0">
              <X size={11}/> Passer
            </button>
          ) : (
            <div className="text-xs text-zinc-500 font-mono shrink-0 w-10 text-center">
              {SKIP_AFTER - elapsed}s
            </div>
          )}
        </div>

        {/* Upgrade hint */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-600">
          <Crown size={9} className="text-yellow-500/60"/>
          <span>Passez Premium pour écouter sans publicité</span>
        </div>

        <audio ref={audioRef} onEnded={() => handleEnd(true)} className="hidden" />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// EventsView — liste et achat de billets
// ════════════════════════════════════════════
export const EventsView = ({ token, isLoggedIn, currentSong, setCurrentSong, setIsPlaying }) => {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [buying, setBuying]     = useState(false);
  const [provider, setProvider] = useState('stripe');
  const [myTickets, setMyTickets] = useState([]);
  const [tab, setTab]           = useState('upcoming'); // 'upcoming' | 'mine'
  const [buyDone, setBuyDone]   = useState(false);

  useEffect(() => {
    fetch(`${API}/events`).then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
    if (isLoggedIn && token) {
      fetch(`${API}/tickets/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []).then(d => setMyTickets(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [isLoggedIn, token]);

  const handleBuy = async (eventId) => {
    if (!isLoggedIn) return alert('Connectez-vous pour acheter un billet');
    setBuying(true);
    try {
      const res = await fetch(`${API}/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: 1, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (data.url) { window.location.href = data.url; return; }
      setBuyDone(true);
    } catch (e) { alert(e.message); }
    setBuying(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center">
          <Ticket size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-black">Événements & Concerts</h1>
          <p className="text-xs text-zinc-500">Billets directement depuis MOOZIK</p>
        </div>
      </div>

      {/* Tabs */}
      {isLoggedIn && (
        <div className="flex gap-1 bg-zinc-900/40 rounded-xl p-1 border border-zinc-800/50">
          {[['upcoming','À venir'],['mine',`Mes billets (${myTickets.length})`]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${tab===k?'bg-red-600 text-white':'text-zinc-500 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Liste événements */}
      {tab === 'upcoming' && (
        loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-600">
            <Loader2 size={22} className="animate-spin mr-2"/> Chargement...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <Ticket size={40} className="mx-auto mb-3 opacity-20"/>
            <p className="text-sm">Aucun événement à venir</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => {
              const isSoldOut = ev.ticketCapacity > 0 && ev.ticketsSold >= ev.ticketCapacity;
              return (
                <div key={ev._id}
                  className={`bg-zinc-900/50 border rounded-2xl overflow-hidden transition cursor-pointer ${selected?._id === ev._id ? 'border-purple-500/40' : 'border-zinc-800/50 hover:border-zinc-700'}`}
                  onClick={() => setSelected(selected?._id === ev._id ? null : ev)}>
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    {ev.image ? (
                      <img src={ev.image} className="w-20 h-20 rounded-xl object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-20 h-20 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                        <Ticket size={24} className="text-zinc-600"/>
                      </div>
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-sm">{ev.title}</p>
                          {ev.artistId && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[11px] text-zinc-500">{ev.artistId.nom}</p>
                              {ev.artistId.certified && <CheckCircle size={9} className="text-blue-400"/>}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-sm text-purple-300">{toEuros(ev.ticketPrice)} €</p>
                          {isSoldOut && <p className="text-[9px] text-red-400 font-bold">COMPLET</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600 flex-wrap">
                        <span className="flex items-center gap-1"><Calendar size={9}/>{new Date(ev.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</span>
                        <span className="flex items-center gap-1"><MapPin size={9}/>{ev.venue}{ev.city ? `, ${ev.city}` : ''}</span>
                        {ev.ticketCapacity > 0 && <span className="flex items-center gap-1"><Users size={9}/>{ev.ticketsSold}/{ev.ticketCapacity}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Panel achat */}
                  {selected?._id === ev._id && (
                    <div className="border-t border-zinc-800 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                      {ev.description && <p className="text-xs text-zinc-400 leading-relaxed">{ev.description}</p>}
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Clock size={10}/> {formatDate(ev.date)}
                      </p>
                      <div className="flex gap-2">
                        {[{ k:'stripe', icon:<CreditCard size={12}/>, l:'Carte' }, { k:'paydunya', icon:<Smartphone size={12}/>, l:'Mobile Money' }].map(p => (
                          <button key={p.k} onClick={() => setProvider(p.k)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${provider===p.k?'bg-purple-600/20 border-purple-500/40 text-white':'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'}`}>
                            {p.icon} {p.l}
                          </button>
                        ))}
                      </div>
                      {buyDone ? (
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl">
                          <Check size={13}/> Billet confirmé !
                        </div>
                      ) : (
                        <button onClick={() => handleBuy(ev._id)} disabled={buying || isSoldOut}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                          {buying ? <Loader2 size={14} className="animate-spin"/> : <Ticket size={14}/>}
                          {buying ? 'Traitement...' : isSoldOut ? 'Complet' : `Acheter — ${toEuros(ev.ticketPrice)} €`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Mes billets */}
      {tab === 'mine' && (
        <div className="space-y-3">
          {myTickets.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Ticket size={32} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">Aucun billet acheté</p>
            </div>
          ) : myTickets.map(t => (
            <div key={t._id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                {t.eventId?.image && <img src={t.eventId.image} className="w-12 h-12 rounded-xl object-cover shrink-0" alt=""/>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{t.eventId?.title}</p>
                  <p className="text-[10px] text-zinc-500">{t.eventId?.venue} — {t.eventId?.date ? new Date(t.eventId.date).toLocaleDateString('fr-FR') : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${t.used ? 'bg-zinc-700 text-zinc-500' : 'bg-green-500/15 text-green-400'}`}>
                    {t.used ? 'UTILISÉ' : 'VALIDE'}
                  </span>
                </div>
              </div>
              {/* QR Code hint */}
              <div className="mt-3 bg-zinc-800/40 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array(9).fill(0).map((_,i) => <div key={i} className={`w-1.5 h-1.5 rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}/>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold">Code QR d'entrée</p>
                  <p className="text-[9px] text-zinc-600 font-mono">{t.qrCode.slice(0,16)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};