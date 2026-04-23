import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Music, Loader2, Check,
  CreditCard, Smartphone, AlertCircle, ExternalLink,
  BarChart2, Download, Heart, ShoppingCart, Play,
  Settings, Crown, Zap, RefreshCw, ChevronRight
} from 'lucide-react';

// const API = import.meta.env.VITE_API_URL || 'https://moozik-gft1.onrender.com';
import { API } from '../config/api';
const toEuros = (c) => (c / 100).toFixed(2);

// ════════════════════════════════════════════
// RoyaltiesDashboard — espace artiste revenus
// ════════════════════════════════════════════
export const RoyaltiesDashboard = ({ token, artistId }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [payout, setPayout]     = useState(null);
  const [savingPayout, setSavingPayout] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileProvider, setMobileProvider] = useState('none');
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [success, setSuccess]   = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    fetch(`${API}/artists/${artistId}/royalties`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setData(d); setPayout(d.payout || null); setPaypalEmail(d.payout?.paypalEmail || ''); setMobilePhone(d.payout?.mobileMoneyPhone || ''); setMobileProvider(d.payout?.mobileMoneyProvider || 'none'); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistId]);

  const savePayout = async (e) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      const res = await fetch(`${API}/artists/${artistId}/payout`, {
        method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypalEmail, mobileMoneyPhone: mobilePhone, mobileMoneyProvider: mobileProvider }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      setPayout(d); setSuccess('Informations de paiement sauvegardées !');
      setTimeout(() => setSuccess(''), 3000);
      setShowPayoutForm(false);
    } catch (e) { setSuccess(''); alert(e.message); }
    setSavingPayout(false);
  };

  const connectStripe = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch(`${API}/artists/${artistId}/stripe-connect`, { method: 'POST', headers: h });
      const d   = await res.json();
      if (d.url) window.location.href = d.url;
    } catch (e) { alert(e.message); }
    setStripeLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-zinc-600"><Loader2 size={22} className="animate-spin mr-2"/> Chargement...</div>;

  const pendingEuros  = toEuros(payout?.pendingBalance || 0);
  const totalEuros    = toEuros(payout?.totalEarned    || 0);
  const tipsEuros     = data?.totalTipsEuros || '0.00';
  const currentMonth  = data?.royalties?.[0];

  return (
    <div className="space-y-5">
      {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2"><Check size={13}/>{success}</div>}

      {/* Solde */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'En attente', value: `${pendingEuros} €`, icon: <DollarSign size={16}/>, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total gagné', value: `${totalEuros} €`,  icon: <TrendingUp size={16}/>, color: 'text-blue-400',  bg: 'bg-blue-500/10' },
          { label: 'Pourboires', value: `${tipsEuros} €`,    icon: <Heart size={16}/>,      color: 'text-pink-400',  bg: 'bg-pink-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-zinc-800/50 rounded-2xl p-4`}>
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ce mois-ci */}
      {currentMonth && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-zinc-300 mb-3 flex items-center gap-2">
            <BarChart2 size={14} className="text-red-400"/> Ce mois ({currentMonth.period})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { l: 'Écoutes', v: currentMonth.plays?.toLocaleString() || 0, icon: <Play size={12}/> },
              { l: 'Premium', v: currentMonth.sources?.premium || 0,       icon: <Crown size={12}/> },
              { l: 'Ventes',  v: `${toEuros(currentMonth.sources?.purchases||0)} €`, icon: <ShoppingCart size={12}/> },
              { l: 'Revenus', v: `${toEuros(currentMonth.revenue||0)} €`,  icon: <DollarSign size={12}/> },
            ].map(s => (
              <div key={s.l} className="bg-zinc-800/40 rounded-xl p-3">
                <div className="flex justify-center mb-1 text-zinc-500">{s.icon}</div>
                <p className="text-base font-black">{s.v}</p>
                <p className="text-[9px] text-zinc-600 uppercase tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique royalties */}
      {data?.royalties?.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-zinc-300 mb-3">Historique mensuel</h3>
          <div className="space-y-2">
            {data.royalties.map(r => (
              <div key={r._id} className="flex items-center justify-between py-2 border-b border-zinc-800/40 last:border-0">
                <div>
                  <p className="text-sm font-bold">{r.period}</p>
                  <p className="text-[10px] text-zinc-600">{r.plays?.toLocaleString()} écoutes</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-400">{toEuros(r.revenue)} €</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.status==='paid'?'bg-green-500/15 text-green-400':r.status==='processing'?'bg-orange-500/15 text-orange-400':'bg-zinc-700 text-zinc-500'}`}>
                    {r.status === 'paid' ? 'VERSÉ' : r.status === 'processing' ? 'EN COURS' : 'EN ATTENTE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config paiement */}
      <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-zinc-300 flex items-center gap-2"><Settings size={14} className="text-zinc-500"/> Recevoir mes paiements</h3>
          <button onClick={() => setShowPayoutForm(!showPayoutForm)} className="text-xs text-zinc-500 hover:text-white transition">
            {showPayoutForm ? 'Fermer' : 'Modifier'}
          </button>
        </div>

        {/* Stripe Connect */}
        <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <CreditCard size={14} className="text-blue-400"/>
            </div>
            <div>
              <p className="text-xs font-bold">Stripe Connect (virement bancaire)</p>
              <p className="text-[10px] text-zinc-600">{payout?.onboardingDone ? '✅ Compte connecté' : 'Compte non configuré'}</p>
            </div>
          </div>
          <button onClick={connectStripe} disabled={stripeLoading}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
            {stripeLoading ? <Loader2 size={11} className="animate-spin"/> : <ExternalLink size={11}/>}
            {payout?.stripeAccountId ? 'Gérer' : 'Connecter'}
          </button>
        </div>

        {showPayoutForm && (
          <form onSubmit={savePayout} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">PayPal / Email</label>
              <input value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} type="email"
                placeholder="votre@paypal.com"
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Mobile Money — Numéro</label>
              <input value={mobilePhone} onChange={e => setMobilePhone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Opérateur Mobile Money</label>
              <select value={mobileProvider} onChange={e => setMobileProvider(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 ring-red-600 text-white">
                <option value="none">Choisir...</option>
                <option value="orange">Orange Money</option>
                <option value="airtel">Airtel Money</option>
                <option value="mpesa">M-Pesa</option>
                <option value="wave">Wave</option>
              </select>
            </div>
            <button type="submit" disabled={savingPayout}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {savingPayout ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
              Sauvegarder
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// SongPriceModal — mettre un titre en vente
// ════════════════════════════════════════════
export const SongPriceModal = ({ song, token, onClose, onSaved }) => {
  const [price, setPrice]         = useState('');
  const [forSale, setForSale]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [current, setCurrent]     = useState(null);

  useEffect(() => {
    fetch(`${API}/songs/${song._id}/price`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setCurrent(d); setForSale(d.forSale || false); setPrice(d.forSale ? toEuros(d.price) : ''); } })
      .catch(() => {});
  }, [song._id]);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/songs/${song._id}/price`, {
        method: 'PUT', headers: { ...{ Authorization: `Bearer ${token}` }, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(price || 0), forSale, currency: 'EUR' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved?.(data); onClose();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-400 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800">
          <h3 className="font-black text-sm flex items-center gap-2"><ShoppingCart size={15} className="text-green-400"/> Vendre ce titre</h3>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">"{song.titre}"</p>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          {/* Toggle vente */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Mettre en vente</p>
            <button type="button" onClick={() => setForSale(!forSale)}
              className={`w-11 h-6 rounded-full transition-colors relative ${forSale ? 'bg-green-600' : 'bg-zinc-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${forSale ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>

          {forSale && (
            <>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Prix (€) *</label>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                  <span className="text-zinc-500 text-sm">€</span>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0.5" step="0.1" required
                    placeholder="0.99" className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600" />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">Minimum 0,50 € · Commission plateforme : 20%</p>
                {price && <p className="text-[10px] text-green-400 mt-0.5">Vous recevez : {toEuros(Math.round(parseFloat(price) * 80))} €</p>}
              </div>
              <div className="bg-zinc-800/40 rounded-xl p-3 text-xs text-zinc-500 space-y-1">
                <p>✓ Les abonnés Premium téléchargent gratuitement</p>
                <p>✓ Aperçu 30s gratuit pour tous</p>
                <p>✓ Vos revenus sont versés chaque mois</p>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
              {forSale ? 'Mettre en vente' : 'Retirer de la vente'}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-zinc-400 hover:text-white text-sm rounded-xl hover:bg-zinc-800 transition">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
// AdminMonetisationView — vue admin globale
// ════════════════════════════════════════════
export const AdminMonetisationView = ({ token }) => {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState('overview');
  const [processing, setProcessing] = useState(false);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  const h = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const [royalties, subs, purchases, ads, events, config] = await Promise.all([
        fetch(`${API}/admin/royalties?period=${period}`, { headers: h }).then(r => r.ok ? r.json() : {}),
        fetch(`${API}/admin/subscriptions`, { headers: h }).then(r => r.ok ? r.json() : { subs: [], total: 0 }),
        fetch(`${API}/admin/purchases`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/ads`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/events`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/monetisation/config`, { headers: h }).then(r => r.ok ? r.json() : {}),
      ]);
      setData({ royalties, subs, purchases, ads, events, config });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const triggerPayout = async () => {
    setProcessing(true);
    const res = await fetch(`${API}/admin/royalties/payout`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ period }) });
    const d = await res.json();
    alert(d.message);
    setProcessing(false);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-zinc-600"><Loader2 size={22} className="animate-spin mr-2"/> Chargement...</div>;

  const totalRevenue = (data?.royalties?.totalEuros || '0') ;
  const premiumCount = data?.subs?.subs?.filter(s => s.planName === 'premium' && s.status === 'active').length || 0;
  const purchaseRevenue = (data?.purchases || []).reduce((s, p) => s + (p.price || 0), 0);
  const adRevenue = (data?.ads || []).reduce((s, a) => s + (a.spent || 0), 0);
  const ticketRevenue = (data?.events || []).reduce((s, e) => s + (e.revenue || 0), 0);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black flex items-center gap-2"><DollarSign size={24} className="text-green-400"/> Monétisation</h2>
        <div className="flex gap-2">
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-1 ring-red-600" />
          <button onClick={triggerPayout} disabled={processing}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50">
            {processing ? <Loader2 size={12} className="animate-spin"/> : <DollarSign size={12}/>}
            Virer les royalties
          </button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Abonnés Premium',  v: premiumCount,                              icon: <Crown size={16}/>,        color: 'text-yellow-400' },
          { l: 'Ventes MP3',       v: `${toEuros(purchaseRevenue)} €`,           icon: <Download size={16}/>,     color: 'text-blue-400' },
          { l: 'Revenus tickets',  v: `${toEuros(ticketRevenue)} €`,            icon: <ShoppingCart size={16}/>, color: 'text-purple-400' },
          { l: 'Revenus pub',      v: `${toEuros(adRevenue)} €`,                icon: <Zap size={16}/>,          color: 'text-orange-400' },
        ].map(s => (
          <div key={s.l} className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4">
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-black">{s.v}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Royalties artistes */}
      {data?.royalties?.royalties?.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-zinc-300 mb-4">Royalties artistes — {period}</h3>
          <div className="space-y-2">
            {data.royalties.royalties.slice(0, 10).map(r => (
              <div key={r._id} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition">
                {r.artistId?.image && <img src={r.artistId.image} className="w-8 h-8 rounded-full object-cover shrink-0" alt=""/>}
                <p className="flex-1 text-sm font-bold truncate">{r.artistId?.nom}</p>
                <p className="text-sm font-black text-green-400">{toEuros(r.revenue)} €</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${r.status==='paid'?'bg-green-500/15 text-green-400':r.status==='processing'?'bg-orange-500/15 text-orange-400':'bg-zinc-700 text-zinc-500'}`}>
                  {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-right text-sm font-black text-green-400 mt-3 pt-3 border-t border-zinc-800">
            Total : {data.royalties.totalEuros} €
          </p>
        </div>
      )}

      {/* Campagnes pub */}
      {data?.ads?.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2"><Zap size={14} className="text-orange-400"/> Campagnes audio</h3>
          <div className="space-y-2">
            {data.ads.map(ad => (
              <div key={ad._id} className="flex items-center gap-3 p-2.5 bg-zinc-800/30 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{ad.title}</p>
                  <p className="text-[10px] text-zinc-500">{ad.advertiser} · {ad.impressions?.toLocaleString()} impressions · CTR {ad.ctr}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-orange-400">{ad.spentEuros} €</p>
                  <p className="text-[10px] text-zinc-600">/{ad.budgetEuros} € budget</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ad.active ? 'bg-green-500/15 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                  {ad.active ? 'ACTIF' : 'INACTIF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};