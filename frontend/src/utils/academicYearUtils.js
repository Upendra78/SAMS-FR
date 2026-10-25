/**
 * Shared Academic Year & Session Utilities
 *
 * Ensures all course offerings and course assignments represent a single 1-year
 * academic session (e.g. 2025–2026) instead of student batch admission cohorts
 * or multi-year ranges (e.g. 2026–2030).
 */

/**
 * Validates if a string represents a 1-year academic session of two consecutive years.
 * E.g. "2025-2026", "2025 - 2026", "2025–2026", "2025-26" -> true.
 * "2026-2030" -> false.
 *
 * @param {string|null|undefined} val
 * @returns {boolean}
 */
export function isSingleAcademicSession(val) {
  if (!val) return false;
  const s = String(val).trim().replace(/\s*[\u2013\u2014-]\s*/, "-");
  const fullMatch = s.match(/^(\d{4})-(\d{4})$/);
  if (fullMatch) {
    const start = Number(fullMatch[1]);
    const end = Number(fullMatch[2]);
    return end - start === 1;
  }
  const shortMatch = s.match(/^(\d{4})-(\d{2})$/);
  if (shortMatch) {
    const start = Number(shortMatch[1]);
    const end = Number(`${shortMatch[1].slice(0, 2)}${shortMatch[2]}`);
    return end - start === 1;
  }
  return false;
}

/**
 * Normalizes an academic year value to the canonical API format "YYYY-YYYY".
 * Rejects multi-year cohort strings unless fallback is allowed.
 *
 * @param {string|null|undefined} val
 * @returns {string} E.g. "2025-2026"
 */
export function toCanonicalAcademicYear(val) {
  if (!val) return "";
  const s = String(val).trim().replace(/\s*[\u2013\u2014-]\s*/g, "-");
  const shortMatch = s.match(/^(\d{4})-(\d{2})$/);
  if (shortMatch) {
    const century = shortMatch[1].slice(0, 2);
    return `${shortMatch[1]}-${century}${shortMatch[2]}`;
  }
  const fullMatch = s.match(/^(\d{4})-(\d{4})$/);
  if (fullMatch) {
    return `${fullMatch[1]}-${fullMatch[2]}`;
  }
  const singleMatch = s.match(/^(\d{4})$/);
  if (singleMatch) {
    const start = Number(singleMatch[1]);
    return `${start}-${start + 1}`;
  }
  return s;
}

/**
 * Formats an academic year or offering session for UI presentation.
 * Uses an en-dash (e.g. "2025–2026").
 * If a multi-year cohort range is encountered (e.g. "2026-2030" or "2026 -2032"),
 * converts it to the 1-year teaching academic session derived from semester or cohort start.
 *
 * @param {string|null|undefined} val - Raw academic year or cohort string
 * @param {number|string|null} [semester=null] - Progression semester (1-8)
 * @returns {string} E.g. "2025–2026"
 */
export function formatAcademicYear(val, semester = null) {
  if (val === null || val === undefined || String(val).trim() === "") {
    return "—";
  }

  const s = String(val).trim().replace(/\s*[\u2013\u2014-]\s*/g, "-");

  // 1. Check if it's already a 1-year session YYYY-YYYY
  const singleMatch = s.match(/^(\d{4})-(\d{4})$/);
  if (singleMatch) {
    const start = Number(singleMatch[1]);
    const end = Number(singleMatch[2]);
    if (end - start === 1) {
      return `${start}–${end}`;
    }

    // It's a multi-year cohort range (e.g. 2026-2030)
    const semNum = Number(semester);
    const yearOffset = Number.isFinite(semNum) && semNum >= 1 ? Math.floor((semNum - 1) / 2) : 0;
    const sessionStart = start + yearOffset;
    return `${sessionStart}–${sessionStart + 1}`;
  }

  // 2. Check YYYY-YY (e.g. 2025-26)
  const shortMatch = s.match(/^(\d{4})-(\d{2})$/);
  if (shortMatch) {
    const start = Number(shortMatch[1]);
    const end = Number(`${shortMatch[1].slice(0, 2)}${shortMatch[2]}`);
    if (end - start === 1) {
      return `${start}–${end}`;
    }
  }

  // 3. Check single 4-digit year (e.g. "2026")
  const singleYearMatch = s.match(/^(\d{4})$/);
  if (singleYearMatch) {
    const start = Number(singleYearMatch[1]);
    const semNum = Number(semester);
    const yearOffset = Number.isFinite(semNum) && semNum >= 1 ? Math.floor((semNum - 1) / 2) : 0;
    const sessionStart = start + yearOffset;
    return `${sessionStart}–${sessionStart + 1}`;
  }

  return s;
}

/**
 * Returns a list of consecutive 1-year academic sessions for dropdown selectors.
 * E.g. 2023–2024, 2024–2025, 2025–2026, 2026–2027, 2027–2028.
 *
 * @param {number|null} [centerYear=null]
 * @param {number} [pastYears=2]
 * @param {number} [futureYears=3]
 * @returns {Array<{ value: string, label: string }>}
 */
export function getAcademicYearOptions(centerYear = null, pastYears = 2, futureYears = 3) {
  const current = centerYear || new Date().getFullYear();
  const startYear = current - pastYears;
  const endYear = current + futureYears;
  const options = [];

  for (let y = startYear; y <= endYear; y++) {
    const val = `${y}-${y + 1}`;
    const lbl = `${y}–${y + 1}`;
    options.push({ value: val, label: lbl });
  }

  return options;
}

/**
 * Extracts the 4-digit admission cohort start year from a batch or session string.
 * E.g. "2024-2028" -> "2024", "2024" -> "2024", "2025-2026" -> "2025".
 *
 * @param {string|null|undefined} val
 * @returns {string} E.g. "2024"
 */
export function extractCohortStartYear(val) {
  if (!val) return "";
  const s = String(val).trim();
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : "";
}
