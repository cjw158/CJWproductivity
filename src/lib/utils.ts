import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getQuadrant(important: boolean, urgent: boolean): number {
  if (important && urgent) return 1;
  if (important && !urgent) return 2;
  if (!important && urgent) return 3;
  return 4;
}

export function getQuadrantLabel(quadrant: number): string {
  switch (quadrant) {
    case 1:
      return "Do First";
    case 2:
      return "Schedule";
    case 3:
      return "Delegate";
    case 4:
      return "Eliminate";
    default:
      return "";
  }
}

export function getQuadrantDescription(quadrant: number): string {
  switch (quadrant) {
    case 1:
      return "Important & Urgent";
    case 2:
      return "Important, Not Urgent";
    case 3:
      return "Urgent, Not Important";
    case 4:
      return "Neither";
    default:
      return "";
  }
}

export function getQuadrantColor(quadrant: number): string {
  switch (quadrant) {
    case 1:
      return "red";
    case 2:
      return "blue";
    case 3:
      return "yellow";
    case 4:
      return "gray";
    default:
      return "gray";
  }
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
