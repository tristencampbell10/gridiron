/**
 * CSV Exporter & Formula Injection Sanitization Utility
 * Enforces strict Formula Injection (CSV Injection) mitigation
 * by prepending a single quote (') to any string starting with:
 * '=', '+', '-', '@', '\t', or '\r'
 */

/**
 * Sanitizes a single cell value to protect against CSV/formula injection in spreadsheet software.
 * 
 * @param {any} value - Cell value to sanitize
 * @returns {string} Sanitized string value
 */
export function sanitizeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  
  // Strict regex check for formula injection characters
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  
  return str;
}

// Alias for backwards compatibility
export const sanitizeCsvCell = sanitizeCsvField;

/**
 * Formats an array of cell values into a RFC-4180 compliant CSV line
 * 
 * @param {Array<any>} fields - Array of raw cell values
 * @returns {string} Formatted, sanitized CSV row
 */
export function formatCsvRow(fields) {
  return fields.map(field => {
    const sanitized = sanitizeCsvField(field);
    // Escape quotes and wrap in quotes if value contains comma, quote, or newline
    if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n') || sanitized.includes('\r')) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  }).join(',');
}

/**
 * Formats lineup and player roster data into a formula-sanitized CSV string
 * and triggers a browser file download.
 * 
 * @param {object|Array} lineup - Lineup object { name, formation, personal_rating, slots } or array of slot items
 * @param {Array} [players] - Optional player pool for lookups
 * @param {object} [options] - Optional export configurations (filename, download)
 * @returns {string} The full formula-sanitized CSV string
 */
export function exportLineupToCSV(lineup, players = [], options = {}) {
  const lineupName = (lineup && lineup.name) ? lineup.name : 'Gridiron Roster 2026';
  const formationName = (lineup && lineup.formation) ? lineup.formation : 'Custom Formation';
  const personalRating = (lineup && lineup.personal_rating !== undefined) ? `${lineup.personal_rating} Stars` : '5 Stars';

  // Normalize slots list
  let slots = [];
  if (Array.isArray(lineup)) {
    slots = lineup;
  } else if (lineup && Array.isArray(lineup.slots)) {
    slots = lineup.slots;
  }

  const headers = [
    'Lineup Name',
    'Formation Preset',
    'Personal Rating',
    'Slot #',
    'Slot Code',
    'Eligible Positions',
    'Player Name',
    'Position',
    'Team',
    'Jersey Number',
    'Performance Rating (0-5)',
    'Fantasy Points',
    'Eligibility Status'
  ];

  const rows = slots.map((item, idx) => {
    // Resolve player object if only id/reference was stored
    let player = item.player;
    if (!player && item.playerId && Array.isArray(players)) {
      player = players.find(p => p.id === item.playerId);
    }

    const slotName = item.slotName || item.slot || `Slot ${idx + 1}`;
    const eligiblePos = item.eligible ? item.eligible.join('/') : (item.eligiblePos || 'ANY');
    const playerName = player ? player.name : (item.playerName || 'UNASSIGNED');
    const pos = player ? (player.pos || player.position) : (item.pos || '--');
    const team = player ? (player.teamAbbr || player.team) : (item.team || '--');
    const num = player ? (player.jersey_number ?? player.number) : (item.jersey_number || '--');
    const rating = player ? Number(player.player_performance_rating || 0).toFixed(2) : (item.rating ? Number(item.rating).toFixed(2) : '0.00');
    const fpts = player ? (player.fantasyPts ?? 0) : (item.fantasyPts ?? '0.0');

    // Validation status
    let status = 'VALID';
    if (!player && playerName === 'UNASSIGNED') {
      status = 'EMPTY';
    } else if (item.eligible && player) {
      const pPos = player.pos || player.position;
      status = item.eligible.includes(pPos) ? 'VALID' : 'INVALID_POSITION';
    }

    return [
      lineupName,
      formationName,
      personalRating,
      idx + 1,
      slotName,
      eligiblePos,
      playerName,
      pos,
      team,
      num,
      rating,
      fpts,
      status
    ];
  });

  // Construct complete CSV payload
  const csvContent = [
    formatCsvRow(headers),
    ...rows.map(row => formatCsvRow(row))
  ].join('\r\n');

  // Trigger browser download if running in client environment
  const shouldDownload = options.download !== false;
  if (shouldDownload && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeFilename = (options.filename || lineupName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `${safeFilename}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('CSV browser trigger notice:', e);
    }
  }

  return csvContent;
}

export default exportLineupToCSV;
