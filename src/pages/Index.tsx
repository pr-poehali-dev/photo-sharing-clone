import { useState } from "react";
import Icon from "@/components/ui/icon";

const IMG1 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/48dbe723-6e8e-4b5c-8094-91f9a43e83f5.jpg";
const IMG2 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/5678c543-1819-43db-9ddb-5c766f362bc2.jpg";
const IMG3 = "https://cdn.poehali.dev/projects/f9611c47-1e4f-4cf0-97d2-d00fbcfee9d6/files/459ec2f1-d0a0-41b7-9a7b-8508b4b1e3ca.jpg";

type Section = "feed" | "explore" | "favorites" | "profile" | "notifications" | "settings";

const REACTIONS = ["❤️", "🔥", "😍", "👏", "💫"];

interface Photo {
  id: number;
  img: string;
  author: string;
  avatar: string;
  desc: string;
  tags: string[];
  likes: number;
  comments: number;
  saves: number;
  height: string;
  liked: boolean;
  saved: boolean;
  reaction?: string;
}

const initialPhotos: Photo[] = [
  { id: 1, img: IMG1, author: "alex_shoots", avatar: "🧑‍🎨", desc: "Золотой час в горах", tags: ["#пейзаж", "#горы", "#закат"], likes: 1247, comments: 38, saves: 212, height: "h-72", liked: false, saved: false },
  { id: 2, img: IMG2, author: "urban_lens", avatar: "📸", desc: "Ночной город в дождь", tags: ["#стрит", "#ночь", "#неон"], likes: 892, comments: 21, saves: 134, height: "h-52", liked: true, saved: false, reaction: "🔥" },
  { id: 3, img: IMG3, author: "color_wave", avatar: "🎨", desc: "Абстракция красок", tags: ["#арт", "#краски", "#макро"], likes: 2103, comments: 67, saves: 445, height: "h-80", liked: false, saved: true },
  { id: 4, img: IMG2, author: "night_vision", avatar: "🌙", desc: "Отражение неона", tags: ["#стрит", "#ночь"], likes: 541, comments: 12, saves: 78, height: "h-64", liked: false, saved: false },
  { id: 5, img: IMG1, author: "mountain_air", avatar: "⛰️", desc: "Туман над долиной", tags: ["#природа", "#туман"], likes: 1890, comments: 44, saves: 320, height: "h-56", liked: false, saved: false },
  { id: 6, img: IMG3, author: "art_flow", avatar: "✨", desc: "Взрыв цвета", tags: ["#абстракция", "#арт"], likes: 3412, comments: 89, saves: 671, height: "h-72", liked: true, saved: true, reaction: "😍" },
];

const NOTIFICATIONS = [
  { id: 1, type: "like", user: "alex_shoots", avatar: "🧑‍🎨", text: "лайкнул вашу фотографию", time: "2 мин", unread: true, img: IMG1 },
  { id: 2, type: "follow", user: "urban_lens", avatar: "📸", text: "подписался на вас", time: "15 мин", unread: true },
  { id: 3, type: "comment", user: "color_wave", avatar: "🎨", text: "прокомментировал: «Невероятный кадр!»", time: "1 час", unread: true, img: IMG3 },
  { id: 4, type: "like", user: "night_vision", avatar: "🌙", text: "и 12 других лайкнули вашу фото", time: "3 часа", unread: false, img: IMG2 },
  { id: 5, type: "follow", user: "mountain_air", avatar: "⛰️", text: "подписался на вас", time: "вчера", unread: false },
  { id: 6, type: "save", user: "art_flow", avatar: "✨", text: "сохранил вашу фотографию", time: "вчера", unread: false, img: IMG1 },
];

const TRENDING_TAGS = ["#закат", "#стрит", "#природа", "#портрет", "#арт", "#минимализм", "#путешествия", "#архитектура", "#макро", "#абстракция"];

