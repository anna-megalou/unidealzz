export type Category = "Coffee" | "Food" | "Fashion" | "Technology" | "Travel";

export interface Offer {
  id: string;
  storeName: string;
  title: string;
  category: Category;
  discount: number;
  description: string;
  expirationDate: string;
  terms: string;
  image?: string;
  featured?: boolean;
  discountLabel?: string;
}

export const offers: Offer[] = [
  {
    id: "1",
    storeName: "Apple",
    title: "Education Pricing + Gift Card",
    category: "Technology",
    discount: 10,
    description: "Save on Mac or iPad for university. Get AirPods on us when you buy an eligible Mac or iPad.",
    expirationDate: "2026-09-30",
    terms: "Valid for currently enrolled students with a valid Greek university (.gr) email. One purchase per student per academic year.",
    featured: true,
    discountLabel: "Education Pricing + Gift Card",
  },
  {
    id: "2",
    storeName: "Starbucks",
    title: "20% Off Storewide",
    category: "Coffee",
    discount: 20,
    description: "Fuel your late-night study sessions with your favorite handcrafted beverage.",
    expirationDate: "2026-06-30",
    terms: "Valid at participating locations. Must present valid student ID. Cannot be combined with other offers.",
    discountLabel: "20% Off Storewide",
  },
  {
    id: "3",
    storeName: "H&M",
    title: "Buy One Get One Free",
    category: "Fashion",
    discount: 50,
    description: "Upgrade your wardrobe with sustainable essentials. BOGO on all basics.",
    expirationDate: "2026-05-31",
    terms: "Applies to items marked 'Basics'. Online and in-store with student verification.",
    discountLabel: "Buy One Get One Free",
  },
  {
    id: "4",
    storeName: "Sony",
    title: "15% Student Discount",
    category: "Technology",
    discount: 15,
    description: "Industry-leading noise cancellation for focused library time.",
    expirationDate: "2026-08-31",
    terms: "Valid on selected Sony audio products. Must verify student status through UNiDAYS.",
    discountLabel: "15% Student Discount",
  },
  {
    id: "5",
    storeName: "Uber Eats",
    title: "€0 Delivery Fee",
    category: "Food",
    discount: 100,
    description: "Stay in and study. Unlimited €0 delivery fee on orders over €15.",
    expirationDate: "2026-07-31",
    terms: "Valid for verified students. Minimum order €15. Subject to availability in your area.",
    discountLabel: "€0 Delivery Fee",
  },
  {
    id: "6",
    storeName: "Brew & Bean",
    title: "Student Morning Boost",
    category: "Coffee",
    discount: 25,
    description: "Start your day right with 25% off all hot drinks before 11am. Valid for all students with a valid university ID.",
    expirationDate: "2026-06-30",
    terms: "Valid Monday to Friday before 11:00 AM. Must present valid student ID.",
  },
  {
    id: "7",
    storeName: "TechZone",
    title: "Student Laptop Bundle",
    category: "Technology",
    discount: 15,
    description: "Save 15% on laptops and accessories. Includes free setup and 1-year extended warranty.",
    expirationDate: "2026-07-31",
    terms: "Valid on selected models. Must verify student status. One purchase per student.",
  },
  {
    id: "8",
    storeName: "StyleCo",
    title: "Student Essentials",
    category: "Fashion",
    discount: 25,
    description: "25% off everyday basics. Stock up on tees, jeans, and sneakers.",
    expirationDate: "2026-05-31",
    terms: "Applies to items marked 'Essentials'. Online orders get free shipping over €50.",
  },
];

export const categories: Category[] = ["Coffee", "Food", "Fashion", "Technology"];

export const categoryIcons: Record<Category, string> = {
  Coffee: "☕",
  Food: "🍔",
  Fashion: "👗",
  Technology: "💻",
  Travel: "✈️",
};
