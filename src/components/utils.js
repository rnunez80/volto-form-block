import { saveAs } from 'file-saver';

export const getFieldName = (label, id) => {
  return label?.length > 0
    ? label?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') + '_' + id
    : id;
};

/**
 * Extract search query string from location or window, with hash-routing fallback
 * @param {Object} [location] - React Router location object
 * @returns {string} - Search query string including leading '?' or empty string
 */
export const getSearchString = (location) => {
  if (location?.search) return location.search;
  if (typeof window !== 'undefined' && window.location?.search) {
    return window.location.search;
  }
  const hash =
    location?.hash ||
    (typeof window !== 'undefined' ? window.location?.hash : '');
  if (hash && hash.includes('?')) {
    return hash.substring(hash.indexOf('?'));
  }
  return '';
};

/**
 * Extract GET request parameter matching a form field's ID, field_name, or label
 * @param {Object} field - Form field / subblock object
 * @param {URLSearchParams} searchParams - Parsed URL search parameters
 * @returns {string|null} - Value from query parameter or null
 */
export const getFieldParamValue = (field, searchParams) => {
  if (!field || !searchParams) return null;

  const candidateKeys = [
    getFieldName(field.label, field.id),
    field.field_id ? getFieldName(field.label, field.field_id) : null,
    field.field_name,
    field.id ? String(field.id) : null,
    field.field_id ? String(field.field_id) : null,
    field.label,
  ].filter(Boolean);

  // Exact match
  for (const key of candidateKeys) {
    if (searchParams.has(key)) {
      return searchParams.get(key);
    }
  }

  // Case-insensitive match fallback
  const lowerCandidates = candidateKeys.map((k) => k.toLowerCase());
  for (const [paramKey, paramValue] of searchParams.entries()) {
    if (lowerCandidates.includes(paramKey.toLowerCase())) {
      return paramValue;
    }
  }

  return null;
};

/**
 * Download a file using `filename` specified in `content-disposition` header
 * @param {string} url             - URL to request
 * @param {Object} [fetchProps]    - Optional addtional props to pass to `fetch`
 * @example
 *     await downloadFile('https://example.com/myfile', { credentials: 'include' })
 */
export async function downloadFile(url, fetchProps) {
  try {
    const response = await fetch(url, fetchProps);

    if (!response.ok) {
      throw new Error(response);
    }

    // Extract filename from header
    const filename = response.headers
      .get('content-disposition')
      .split(';')
      .find((n) => n.includes('filename='))
      .replace('filename=', '')
      .trim();
    const blob = await response.blob();

    // Download the file
    saveAs(blob, filename);
  } catch (error) {
    throw new Error(error);
  }
}
