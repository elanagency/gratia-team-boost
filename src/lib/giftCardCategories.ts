import {
  CreditCard,
  ShoppingBag,
  Plane,
  Film,
  UtensilsCrossed,
  Home,
  Heart,
  Globe,
  Store,
  Sparkles,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDefinition {
  name: string;
  icon: LucideIcon;
}

export const GIFT_CARD_CATEGORIES: CategoryDefinition[] = [
  { name: "Prepaid Cards", icon: CreditCard },
  { name: "Apparel", icon: ShoppingBag },
  { name: "Destinations", icon: Plane },
  { name: "Entertainment", icon: Film },
  { name: "Food & Drink", icon: UtensilsCrossed },
  { name: "Home", icon: Home },
  { name: "Lifestyle", icon: Heart },
  { name: "Online Shopping", icon: Globe },
  { name: "Restaurants", icon: Store },
  { name: "Wellness", icon: Sparkles },
  { name: "Other", icon: LayoutGrid },
];

// Keyword-to-category mapping for auto-categorisation
const BRAND_CATEGORY_MAP: Record<string, string> = {
  // Prepaid Cards
  "visa": "Prepaid Cards",
  "mastercard": "Prepaid Cards",
  "prepaid": "Prepaid Cards",
  "eftpos": "Prepaid Cards",
  "amex": "Prepaid Cards",
  "american express": "Prepaid Cards",
  // Apparel
  "adidas": "Apparel",
  "nike": "Apparel",
  "h&m": "Apparel",
  "zara": "Apparel",
  "uniqlo": "Apparel",
  "lululemon": "Apparel",
  "gap": "Apparel",
  "foot locker": "Apparel",
  "cotton on": "Apparel",
  "bonds": "Apparel",
  "rebel": "Apparel",
  "platypus": "Apparel",
  "the iconic": "Apparel",
  "country road": "Apparel",
  "seed": "Apparel",
  "kathmandu": "Apparel",
  "r.m.williams": "Apparel",
  "surfstitch": "Apparel",
  "general pants": "Apparel",
  "asos": "Apparel",
  "nordstrom": "Apparel",
  "old navy": "Apparel",
  "forever 21": "Apparel",
  "under armour": "Apparel",
  "puma": "Apparel",
  // Destinations
  "airbnb": "Destinations",
  "hotel": "Destinations",
  "travel": "Destinations",
  "flight": "Destinations",
  "webjet": "Destinations",
  "booking": "Destinations",
  "expedia": "Destinations",
  "accor": "Destinations",
  "marriott": "Destinations",
  "hilton": "Destinations",
  // Entertainment
  "spotify": "Entertainment",
  "netflix": "Entertainment",
  "disney": "Entertainment",
  "hoyts": "Entertainment",
  "event cinema": "Entertainment",
  "cinema": "Entertainment",
  "playstation": "Entertainment",
  "xbox": "Entertainment",
  "nintendo": "Entertainment",
  "steam": "Entertainment",
  "google play": "Entertainment",
  "apple": "Entertainment",
  "itunes": "Entertainment",
  "amc": "Entertainment",
  "ticketek": "Entertainment",
  "ticketmaster": "Entertainment",
  "stan": "Entertainment",
  "foxtel": "Entertainment",
  "kayo": "Entertainment",
  "roblox": "Entertainment",
  "fortnite": "Entertainment",
  // Food & Drink
  "uber eats": "Food & Drink",
  "doordash": "Food & Drink",
  "menulog": "Food & Drink",
  "deliveroo": "Food & Drink",
  "grubhub": "Food & Drink",
  "wine": "Food & Drink",
  "beer": "Food & Drink",
  "liquor": "Food & Drink",
  "dan murphy": "Food & Drink",
  "bws": "Food & Drink",
  "coles": "Food & Drink",
  "woolworths": "Food & Drink",
  "aldi": "Food & Drink",
  "instacart": "Food & Drink",
  "whole foods": "Food & Drink",
  // Home
  "ikea": "Home",
  "bunnings": "Home",
  "home depot": "Home",
  "freedom": "Home",
  "temple": "Home",
  "kmart": "Home",
  "target": "Home",
  "bed bath": "Home",
  "harvey norman": "Home",
  "good guys": "Home",
  "jb hi-fi": "Home",
  "lowes": "Home",
  "wayfair": "Home",
  // Lifestyle
  "sephora": "Lifestyle",
  "mecca": "Lifestyle",
  "priceline": "Lifestyle",
  "beauty": "Lifestyle",
  "cosmetic": "Lifestyle",
  "fragrance": "Lifestyle",
  "pet": "Lifestyle",
  "bath & body": "Lifestyle",
  // Online Shopping
  "amazon": "Online Shopping",
  "ebay": "Online Shopping",
  "catch": "Online Shopping",
  "wish": "Online Shopping",
  "etsy": "Online Shopping",
  "shopify": "Online Shopping",
  // Restaurants
  "starbucks": "Restaurants",
  "mcdonald": "Restaurants",
  "kfc": "Restaurants",
  "subway": "Restaurants",
  "domino": "Restaurants",
  "pizza": "Restaurants",
  "grill": "Restaurants",
  "burger": "Restaurants",
  "nando": "Restaurants",
  "restaurant": "Restaurants",
  "dining": "Restaurants",
  "cafe": "Restaurants",
  "coffee": "Restaurants",
  "chipotle": "Restaurants",
  "taco bell": "Restaurants",
  "wendy": "Restaurants",
  "panera": "Restaurants",
  "olive garden": "Restaurants",
  "chili": "Restaurants",
  "applebee": "Restaurants",
  "dunkin": "Restaurants",
  // Wellness
  "spa": "Wellness",
  "wellness": "Wellness",
  "fitness": "Wellness",
  "gym": "Wellness",
  "yoga": "Wellness",
  "massage": "Wellness",
  "health": "Wellness",
  "pharmacy": "Wellness",
  "chemist": "Wellness",
};

/**
 * Determines the category for a brand based on its name.
 * Matches longer keywords first to avoid false positives.
 */
export function getCategoryForBrand(brandName: string): string {
  const lowerName = brandName.toLowerCase();

  // Sort keys by length descending so multi-word matches take priority
  const sortedKeys = Object.keys(BRAND_CATEGORY_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeys) {
    if (lowerName.includes(keyword)) {
      return BRAND_CATEGORY_MAP[keyword];
    }
  }

  return "Other";
}
