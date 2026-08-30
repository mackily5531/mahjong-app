// counts配列を直接書き換えながらバックトラックする。呼び出し側は複製したcountsを渡すこと
export function canDecomposeSets(
  counts: number[],
  setsNeeded: number,
): boolean {
  if (setsNeeded === 0) return counts.every((c) => c === 0);

  const i = counts.findIndex((c) => c > 0);
  if (i === -1) return false; // 牌が余っているのにsetsNeededが0でない

  // 刻子(同じ牌3枚)
  if (counts[i] >= 3) {
    counts[i] -= 3;
    if (canDecomposeSets(counts, setsNeeded - 1)) {
      counts[i] += 3;
      return true;
    }
    counts[i] += 3;
  }

  // 順子(萬子・筒子・索子のみ、同じ色の中に収まる範囲のみ)
  if (i < 27) {
    const rankInSuit = i % 9; // 0-8 = rank1-9
    if (rankInSuit <= 6) {
      const i2 = i + 1;
      const i3 = i + 2;
      if (counts[i2] > 0 && counts[i3] > 0) {
        counts[i]--;
        counts[i2]--;
        counts[i3]--;
        if (canDecomposeSets(counts, setsNeeded - 1)) {
          counts[i]++;
          counts[i2]++;
          counts[i3]++;
          return true;
        }
        counts[i]++;
        counts[i2]++;
        counts[i3]++;
      }
    }
  }

  return false;
}
