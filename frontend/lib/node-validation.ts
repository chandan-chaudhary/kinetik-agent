
/**
 * Utility functions for node configuration validation
 */

/**
 * Check if a node has all required configuration filled
 */
export function isNodeConfigured(
  data: Record<string, unknown>,
  requiredFields: string[],
): boolean {
  return requiredFields.every((field) => {
    const value = data[field];
    return value !== undefined && value !== null && value !== "";
  });
}

/**
 * Get node description with configuration status
 */
export function getNodeDescription(
  baseDescription: string,
  data: Record<string, unknown>,
  requiredFields: string[],
): string {
  if (requiredFields.length === 0) {
    return baseDescription;
  }

  const isConfigured = isNodeConfigured(data, requiredFields);
  return isConfigured ? baseDescription : `Not configured`;
}

/**
 * Validate required fields and show appropriate error messages
 */
export function validateRequiredFields(
  values: Record<string, unknown>,
  requiredFields: { field: string; label: string }[],
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields
    .filter(({ field }) => {
      const value = values[field];
      return value === undefined || value === null || value === "";
    })
    .map(({ label }) => label);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
