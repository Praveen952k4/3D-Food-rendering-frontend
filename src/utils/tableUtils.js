/**
 * Utility functions for table ordering and normalization.
 */

/**
 * Natural numerical sort for table items by table number.
 * Ensures Table 2 appears before Table 10, handling numbers like '1', '2', '10', 'T-1', etc.
 *
 * @param {Array} tables - Array of table objects with a `number` property.
 * @returns {Array} New sorted array.
 */
export const sortTablesByNumber = (tables) => {
  if (!Array.isArray(tables)) return [];
  return [...tables].sort((a, b) => {
    const rawA = a?.number != null ? String(a.number).trim() : '';
    const rawB = b?.number != null ? String(b.number).trim() : '';
    const numA = parseInt(rawA.replace(/\D/g, ''), 10);
    const numB = parseInt(rawB.replace(/\D/g, ''), 10);

    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return rawA.localeCompare(rawB, undefined, { numeric: true, sensitivity: 'base' });
  });
};
