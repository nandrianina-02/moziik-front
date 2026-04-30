import React, { useState, useRef, useEffect } from 'react';
import {
  Camera, Save, User, Mail, Key, Loader2, CheckCircle, ShieldCheck,
  Mic2, UserCircle, Trash2, Music, Heart, ListOrdered, AlertCircle,
  Eye, EyeOff, Flame, Share2, Trophy, Image as ImageIcon, Check,
  Settings, Star, Globe, Bell, Radio
} from 'lucide-react';
import { API } from '../config/api';

// ── Google Fonts ──────────────────────────────────────────




// ── Streak Badge ──────────────────────────────────────────
const StreakBadge = ({ streak }) => {
  if (!streak || streak < 1) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'linear-gradient(90deg,#f97316,#fbbf24)',
      color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      padding: '3px 10px', borderRadius: 100,
    }}>
      <Flame size={11} />
      {streak} jour{streak > 1 ? 's' : ''} de suite
    </span>
  );
};

// ── Password Strength ─────────────────────────────────────
const PwdStrength = ({ value }) => {
  if (!value) return null;
  const s = value.length < 6 ? 1 : value.length < 8 ? 2 : value.length < 12 ? 3 : 4;
  const colors = ['', '#E24B4A', '#f97316', '#fbbf24', '#4ade80'];
  const labels = ['', 'Trop court', 'Faible', 'Correct', 'Fort'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: 3, flex: 1, borderRadius: 100,
          background: i <= s ? colors[s] : 'rgba(255,255,255,0.1)',
          transition: 'background 0.3s',
        }} />
      ))}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 52, textAlign: 'right' }}>
        {labels[s]}
      </span>
    </div>
  );
};

// ── Alert ─────────────────────────────────────────────────
const Alert = ({ type, msg }) => {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 10, fontSize: 12, marginTop: 10,
      background: isErr ? 'rgba(226,75,74,0.08)' : 'rgba(74,222,128,0.08)',
      border: `0.5px solid ${isErr ? 'rgba(226,75,74,0.25)' : 'rgba(74,222,128,0.25)'}`,
      color: isErr ? '#fca5a5' : '#86efac',
    }}>
      {isErr
        ? <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        : <CheckCircle size={14} style={{ flexShrink: 0 }} />}
      <span>{msg}</span>
    </div>
  );
};

// ── Toggle Switch ─────────────────────────────────────────
const ToggleRow = ({ label, sub, value, onChange }) => (
  <div
    onClick={() => onChange(!value)}
    style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 24px', cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
    </div>
    <div style={{
      width: 40, height: 22, borderRadius: 100, flexShrink: 0,
      background: value ? '#E24B4A' : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'transform 0.2s',
        transform: value ? 'translateX(18px)' : 'translateX(0)',
      }} />
    </div>
  </div>
);

// ── Section Card ──────────────────────────────────────────
const SectionCard = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 20, overflow: 'hidden', ...style,
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, badge }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '20px 24px 0',
  }}>
    <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>{icon}</span>
    <span style={{
      fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.4)',
    }}>{title}</span>
    {badge && (
      <span style={{
        marginLeft: 'auto', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '3px 8px', borderRadius: 100,
        background: 'rgba(74,222,128,0.12)', color: '#86efac',
        border: '0.5px solid rgba(74,222,128,0.25)',
      }}>{badge}</span>
    )}
  </div>
);

const SectionBody = ({ children }) => (
  <div style={{ padding: '20px 24px 24px' }}>{children}</div>
);

// ── Field ─────────────────────────────────────────────────
const Field = ({ label, icon, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 500, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
      marginBottom: 6,
    }}>
      {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
      {label}
    </div>
    {children}
  </div>
);

