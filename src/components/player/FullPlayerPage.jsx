import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ChevronDown, Sliders, ListMusic, MessageCircle,
  Info, Sparkles,
} from 'lucide-react';

import './fullPlayer.css';
import { useNavigate } from 'react-router-dom';

import { useAccentColor }      from './hooks/useAccentColor';
import { usePlayerAnalytics }  from './hooks/usePlayerAnalytics';
import { useAutoQueue }        from './hooks/useAutoQueue';
import { useQueueDrag }        from './hooks/useQueueDrag';
import { useLocalAuth }        from './hooks/useLocalAuth';
import { useAudioCache }       from '../../hooks/usePWA';

import PlayerView    from './PlayerView';
import { EQPanel }  from './panels/EQPanel';
import QueuePanel   from './panels/QueuePanel';
import InfosPanel   from './panels/InfosPanel';
import CommentsPanel from './panels/CommentsPanel';

import ShareModal from './modals/ShareModal';
import Toast      from './modals/Toast';

import { eqPresets } from './constants/eq';

function TABS_MOBILE(queueLen, commentsLen) {
  return [
    { key: 'player',   icon: null,                       label: 'Lecture' },
    { key: 'eq',       icon: <Sliders size={13} />,       label: 'EQ' },
    { key: 'queue',    icon: <ListMusic size={13} />,     label: `File${queueLen > 0 ? ` (${queueLen})` : ''}` },
    { key: 'comments', icon: <MessageCircle size={13} />, label: `Comms${commentsLen > 0 ? ` (${commentsLen})` : ''}` },
    { key: 'infos',    icon: <Info size={13} />,          label: 'Infos' },
  ];
}

const TABS_DESKTOP = (queueLen, commentsLen) => [
  { key: 'eq',       icon: <Sliders size={12} />,       label: 'Égaliseur' },
  { key: 'queue',    icon: <ListMusic size={12} />,      label: `File (${queueLen})` },
  { key: 'comments', icon: <MessageCircle size={12} />,  label: `Comms${commentsLen > 0 ? ` (${commentsLen})` : ''}` },
  { key: 'infos',    icon: <Info size={12} />,           label: 'Infos' },
];

