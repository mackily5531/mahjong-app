import type { Tile } from "../types/tile";
import type { GameMode } from "../types/gameMode";
import type { Meld } from "../types/meld";
import { buildCounts, indexToTile } from "./tileIndex";
import { isStandardWin, isSevenPairs, isKokushi } from "./winCheck";

// このモードで実在するインデックス一覧(三麻は萬子2〜8[index 1-7]を除く)
function validIndices(mode: GameMode): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 34; i++) {
    if (mode === "sanma" && i >= 1 && i <= 7) continue;
    indices.push(i);
  }
  return indices;
}

// concealedTiles(副露を除いた手牌)に、どの牌が来れば和了できるかを列挙する
export function findWinningTiles(
  concealedTiles: Tile[],
  melds: Meld[],
  mode: GameMode,
): Tile[] {
  const meldsCount = melds.length;
  const expectedConcealedCount = 13 - meldsCount * 3;
  if (concealedTiles.length !== expectedConcealedCount) return [];

  const baseCounts = buildCounts(concealedTiles);
  const winningIndices: number[] = [];

  for (const idx of validIndices(mode)) {
    if (baseCounts[idx] >= 4) continue; // 現物5枚目は存在しない

    const counts = baseCounts.slice();
    counts[idx]++;

    const win =
      isStandardWin(counts.slice(), meldsCount) ||
      (meldsCount === 0 && isSevenPairs(counts)) ||
      (meldsCount === 0 && isKokushi(counts));

    if (win) winningIndices.push(idx);
  }

  return winningIndices.map(indexToTile);
}
