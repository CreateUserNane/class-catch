const CLASS_ACCENTS = ['indigo', 'emerald', 'amber', 'slate'] as const;

export function classAccentToken(classId: number): (typeof CLASS_ACCENTS)[number] {
  const index = (Math.max(1, Math.trunc(classId)) - 1) % CLASS_ACCENTS.length;
  return CLASS_ACCENTS[index] ?? 'indigo';
}
