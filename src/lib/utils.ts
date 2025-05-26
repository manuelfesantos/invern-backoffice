import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getValueByPath(obj: any, path: string): any {
  if (!obj || typeof path !== "string") {
    return undefined;
  }
  return path
    .split(".")
    .reduce(
      (o, key) => (o && o[key] !== "undefined" ? o[key] : undefined),
      obj,
    );
}
