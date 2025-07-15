import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  try {
    return twMerge(clsx(inputs));
  } catch (error) {
    // Fallback in case of any navigation context issues
    console.warn('cn utility error:', error);
    return clsx(inputs).replace(/\s+/g, ' ').trim();
  }
}
