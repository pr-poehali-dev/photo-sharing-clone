import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ——— CONSTANTS ———
const AUTH_URL = "https://functions.poehali.dev/5ffb3b59-4c75-4b33-b3eb-741f87fdd137";
const POSTS_URL = "https://functions.poehali.dev/ea16cc75-61a1-41be-a6be-58ef33c31734";
const MESSAGES_URL = "https://functions.poehali.dev/54b415ee-9273-440c-a386-02766a9b2b53";

const IMG1 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/48dbe723-6e8e-4b5c-8094-91f9a43e83f5.jpg";
const IMG2 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/5678c543-1819-43db-9ddb-5c766f362bc2.jpg";
const IMG3 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/459ec2f1-d0a0-41b7-9a7b-8508b4b1e3ca.jpg";

const REACTIONS = ["😍", "🔥", "❤️", "👏", "💫"];
const TRENDING_TAGS = ["#закат", "#стрит", "#природа", "#портрет", "#арт", "#минимализм", "#путешествия", "#архитектура", "#макро", "#абстракция"];

const DEMO_NOTIFICATIONS = [
  { id: 1, type: "like", user: "alex_shoots", avatar: "🧑‍🎨", text: "лайкнул вашу фотографию", time: "2 мин", unread: true, img: IMG1 },
  { id: 2, type: "follow", user: "urban_lens", avatar: "📸", text: "подписался на вас", time: "15 мин", unread: true },
  { id: 3, type: "comment", user: "color_wave", avatar: "🎨", text: "прокомментировал: «Невероятный кадр!»", time: "1 час", unread: true, img: IMG3 },
  { id: 4, type: "like", user: "night_vision", avatar: "🌙", text: "и 12 других лайкнули вашу фото", time: "3 часа", unread: false, img: IMG2 },
  { id: 5, type: "follow", user: "mountain_air", avatar: "⛰️", text: "подписался на вас", time: "вчера", unread: false },
  { id: 6, type: "save", user: "art_flow", avatar: "✨", text: "сохранил вашу фотографию", time: "вчера", unread: false, img: IMG1 },
];

// ——— INTERFACES ———
interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_emoji: string;
  bio: string | null;
  location: string | null;
  photos_count: number;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: number;
  user_id: number;
  image_url: string;
  caption: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  liked: boolean;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  username: string;
  avatar_emoji: string;
  user_id: number;
}

interface Message {
  id: number;
  sender_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
}

interface Dialog {
  partner_id: number;
  username: string;
  avatar_emoji: string;
  display_name: string;
  last_text: string;
  last_time: string;
  unread_count: number;
}

interface OtherUser {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  bio: string | null;
  photos_count: number;
  followers_count: number;
  following: boolean;
}

interface ChatPartner {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
}

type Section = "feed" | "explore" | "people" | "messages" | "chat" | "profile" | "notifications" | "settings" | "post_detail";

// ——— HELPER ———
async function apiCall<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Ошибка запроса");
  }
  return data;
}

// ——— TOAST HOOK ———
function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}

