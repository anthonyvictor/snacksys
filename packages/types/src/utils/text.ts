export function capitalize(str: string): string {
  if (!str) return ""; // Handle empty or null/undefined input

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
