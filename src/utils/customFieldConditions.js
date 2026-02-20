/**
 * Evaluate whether a custom field should be visible based on its condition.
 * @param {object} field - The field definition (may have a `condition` property)
 * @param {object} values - Current values for all fields in the section { fieldId: value }
 * @returns {boolean}
 */
export function shouldShowField(field, values) {
  if (!field.condition) return true;
  const { fieldId, operator, value } = field.condition;
  const actual = values[fieldId];
  if (operator === 'equals') return actual === value;
  if (operator === 'not_equals') return actual !== value;
  return true;
}
