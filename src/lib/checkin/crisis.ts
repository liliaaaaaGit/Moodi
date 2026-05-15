const CRISIS_PATTERNS: RegExp[] = [
  /nicht mehr leben/i,
  /umbringen/i,
  /suizid/i,
  /selbstmord/i,
  /mich verletzen/i,
  /mich umbringen/i,
  /schluss machen mit (?:mir|meinem leben)/i,
  /kann nicht mehr/i,
  /will nicht mehr/i,
];

export function hasCrisisTriggers(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isCrisisLevel(level: number): boolean {
  return level >= 9;
}

export function isCrisis(input: { level: number; text: string }): boolean {
  return (
    isCrisisLevel(input.level) ||
    (input.text.trim().length > 0 && hasCrisisTriggers(input.text))
  );
}
