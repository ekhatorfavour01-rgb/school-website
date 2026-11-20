'use strict';

/** Removes HTML tags and control characters (keeps normal text, tabs and new lines). */
function stripTags(input) {
  let value = String(input ?? '');
  // Repeat until nothing changes, so "<<b>script>" cannot sneak a tag through.
  let previous;
  do {
    previous = value;
    value = value.replace(/<[^>]*>/g, '');
  } while (value !== previous);
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** One line of text: collapse every run of spaces, tabs and new lines into one space. */
function normalizeSpaces(input) {
  return String(input ?? '').replace(/\s+/g, ' ').trim();
}

/** Longer text: keep paragraphs but tidy the spacing. */
function normalizeMultiline(input) {
  return String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Makes text safe to put inside a RegExp (used for search boxes). */
function escapeRegex(input) {
  return String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * One cell of a CSV file. Quotes the value and neutralises spreadsheet formulas
 * (a cell starting with = + - @ could run a formula when opened in Excel).
 */
function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function truncate(input, max) {
  const text = String(input ?? '');
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}â¦`;
}

module.exports = { stripTags, normalizeSpaces, normalizeMultiline, escapeHtml, escapeRegex, csvCell, truncate };