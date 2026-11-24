// Largest-remainder allocation conserves integer units (cents, or whole points).
export function allocateUnits(total: number, weights: number[]): number[] {
  const sum = weights.reduce((value, weight) => value + Math.max(0, weight), 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const shares = weights.map((weight) => Math.max(0, weight) * Math.round(total) / sum);
  const units = shares.map(Math.floor);
  let remaining = Math.round(total) - units.reduce((value, unit) => value + unit, 0);
  const order = shares.map((share, index) => ({ index, fraction: share - units[index]! }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const item of order) {
    if (remaining-- <= 0) break;
    units[item.index]! += 1;
  }
  return units;
}