const Input = ({ readonly, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%',
      background: readonly ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
      border: `0.5px solid ${readonly ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 10, padding: '10px 14px',
      fontSize: 14, fontFamily: "'DM Sans', sans-serif",
      color: readonly ? 'rgba(255,255,255,0.3)' : '#fff',
      outline: 'none', opacity: props.disabled ? 0.4 : 1,
      cursor: readonly || props.disabled ? 'not-allowed' : 'text',
      boxSizing: 'border-box',
    }}
    onFocus={e => { if (!readonly && !props.disabled) e.target.style.borderColor = '#E24B4A'; }}
    onBlur={e => { e.target.style.borderColor = readonly ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'; }}
    readOnly={readonly}
  />
);

// ── Primary Button ────────────────────────────────────────
const BtnPrimary = ({ children, loading, onClick, disabled, variant = 'red' }) => {
  const bg = variant === 'red' ? '#E24B4A' : variant === 'purple' ? 'rgba(147,51,234,0.3)' : 'rgba(255,255,255,0.08)';
  const hoverBg = variant === 'red' ? '#c43a39' : variant === 'purple' ? 'rgba(147,51,234,0.45)' : 'rgba(255,255,255,0.13)';
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '12px 16px',
        background: disabled ? 'rgba(255,255,255,0.06)' : bg,
        border: variant === 'purple' ? '0.5px solid rgba(192,132,252,0.3)' : 'none',
        borderRadius: 12, color: '#fff',
        fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 14, transition: 'background 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = disabled ? 'rgba(255,255,255,0.06)' : bg; }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
  );
};

// ── Daily Song Share ──────────────────────────────────────
const DailySongShare = ({ token, musiques }) => {
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef();
  if (!musiques?.length) return null;
  const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const song = musiques[seed % musiques.length];

  const handleShare = async () => {
    setSharing(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1080; canvas.height = 1080;
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#18181b'); grad.addColorStop(1, '#450a0a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080);
      if (song.image) {
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = song.image; });
        const size = 600, x = 240, y = 180, r = 32;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + size - r, y);
        ctx.arcTo(x + size, y, x + size, y + r, r);
        ctx.lineTo(x + size, y + size - r);
        ctx.arcTo(x + size, y + size, x + size - r, y + size, r);
        ctx.lineTo(x + r, y + size);
        ctx.arcTo(x, y + size, x, y + size - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('MOOZIK', 540, 100);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 52px sans-serif';
      ctx.fillText(song.titre.length > 22 ? song.titre.slice(0, 22) + '…' : song.titre, 540, 850);
      ctx.fillStyle = '#a1a1aa'; ctx.font = '36px sans-serif';
      ctx.fillText(song.artiste.toUpperCase(), 540, 910);
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Ma chanson du jour', 540, 980);
      const link = document.createElement('a');
      link.download = `moozik-${song.titre.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      const text = `🎵 Ma chanson du jour sur MOOZIK : ${song.titre} — ${song.artiste}`;
      navigator.clipboard.writeText(text).catch(() => {});
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    }
    setSharing(false);
  };

  return (
    <SectionCard>
      <SectionHeader icon={<Share2 size={14} />} title="Chanson du jour" />
      <SectionBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {song.image && (
            <img src={song.image} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '0.5px solid rgba(255,255,255,0.08)' }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.titre}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{song.artiste}</div>
          </div>
        </div>
        <BtnPrimary variant="default" loading={sharing} onClick={handleShare}>
          {done ? <><Check size={14} /> Image générée !</> : <><ImageIcon size={14} /> Générer image Instagram/WhatsApp</>}
        </BtnPrimary>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </SectionBody>
    </SectionCard>
  );
};

// ── Weekly Top 5 ──────────────────────────────────────────
const WeeklyTop5 = ({ token }) => {
  const [top5, setTop5] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/history/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.topSongs?.length) setTop5(d.topSongs.slice(0, 5).map(s => ({
          _id: s.song?._id, titre: s.song?.titre, artiste: s.song?.artiste,
          image: s.song?.image, count: s.count,
        })));
      }).catch(() => {});
  }, [token]);

  if (!top5.length) return null;
  const rankColors = ['#fbbf24', 'rgba(255,255,255,0.5)', '#cd7c2f', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)'];

  return (
    <SectionCard>
      <SectionHeader icon={<Trophy size={14} />} title="Mon top 5 de la semaine" badge="Public" />
      <SectionBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {top5.map((song, i) => (
            <div key={song._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, width: 18, textAlign: 'center', color: rankColors[i], flexShrink: 0 }}>
                {i + 1}
              </span>
              {song.image && <img src={song.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.titre}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artiste}</div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontStyle: 'italic' }}>{song.count}×</span>
            </div>
          ))}
        </div>
      </SectionBody>
    </SectionCard>
  );
};

// ── Artist Banner ─────────────────────────────────────────
const ArtistBanner = ({ nom, artistCoverPreview, onChangeCover }) => {
  const fileRef = useRef();
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(147,51,234,0.12), rgba(219,39,119,0.08))',
      border: '0.5px solid rgba(192,132,252,0.2)',
      borderRadius: 20, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div
        style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, cursor: 'pointer' }}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 14, overflow: 'hidden',
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {artistCoverPreview
            ? <img src={artistCoverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>
                {(nom || '?')[0].toUpperCase()}
              </span>
          }
        </div>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          <Camera size={18} color="#fff" />
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChangeCover} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#c084fc', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Page artiste publique
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nom || "Votre nom d'artiste"}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Photo visible par tous les auditeurs</div>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(147,51,234,0.22)', border: '0.5px solid rgba(192,132,252,0.3)',
          color: '#c084fc', fontSize: 11, fontWeight: 500, padding: '8px 14px',
          borderRadius: 100, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.38)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(147,51,234,0.22)'}
      >
        <Camera size={12} /> Modifier
      </button>
    </div>
  );
};

