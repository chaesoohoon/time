import { CATEGORY_COLORS } from "./constants";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function categoryStyle(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.기타;
}

export function compactName(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
}
