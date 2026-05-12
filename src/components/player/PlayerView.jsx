import { memo, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Heart,
  Volume2, VolumeX, Radio, Tag,
  MessageCircle, Download, Share2, Moon, Check,
} from 'lucide-react';

/**
 * @param {{
 *   currentSong: import('../types/player').Song | null,
 *   isPlaying: boolean,
 *   setIsPlaying: (fn: (v: boolean) => boolean) => void,
 *   currentTime: number,
 *   duration: number,
 *   handleNext: () => void,
 *   handlePrev: () => void,
 *   isShuffle: boolean,
 *   setIsShuffle: (fn: (v: boolean) => boolean) => void,
 *   repeatMode: 0 | 1 | 2,
 *   setRepeatMode: (fn: (v: number) => number) => void,
 *   volume: number,
 *   setVolume: React.Dispatch<React.SetStateAction<number>>,
 *   sleepTimer: number,
 *   setSleepTimer: (v: number) => void,
 *   accentHex: string,
 *   accentCSS: string,
 *   heartAnim: boolean,
 *   onLike: () => void,
 *   onSeek: (e: React.MouseEvent) => void,
 *   onSeekTouch: (e: React.TouchEvent) => void,
 *   tsComments: import('../types/player').Comment[],
 *   onSeekToTimestamp: (ts: number) => void,
 *   setActiveTab: (tab: string) => void,
 *   formatTime: (s: number) => string,
 *   initAudioEngine: () => void,
 *   onOpenListenParty?: () => void,
 *   onShareClick: () => void,
 *   isAudioCached: (id?: string) => boolean,
 *   cacheAudio: (song: import('../types/player').Song) => Promise<void>,
 *   removeCached: (song: import('../types/player').Song) => Promise<void>,
 * }} props
 */
