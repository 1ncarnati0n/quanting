export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | undefined | null };

function toClassList(input: ClassValue): string[] {
  if (!input) return [];

  if (typeof input === "string" || typeof input === "number") {
    return String(input).trim().split(/\s+/).filter(Boolean);
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => toClassList(item));
  }

  if (typeof input === "object") {
    return Object.entries(input)
      .filter(([, active]) => Boolean(active))
      .map(([key]) => key);
  }

  return [];
}

export function cn(...inputs: ClassValue[]): string {
  const tokens = inputs.flatMap((input) => toClassList(input));
  const seen = new Set<string>();
  const output: string[] = [];
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    output.push(token);
  }
  return output.join(" ");
}
