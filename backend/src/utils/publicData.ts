/**
 * Retire de toute réponse publique les liens vers des comptes utilisateurs (`userId`) :
 * - ceux des candidats, reconnus à leur forme (ils portent `name` et `positionId`) ;
 * - celui de l'organisateur du scrutin (objet `admin`).
 * Les dates et les autres objets sont laissés intacts.
 */
export const stripCandidateAccounts = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripCandidateAccounts(item)) as unknown as T;
  }
  if (value instanceof Date || value === null || typeof value !== 'object') {
    return value;
  }
  const source = value as Record<string, unknown>;
  const isCandidate = 'name' in source && 'positionId' in source;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if (isCandidate && key === 'userId') continue;
    if (key === 'admin' && child && typeof child === 'object' && !Array.isArray(child)) {
      const { userId: _hidden, ...rest } = child as Record<string, unknown>;
      result[key] = stripCandidateAccounts(rest);
      continue;
    }
    result[key] = stripCandidateAccounts(child);
  }
  return result as T;
};