function Toast({ message }: { message: string }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm text-white animate-scale-in"
      style={{ background: "rgba(255,45,120,0.9)", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(255,45,120,0.4)" }}
    >
      {message}
    </div>
  );
}

// ——— AUTH SCREEN ———
function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [regData, setRegData] = useState({ username: "", email: "", password: "", display_name: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiCall<{ token: string; user: User }>(`${AUTH_URL}?action=login`, "POST", loginData);
      localStorage.setItem("kadr_token", data.token);
      onAuth(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiCall<{ token: string; user: User }>(`${AUTH_URL}?action=register`, "POST", {
        ...regData,
        display_name: regData.display_name || regData.username,
      });
      localStorage.setItem("kadr_token", data.token);
      onAuth(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-mesh min-h-screen flex flex-col items-center justify-center px-6 max-w-md mx-auto">
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="font-oswald text-5xl font-bold neon-text-pink tracking-widest mb-2">КАДР</h1>
        <p className="text-muted-foreground text-sm">Фото-платформа нового поколения</p>
      </div>

      <div className="w-full glass rounded-2xl p-1 flex gap-1 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {(["login", "register"] as const).map((key) => (
          <button
            key={key}
            onClick={() => { setMode(key); setError(""); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            style={mode === key ? {
              background: "linear-gradient(135deg, #FF2D78, #BF00FF)",
              color: "white",
              boxShadow: "0 4px 20px rgba(255,45,120,0.3)",
            } : { color: "var(--muted-foreground)" }}
          >
            {key === "login" ? "Войти" : "Регистрация"}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="w-full mb-4 px-4 py-3 rounded-xl text-sm animate-scale-in"
          style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)", color: "#FF2D78" }}
        >
          {error}
        </div>
      )}

      {mode === "login" && (
        <form onSubmit={handleLogin} className="w-full space-y-3 animate-slide-up">
          <div className="relative">
            <Icon name="AtSign" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              placeholder="Email или @username"
              value={loginData.login}
              onChange={e => setLoginData(p => ({ ...p, login: e.target.value }))}
              required
            />
          </div>
          <div className="relative">
            <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              type="password"
              placeholder="Пароль"
              value={loginData.password}
              onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-3 text-base flex items-center justify-center gap-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><Icon name="Loader2" size={18} className="animate-spin" />Входим...</>
            ) : "Войти"}
          </button>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister} className="w-full space-y-3 animate-slide-up">
          <div className="relative">
            <Icon name="User" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              placeholder="@username (минимум 3 символа)"
              value={regData.username}
              onChange={e => setRegData(p => ({ ...p, username: e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase() }))}
              required
            />
          </div>
          <div className="relative">
            <Icon name="Sparkles" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              placeholder="Отображаемое имя"
              value={regData.display_name}
              onChange={e => setRegData(p => ({ ...p, display_name: e.target.value }))}
            />
          </div>
          <div className="relative">
            <Icon name="AtSign" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              type="email"
              placeholder="Email"
              value={regData.email}
              onChange={e => setRegData(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="relative">
            <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="search-input pl-10"
              type="password"
              placeholder="Пароль (минимум 6 символов)"
              value={regData.password}
              onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full py-3 text-base flex items-center justify-center gap-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><Icon name="Loader2" size={18} className="animate-spin" />Создаём аккаунт...</>
            ) : "Создать аккаунт"}
          </button>
          <p className="text-center text-xs text-muted-foreground pt-1">
            Регистрируясь, вы соглашаетесь с правилами платформы
          </p>
        </form>
      )}

      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(255,45,120,0.07)" }} />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 rounded-full blur-3xl" style={{ background: "rgba(0,245,255,0.05)" }} />
      </div>
    </div>
  );
}

