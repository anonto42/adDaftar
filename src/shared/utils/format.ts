/**
 * Formatting Utilities
 *
 * Common formatting functions for dates, numbers, and strings.
 */

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number, 
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'SAR' | 'AED' = 'USD'
): string {
  switch (currency) {
    case 'BDT':
      return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'GBP':
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'INR':
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'JPY':
      return `¥${amount.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'SAR':
      return `﷼${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'AED':
      return `د.إ${amount.toLocaleString('ar-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format a number with K, M, B suffixes for large values
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  }
  if (count < 1000000) {
    const value = count / 1000;
    return value % 1 === 0 ? `${value}K` : `${value.toFixed(1)}K`;
  }
  if (count < 1000000000) {
    const value = count / 1000000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
  }
  const value = count / 1000000000;
  return value % 1 === 0 ? `${value}B` : `${value.toFixed(1)}B`;
}

/**
 * Format a date as relative time (e.g., "2h", "3d", "1w")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) {
    return 'now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks}w`;
  }

  // For older dates, show the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as full date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as time (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format username with @ prefix
 */
export function formatUsername(username: string): string {
  return username.startsWith('@') ? username : `@${username}`;
}

/**
 * Format hashtag with # prefix
 */
export function formatHashtag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
