// Utility functions for barcode generation and handling

/**
 * Generates a unique barcode based on the provided ID and prefix
 * @param id The unique identifier to encode
 * @param prefix Optional prefix to add to the barcode
 * @returns A barcode string
 */
export function generateBarcode(id: string, prefix = ""): string {
  // Add prefix and pad with zeros to ensure consistent length
  const paddedId = id.toString().padStart(8, "0")
  return `${prefix}${paddedId}`
}

/**
 * Generates a unique barcode for an inventory item
 * @param itemId The item ID
 * @returns A barcode string
 */
export function generateItemBarcode(itemId: string): string {
  // Items use 'I' prefix
  return generateBarcode(itemId.replace(/[^0-9]/g, ""), "I")
}

/**
 * Generates a unique barcode for a borrowing record
 * @param recordId The record ID
 * @returns A barcode string
 */
export function generateBorrowingBarcode(recordId: string): string {
  // Borrowing records use 'B' prefix
  return generateBarcode(recordId.replace(/[^0-9]/g, ""), "B")
}

/**
 * Generates a unique barcode for a user
 * @param userId The user ID (email)
 * @returns A barcode string
 */
export function generateUserBarcode(userId: string): string {
  // Users use 'U' prefix
  // For emails, we'll use a hash function to generate a numeric ID
  const hash = hashString(userId)
  return generateBarcode(hash.toString(), "U")
}

/**
 * Simple hash function to convert a string to a number
 * @param str The string to hash
 * @returns A numeric hash
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Ensure positive number
  return Math.abs(hash)
}

/**
 * Extracts the ID and type from a barcode
 * @param barcode The barcode to parse
 * @returns An object with the ID and type
 */
export function parseBarcode(barcode: string): { id: string; type: "item" | "borrowing" | "user" | "unknown" } {
  if (!barcode || typeof barcode !== "string") {
    return { id: "", type: "unknown" }
  }

  const prefix = barcode.charAt(0)
  const id = barcode.substring(1)

  switch (prefix) {
    case "I":
      return { id, type: "item" }
    case "B":
      return { id, type: "borrowing" }
    case "U":
      return { id, type: "user" }
    default:
      return { id: barcode, type: "unknown" }
  }
}