const PlayerView = memo(({
  currentSong, isPlaying, setIsPlaying,
  currentTime, duration,
  handleNext, handlePrev,
  isShuffle, setIsShuffle,
  repeatMode, setRepeatMode,
  volume, setVolume,
  sleepTimer, setSleepTimer,
  accentHex, accentCSS,
  heartAnim, onLike,
  onSeek, onSeekTouch,
  tsComments, onSeekToTimestamp, setActiveTab,
  formatTime, initAudioEngine,
  onOpenListenParty,
  onShareClick,
  isAudioCached, cacheAudio, removeCached,
}) => {
  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;
  const cached = isAudioCached(currentSong?._id);

  const handleDownload = useCallback(async () => {
    if (!currentSong) return;
    cached ? await removeCached(currentSong) : await cacheAudio(currentSong);
  }, [cached, currentSong, cacheAudio, removeCached]);

  return (
    <div className={`fp-fade ${isPlaying ? 'fp-playing' : 'fp-paused'}`} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Cover ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 36px 14px', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 248 }}>
          {currentSong?.image && (
            <>
              <div
                className="fp-glow-layer-1"
                style={{ backgroundImage: `url(${currentSong.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <div className="fp-glow-layer-2" />
            </>
          )}
          <div className="fp-cover-wrap" style={{ position: 'relative', aspectRatio: '1/1' }}>
            <div className="fp-cover-inner">
              <img
                src={currentSong?.image}
                alt={currentSong?.titre}
                style={{ width: '100%', height: '100%', borderRadius: 24, objectFit: 'cover', display: 'block', boxShadow: '0 28px 72px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.08)' }}
              />
              {currentSong?.format && (
                <div className="fp-badge" style={{ position: 'absolute', bottom: 10, left: 10 }}>{currentSong.format}</div>
              )}
              {isPlaying && (
                <>
                  <div className="fp-ring fp-ring-1" />
                  <div className="fp-ring fp-ring-2" />
                  <div className="fp-ring fp-ring-3" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Title + meta ── */}
      <div style={{ padding: '0 20px 10px', flexShrink: 0 }}>
        {/* Stats row */}
        {(currentSong?.plays || duration > 0) && (
          <div style={{ display: 'flex', gap: 18, marginBottom: 10 }}>
            {currentSong?.plays > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: `rgba(${accentCSS},1)`, fontFamily: 'var(--fp-mono)', lineHeight: 1 }}>
                  {currentSong.plays >= 1000 ? `${(currentSong.plays / 1000).toFixed(1)}K` : currentSong.plays}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)', marginTop: 2 }}>Écoutes</div>
              </div>
            )}
            {duration > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: `rgba(${accentCSS},.7)`, fontFamily: 'var(--fp-mono)', lineHeight: 1 }}>{formatTime(duration)}</div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)', marginTop: 2 }}>Durée</div>
              </div>
            )}
            {currentSong?.annee && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: `rgba(${accentCSS},.5)`, fontFamily: 'var(--fp-mono)', lineHeight: 1 }}>{currentSong.annee}</div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)', marginTop: 2 }}>Année</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 4px', lineHeight: 1.1 }}>
              {currentSong?.titre}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: `rgba(${accentCSS},1)`, fontWeight: 700 }}>{currentSong?.artiste}</span>
              {currentSong?.album && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>· {currentSong.album}</span>}
            </div>
            {currentSong?.moods?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {currentSong.moods.map((m) => (
                  <span key={m} className="fp-mood"><Tag size={7} />{m}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onLike}
            style={{ marginLeft: 12, padding: 10, borderRadius: '50%', border: 'none', background: currentSong?.liked ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)', cursor: 'pointer', flexShrink: 0, animation: heartAnim ? 'fp-heartbeat .5s cubic-bezier(.34,1.56,.64,1)' : 'none', transition: 'background .25s', boxShadow: currentSong?.liked ? '0 0 16px rgba(239,68,68,.3)' : 'none' }}
          >
            <Heart size={24} fill={currentSong?.liked ? '#ef4444' : 'none'} color={currentSong?.liked ? '#ef4444' : 'rgba(255,255,255,.28)'} style={{ transition: 'all .25s' }} />
          </button>
        </div>
      </div>

      {/* ── Genre / format tags ── */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {currentSong?.genre && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.1)' }}>{currentSong.genre}</span>
        )}
        {currentSong?.format && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 7, background: `rgba(${accentCSS},.14)`, color: `rgba(${accentCSS},1)`, border: `1px solid rgba(${accentCSS},.28)` }}>{currentSong.format}</span>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: '0 20px 4px', flexShrink: 0 }}>
        <div className="fp-prog-track" onClick={onSeek} onTouchMove={onSeekTouch}>
          <div className="fp-prog-fill" style={{ width: `${prog}%` }}>
            <div className="fp-prog-thumb" />
          </div>
          {duration > 0 && tsComments.map((c) => {
            const pct = Math.min(97, Math.max(2, (c.timestamp / duration) * 100));
            const near = Math.abs(currentTime - c.timestamp) < 3;
            return (
              <div
                key={c._id}
                className="fp-ts-marker"
                style={{ left: `${pct}%`, width: near ? 10 : 7, height: near ? 10 : 7, background: near ? `rgba(${accentCSS},1)` : 'rgba(255,255,255,.5)', boxShadow: near ? `0 0 10px rgba(${accentCSS},.9)` : '' }}
                onClick={(e) => { e.stopPropagation(); onSeekToTimestamp(c.timestamp); setActiveTab('comments'); }}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, fontSize: 10, color: 'rgba(255,255,255,.2)', fontFamily: 'var(--fp-mono)' }}>
          <span>{formatTime(currentTime)}</span>
          {tsComments.length > 0 && (
            <button
              onClick={() => setActiveTab('comments')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: `rgba(${accentCSS},.6)`, border: 'none', background: 'none', cursor: 'pointer', transition: 'color .18s', fontFamily: 'var(--fp-font)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = `rgba(${accentCSS},1)`)}
              onMouseLeave={(e) => (e.currentTarget.style.color = `rgba(${accentCSS},.6)`)}
            >
              <MessageCircle size={9} /> {tsComments.length}
            </button>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Transport controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 6px', flexShrink: 0 }}>
        <button
          onClick={() => onOpenListenParty?.()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)', cursor: 'pointer', transition: 'all .2s', fontFamily: 'var(--fp-font)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'rgba(255,255,255,.85)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = 'rgba(255,255,255,.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Radio size={13} /> Party
        </button>

        <button onClick={() => setIsShuffle((v) => !v)} className="fp-ctrl"
          style={{ width: 44, height: 44, color: isShuffle ? accentHex : 'rgba(255,255,255,.3)', background: isShuffle ? `rgba(${accentCSS},.14)` : '' }}>
          <Shuffle size={20} />
        </button>

        <button onClick={handlePrev} className="fp-ctrl fp-skip" style={{ width: 48, height: 48, color: 'rgba(255,255,255,.85)' }}>
          <SkipBack size={26} fill="rgba(255,255,255,.85)" />
        </button>

        <button
          className="fp-play-btn"
          onClick={() => { initAudioEngine(); setIsPlaying((p) => !p); }}
          style={{ width: 70, height: 70 }}
        >
          {isPlaying
            ? <Pause fill="white" size={26} color="white" />
            : <Play fill="white" size={26} color="white" style={{ marginLeft: 3 }} />
          }
        </button>

        <button onClick={handleNext} className="fp-ctrl fp-skip" style={{ width: 48, height: 48, color: 'rgba(255,255,255,.85)' }}>
          <SkipForward size={26} fill="rgba(255,255,255,.85)" />
        </button>

        <button onClick={() => setRepeatMode((m) => (m + 1) % 3)} className="fp-ctrl"
          style={{ width: 44, height: 44, color: repeatMode > 0 ? accentHex : 'rgba(255,255,255,.3)', background: repeatMode > 0 ? `rgba(${accentCSS},.14)` : '' }}>
          {repeatMode === 2 ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>

        <div style={{ width: 72 }} />
      </div>

      {/* ── Volume ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 28px 12px', flexShrink: 0 }}>
        <button onClick={() => setVolume((v) => (v > 0 ? 0 : 80))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
          {volume === 0 ? <VolumeX size={15} color="rgba(255,255,255,.2)" /> : <Volume2 size={15} color="rgba(255,255,255,.22)" />}
        </button>
        <div className="fp-vol-track">
          <div className="fp-vol-fill" style={{ width: `${volume}%` }} />
          <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value, 10))} className="fp-vol-input" />
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontFamily: 'var(--fp-mono)', minWidth: 32, textAlign: 'right' }}>{volume}%</span>
      </div>

      {/* ── Action pills ── */}
      <div style={{ padding: '0 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button onClick={onLike} className={`fp-pill${currentSong?.liked ? ' liked' : ''}`}>
            <Heart size={12} fill={currentSong?.liked ? '#f87171' : 'none'} />
            {currentSong?.liked ? 'Aimé' : 'Aimer'}
          </button>

          <button
            className="fp-pill"
            style={cached ? { color: '#4ade80', borderColor: 'rgba(74,222,128,.4)', background: 'rgba(74,222,128,.1)' } : {}}
            onClick={handleDownload}
          >
            {cached ? <><Check size={12} /> Téléchargé</> : <><Download size={12} /> Télécharger</>}
          </button>

          <button className="fp-pill" onClick={onShareClick}>
            <Share2 size={12} /> Partager
          </button>

          <button className={`fp-pill${sleepTimer > 0 ? ' sleep-on' : ''}`} onClick={() => setSleepTimer(sleepTimer > 0 ? 0 : 30)}>
            <Moon size={12} /> {sleepTimer > 0 ? `Veille ${sleepTimer}'` : 'Veille'}
          </button>
        </div>
      </div>
    </div>
  );
});

PlayerView.displayName = 'PlayerView';
export default PlayerView;