// ——— SKELETON ———
function SkeletonCard({ height }: { height: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden mb-3 animate-pulse ${height}`} style={{ background: "rgba(255,255,255,0.06)" }} />
  );
}

function SkeletonUserCard() {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full w-1/3" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    </div>
  );
}

// ——— DEMO POSTS ———
const DEMO_POSTS: Post[] = [
  {
    id: -1, user_id: 0, image_url: IMG1, caption: "Закат над городом", tags: ["#закат", "#город", "#фото"],
    likes_count: 1240, comments_count: 34, created_at: new Date().toISOString(),
    username: "alex_shoots", display_name: "Alex S.", avatar_emoji: "🧑‍🎨", liked: false,
  },
  {
    id: -2, user_id: 0, image_url: IMG2, caption: "Городские улицы", tags: ["#стрит", "#урбан"],
    likes_count: 867, comments_count: 21, created_at: new Date().toISOString(),
    username: "urban_lens", display_name: "Urban Lens", avatar_emoji: "📸", liked: false,
  },
  {
    id: -3, user_id: 0, image_url: IMG3, caption: "Взрыв цвета", tags: ["#арт", "#абстракция", "#цвет"],
    likes_count: 3412, comments_count: 89, created_at: new Date().toISOString(),
    username: "art_flow", display_name: "Art Flow", avatar_emoji: "✨", liked: true,
  },
];

const CARD_HEIGHTS = ["h-52", "h-64", "h-72", "h-80"] as const;

// ——— FEED SECTION ———
function FeedSection({
  token,
  currentUser,
  onOpenPost,
  onOpenChat,
}: {
  token: string;
  currentUser: User;
  onOpenPost: (post: Post) => void;
  onOpenChat: (partner: ChatPartner) => void;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactionTarget, setReactionTarget] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall<{ posts: Post[] }>(`${POSTS_URL}?action=feed`, "GET", undefined, token);
      setPosts(data.posts && data.posts.length > 0 ? data.posts : DEMO_POSTS);
    } catch {
      setPosts(DEMO_POSTS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (post: Post) => {
    if (post.id < 0) { showToast("Войдите чтобы ставить лайки"); return; }
    const wasLiked = post.liked;
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, liked: !wasLiked, likes_count: p.likes_count + (wasLiked ? -1 : 1) } : p));
    try {
      await apiCall(`${POSTS_URL}?action=like`, "POST", { post_id: post.id }, token);
    } catch (err) {
      setPosts(ps => ps.map(p => p.id === post.id ? { ...p, liked: wasLiked, likes_count: p.likes_count + (wasLiked ? 1 : -1) } : p));
      showToast(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const cardHeight = (index: number) => CARD_HEIGHTS[index % CARD_HEIGHTS.length];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Stories */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,45,120,0.15)", border: "2px dashed rgba(255,45,120,0.4)" }}
          >
            <Icon name="Plus" size={20} className="text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground">Добавить</span>
        </div>
        {DEMO_POSTS.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
            <div className="story-ring p-0.5 rounded-full">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-xl border-2 border-black">
                {p.avatar_emoji}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">{p.username}</span>
          </div>
        ))}
      </div>

      {/* Feed grid */}
      {loading ? (
        <div className="columns-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height={cardHeight(i)} />
          ))}
        </div>
      ) : (
        <div className="columns-2 gap-3">
          {posts.map((post, idx) => (
            <div
              key={post.id}
              className={`photo-card w-full mb-3 animate-fade-in ${cardHeight(idx)}`}
              onClick={() => onOpenPost(post)}
            >
              <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" />
              <div className="photo-overlay" onClick={e => e.stopPropagation()}>
                {/* Top: author */}
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onOpenChat({ id: post.user_id, username: post.username, display_name: post.display_name, avatar_emoji: post.avatar_emoji })}
                  >
                    <div className="avatar-ring">
                      <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-sm">{post.avatar_emoji}</div>
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow">{post.username}</span>
                  </div>
                </div>
                {/* Bottom: caption, tags, actions */}
                <div>
                  {post.caption && (
                    <p className="text-white text-xs font-medium mb-2 drop-shadow line-clamp-2">{post.caption}</p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,245,255,0.2)", color: "#00F5FF" }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      className={`reaction-btn ${post.liked ? "active" : ""}`}
                      onClick={() => handleLike(post)}
                    >
                      <Icon name="Heart" size={12} className={post.liked ? "fill-current" : ""} />
                      {post.likes_count}
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={() => onOpenPost(post)}
                    >
                      <Icon name="MessageCircle" size={12} />
                      {post.comments_count}
                    </button>
                    <div className="relative ml-auto">
                      <button
                        className="reaction-btn"
                        onClick={() => setReactionTarget(reactionTarget === post.id ? null : post.id)}
                      >
                        <Icon name="Smile" size={12} />
                      </button>
                      {reactionTarget === post.id && (
                        <div className="absolute bottom-8 right-0 flex gap-1 p-2 rounded-2xl glass-strong animate-scale-in z-10">
                          {REACTIONS.map(r => (
                            <button
                              key={r}
                              className="text-lg hover:scale-125 transition-transform"
                              onClick={() => setReactionTarget(null)}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— POST DETAIL ———
function PostDetail({
  post,
  token,
  currentUser,
  onBack,
  onOpenChat,
}: {
  post: Post;
  token: string;
  currentUser: User;
  onBack: () => void;
  onOpenChat: (partner: ChatPartner) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (post.id < 0) { setLoadingComments(false); return; }
    apiCall<{ comments: Comment[] }>(`${POSTS_URL}?action=comments&post_id=${post.id}`, "GET", undefined, token)
      .then(d => setComments(d.comments ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [post.id, token]);

  const handleLike = async () => {
    if (post.id < 0) { showToast("Демо-пост"); return; }
    const prev = liked;
    setLiked(!prev);
    setLikesCount(c => c + (prev ? -1 : 1));
    try {
      await apiCall(`${POSTS_URL}?action=like`, "POST", { post_id: post.id }, token);
    } catch {
      setLiked(prev);
      setLikesCount(c => c + (prev ? 1 : -1));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || post.id < 0) { showToast(post.id < 0 ? "Демо-пост" : "Введите текст"); return; }
    setSending(true);
    try {
      await apiCall(`${POSTS_URL}?action=comment`, "POST", { post_id: post.id, text: commentText }, token);
      setComments(cs => [
        ...cs,
        {
          id: Date.now(),
          text: commentText,
          created_at: new Date().toISOString(),
          username: currentUser.username,
          avatar_emoji: currentUser.avatar_emoji,
          user_id: currentUser.id,
        },
      ]);
      setCommentText("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Photo */}
      <div className="relative w-full aspect-square bg-black">
        <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Author row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar-ring">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-xl">{post.avatar_emoji}</div>
            </div>
            <div>
              <p className="font-semibold text-sm">{post.display_name}</p>
              <p className="text-xs text-muted-foreground">@{post.username}</p>
            </div>
          </div>
          {post.user_id !== currentUser.id && (
            <button
              className="reaction-btn text-xs"
              onClick={() => onOpenChat({ id: post.user_id, username: post.username, display_name: post.display_name, avatar_emoji: post.avatar_emoji })}
            >
              <Icon name="MessageCircle" size={14} />
              Написать
            </button>
          )}
        </div>

        {/* Caption + tags */}
        {post.caption && <p className="text-sm leading-relaxed">{post.caption}</p>}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 py-2 border-t border-border">
          <button className={`reaction-btn ${liked ? "active" : ""}`} onClick={handleLike}>
            <Icon name="Heart" size={16} className={liked ? "fill-current" : ""} />
            {likesCount}
          </button>
          <span className="reaction-btn cursor-default">
            <Icon name="MessageCircle" size={16} />
            {comments.length}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
        </div>

        {/* Comments */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Комментарии</p>
          {loadingComments ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 rounded w-24" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-2 rounded w-48" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Комментариев пока нет</p>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-sm flex-shrink-0 glass">
                    {c.avatar_emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{c.username}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground/80">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment form */}
        <form onSubmit={handleComment} className="flex gap-2 pt-2 border-t border-border">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-sm flex-shrink-0 glass">
            {currentUser.avatar_emoji}
          </div>
          <input
            className="search-input flex-1 py-2 text-sm"
            placeholder="Написать комментарий..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !commentText.trim()}
            className="btn-neon px-3 py-2 flex items-center"
            style={{ opacity: !commentText.trim() ? 0.5 : 1 }}
          >
            {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— EXPLORE SECTION ———
function ExploreSection({ token, onOpenPost }: { token: string; onOpenPost: (post: Post) => void }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    apiCall<{ posts: Post[] }>(`${POSTS_URL}?action=feed`, "GET", undefined, token)
      .then(d => setAllPosts(d.posts && d.posts.length > 0 ? d.posts : DEMO_POSTS))
      .catch(() => { setAllPosts(DEMO_POSTS); showToast("Показаны демо-данные"); })
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = allPosts.filter(p => {
    const q = query.toLowerCase();
    const matchQuery = !q || p.caption.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)) || p.username.toLowerCase().includes(q);
    const matchTag = !activeTag || p.tags.includes(activeTag);
    return matchQuery && matchTag;
  });

  const cardHeight = (i: number) => CARD_HEIGHTS[i % CARD_HEIGHTS.length];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="relative mb-5">
        <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="search-input pl-10"
          placeholder="Поиск по фото, авторам, хештегам..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Тренды</p>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map(t => (
            <button
              key={t}
              className={`tag ${activeTag === t ? "!bg-cyan-400/20 !border-cyan-400/50" : ""}`}
              onClick={() => setActiveTag(t === activeTag ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        {query || activeTag ? `Результаты (${filtered.length})` : "Популярные фото"}
      </p>

      {loading ? (
        <div className="columns-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={cardHeight(i)} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Ничего не найдено</p>
        </div>
      ) : (
        <div className="columns-2 gap-3">
          {filtered.map((post, i) => (
            <div key={post.id} className={`photo-card mb-3 ${cardHeight(i)}`} onClick={() => onOpenPost(post)}>
              <img src={post.image_url} alt={post.caption} className="w-full h-full object-cover" />
              <div className="photo-overlay">
                <div />
                <div className="flex items-center gap-2">
                  <Icon name="Heart" size={12} className="text-white" />
                  <span className="text-white text-xs">{post.likes_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— PEOPLE SECTION ———
function PeopleSection({
  token,
  currentUser,
  onOpenChat,
}: {
  token: string;
  currentUser: User;
  onOpenChat: (partner: ChatPartner) => void;
}) {
  const [users, setUsers] = useState<OtherUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Set<number>>(new Set());
  const { toast, showToast } = useToast();

  useEffect(() => {
    apiCall<{ users: OtherUser[] }>(`${POSTS_URL}?action=users`, "GET", undefined, token)
      .then(d => setUsers((d.users ?? []).filter(u => u.id !== currentUser.id)))
      .catch(err => showToast(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [token, currentUser.id]);

  const handleFollow = async (user: OtherUser) => {
    setFollowLoading(s => new Set(s).add(user.id));
    const wasFollowing = user.following;
    setUsers(us => us.map(u => u.id === user.id ? { ...u, following: !wasFollowing } : u));
    try {
      await apiCall(`${POSTS_URL}?action=follow`, "POST", { user_id: user.id }, token);
    } catch (err) {
      setUsers(us => us.map(u => u.id === user.id ? { ...u, following: wasFollowing } : u));
      showToast(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setFollowLoading(s => { const ns = new Set(s); ns.delete(user.id); return ns; });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Авторы платформы</p>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonUserCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Пользователей пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="glass rounded-2xl p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="avatar-ring flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-2xl">{user.avatar_emoji}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                  {user.bio && <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{user.bio}</p>}
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground"><span className="text-foreground font-semibold">{user.followers_count}</span> подписчиков</span>
                    <span className="text-[10px] text-muted-foreground"><span className="text-foreground font-semibold">{user.photos_count}</span> фото</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    className={user.following ? "reaction-btn active text-xs px-3 py-1.5" : "btn-neon text-xs px-3 py-1.5"}
                    onClick={() => handleFollow(user)}
                    disabled={followLoading.has(user.id)}
                  >
                    {followLoading.has(user.id) ? (
                      <Icon name="Loader2" size={12} className="animate-spin" />
                    ) : user.following ? "Отписаться" : "Подписаться"}
                  </button>
                  <button
                    className="reaction-btn text-xs px-3 py-1.5"
                    onClick={() => onOpenChat({ id: user.id, username: user.username, display_name: user.display_name, avatar_emoji: user.avatar_emoji })}
                  >
                    <Icon name="MessageCircle" size={12} />
                    Написать
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— MESSAGES SECTION ———
function MessagesSection({
  token,
  onOpenChat,
}: {
  token: string;
  onOpenChat: (partner: ChatPartner) => void;
}) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    apiCall<{ dialogs: Dialog[] }>(`${MESSAGES_URL}?action=dialogs`, "GET", undefined, token)
      .then(d => setDialogs(d.dialogs ?? []))
      .catch(err => showToast(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [token]);

  const formatTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Сообщения</p>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonUserCard key={i} />)}
        </div>
      ) : dialogs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Диалогов пока нет</p>
          <p className="text-xs mt-1 opacity-60">Напишите кому-нибудь из раздела «Люди»</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dialogs.map(dialog => (
            <button
              key={dialog.partner_id}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors animate-fade-in"
              onClick={() => onOpenChat({ id: dialog.partner_id, username: dialog.username, display_name: dialog.display_name, avatar_emoji: dialog.avatar_emoji })}
            >
              <div className="relative flex-shrink-0">
                <div className="avatar-ring">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-2xl">{dialog.avatar_emoji}</div>
                </div>
                {dialog.unread_count > 0 && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "#FF2D78" }}
                  >
                    {dialog.unread_count > 9 ? "9+" : dialog.unread_count}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm truncate">{dialog.display_name}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatTime(dialog.last_time)}</span>
                </div>
                <p className={`text-xs truncate ${dialog.unread_count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {dialog.last_text || "Нет сообщений"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— CHAT SECTION ———
function ChatSection({
  token,
  partner,
  currentUser,
  onBack,
}: {
  token: string;
  partner: ChatPartner;
  currentUser: User;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast, showToast } = useToast();

  const loadMessages = useCallback(async () => {
    try {
      const data = await apiCall<{ messages: Message[] }>(`${MESSAGES_URL}?action=chat&user_id=${partner.id}`, "GET", undefined, token);
      setMessages(data.messages ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [token, partner.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [loading, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msgText = text;
    setText("");
    setSending(true);
    const tempId = Date.now();
    setMessages(ms => [...ms, {
      id: tempId,
      sender_id: currentUser.id,
      text: msgText,
      is_read: false,
      created_at: new Date().toISOString(),
      is_mine: true,
    }]);
    try {
      await apiCall(`${MESSAGES_URL}?action=send`, "POST", { receiver_id: partner.id, text: msgText }, token);
    } catch (err) {
      setMessages(ms => ms.filter(m => m.id !== tempId));
      setText(msgText);
      showToast(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div
                  className="h-10 rounded-2xl animate-pulse"
                  style={{ width: `${50 + (i * 17) % 30}%`, background: "rgba(255,255,255,0.08)" }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">{partner.avatar_emoji}</div>
            <p className="font-semibold">{partner.display_name}</p>
            <p className="text-xs mt-1 opacity-60">Напишите первое сообщение</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"} animate-fade-in`}>
              {!msg.is_mine && (
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-sm mr-2 mt-auto flex-shrink-0 glass">
                  {partner.avatar_emoji}
                </div>
              )}
              <div
                className="max-w-[72%] px-4 py-2.5 rounded-2xl text-sm"
                style={msg.is_mine ? {
                  background: "rgba(255,45,120,0.2)",
                  border: "1px solid rgba(255,45,120,0.35)",
                  borderBottomRightRadius: "6px",
                } : {
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(20px)",
                  borderBottomLeftRadius: "6px",
                }}
              >
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.is_mine ? "text-right" : ""} opacity-50`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border glass-strong flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="search-input flex-1 py-2.5"
            placeholder={`Написать ${partner.display_name}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="btn-neon px-4 py-2.5 flex items-center"
            style={{ opacity: !text.trim() ? 0.5 : 1 }}
          >
            {sending ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Send" size={18} />}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— PROFILE SECTION ———
function ProfileSection({
  token,
  currentUser,
}: {
  token: string;
  currentUser: User;
}) {
  const [tab, setTab] = useState<"gallery" | "likes">("gallery");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const { toast, showToast } = useToast();

  useEffect(() => {
    apiCall<{ posts: Post[] }>(`${POSTS_URL}?action=user_posts&user_id=${currentUser.id}`, "GET", undefined, token)
      .then(d => setPosts(d.posts ?? []))
      .catch(err => showToast(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoadingPosts(false));
  }, [token, currentUser.id]);

  useEffect(() => {
    if (tab === "likes") {
      apiCall<{ posts: Post[] }>(`${POSTS_URL}?action=liked_posts`, "GET", undefined, token)
        .then(d => setLikedPosts(d.posts ?? []))
        .catch(() => setLikedPosts([]));
    }
  }, [tab, token]);

  const displayPosts = tab === "gallery" ? posts : likedPosts;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Avatar + info */}
      <div className="flex flex-col items-center mb-6 animate-fade-in">
        <div className="avatar-ring mb-3">
          <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-4xl border-2 border-black">
            {currentUser.avatar_emoji}
          </div>
        </div>
        <h2 className="font-oswald text-xl font-bold neon-text-pink">{currentUser.display_name}</h2>
        <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
        {currentUser.bio && <p className="text-sm text-center mt-2 max-w-xs text-foreground/70">{currentUser.bio}</p>}
        {currentUser.location && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Icon name="MapPin" size={12} />
            {currentUser.location}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Фото", value: currentUser.photos_count },
          { label: "Подписчики", value: currentUser.followers_count },
          { label: "Подписки", value: currentUser.following_count },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="text-xl font-bold font-oswald neon-text-pink">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-1 flex gap-1 mb-4">
        {[
          { key: "gallery" as const, label: "Галерея", icon: "Grid3X3" },
          { key: "likes" as const, label: "Лайки", icon: "Heart" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300"
            style={tab === t.key ? {
              background: "linear-gradient(135deg, #FF2D78, #BF00FF)",
              color: "white",
            } : { color: "var(--muted-foreground)" }}
          >
            <Icon name={t.icon as "Grid3X3"} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loadingPosts && tab === "gallery" ? (
        <div className="columns-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Camera" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{tab === "gallery" ? "Фотографий пока нет" : "Нет понравившихся фото"}</p>
        </div>
      ) : (
        <div className="columns-3 gap-2">
          {displayPosts.map(p => (
            <div key={p.id} className="photo-card h-28 mb-2 rounded-xl overflow-hidden">
              <img src={p.image_url} alt={p.caption} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

// ——— NOTIFICATIONS SECTION ———
function NotificationsSection() {
  const [notifs, setNotifs] = useState(DEMO_NOTIFICATIONS);

  const markAll = () => setNotifs(ns => ns.map(n => ({ ...n, unread: false })));
  const unreadCount = notifs.filter(n => n.unread).length;

  const typeIcon = (type: string) => {
    if (type === "like") return "Heart";
    if (type === "follow") return "UserPlus";
    if (type === "comment") return "MessageCircle";
    return "Bookmark";
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Уведомления {unreadCount > 0 && <span className="ml-1 neon-text-pink">({unreadCount})</span>}
        </p>
        {unreadCount > 0 && (
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors" onClick={markAll}>
            Прочитать все
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifs.map(n => (
          <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`}>
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${n.unread ? "avatar-ring" : "glass"}`}>
                {n.avatar}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: n.type === "like" ? "#FF2D78" : n.type === "follow" ? "#BF00FF" : n.type === "comment" ? "#00F5FF" : "#FF6B00" }}
              >
                <Icon name={typeIcon(n.type) as "Heart"} size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{n.user}</span>{" "}
                <span className="text-muted-foreground">{n.text}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{n.time}</p>
            </div>
            {n.img && (
              <img src={n.img} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            )}
            {n.unread && (
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#FF2D78" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ——— SETTINGS SECTION ———
function SettingsSection({
  currentUser,
  onLogout,
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  const [privateAccount, setPrivateAccount] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {/* Profile card */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4 mb-6 animate-fade-in">
        <div className="avatar-ring flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-3xl">{currentUser.avatar_emoji}</div>
        </div>
        <div>
          <p className="font-oswald text-lg font-bold neon-text-pink">{currentUser.display_name}</p>
          <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{currentUser.email}</p>
        </div>
      </div>

      {/* Privacy */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Приватность</p>
      <div className="glass rounded-2xl overflow-hidden mb-4">
        <div className="setting-row">
          <div className="flex items-center gap-3">
            <Icon name="Lock" size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Закрытый аккаунт</p>
              <p className="text-xs text-muted-foreground">Только подписчики видят фото</p>
            </div>
          </div>
          <button
            onClick={() => setPrivateAccount(p => !p)}
            className="w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
            style={{ background: privateAccount ? "linear-gradient(135deg, #FF2D78, #BF00FF)" : "rgba(255,255,255,0.12)" }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white transition-all duration-300 mx-0.5"
              style={{ transform: privateAccount ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
        <div className="border-t border-border" />
        <div className="setting-row">
          <div className="flex items-center gap-3">
            <Icon name="Bell" size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Уведомления</p>
              <p className="text-xs text-muted-foreground">Push-уведомления о событиях</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(p => !p)}
            className="w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
            style={{ background: notifications ? "linear-gradient(135deg, #FF2D78, #BF00FF)" : "rgba(255,255,255,0.12)" }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white transition-all duration-300 mx-0.5"
              style={{ transform: notifications ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>
        <div className="border-t border-border" />
        <div className="setting-row" onClick={() => setShowEmail(p => !p)}>
          <div className="flex items-center gap-3">
            <Icon name="Mail" size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">{showEmail ? currentUser.email : "Нажмите чтобы показать"}</p>
            </div>
          </div>
          <Icon name="Eye" size={16} className="text-muted-foreground" />
        </div>
      </div>

      {/* About */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">О платформе</p>
      <div className="glass rounded-2xl overflow-hidden mb-6">
        {[
          { icon: "Info", label: "Версия", value: "1.0.0" },
          { icon: "Shield", label: "Политика конфиденциальности", value: "" },
          { icon: "FileText", label: "Условия использования", value: "" },
        ].map((row, i) => (
          <div key={i}>
            {i > 0 && <div className="border-t border-border" />}
            <div className="setting-row">
              <div className="flex items-center gap-3">
                <Icon name={row.icon as "Info"} size={18} className="text-muted-foreground" />
                <p className="text-sm">{row.label}</p>
              </div>
              {row.value ? (
                <span className="text-xs text-muted-foreground">{row.value}</span>
              ) : (
                <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)", color: "#FF2D78" }}
        onClick={onLogout}
      >
        <Icon name="LogOut" size={16} />
        Выйти из аккаунта
      </button>
    </div>
  );
}

// ——— MAIN INDEX ———
export default function Index() {
  const [section, setSection] = useState<Section>("feed");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("kadr_token");
    if (!token) { setAuthLoading(false); return; }
    fetch(`${AUTH_URL}?action=me`, { headers: { "X-Authorization": token } })
      .then(r => r.json())
      .then((data: { user?: User }) => {
        if (data.user) {
          setCurrentUser(data.user);
          setAuthToken(token);
        } else {
          localStorage.removeItem("kadr_token");
        }
      })
      .catch(() => localStorage.removeItem("kadr_token"))
      .finally(() => setAuthLoading(false));
  }, []);

  // Load unread count
  useEffect(() => {
    if (!authToken) return;
    const fetchUnread = () => {
      apiCall<{ count: number }>(`${MESSAGES_URL}?action=unread`, "GET", undefined, authToken)
        .then(d => setUnreadCount(d.count ?? 0))
        .catch(() => setUnreadCount(0));
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [authToken, section]);

  const handleAuth = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("kadr_token");
    setCurrentUser(null);
    setAuthToken("");
    setSection("feed");
    setChatPartner(null);
    setSelectedPost(null);
  };

  const openChat = (partner: ChatPartner) => {
    setChatPartner(partner);
    setSection("chat");
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setSection("post_detail");
  };

  const goBack = () => {
    if (section === "chat") {
      setChatPartner(null);
      setSection("messages");
    } else if (section === "post_detail") {
      setSelectedPost(null);
      setSection("feed");
    } else {
      setSection("feed");
    }
  };

  const sectionTitle: Record<Section, string> = {
    feed: "КАДР",
    explore: "Поиск",
    people: "Люди",
    messages: "Сообщения",
    chat: chatPartner ? chatPartner.display_name : "Чат",
    profile: "Профиль",
    notifications: "Уведомления",
    settings: "Настройки",
    post_detail: "Фото",
  };

  const NAV_ITEMS = [
    { key: "feed" as Section, icon: "Home", label: "Лента" },
    { key: "people" as Section, icon: "Users", label: "Люди" },
    { key: "messages" as Section, icon: "MessageCircle", label: "Сообщения" },
    { key: "profile" as Section, icon: "User", label: "Профиль" },
  ];

  // Loading screen
  if (authLoading) {
    return (
      <div className="gradient-mesh min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-oswald text-4xl font-bold neon-text-pink tracking-widest animate-float">КАДР</h1>
        <Icon name="Loader2" size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // Auth screen
  if (!currentUser) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const isBack = section === "chat" || section === "post_detail" || section === "settings" || section === "notifications";

  return (
    <div className="gradient-mesh min-h-screen flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header className="glass-strong px-4 pt-safe flex items-center justify-between h-14 flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {isBack && (
            <button onClick={goBack} className="p-1 -ml-1 rounded-xl hover:bg-white/5 transition-colors">
              <Icon name="ArrowLeft" size={22} />
            </button>
          )}
          {section === "chat" && chatPartner ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-lg glass">{chatPartner.avatar_emoji}</div>
              <div>
                <p className="font-oswald text-sm font-bold neon-text-pink leading-tight">{chatPartner.display_name}</p>
                <p className="text-[10px] text-muted-foreground">@{chatPartner.username}</p>
              </div>
            </div>
          ) : (
            <h1 className={`font-oswald text-xl font-bold neon-text-pink tracking-wide`}>
              {sectionTitle[section]}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {section === "feed" && (
            <>
              <button
                className="p-2 rounded-xl hover:bg-white/5 transition-colors relative"
                onClick={() => setSection("notifications")}
              >
                <Icon name="Bell" size={20} />
              </button>
              <button
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                onClick={() => setSection("settings")}
              >
                <Icon name="Settings" size={20} />
              </button>
            </>
          )}
          {section === "messages" && (
            <button
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setSection("people")}
            >
              <Icon name="UserPlus" size={20} />
            </button>
          )}
          {section === "profile" && (
            <button
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              onClick={() => setSection("settings")}
            >
              <Icon name="Settings" size={20} />
            </button>
          )}
          {section === "explore" && (
            <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
              <Icon name="SlidersHorizontal" size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {section === "feed" && (
          <FeedSection token={authToken} currentUser={currentUser} onOpenPost={openPost} onOpenChat={openChat} />
        )}
        {section === "explore" && (
          <ExploreSection token={authToken} onOpenPost={openPost} />
        )}
        {section === "people" && (
          <PeopleSection token={authToken} currentUser={currentUser} onOpenChat={openChat} />
        )}
        {section === "messages" && (
          <MessagesSection token={authToken} onOpenChat={openChat} />
        )}
        {section === "chat" && chatPartner && (
          <ChatSection token={authToken} partner={chatPartner} currentUser={currentUser} onBack={goBack} />
        )}
        {section === "profile" && (
          <ProfileSection token={authToken} currentUser={currentUser} />
        )}
        {section === "notifications" && (
          <NotificationsSection />
        )}
        {section === "settings" && (
          <SettingsSection currentUser={currentUser} onLogout={handleLogout} />
        )}
        {section === "post_detail" && selectedPost && (
          <PostDetail
            post={selectedPost}
            token={authToken}
            currentUser={currentUser}
            onBack={goBack}
            onOpenChat={openChat}
          />
        )}
      </main>

      {/* Bottom navigation */}
      {!isBack && (
        <nav className="glass-strong border-t border-border flex items-center justify-around px-2 pb-safe flex-shrink-0 sticky bottom-0 z-30">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`nav-item flex-1 ${section === item.key || (item.key === "feed" && section === "explore") ? "active" : ""}`}
              onClick={() => setSection(item.key === "feed" && section === "explore" ? "feed" : item.key)}
            >
              <div className="relative nav-icon">
                <Icon name={item.icon as "Home"} size={22} />
                {item.key === "messages" && unreadCount > 0 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: "#FF2D78" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </div>
              <span className="nav-label text-[10px]">{item.label}</span>
            </button>
          ))}
          {/* Explore as central button */}
          <button
            className={`nav-item flex-1 ${section === "explore" ? "active" : ""}`}
            onClick={() => setSection("explore")}
            style={{ order: -1 }}
          >
            <div className="nav-icon">
              <Icon name="Search" size={22} />
            </div>
            <span className="nav-label text-[10px]">Поиск</span>
          </button>
        </nav>
      )}
    </div>
  );
}