const FullPlayerPage = ({
  currentSong, isPlaying, setIsPlaying,
  setCurrentSong,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  toggleLike,
  volume, setVolume,
  queue, setQueue, musiques,
  audioRef, initAudioEngine, audioContextRef,
  eqGains, setEqGains, eqFiltersRef,
  playbackRate, setPlaybackRate,
  sleepTimer, setSleepTimer, sleepRemaining,
  formatTime, canvasRef,
  token, isLoggedIn, userId, isAdmin,
  onOpenListenParty,
  smartMode, setSmartMode,
}) => {
  const [activeTab, setActiveTab]       = useState('player');
  const [activePreset, setActivePreset] = useState('Flat');
  const [tsComments, setTsComments]     = useState([]);
  const [heartAnim, setHeartAnim]       = useState(false);
  const [showShare, setShowShare]       = useState(false);
  const [toast, setToast]               = useState(null);
  const rootRef = useRef(null);

  const navigate = useNavigate();
  const handleClose = () => navigate(-1);

  const { accentHex, accentCSS } = useAccentColor(currentSong?.image);
  const { role, userNom }        = useLocalAuth();
  const { cacheAudio, removeCached, isAudioCached } = useAudioCache();
  const { dragOver, onDragStart, onDragOver, onDrop } = useQueueDrag(setQueue);

  const isAdminResolved = isAdmin || role === 'admin';

  usePlayerAnalytics(currentSong, currentTime, duration);
  useAutoQueue(currentSong, musiques, queue, setQueue);

  const safeEqGains = useMemo(
    () => (eqGains?.length === 12 ? eqGains : Array(12).fill(0)),
    [eqGains],
  );

  const smartQueueCount = useMemo(() => {
    if (!smartMode || !musiques?.length || !currentSong?.moods?.length) return 0;
    return musiques.filter(
      (s) => s._id !== currentSong._id && s.moods?.some((m) => currentSong.moods.includes(m)),
    ).length;
  }, [smartMode, musiques, currentSong]);

  const handleEqBand = useCallback((idx, value) => {
    setEqGains((prev) => {
      const next = prev?.length === 12 ? [...prev] : Array(12).fill(0);
      next[idx] = value;
      return next;
    });
    if (eqFiltersRef.current[idx]) eqFiltersRef.current[idx].gain.value = value;
    setActivePreset('');
  }, [setEqGains, eqFiltersRef]);

  const applyPreset = useCallback((name) => {
    const gains = eqPresets[name] ?? Array(12).fill(0);
    setEqGains([...gains]);
    setActivePreset(name);
    gains.forEach((v, i) => {
      if (eqFiltersRef.current[i]) eqFiltersRef.current[i].gain.value = v;
    });
  }, [setEqGains, eqFiltersRef]);

  const onSeek = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
    }
  }, [audioRef, duration]);

  const onSeekTouch = useCallback((e) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(1, (e.touches[0].clientX - r.left) / r.width)) * duration;
    }
  }, [audioRef, duration]);

  const onSeekToTimestamp = useCallback((ts) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ts;
      if (!isPlaying) setIsPlaying(true);
    }
    setActiveTab('player');
  }, [audioRef, isPlaying, setIsPlaying]);

  const handleLike = useCallback(() => {
    setHeartAnim(true);
    toggleLike(currentSong?._id);
    setTimeout(() => setHeartAnim(false), 550);
  }, [toggleLike, currentSong]);

  const showToast = useCallback((message, icon) => {
    setToast({ message, icon, key: Date.now() });
  }, []);

  const eqPanelProps = {
    safeEqGains, activePreset, applyPreset,
    smartMode, setSmartMode, smartQueueCount,
    playbackRate, setPlaybackRate,
    sleepTimer, setSleepTimer, sleepRemaining,
    handleEqBand, accentColor: accentHex,
  };

  const queuePanelProps = {
    queue, setQueue,
    currentSong,
    setCurrentSong,
    setIsPlaying,
    dragOver, onDragStart, onDragOver, onDrop,
    accentColor: accentHex,
  };

  const playerViewProps = {
    currentSong, isPlaying, setIsPlaying,
    currentTime, duration,
    handleNext, handlePrev,
    isShuffle, setIsShuffle,
    repeatMode, setRepeatMode,
    volume, setVolume,
    sleepTimer, setSleepTimer,
    accentHex, accentCSS,
    heartAnim, onLike: handleLike,
    onSeek, onSeekTouch,
    tsComments, onSeekToTimestamp, setActiveTab,
    formatTime, initAudioEngine,
    onOpenListenParty,
    onShareClick: () => setShowShare(true),
    isAudioCached, cacheAudio, removeCached,
  };

  const commentsPanelProps = {
    songId: currentSong?._id,
    currentTime, duration,
    onSeek: onSeekToTimestamp,
    token, isLoggedIn, userId,
    isAdmin: isAdminResolved,
    userNom,
    onMarkersReady: setTsComments,
    accentColor: accentHex,
  };

  const infosPanelProps = {
    currentSong, currentTime, duration, audioRef, audioContextRef,
    accentColor: accentHex,
  };

  const tabsMobile  = TABS_MOBILE(queue.length, tsComments.length);
  const tabsDesktop = TABS_DESKTOP(queue.length, tsComments.length);

  const renderPanel = (tab) => {
    switch (tab) {
      case 'player':
        return <PlayerView {...playerViewProps} />;
      case 'eq':
        return (
          <div className="fp-fade" style={{ flex: 1 }}>
            <EQPanel {...eqPanelProps} />
          </div>
        );
      case 'queue':
        return (
          <div className="fp-fade" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <QueuePanel {...queuePanelProps} />
          </div>
        );
      case 'comments':
        return currentSong ? (
          <div className="fp-fade" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
            <CommentsPanel {...commentsPanelProps} />
          </div>
        ) : null;
      case 'infos':
        return (
          <div className="fp-fade" style={{ flex: 1 }}>
            <InfosPanel {...infosPanelProps} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={rootRef}
      className="fp-root"
      style={{
        '--fp-accent': accentCSS,
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'row',
        overflow: 'hidden', userSelect: 'none',
        background: '#080808',
      }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {currentSong?.image && (
          <img
            src={currentSong.image} alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', transform: 'scale(1.5)',
              filter: 'blur(90px) saturate(2.2)', opacity: .25,
              transition: 'opacity 1.2s ease',
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,8,8,.8) 0%, rgba(8,8,8,.45) 35%, rgba(8,8,8,.9) 75%, rgba(8,8,8,.99) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,.55) 0%, transparent 30%, transparent 70%, rgba(8,8,8,.55) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: 220, background: `radial-gradient(ellipse at center, rgba(${accentCSS},.16) 0%, transparent 70%)`, transition: 'background 1.2s ease', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '50%', height: 140, background: `radial-gradient(ellipse at center, rgba(${accentCSS},.08) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .022, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '100px' }} />
      </div>

      {/* Main column */}
      <div
        className={isPlaying ? 'fp-playing' : 'fp-paused'}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <canvas ref={canvasRef} width="1000" height="6" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, zIndex: 10, pointerEvents: 'none', opacity: .85 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '46px 18px 8px', flexShrink: 0, zIndex: 10 }}>
          <button onClick={handleClose} className="fp-ctrl" style={{ width: 42, height: 42 }}>
            <ChevronDown size={22} color="rgba(255,255,255,.55)" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.2)' }}>
              En cours
            </span>
            {smartMode && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, background: `rgba(${accentCSS},.18)`, color: accentHex, padding: '3px 8px', borderRadius: 99, border: `1px solid rgba(${accentCSS},.3)` }}>
                <Sparkles size={8} /> Smart
              </span>
            )}
            {isPlaying && (
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                <div className="fp-bar" style={{ height: 4 }} />
                <div className="fp-bar" style={{ height: 9 }} />
                <div className="fp-bar" style={{ height: 6 }} />
                <div className="fp-bar" style={{ height: 4 }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { key: 'eq',       icon: <Sliders size={15} />,       badge: 0 },
              { key: 'queue',    icon: <ListMusic size={15} />,      badge: queue.length },
              { key: 'comments', icon: <MessageCircle size={15} />,  badge: tsComments.length },
            ].map(({ key, icon, badge }) => (
              <div key={key} style={{ position: 'relative' }}>
                <button
                  onClick={() => setActiveTab((t) => (t === key ? 'player' : key))}
                  className="fp-ctrl"
                  style={{
                    width: 38, height: 38,
                    color: activeTab === key ? accentHex : 'rgba(255,255,255,.35)',
                    background: activeTab === key ? `rgba(${accentCSS},.16)` : undefined,
                    border: `1px solid ${activeTab === key ? `rgba(${accentCSS},.3)` : 'transparent'}`,
                    transition: 'all .2s',
                  }}
                >
                  {icon}
                </button>
                {badge > 0 && (
                  <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, background: `rgba(${accentCSS},1)`, borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', boxShadow: `0 2px 8px rgba(${accentCSS},.5)` }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="fp-mobile-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {tabsMobile.map(({ key, icon, label }) => (
            <button key={key} className={`fp-tab${activeTab === key ? ' on' : ''}`} onClick={() => setActiveTab(key)}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="fp-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {renderPanel(activeTab)}
        </div>
      </div>

      {/* Right column — desktop */}
      <div
        className="fp-right"
        style={{ position: 'relative', width: 380, flexDirection: 'column', borderLeft: `1px solid rgba(${accentCSS},.1)`, overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(48px)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
            {tabsDesktop.map(({ key, icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`fp-tab${activeTab === key ? ' on' : ''}`}>
                {icon}<span style={{ fontSize: 9 }}>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="fp-scroll" style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {(activeTab === 'player' || activeTab === 'queue') && <QueuePanel {...queuePanelProps} />}
              {activeTab !== 'player' && activeTab !== 'queue' && renderPanel(activeTab)}
            </div>
          </div>
        </div>
      </div>

      {showShare && currentSong && (
        <ShareModal song={currentSong} onClose={() => setShowShare(false)} onToast={showToast} />
      )}

      {toast && <Toast key={toast.key} message={toast.message} icon={toast.icon} onDone={() => setToast(null)} />}
    </div>
  );
};

export default FullPlayerPage;