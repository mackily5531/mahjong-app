import { canDecomposeSets } from "./handDecomposition";

// 通常形: 副露分を除いた面子数(4 - meldsCount)+雀頭1組に分解できるか
export function isStandardWin(counts: number[], meldsCount: number): boolean {
  const neededSets = 4 - meldsCount;
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      const rest = counts.slice();
      rest[i] -= 2;
      if (canDecomposeSets(rest, neededSets)) return true;
    }
  }
  return false;
}

// 七対子: 副露があると成立しない。14枚が「ちょうど2枚ずつ×7種類」であること
export function isSevenPairs(counts: number[]): boolean {
  let pairKinds = 0;
  for (const c of counts) {
    if (c === 0) continue;
    if (c !== 2) return false;
    pairKinds++;
  }
  return pairKinds === 7;
}

// 国士無双: 副露があると成立しない。老頭牌+字牌の13種類が最低1枚ずつ、うち1種類だけ2枚
const KOKUSHI_INDICES = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
const KOKUSHI_SET = new Set(KOKUSHI_INDICES);

export function isKokushi(counts: number[]): boolean {
  let total = 0;
  for (let i = 0; i < 34; i++) {
    if (counts[i] === 0) continue;
    if (!KOKUSHI_SET.has(i)) return false;
    total += counts[i];
  }
  if (total !== 14) return false;
  return KOKUSHI_INDICES.every((i) => counts[i] >= 1);
}
