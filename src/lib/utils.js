/**
 * Extract initials from a full name
 * @param {string} name - The full name
 * @returns {string} - The initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  
  // Handle edge cases
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return '';
  
  // Split by spaces and filter out empty strings
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) return '';
  
  // For single names, return first two characters if available
  if (words.length === 1) {
    return trimmedName.slice(0, 2).toUpperCase();
  }
  
  // For multiple words, take first letter of each word
  const initials = words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3); // Limit to 3 initials max
    
  return initials;
}
