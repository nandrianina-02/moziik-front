import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp } from 'lucide-react';

/**
 * MiniPlayerMobile — barre player compacte en bas sur mobile.
 * Swipe vers le haut → ouvre le FullPlayer.
 * Swipe vers le bas → réduit (ne fait rien si déjà réduit).
 */
const MiniPlayerMobile = ({
  currentSong, isPlaying, setIsPlaying,
  handleNext, toggleLike, onOpenFullPlayer,
  currentTime, duration, initAudioEngine,
}) => {
  const startY = useRef(null);
  const [translateY, setTranslateY] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    // On autorise seulement le swipe vers le haut (dy négatif)
    if (dy < 0) setTranslateY(Math.max(dy, -80));
  };

  const onTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - (startY.current ?? 0);
    setSwiping(false);
    setTranslateY(0);
    startY.current = null;
    if (dy < -40) onOpenFullPlayer(); // swipe haut → full player
  };

  if (!currentSong) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        transform: `translateY(${translateY}px)`,
        transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Barre de progression fine en haut */}
      <div className="h-0.5 bg-zinc-800 w-full">
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${prog}%` }}
        />
      </div>

      {/* Corps du mini player */}
      <div className="bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-800/60 px-4 py-3 flex items-center gap-3">
        {/* Swipe handle */}
        <button
          onClick={onOpenFullPlayer}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-700 rounded-full"
          aria-label="Ouvrir lecteur"
        />

        {/* Cover — tap → full player */}
        <button onClick={onOpenFullPlayer} className="relative shrink-0">
          <img
            src={currentSong.image}
            className="w-11 h-11 rounded-xl object-cover shadow-lg"
            alt=""
          />
          {isPlaying && (
            <div className="absolute inset-0 rounded-xl ring-1 ring-red-500/50 animate-pulse" />
          )}
        </button>

        {/* Info */}
        <button onClick={onOpenFullPlayer} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold truncate text-white">{currentSong.titre}</p>
          <p className="text-[11px] text-zinc-500 truncate">{currentSong.artiste}</p>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(currentSong._id); }}
            className="p-2 rounded-xl hover:bg-zinc-800 transition"
          >
            <Heart
              size={17}
              fill={currentSong.liked ? '#ef4444' : 'none'}
              className={currentSong.liked ? 'text-red-500' : 'text-zinc-500'}
            />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); initAudioEngine(); setIsPlaying(p => !p); }}
            className="p-2 rounded-xl hover:bg-zinc-800 transition"
          >
            {isPlaying
              ? <Pause size={20} fill="white" className="text-white" />
              : <Play size={20} fill="white" className="text-white" />
            }
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="p-2 rounded-xl hover:bg-zinc-800 transition"
          >
            <SkipForward size={17} className="text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayerMobile;
