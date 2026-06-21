import { Ticket, Heart, ShieldCheck } from "lucide-react";

export const student = {
  firstName: "Alex",
  memberStatus: "Elite Member Status",
  newOffersToday: 12,
  interests: "Tech & Design",
  verificationStatus: "Verified Student",
  nextRenewal: "Sept 2024",
  totalSavings: 1240.5,
  monthlySavingsDelta: 12,
  claimedOffers: 48,
  savedForLater: 15,
  profileCompletion: 85,
  checklist: [
    { label: "Student ID Verified", done: true },
    { label: "Email Confirmed", done: true },
    { label: "Link Institution Portal", done: false },
  ],
};

export const recommended = [
  {
    id: "rec-1",
    badge: "TRENDING",
    badgeTone: "success" as const,
    category: "TECHNOLOGY",
    title: "Creative Cloud Pro Max",
    subtitle: "60% Student Discount on Annual Plans",
    price: "€19,99/μήνα",
    originalPrice: "€49,99",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "rec-2",
    badge: "FLASH SALE",
    badgeTone: "success" as const,
    category: "LIFESTYLE",
    title: "Eco-Stride Essentials",
    subtitle: "Buy 1 Get 1 Free for Verified Students",
    price: "BOGO",
    originalPrice: "Limited time only",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  },
];

export const recentActivity = [
  {
    id: "a1",
    icon: Ticket,
    title: "Redeemed: Coffee Island 2-for-1",
    meta: "2 hours ago • Syntagma Hub",
    tone: "primary" as const,
  },
  {
    id: "a2",
    icon: Heart,
    title: "Saved: Apple MacBook Air M3",
    meta: "Yesterday • Electronics",
    tone: "fashion" as const,
  },
  {
    id: "a3",
    icon: ShieldCheck,
    title: "ID Re-verified Successfully",
    meta: "3 days ago • System",
    tone: "success" as const,
  },
];

export const savedDeals = [
  {
    id: "s1",
    badge: "TRENDING",
    category: "AUDIO & SOUND",
    title: "35% Off Studio Headphones",
    description:
      "Exclusive academic discount for premium noise-cancelling equipment. Valid for all verified university students.",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s2",
    badge: "NEW",
    category: "LIFESTYLE",
    title: "Annual Membership 50% Off",
    description:
      "Unlock premium meditation and productivity tools designed for the modern scholar.",
    image:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s3",
    badge: "FLASH SALE",
    category: "APPAREL",
    title: "€20 Off Summer Essentials",
    description:
      "Refresh your wardrobe with sustainable essentials. Minimum spend €80 for student discount.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  },
];

export const savedRecommendations = {
  feature: {
    eyebrow: "TOP PICK",
    title: "Student Meal Plans: Get 10 Free Meals",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    cta: "Grab Deal",
  },
  tiles: [
    {
      id: "t1",
      title: "Back to University Gear",
      subtitle: "Extra 15% off at all university stores",
      bg: "bg-emerald-300",
      fg: "text-foreground",
      icon: "backpack" as const,
    },
    {
      id: "t2",
      title: "Student Travel Passes",
      subtitle: "",
      bg: "bg-[hsl(var(--category-fashion))]",
      fg: "text-white",
      icon: "plane" as const,
    },
    {
      id: "t3",
      title: "Cinematic Experience",
      subtitle: "",
      bg: "bg-card ring-1 ring-border",
      fg: "text-foreground",
      icon: "film" as const,
    },
  ],
};

export const supportTopics = [
  {
    q: "How do I verify my student status?",
    a: "Head to the Verification page and submit your university email or student ID. Most verifications complete within minutes.",
  },
  {
    q: "Why was my redemption declined?",
    a: "Make sure your verification is current and the offer is still active. Some brand offers require re-verification each semester.",
  },
  {
    q: "Can I share offers with friends?",
    a: "Premium offers are personal to verified students. Invite friends to join Unidealz instead — they'll unlock their own perks.",
  },
  {
    q: "How do I cancel a saved deal?",
    a: "Open Saved Deals, hover over the card, and click Remove. Saved deals don't charge you anything until you redeem them.",
  },
];
