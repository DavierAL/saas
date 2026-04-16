/**
 * Date utilities for consistent ISO date handling across the app.
 */
export const nowISO = (): string => new Date().toISOString();

export const isExpired = (isoDate: string): boolean => {
  const target = new Date(isoDate);
  return target <= new Date();
};

export const daysUntil = (isoDate: string): number => {
  const target = new Date(isoDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
