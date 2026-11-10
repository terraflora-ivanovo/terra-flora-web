/**
 * Builds a Russian phone mask `+7 (999) 000-00-00` from raw digit input.
 * Strips a leading 7/8 country digit and keeps at most 10 local digits.
 */
export function maskRuPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  let result = "+7";
  if (digits.length === 0) return result;
  result += ` (${digits.slice(0, 3)}`;
  if (digits.length < 3) return result;
  result += `) ${digits.slice(3, 6)}`;
  if (digits.length < 6) return result;
  result += `-${digits.slice(6, 8)}`;
  if (digits.length < 8) return result;
  return `${result}-${digits.slice(8, 10)}`;
}

/** Extracts up to 10 local digits from a masked or raw phone string. */
export function localPhoneDigits(masked: string): string {
  let digits = masked.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export { formatPriceRub, publicImageUrl } from "@/lib/product-image";
