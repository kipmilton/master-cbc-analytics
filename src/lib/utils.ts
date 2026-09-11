import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDisplayName(name?: string): string {
  if (!name) return "";
  const clean = name.trim();
  // Never display email-derived handles — return empty so callers fall back gracefully
  if (clean.includes("@")) return "";
  return clean;
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const display = formatDisplayName(name);
  if (!display) return timeOfDay;
  return `${timeOfDay}, ${display}`;
}
