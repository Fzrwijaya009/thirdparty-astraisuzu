/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates human-readable lead time between two date strings (ISO or locale date string)
 * Returns format like: "2 jam 15 mnt", "1 hari 3 jam", or "35 mnt"
 */
export function calculateLeadTime(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr) return '-';

  const start = new Date(startDateStr).getTime();
  if (isNaN(start)) {
    // If it is in Indonesian locale format DD/MM/YYYY, HH:MM
    return '-';
  }

  const end = endDateStr ? new Date(endDateStr).getTime() : Date.now();
  if (isNaN(end) || end < start) {
    return '0 mnt';
  }

  const diffMs = end - start;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return remHours > 0 ? `${diffDays} hari ${remHours} jam` : `${diffDays} hari`;
  }

  if (diffHours > 0) {
    const remMin = diffMin % 60;
    return remMin > 0 ? `${diffHours} jam ${remMin} mnt` : `${diffHours} jam`;
  }

  return `${Math.max(1, diffMin)} mnt`;
}

/**
 * Format timestamp into Indonesian locale date & time
 */
export function formatDateTimeIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
