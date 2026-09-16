/** Reads a single value from `searchParams`, which may be `string | string[]`. */
export function firstParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}
