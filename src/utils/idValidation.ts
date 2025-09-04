/**
 * Utility functions for validating MongoDB ObjectIds and other IDs
 */

// Store a mapping of original IDs to converted MongoDB ObjectIds
const idMappings: Record<string, string> = {};

/**
 * Generate a valid MongoDB ObjectId string
 * @returns A 24-character hexadecimal string that matches MongoDB ObjectId format
 */
export const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
};

/**
 * Checks if a string is a valid MongoDB ObjectId (24-character hexadecimal string)
 * @param id The ID string to check
 * @returns True if the ID is a valid MongoDB ObjectId format, false otherwise
 */
export const isValidMongoObjectId = (id: string | undefined | null): boolean => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates an ID for MongoDB and throws an error if invalid
 * @param id The ID to validate
 * @param entityName Optional name of the entity for the error message
 * @throws Error if the ID is not valid
 */
export const validateMongoObjectId = (id: string | undefined | null, entityName: string = 'item'): void => {
  if (!isValidMongoObjectId(id)) {
    throw new Error(`Invalid ${entityName} ID format: ${id}. Must be a valid MongoDB ObjectId.`);
  }
};

/**
 * Gets a safe ID for API requests - ensures we're using a valid ObjectId
 * @param obj The object containing potential ID properties
 * @returns A valid MongoDB ObjectId or throws an error if none found
 */
export const getSafeMongoId = (obj: any, entityName: string = 'item'): string => {
  const id = obj?._id || obj?.id;
  validateMongoObjectId(id, entityName);
  return id;
};

/**
 * Converts a non-standard ID to a valid MongoDB ObjectId format
 * and stores the mapping for future reference
 * @param originalId The original ID that needs conversion
 * @returns A valid MongoDB ObjectId format string
 */
export const convertToValidObjectId = (originalId: string): string => {
  // Check if we already have a mapping for this ID
  if (idMappings[originalId]) {
    return idMappings[originalId];
  }

  // If already valid, return as is
  if (isValidMongoObjectId(originalId)) {
    return originalId;
  }

  let validId: string;

  // For numeric IDs, create a deterministic conversion
  if (/^\d+$/.test(originalId)) {
    // Convert to hex and pad to 24 characters
    let hexValue = parseInt(originalId).toString(16);
    validId = hexValue.padStart(24, '0').substring(0, 24);
  } else {
    // For non-numeric IDs, create a hash-like deterministic value
    const idBase = `id_${originalId}_fix`;
    validId = Array.from(idBase)
      .reduce((acc, char) => acc + char.charCodeAt(0).toString(16), '')
      .padEnd(24, '0')
      .substring(0, 24);
  }

  // Store mapping for future reference
  idMappings[originalId] = validId;
  
  return validId;
};

/**
 * Gets the original ID from a converted ID if available
 * @param convertedId The converted MongoDB ObjectId
 * @returns The original ID if found, or the converted ID if not
 */
export const getOriginalId = (convertedId: string): string => {
  // Check if this converted ID is in our mappings
  for (const [original, converted] of Object.entries(idMappings)) {
    if (converted === convertedId) {
      return original;
    }
  }
  return convertedId;
};
