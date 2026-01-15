/**
 * Luhn Modulo N Algorithm Implementation
 * Used for generating and validating unique device IDs with check digits
 * 
 * Supports hexadecimal characters: 0-9, A-F
 */

const HEX_CHARSET = "0123456789ABCDEF";

/**
 * Calculate Luhn check digit for a given string using modulo N
 * @param input - Input string (without check digit)
 * @param charset - Character set to use (default: HEX)
 * @returns Check character
 */
export function calculateLuhnCheckDigit(
  input: string,
  charset: string = HEX_CHARSET
): string {
  const n = charset.length;
  let sum = 0;
  let factor = 2;

  // Process from right to left
  for (let i = input.length - 1; i >= 0; i--) {
    const char = input[i];
    const codePoint = charset.indexOf(char.toUpperCase());

    if (codePoint === -1) {
      throw new Error(`Invalid character '${char}' not in charset`);
    }

    let addend = factor * codePoint;

    // Luhn algorithm: if addend >= n, sum its digits
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / n) + (addend % n);
    sum += addend;
  }

  // Calculate check digit
  const remainder = sum % n;
  const checkCodePoint = (n - remainder) % n;

  return charset[checkCodePoint];
}

/**
 * Validate a string with Luhn check digit
 * @param input - Input string (with check digit at the end)
 * @param charset - Character set to use
 * @returns True if valid
 */
export function validateLuhn(
  input: string,
  charset: string = HEX_CHARSET
): boolean {
  if (!input || input.length < 2) return false;

  const data = input.slice(0, -1);
  const checkDigit = input.slice(-1);

  try {
    const calculatedCheckDigit = calculateLuhnCheckDigit(data, charset);
    return calculatedCheckDigit === checkDigit.toUpperCase();
  } catch {
    return false;
  }
}

/**
 * Generate a random hexadecimal string of specified length
 * @param length - Length of the string to generate
 * @returns Random hex string
 */
export function generateRandomHex(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += HEX_CHARSET[Math.floor(Math.random() * HEX_CHARSET.length)];
  }
  return result;
}

/**
 * Generate a unique HEX code with Luhn check digit
 * @param length - Total length including check digit (default: 6)
 * @returns HEX string with check digit
 */
export function generateUniqueHexWithLuhn(length: number = 6): string {
  if (length < 2) {
    throw new Error("Length must be at least 2 (data + check digit)");
  }

  // Generate random hex string (length - 1 for the check digit)
  const dataLength = length - 1;
  const randomData = generateRandomHex(dataLength);

  // Calculate and append check digit
  const checkDigit = calculateLuhnCheckDigit(randomData);

  return randomData + checkDigit;
}

/**
 * Generate a device ID in the format: MASH-{MODEL}{VERSION}-{LOC}{YY}-{HEX}
 * Example: MASH-A1-CAL25-D5A91F
 * 
 * @param model - Model type (A=Alpha, B=Beta, R=Release)
 * @param version - Version number (1-99)
 * @param location - Location code (3 letters)
 * @param year - Year (2 digits)
 * @returns Complete device ID with Luhn-validated HEX code
 */
export function generateDeviceId(
  model: "A" | "B" | "R",
  version: number,
  location: string,
  year?: number
): string {
  // Validate inputs
  if (!["A", "B", "R"].includes(model)) {
    throw new Error("Model must be A (Alpha), B (Beta), or R (Release)");
  }

  if (version < 1 || version > 99) {
    throw new Error("Version must be between 1 and 99");
  }

  // Process location: take first 3 letters, uppercase
  const locationCode = location
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .padEnd(3, "X")
    .slice(0, 3);

  // Get current year if not provided
  const currentYear = year || new Date().getFullYear();
  const yearCode = String(currentYear).slice(-2);

  // Generate unique HEX code with Luhn check digit (6 characters total)
  const hexCode = generateUniqueHexWithLuhn(6);

  // Assemble device ID
  const deviceId = `MASH-${model}${version}-${locationCode}${yearCode}-${hexCode}`;

  return deviceId;
}

/**
 * Parse a device ID to extract its components
 * @param deviceId - Device ID string
 * @returns Parsed components or null if invalid
 */
export function parseDeviceId(deviceId: string): {
  brand: string;
  model: string;
  version: number;
  location: string;
  year: string;
  hexCode: string;
  isValid: boolean;
} | null {
  // Expected format: MASH-A1-CAL25-D5A91F
  const pattern = /^MASH-([ABR])(\d{1,2})-([A-Z]{3})(\d{2})-([0-9A-F]{6})$/i;
  const match = deviceId.match(pattern);

  if (!match) return null;

  const [, model, versionStr, location, year, hexCode] = match;
  const version = parseInt(versionStr, 10);

  // Validate Luhn check digit
  const isValid = validateLuhn(hexCode.toUpperCase());

  return {
    brand: "MASH",
    model,
    version,
    location,
    year,
    hexCode: hexCode.toUpperCase(),
    isValid,
  };
}
