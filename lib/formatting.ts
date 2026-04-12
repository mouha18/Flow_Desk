/**
 * Formatting utilities for FlowDesk
 * Currency, duration, and date formatting functions
 */

/**
 * Format a currency amount
 * - XOF: "50 000 XOF" (space as thousands separator, no decimals)
 * - USD: "$1,250.00" (comma separator, 2 decimals)
 */
export function formatCurrency(amount: number, currency: "XOF" | "USD"): string {
  if (currency === "XOF") {
    // XOF uses space as thousands separator, no decimals
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(",", " ") // Replace comma with space for thousands separator
      .concat(" XOF");
  } else {
    // USD uses comma separator, 2 decimals
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Format a duration in milliseconds
 * - "1h 30m" for hours + minutes
 * - "45m" for minutes only
 * - "30s" for seconds only
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a timestamp to a human-readable date
 * - short: "Apr 9, 2026"
 * - long: "April 9, 2026"
 */
export function formatDate(timestamp: number, format: "short" | "long"): string {
  const date = new Date(timestamp);

  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}