import type { Meld } from "../types/meld";
import { tileToIndex } from "./tileIndex";

export interface Group {
  type: "sequence" | "triplet";
  startIndex: number; // 順子は最小index、刻子はそのindex
  isOpen: boolean;
  isKan?: boolean;
}

export interface Decomposition {
  groups: Group[]; // 濃厚(手牌)側の分解結果
  pairIndex: number;
}

function decomposeAll(counts: number[], setsNeeded: number): Group[][] {
  if (setsNeeded === 0) {
    return counts.every((c) => c === 0) ? [[]] : [];
  }
  const i = counts.findIndex((c) => c > 0);
  if (i === -1) return [];
  const results: Group[][] = [];

  if (counts[i] >= 3) {
    counts[i] -= 3;
    for (const rest of decomposeAll(counts, setsNeeded - 1)) {
      results.push([
        { type: "triplet", startIndex: i, isOpen: false },
        ...rest,
      ]);
    }
    counts[i] += 3;
  }

  if (i < 27) {
    const rankInSuit = i % 9;
    if (rankInSuit <= 6) {
      const i2 = i + 1;
      const i3 = i + 2;
      if (counts[i2] > 0 && counts[i3] > 0) {
        counts[i]--;
        counts[i2]--;
        counts[i3]--;
        for (const rest of decomposeAll(counts, setsNeeded - 1)) {
          results.push([
            { type: "sequence", startIndex: i, isOpen: false },
            ...rest,
          ]);
        }
        counts[i]++;
        counts[i2]++;
        counts[i3]++;
      }
    }
  }

  return results;
}

// 副露を除いた「手の内」の counts から、あり得る分解パターンをすべて列挙する
// (同じ手でも複数の読み方があるため、後で役の合計飜数が最大になる分解を選ぶ)
export function decomposeConcealedPart(
  counts: number[],
  setsNeeded: number,
): Decomposition[] {
  const decompositions: Decomposition[] = [];
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const groupSets = decomposeAll(counts, setsNeeded);
      for (const groups of groupSets) {
        decompositions.push({ groups, pairIndex: i });
      }
      counts[i] += 2;
    }
  }
  return decompositions;
}

export function meldToGroup(meld: Meld): Group {
  const indices = meld.tiles.map(tileToIndex);
  if (meld.type === "chi") {
    return { type: "sequence", startIndex: Math.min(...indices), isOpen: true };
  }
  const isKan = meld.type === "minkan" || meld.type === "ankan";
  return {
    type: "triplet",
    startIndex: indices[0],
    isOpen: meld.type !== "ankan",
    isKan,
  };
}

export function groupIndices(group: Group): number[] {
  return group.type === "sequence"
    ? [group.startIndex, group.startIndex + 1, group.startIndex + 2]
    : [group.startIndex, group.startIndex, group.startIndex];
}
