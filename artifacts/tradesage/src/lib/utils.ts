import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function getScoreColors(score: number) {
  if (score >= 70) {
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950",
      border: "border-emerald-200 dark:border-emerald-900",
      ring: "text-emerald-500",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-950",
      border: "border-amber-200 dark:border-amber-900",
      ring: "text-amber-500",
    };
  }
  return {
    text: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-950",
    border: "border-rose-200 dark:border-rose-900",
    ring: "text-rose-500",
  };
}
