"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send, Trash2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
}

interface CommentSectionProps {
  mediaType: "movie" | "tv";
  tmdbId: number;
  seasonNum?: number;
  episodeNum?: number;
}

export default function CommentSection({
  mediaType,
  tmdbId,
  seasonNum,
  episodeNum,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComments = async () => {
    try {
      const params = new URLSearchParams({
        mediaType,
        tmdbId: tmdbId.toString(),
      });
      if (seasonNum !== undefined) params.set("seasonNum", seasonNum.toString());
      if (episodeNum !== undefined) params.set("episodeNum", episodeNum.toString());

      const res = await fetch(`/api/comments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [mediaType, tmdbId, seasonNum, episodeNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          tmdbId,
          content: content.trim(),
          seasonNum,
          episodeNum,
        }),
      });

      if (res.ok) {
        setContent("");
        fetchComments();
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  return (
    <div className="bg-[#121420] border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-bold text-white">Yorumlar & Tartışma</h3>
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-gray-300">
          {comments.length}
        </span>
      </div>

      {/* New Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.username}
              className="w-10 h-10 rounded-xl bg-red-950/40 object-cover shrink-0 mt-1"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Film veya bölüm hakkında ne düşünüyorsun? (Spoiler vermekten kaçının)..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-500/60 focus:bg-white/10 transition-all resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Gönderiliyor..." : "Yorumu Paylaş"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center mb-8">
          <p className="text-sm text-gray-300 mb-2">
            Yorum yapmak ve tartışmaya katılmak için giriş yapmalısınız.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition-all"
          >
            Giriş Yap veya Kayıt Ol
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {fetching ? (
          <p className="text-sm text-gray-400 text-center py-4">Yorumlar yükleniyor...</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Henüz hiç yorum yapılmamış.</p>
            <p className="text-xs text-gray-500 mt-1">İlk yorumu yapan siz olun!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = user?.id === comment.user.id;
            return (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-[#0e1017] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user.username}`}
                      alt={comment.user.username}
                      className="w-8 h-8 rounded-full bg-red-950/40 object-cover"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-200">
                        {comment.user.username}
                      </span>
                      <span className="text-[11px] text-gray-500 ml-2">
                        {new Date(comment.createdAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                      title="Yorumu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
