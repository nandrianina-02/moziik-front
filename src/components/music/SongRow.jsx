import React from 'react';
import { Heart, ListPlus, Eye } from 'lucide-react';
import ReactionsBar from './ReactionsBar';
import CommentsSection from './CommentsSection';

const SongRow = ({ song, index, currentSong, setCurrentSong, setIsPlaying, toggleLike, addToQueue, token, isLoggedIn, userNom }) => (
  <div className={`p-3 rounded-xl transition group ${currentSong?._id === song._id ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5'}`}>
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentSong(song); setIsPlaying(true); }}>
      <span className="text-zinc-600 font-mono text-xs w-5 text-right shrink-0">{index + 1}</span>
      <img src={song.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${currentSong?._id === song._id ? 'text-red-400' : ''}`}>{song.titre}</p>
        <p className="text-[10px] text-zinc-500 truncate uppercase">{song.artiste}</p>
      </div>
      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition shrink-0">
        <button onClick={e => { e.stopPropagation(); toggleLike(song._id); }}>
          <Heart size={14} fill={song.liked ? 'red' : 'none'} className={song.liked ? 'text-red-500' : 'text-zinc-500 hover:text-white'} />
        </button>
        <button onClick={e => { e.stopPropagation(); addToQueue(song); }}>
          <ListPlus size={14} className="text-zinc-500 hover:text-white" />
        </button>
      </div>
      {song.plays > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0">
          <Eye size={9} /> {song.plays}
        </div>
      )}
    </div>
    <div className="pl-8">
      <ReactionsBar songId={song._id} token={token} isLoggedIn={isLoggedIn} />
      <CommentsSection songId={song._id} token={token} userNom={userNom} isLoggedIn={isLoggedIn} />
    </div>
  </div>
);

export default SongRow;
