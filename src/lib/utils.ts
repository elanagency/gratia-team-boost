import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePointsFromPrice(priceInCents: number, exchangeRate: string, multiplier: number = 1): number {
  const rate = parseFloat(exchangeRate);
  if (!rate || rate <= 0) {
    return 0; // Return 0 if invalid exchange rate
  }
  const priceInDollars = priceInCents / 100;
  return Math.round((priceInDollars / rate) * multiplier);
}