function PhotoCard({ photo, onToggleLike, onToggleSave, onReact }: {
  photo: Photo;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onReact: (id: number, r: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={`photo-card ${photo.height} w-full mb-3 animate-fade-in`}>
      <img src={photo.img} alt={photo.desc} className="w-full h-full object-cover" />
      <div className="photo-overlay">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="avatar-ring">
              <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-sm">{photo.avatar}</div>
            </div>
            <span className="text-white text-xs font-semibold drop-shadow">{photo.author}</span>
          </div>
          {photo.reaction && <span className="text-lg animate-float">{photo.reaction}</span>}
        </div>
        <div>
          <p className="text-white text-xs font-medium mb-2 drop-shadow">{photo.desc}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {photo.tags.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,245,255,0.2)", color: "#00F5FF" }}>{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className={`reaction-btn ${photo.liked ? "active" : ""}`} onClick={() => onToggleLike(photo.id)}>
              <Icon name="Heart" size={12} className={photo.liked ? "fill-current" : ""} />
              {photo.likes + (photo.liked ? 1 : 0)}
            </button>
            <button className="reaction-btn">
              <Icon name="MessageCircle" size={12} />
              {photo.comments}
            </button>
            <button className={`reaction-btn ${photo.saved ? "active" : ""}`} onClick={() => onToggleSave(photo.id)}>
              <Icon name="Bookmark" size={12} className={photo.saved ? "fill-current" : ""} />
            </button>
            <div className="relative ml-auto">
              <button className="reaction-btn" onClick={() => setShowReactions(!showReactions)}>
                <Icon name="Smile" size={12} />
              </button>
              {showReactions && (
                <div className="absolute bottom-8 right-0 flex gap-1 p-2 rounded-2xl glass-strong animate-scale-in z-10">
                  {REACTIONS.map(r => (
                    <button key={r} className="text-lg hover:scale-125 transition-transform" onClick={() => { onReact(photo.id, r); setShowReactions(false); }}>
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
  );
}

function FeedSection({ photos, onToggleLike, onToggleSave, onReact }: {
  photos: Photo[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onReact: (id: number, r: string) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {[
          { label: "Добавить", special: true },
          { label: "alex_s", emoji: "🧑‍🎨" },
          { label: "urban_l", emoji: "📸" },
          { label: "color_w", emoji: "🎨" },
          { label: "night_v", emoji: "🌙" },
          { label: "art_f", emoji: "✨" },
          { label: "mnt_air", emoji: "⛰️" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
            {s.special ? (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,120,0.15)", border: "2px dashed rgba(255,45,120,0.4)" }}>
                <Icon name="Plus" size={20} className="text-primary" />
              </div>
            ) : (
              <div className="story-ring p-0.5 rounded-full">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-xl border-2 border-black">{s.emoji}</div>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="columns-2 gap-3">
        {photos.map(photo => (
          <PhotoCard key={photo.id} photo={photo} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onReact={onReact} />
        ))}
      </div>
    </div>
  );
}

function ExploreSection() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="relative mb-5">
        <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="search-input pl-10" placeholder="Поиск по фото, авторам, хештегам..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Тренды</p>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map(t => (
            <button key={t} className={`tag ${activeTag === t ? "!bg-cyan-400/20 !border-cyan-400/50" : ""}`} onClick={() => setActiveTag(t === activeTag ? null : t)}>{t}</button>
          ))}
        </div>
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Популярные фото</p>
      <div className="columns-2 gap-3">
        {[IMG3, IMG2, IMG1, IMG3, IMG2, IMG1].map((img, i) => (
          <div key={i} className={`photo-card mb-3 ${i % 3 === 0 ? "h-72" : i % 3 === 1 ? "h-52" : "h-64"}`}>
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="photo-overlay">
              <div />
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={12} className="text-white" />
                <span className="text-white text-xs">{(300 + i * 400).toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FavoritesSection({ photos }: { photos: Photo[] }) {
  const saved = photos.filter(p => p.saved);
  const liked = photos.filter(p => p.liked);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex gap-3 mb-5">
        {[
          { label: "Сохранённые", count: saved.length, icon: "Bookmark" },
          { label: "Понравились", count: liked.length, icon: "Heart" },
        ].map(tab => (
          <div key={tab.label} className="flex-1 stat-card cursor-pointer">
            <Icon name={tab.icon as "Bookmark"} size={20} className="text-primary mx-auto mb-1" />
            <div className="text-xl font-bold font-oswald neon-text-pink">{tab.count}</div>
            <div className="text-xs text-muted-foreground">{tab.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Сохранённые</p>
      {saved.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Пока ничего не сохранено</div>
      ) : (
        <div className="columns-2 gap-3 mb-5">
          {saved.map(p => (
            <div key={p.id} className={`photo-card mb-3 ${p.height}`}>
              <img src={p.img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Понравившиеся</p>
      {liked.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Пока нет лайков</div>
      ) : (
        <div className="columns-2 gap-3">
          {liked.map(p => (
            <div key={p.id} className={`photo-card mb-3 ${p.height}`}>
              <img src={p.img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileSection({ photos }: { photos: Photo[] }) {
  const [activeTab, setActiveTab] = useState<"grid" | "liked">("grid");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative h-36">
        <img src={IMG2} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, hsl(var(--background)))" }} />
      </div>
      <div className="px-4 -mt-10 relative">
        <div className="flex items-end justify-between mb-4">
          <div className="avatar-ring">
            <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-4xl border-4 border-black">🧑‍🎨</div>
          </div>
          <button className="btn-neon">Редактировать</button>
        </div>
        <h2 className="text-xl font-bold font-oswald mb-0.5">@my_username</h2>
        <p className="text-sm text-muted-foreground mb-3">Фотограф · Москва ✈️</p>
        <p className="text-sm text-foreground/80 mb-4">Снимаю жизнь такой, какая она есть. Люблю закаты, неон и абстракцию.</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {["#пейзаж", "#стрит", "#арт"].map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Фото", val: "48" },
            { label: "Подписчиков", val: "12.4K" },
            { label: "Подписок", val: "384" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="text-xl font-bold font-oswald neon-text-pink">{s.val}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          {[
            { key: "grid", label: "Галерея", icon: "Grid3X3" },
            { key: "liked", label: "Лайки", icon: "Heart" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "grid" | "liked")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? "btn-neon" : "glass text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name={tab.icon as "Grid3X3"} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="columns-3 gap-2 pb-4">
          {photos.map(p => (
            <div key={p.id} className="photo-card mb-2 h-28">
              <img src={p.img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unreadCount = notifs.filter(n => n.unread).length;

  const getIcon = (type: string) => {
    if (type === "like") return "Heart";
    if (type === "follow") return "UserPlus";
    if (type === "comment") return "MessageCircle";
    return "Bookmark";
  };

  const getColor = (type: string) => {
    if (type === "like") return "#FF2D78";
    if (type === "follow") return "#00F5FF";
    if (type === "comment") return "#BF00FF";
    return "#FF6B00";
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#FF2D78" }}>{unreadCount}</span>
          )}
          <span className="text-sm text-muted-foreground">непрочитанных</span>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => setNotifs(notifs.map(n => ({ ...n, unread: false })))} className="text-xs text-primary hover:underline">Прочитать все</button>
        )}
      </div>
      <div className="space-y-1">
        {notifs.map(n => (
          <div key={n.id} className={`notif-item ${n.unread ? "unread" : ""}`} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-xl">{n.avatar}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: getColor(n.type) }}>
                <Icon name={getIcon(n.type) as "Heart"} size={10} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{n.user}</span>
                {" "}
                <span className="text-muted-foreground">{n.text}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.time} назад</p>
            </div>
            {n.img && (
              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                <img src={n.img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {n.unread && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#FF2D78" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSection() {
  const [privacy, setPrivacy] = useState({ privateAccount: false, showActivity: true, allowComments: true, notifications: true, emailDigest: false });

  const toggle = (key: keyof typeof privacy) => setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="glass rounded-2xl p-4 flex items-center gap-4 mb-5">
        <div className="avatar-ring">
          <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-3xl border-2 border-black">🧑‍🎨</div>
        </div>
        <div>
          <p className="font-semibold">@my_username</p>
          <p className="text-sm text-muted-foreground">my@email.com</p>
        </div>
        <button className="ml-auto btn-neon text-xs py-2">Изменить</button>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Приватность</p>
      <div className="space-y-1 mb-5">
        {[
          { key: "privateAccount" as const, label: "Закрытый аккаунт", desc: "Только подписчики видят фото" },
          { key: "showActivity" as const, label: "Показывать активность", desc: "Когда вы онлайн" },
          { key: "allowComments" as const, label: "Разрешить комментарии", desc: "Все могут комментировать" },
        ].map(s => (
          <div key={s.key} className="setting-row">
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <button onClick={() => toggle(s.key)} className="w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0" style={{ background: privacy[s.key] ? "#FF2D78" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300" style={{ left: privacy[s.key] ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Уведомления</p>
      <div className="space-y-1 mb-5">
        {[
          { key: "notifications" as const, label: "Push-уведомления", desc: "Лайки, комментарии, подписки" },
          { key: "emailDigest" as const, label: "Email-дайджест", desc: "Еженедельная подборка" },
        ].map(s => (
          <div key={s.key} className="setting-row">
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <button onClick={() => toggle(s.key)} className="w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0" style={{ background: privacy[s.key] ? "#FF2D78" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300" style={{ left: privacy[s.key] ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Аккаунт</p>
      <div className="space-y-1">
        {[
          { label: "Изменить пароль", icon: "Lock" },
          { label: "Привязанные аккаунты", icon: "Link" },
          { label: "Скачать данные", icon: "Download" },
          { label: "Заблокированные", icon: "Ban" },
        ].map(item => (
          <div key={item.label} className="setting-row">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,45,120,0.1)" }}>
                <Icon name={item.icon as "Lock"} size={14} className="text-primary" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 py-4 mt-4 rounded-2xl transition-all" style={{ color: "#FF2D78", background: "rgba(255,45,120,0.05)", border: "1px solid rgba(255,45,120,0.15)" }}>
          <Icon name="LogOut" size={16} />
          <span className="text-sm font-medium">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("feed");
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  const unreadNotifs = NOTIFICATIONS.filter(n => n.unread).length;

  const toggleLike = (id: number) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked } : p));
  const toggleSave = (id: number) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  const setReaction = (id: number, r: string) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, reaction: r, liked: true } : p));

  const NAV = [
    { key: "feed", icon: "Home", label: "Лента" },
    { key: "explore", icon: "Search", label: "Поиск" },
    { key: "favorites", icon: "Bookmark", label: "Избранное" },
    { key: "notifications", icon: "Bell", label: "Звонки", badge: unreadNotifs },
    { key: "profile", icon: "User", label: "Профиль" },
  ];

  const titles: Record<Section, string> = {
    feed: "КАДР",
    explore: "Поиск",
    favorites: "Избранное",
    profile: "Профиль",
    notifications: "Уведомления",
    settings: "Настройки",
  };

  return (
    <div className="gradient-mesh min-h-screen flex flex-col max-w-md mx-auto relative">
      <header className="glass-strong sticky top-0 z-20 px-4 pt-12 pb-3 flex items-center justify-between">
        <h1 className="font-oswald text-2xl font-bold neon-text-pink tracking-widest">{titles[section]}</h1>
        <div className="flex items-center gap-2">
          {section === "feed" && (
            <>
              <button className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-secondary transition-colors">
                <Icon name="Plus" size={18} className="text-foreground" />
              </button>
              <button onClick={() => setSection("settings")} className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-secondary transition-colors">
                <Icon name="Settings" size={18} className="text-foreground" />
              </button>
            </>
          )}
          {section === "settings" && (
            <button onClick={() => setSection("feed")} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
              <Icon name="X" size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {section === "feed" && <FeedSection photos={photos} onToggleLike={toggleLike} onToggleSave={toggleSave} onReact={setReaction} />}
        {section === "explore" && <ExploreSection />}
        {section === "favorites" && <FavoritesSection photos={photos} />}
        {section === "profile" && <ProfileSection photos={photos} />}
        {section === "notifications" && <NotificationsSection />}
        {section === "settings" && <SettingsSection />}
      </main>

      {section !== "settings" && (
        <nav className="glass-strong sticky bottom-0 z-20 px-4 pb-6 pt-2 flex items-center justify-around">
          {NAV.map(item => (
            <button
              key={item.key}
              className={`nav-item ${section === item.key ? "active" : ""}`}
              onClick={() => setSection(item.key as Section)}
            >
              <div className="relative">
                <Icon name={item.icon as "Home"} size={22} className={`nav-icon transition-colors ${section === item.key ? "text-primary" : "text-muted-foreground"}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "#FF2D78" }}>
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`nav-label text-[10px] transition-colors ${section === item.key ? "text-primary" : "text-muted-foreground"}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
