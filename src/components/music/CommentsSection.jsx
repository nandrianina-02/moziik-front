import React, { useState, useEffect } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, Send, Heart, Reply } from 'lucide-react';
import { API } from '../../config/api';

const CommentsSection = ({ songId, token, userNom, isLoggedIn }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadComments = async () => {
    try {
      const res = await fetch(`${API}/songs/${songId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {}
  };

  useEffect(() => { if (expanded) loadComments(); }, [songId, expanded]);

  const postComment = async () => {
    if (!newComment.trim() || !isLoggedIn) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/songs/${songId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texte: newComment, auteur: userNom })
      });
      if (res.ok) { setNewComment(''); loadComments(); }
    } catch {}
    setLoading(false);
  };

  const postReply = async (commentId) => {
    if (!replyText.trim() || !isLoggedIn) return;
    try {
      const res = await fetch(`${API}/songs/${songId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texte: replyText, auteur: userNom })
      });
      if (res.ok) { setReplyText(''); setReplyTo(null); loadComments(); }
    } catch {}
  };

  const likeComment = async (commentId) => {
    if (!isLoggedIn) return;
    try {
      await fetch(`${API}/songs/${songId}/comments/${commentId}/like`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      loadComments();
    } catch {}
  };

  return (
    <div className="mt-4">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition">
        <MessageCircle size={14} /> {comments.length > 0 ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}` : 'Commentaires'}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {isLoggedIn && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-xs font-black shrink-0">
                {(userNom || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 ring-red-600 text-white placeholder-zinc-600" />
                <button onClick={postComment} disabled={loading || !newComment.trim()}
                  className="p-2 bg-red-600 hover:bg-red-500 rounded-xl transition disabled:opacity-40">
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}
          {!isLoggedIn && <p className="text-[10px] text-zinc-600 italic">Connectez-vous pour commenter.</p>}

          {comments.map(c => (
            <div key={c._id} className="bg-zinc-900/40 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-black shrink-0">
                    {(c.auteur || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-300">{c.auteur}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{c.texte}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => likeComment(c._id)}
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400 transition">
                    <Heart size={11} fill={c.likedByMe ? 'red' : 'none'} className={c.likedByMe ? 'text-red-400' : ''} />
                    {c.likes || 0}
                  </button>
                  {isLoggedIn && (
                    <button onClick={() => setReplyTo(replyTo === c._id ? null : c._id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-blue-400 transition">
                      <Reply size={11} /> Répondre
                    </button>
                  )}
                </div>
              </div>

              {c.reponses && c.reponses.length > 0 && (
                <div className="ml-8 space-y-2 border-l border-zinc-700/50 pl-3">
                  {c.reponses.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-black shrink-0">
                        {(r.auteur || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400">{r.auteur}</p>
                        <p className="text-[11px] text-zinc-500">{r.texte}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {replyTo === c._id && isLoggedIn && (
                <div className="ml-8 flex gap-2 mt-2">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && postReply(c._id)}
                    placeholder="Votre réponse..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 ring-blue-500 text-white placeholder-zinc-600" />
                  <button onClick={() => postReply(c._id)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition">
                    <Send size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
