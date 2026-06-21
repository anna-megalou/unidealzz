import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = [
  "/operations",
  "/login",
  "/signup",
  "/reset-password",
  "/accept-invite",
  "/unsubscribe",
];

const BUBBLE_SEEN_KEY = "unidealz.mascot.bubbleSeen";
const SIZE = 64;
const SIZE_MOBILE = 52;
const EDGE_GAP = 16;
const BOTTOM_RESERVED = 96; // space reserved for the Get Premium button
const COOKIE_LIFT = 180;

interface ChatMascotProps {
  onOpen: () => void;
  cookieBannerOpen: boolean;
}

const ChatMascot = ({ onOpen, cookieBannerOpen }: ChatMascotProps) => {
  const location = useLocation();
  const hidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  const [size, setSize] = useState(SIZE);
  const [showBubble, setShowBubble] = useState(false);
  const [waving, setWaving] = useState(false);
  // Tiny offset (in px) from the home position; used for the brief wander.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [wandering, setWandering] = useState(false);
  const [transitionOn, setTransitionOn] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Responsive size
  useEffect(() => {
    const sync = () => setSize(window.innerWidth < 640 ? SIZE_MOBILE : SIZE);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // First-load speech bubble (auto-hide)
  useEffect(() => {
    if (sessionStorage.getItem(BUBBLE_SEEN_KEY)) return;
    const showT = setTimeout(() => setShowBubble(true), 900);
    const hideT = setTimeout(() => {
      setShowBubble(false);
      sessionStorage.setItem(BUBBLE_SEEN_KEY, "1");
    }, 6500);
    return () => {
      clearTimeout(showT);
      clearTimeout(hideT);
    };
  }, []);

  // Periodic wave animation (every 5s, lasts ~1.4s)
  useEffect(() => {
    const tick = () => {
      setWaving(true);
      setTimeout(() => setWaving(false), 1400);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  // Every 20s, do a brief in-place animation (~3s) without changing position.
  useEffect(() => {
    const tick = () => {
      setWandering(true);
      setTimeout(() => setWandering(false), 3000);
    };
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);

  const handleClick = () => {
    onOpen();
    setShowBubble(false);
    sessionStorage.setItem(BUBBLE_SEEN_KEY, "1");
  };

  if (hidden) return null;

  // Home position: bottom-right, above Get Premium button. Lifts when cookie banner shows.
  const bottomBase = BOTTOM_RESERVED + (cookieBannerOpen ? COOKIE_LIFT : 0);

  return (
    <div
      style={{
        right: EDGE_GAP - offset.x, // offset.x is negative → moves the mascot left
        bottom: bottomBase - offset.y, // offset.y is negative → moves it up
        width: size,
        height: size,
        transition: transitionOn
          ? "right 1200ms cubic-bezier(0.22,1,0.36,1), bottom 1200ms cubic-bezier(0.22,1,0.36,1)"
          : "none",
      }}
      className="fixed z-[55] select-none"
    >
      {/* Speech bubble */}
      {showBubble && (
        <div
          className={cn(
            "absolute right-full top-1/2 mr-3 -translate-y-1/2 rounded-2xl border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-xl animate-fade-in",
            "max-w-[220px] text-left",
          )}
        >
          <span className="block leading-snug">
            👋 Hi! Need help finding the best <span className="text-primary">student deals</span>?
          </span>
          <span
            aria-hidden
            className="absolute right-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t bg-card"
          />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-label="Open Unidealz Deals Assistant"
        onClick={handleClick}
        className={cn(
          "group relative flex h-full w-full items-center justify-center rounded-full",
          "bg-gradient-to-br from-primary via-primary to-[hsl(265_70%_60%)] text-primary-foreground",
          "shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)] ring-2 ring-white/40",
          "cursor-pointer transition-transform duration-200 hover:scale-110 hover:shadow-[0_14px_36px_-8px_hsl(var(--primary)/0.7)]",
          wandering && "animate-mascot-float",
        )}
      >
        <MascotFace size={size} waving={waving} />
        {/* Glow halo on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 ring-4 ring-primary/30 transition-opacity duration-200 group-hover:opacity-100"
        />
        {/* Tiny status dot */}
        <span
          aria-hidden
          className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white shadow"
        />
      </button>
    </div>
  );
};

const MascotFace = ({ size, waving }: { size: number; waving: boolean }) => {
  const s = size * 0.78;
  return (
    <svg viewBox="0 0 100 100" width={s} height={s} className="drop-shadow-sm" aria-hidden>
      <defs>
        <radialGradient id="m-head" cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#f1f5ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#dbe5ff" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="34" fill="url(#m-head)" />
      <line x1="50" y1="16" x2="50" y2="9" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="7" r="3" fill="hsl(var(--primary))" />
      <g fill="#1e1b4b">
        <circle cx="40" cy="48" r="3.5" />
        <circle cx="60" cy="48" r="3.5" />
      </g>
      <g fill="#fff">
        <circle cx="41.2" cy="46.8" r="1.1" />
        <circle cx="61.2" cy="46.8" r="1.1" />
      </g>
      <path d="M40 60 Q50 68 60 60" stroke="#1e1b4b" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="58" r="3" fill="hsl(var(--primary)/0.35)" />
      <circle cx="66" cy="58" r="3" fill="hsl(var(--primary)/0.35)" />
      <g
        style={{
          transformOrigin: "82px 70px",
          animation: waving ? "mascot-wave 1.2s ease-in-out" : "none",
        }}
      >
        <circle cx="82" cy="70" r="7" fill="hsl(var(--primary))" />
        <circle cx="82" cy="70" r="7" fill="url(#m-head)" opacity="0.25" />
      </g>
    </svg>
  );
};

export default ChatMascot;