// ── Loyalty Widget ────────────────────────────────────────
const LoyaltyWidget = ({ token, isLoggedIn }) => {
  // Remplace par ta vraie logique de fetch si besoin
  const points = 1240;
  const nextLevel = 2000;
  const pct = Math.round((points / nextLevel) * 100);

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(226,75,74,0.1),rgba(30,10,60,0.3))',
      border: '0.5px solid rgba(226,75,74,0.2)',
      borderRadius: 20, padding: '20px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(226,75,74,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
          <Star size={11} style={{ display: 'inline', marginRight: 5 }} />
          Points de fidélité
        </span>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {points.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>pts</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#E24B4A,#f97316)', borderRadius: 100, width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
        <span>Niveau Or</span>
        <span>{nextLevel - points} pts → Platine</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// ACCOUNT VIEW
// ════════════════════════════════════════════════════════════
const AccountView = ({
  token, userNom, userEmail, userRole,
  userId: userIdProp, userArtistId: userArtistIdProp,
  isAdmin, isArtist, isUser, musiques, userPlaylists,
  onUpdateProfile, isLoggedIn,
  API,
}) => {
  const userId       = userIdProp       || localStorage.getItem('moozik_userId')    || '';
  const userArtistId = userArtistIdProp || localStorage.getItem('moozik_artisteId') || '';

  // Profile
  const [nom, setNom]                         = useState(userNom || '');
  const [avatarFile, setAvatarFile]           = useState(null);
  const [avatarPreview, setAvatarPreview]     = useState(null);
  const avatarKey                              = `moozik_avatar_${userId || userArtistId || 'guest'}`;
  const [savedAvatar, setSavedAvatar]         = useState(localStorage.getItem(avatarKey) || null);
  const [loadingProfile, setLoadingProfile]   = useState(false);
  const [profileMsg, setProfileMsg]           = useState({ type: '', text: '' });

  // Artist cover
  const [artistCoverFile, setArtistCoverFile]         = useState(null);
  const [artistCoverPreview, setArtistCoverPreview]   = useState(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [showCurrentPwd, setShowCurrentPwd]   = useState(false);
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [pwdMsg, setPwdMsg]                   = useState({ type: '', text: '' });

  // Streak / stats
  const [streak, setStreak]     = useState(0);
  const [favCount, setFavCount] = useState(0);

  // Preferences
  const [prefPublic, setPrefPublic]     = useState(true);
  const [prefNotifs, setPrefNotifs]     = useState(true);
  const [prefActivity, setPrefActivity] = useState(false);

  const avatarInputRef = useRef();

  useEffect(() => { setNom(userNom || ''); }, [userNom]);

  // Favoris
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/songs/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setFavCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, [token]);

  // Streak
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/history?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.history?.length) return;
        const days = new Set(d.history.map(h => new Date(h.playedAt).toISOString().slice(0, 10)));
        let s = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const day = new Date(today);
          day.setDate(today.getDate() - i);
          if (days.has(day.toISOString().slice(0, 10))) s++;
          else if (i > 0) break;
        }
        setStreak(s);
        localStorage.setItem('moozik_streak', String(s));
      }).catch(() => {});
  }, [token]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleArtistCoverChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setArtistCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setArtistCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const flash = (setter, type, text, delay = 4000) => {
    setter({ type, text });
    setTimeout(() => setter({ type: '', text: '' }), delay);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setLoadingProfile(true);
    try {
      if (avatarFile) {
        let endpoint = isArtist && userArtistId ? `${API}/artists/${userArtistId}` : userId ? `${API}/users/${userId}` : '';
        if (endpoint) {
          const fd = new FormData(); fd.append('avatar', avatarFile);
          const res = await fetch(endpoint, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
          if (res.ok) {
            const data = await res.json();
            const cloudUrl = data.avatar || data.image || avatarPreview;
            localStorage.setItem(avatarKey, cloudUrl);
            setSavedAvatar(cloudUrl);
            if (onUpdateProfile) onUpdateProfile({ avatar: cloudUrl });
          }
        } else {
          localStorage.setItem(avatarKey, avatarPreview);
          setSavedAvatar(avatarPreview);
          if (onUpdateProfile) onUpdateProfile({ avatar: avatarPreview });
        }
        setAvatarFile(null);
      }
      if (artistCoverFile && isArtist && userArtistId) {
        const fd = new FormData(); fd.append('image', artistCoverFile);
        await fetch(`${API}/artists/${userArtistId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd }).catch(() => {});
        setArtistCoverFile(null);
      }
      const trimmed = nom.trim();
      if (trimmed && trimmed !== userNom) {
        let endpoint = isArtist && userArtistId ? `${API}/artists/${userArtistId}` : userId ? `${API}/users/${userId}` : isAdmin ? `${API}/admin/profile` : '';
        if (!endpoint) throw new Error('ID introuvable — reconnectez-vous.');
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nom: trimmed }),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Erreur (${res.status})`); }
        localStorage.setItem('moozik_nom', trimmed);
        if (onUpdateProfile) onUpdateProfile({ nom: trimmed });
      }
      flash(setProfileMsg, 'success', 'Profil mis à jour !');
    } catch (err) {
      flash(setProfileMsg, 'error', err.message || 'Erreur inconnue');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!currentPassword)                return flash(setPwdMsg, 'error', 'Mot de passe actuel requis');
    if (newPassword.length < 6)          return flash(setPwdMsg, 'error', 'Minimum 6 caractères');
    if (currentPassword === newPassword) return flash(setPwdMsg, 'error', 'Doit être différent');
    setLoadingPassword(true);
    try {
      let endpoint = isArtist && userArtistId ? `${API}/artists/${userArtistId}/password` : userId ? `${API}/users/${userId}/password` : isAdmin ? `${API}/admin/password` : '';
      if (!endpoint) throw new Error('ID introuvable.');
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 404) throw new Error('Fonctionnalité non disponible');
        const msg = d.message || '';
        throw new Error(msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')
          ? 'Mot de passe actuel incorrect' : msg || `Erreur (${res.status})`);
      }
      setCurrentPassword(''); setNewPassword('');
      flash(setPwdMsg, 'success', 'Mot de passe changé !');
    } catch (err) {
      flash(setPwdMsg, 'error', err.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  const removeAvatar = () => {
    localStorage.removeItem(avatarKey);
    setSavedAvatar(null); setAvatarPreview(null); setAvatarFile(null);
    if (onUpdateProfile) onUpdateProfile({ avatar: null });
  };

  const roleConfig = isAdmin
    ? { label: 'Administrateur', Icon: ShieldCheck }
    : isArtist
    ? { label: 'Artiste',        Icon: Mic2 }
    : { label: 'Utilisateur',   Icon: UserCircle };

  const heroGradient = isAdmin
    ? 'linear-gradient(135deg,#18181b 0%,#3b0000 100%)'
    : isArtist
    ? 'linear-gradient(135deg,#18181b 0%,#1e0a3c 100%)'
    : 'linear-gradient(135deg,#18181b 0%,#0a1628 100%)';

  const accentColor = isAdmin ? '#E24B4A' : isArtist ? '#c084fc' : '#60a5fa';
  const displayAvatar = avatarPreview || savedAvatar;

  const stats = [
    { label: 'Musiques',  value: musiques?.length    || 0, icon: <Music size={16} />,        color: '#E24B4A' },
    { label: 'Favoris',   value: favCount,                  icon: <Heart size={16} />,        color: '#f472b6' },
    { label: 'Playlists', value: userPlaylists?.length || 0, icon: <ListOrdered size={16} />, color: '#60a5fa' },
  ];

  const pageStyle = {
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 760, margin: '0 auto',
    padding: '2rem 1rem 4rem',
    display: 'flex', flexDirection: 'column', gap: 20,
    color: '#fff',
  };

  return (
    <>
      <div style={pageStyle}>

        {/* ── HERO ── */}
        <div style={{
          background: heroGradient,
          borderRadius: 24, overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 70% 55% at 85% 15%, ${accentColor}22 0%, transparent 60%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '28px 28px 24px', display: 'flex', alignItems: 'flex-start', gap: 24, position: 'relative' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: `linear-gradient(135deg,${accentColor},#1a0000)`,
                padding: 3,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: '#27272a', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Syne',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#fff',
                }}>
                  {displayAvatar
                    ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (nom || userEmail || '?')[0].toUpperCase()
                  }
                </div>
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: accentColor, border: '2px solid #18181b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'transform 0.15s',
                  color: '#fff',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={12} />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 100, marginBottom: 10,
                background: `${accentColor}20`,
                border: `0.5px solid ${accentColor}50`,
                color: accentColor,
              }}>
                <roleConfig.Icon size={11} />
                {roleConfig.label}
              </div>

              <div style={{
                fontFamily: "'Syne',sans-serif", fontSize: '1.9rem', fontWeight: 800,
                color: '#fff', lineHeight: 1.1, marginBottom: 6,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {nom || userEmail}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                {userEmail}
              </div>
              {streak > 0 && <StreakBadge streak={streak} />}

              {!userId && !userArtistId && !isAdmin && (
                <div style={{
                  marginTop: 10, fontSize: 10, color: '#fef08a',
                  background: 'rgba(234,179,8,0.1)', borderRadius: 8, padding: '6px 10px',
                }}>
                  ⚠️ Reconnectez-vous pour modifier le nom
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          {(isUser || isArtist) && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              borderTop: '0.5px solid rgba(255,255,255,0.07)',
            }}>
              {stats.map((s, i) => (
                <div key={s.label} style={{
                  padding: '18px 12px', textAlign: 'center',
                  borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
                }}>
                  <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ARTIST BANNER ── */}
        {isArtist && (
          <ArtistBanner
            nom={nom || userNom}
            artistCoverPreview={artistCoverPreview}
            onChangeCover={handleArtistCoverChange}
          />
        )}

        {/* ── AVATAR PREVIEW BANNER ── */}
        {avatarPreview && avatarPreview !== savedAvatar && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(147,197,253,0.2)',
            borderRadius: 14, padding: '12px 16px',
          }}>
            <img src={avatarPreview} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <span style={{ fontSize: 12, color: '#93c5fd', flex: 1 }}>Nouvelle photo — sauvegardez pour appliquer</span>
            <button onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* ── LOYALTY ── */}
        <LoyaltyWidget token={token} isLoggedIn={isLoggedIn} />

        {/* ── TOP 5 + CHANSON DU JOUR ── */}
        {isLoggedIn && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <WeeklyTop5 token={token} API={API} />
            {musiques?.length > 0 && <DailySongShare token={token} musiques={musiques} />}
          </div>
        )}

        {/* ── PROFILE FORM ── */}
        <SectionCard>
          <SectionHeader icon={<User size={14} />} title="Informations du profil" />
          <SectionBody>
            {savedAvatar && !avatarPreview && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 14px',
              }}>
                <img src={savedAvatar} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '0.5px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 }}>Photo de profil active</span>
                <button onClick={removeAvatar}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <Field label="Nom d'affichage">
              <Input
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Votre prénom ou pseudo"
                disabled={!userId && !userArtistId && !isAdmin}
              />
            </Field>
            <Field label="Email" icon={<Mail size={10} />}>
              <Input value={userEmail} readonly />
            </Field>

            <Alert type={profileMsg.type} msg={profileMsg.text} />
            <BtnPrimary loading={loadingProfile} onClick={handleSaveProfile} variant="red">
              <Save size={16} /> Sauvegarder le profil
            </BtnPrimary>
          </SectionBody>
        </SectionCard>

        {/* ── PASSWORD FORM ── */}
        <SectionCard>
          <SectionHeader icon={<Key size={14} />} title="Changer le mot de passe" />
          <SectionBody>
            <Field label="Mot de passe actuel">
              <div style={{ position: 'relative' }}>
                <Input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrentPwd(v => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                  {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            <Field label="Nouveau mot de passe">
              <div style={{ position: 'relative' }}>
                <Input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNewPwd(v => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: 4, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PwdStrength value={newPassword} />
            </Field>

            <Alert type={pwdMsg.type} msg={pwdMsg.text} />
            <BtnPrimary
              loading={loadingPassword}
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword}
              variant="default"
            >
              <Key size={16} /> Changer le mot de passe
            </BtnPrimary>
          </SectionBody>
        </SectionCard>

        {/* ── PREFERENCES ── */}
        <SectionCard>
          <SectionHeader icon={<Settings size={14} />} title="Préférences" />
          <div style={{ paddingTop: 8 }}>
            <ToggleRow label="Profil public" sub="Votre top 5 est visible par tous" value={prefPublic} onChange={setPrefPublic} />
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />
            <ToggleRow label="Notifications e-mail" sub="Nouveautés de vos artistes favoris" value={prefNotifs} onChange={setPrefNotifs} />
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '0 24px' }} />
            <ToggleRow label="Partage d'activité" sub="Montrer ce que j'écoute en temps réel" value={prefActivity} onChange={setPrefActivity} />
          </div>
          <div style={{ height: 8 }} />
        </SectionCard>

      </div>
    </>
  );
};

export default AccountView;