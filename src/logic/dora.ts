import type { Tile } from "../types/tile";
import type { GameMode } from "../types/gameMode";
import { tileToIndex, indexToTile } from "./tileIndex";

function nextIndicatorIndex(index: number, mode: GameMode): number {
  if (index < 27) {
    // 三麻の萬子は1と9しか存在しないため、1⇔9で循環させる
    if (mode === "sanma") {
      return index === 0 ? 8 : 0;
    }
    const suitBase = Math.floor(index / 9) * 9;
    const rankInSuit = index % 9;
    return suitBase + ((rankInSuit + 1) % 9);
  }
  if (index <= 30) {
    // 風牌: 東→南→西→北→東
    return 27 + ((index - 27 + 1) % 4);
  }
  // 三元牌: 白→發→中→白
  return 31 + ((index - 31 + 1) % 3);
}

export function doraFromIndicator(indicator: Tile, mode: GameMode): Tile {
  return indexToTile(nextIndicatorIndex(tileToIndex(indicator), mode));
}

const NORTH_INDEX = 30;

// indicatorsからドラを求め、allTiles内の枚数を数える
// ドラが北(4z)の場合は、抜いた北(抜きドラ)もドラとして加算する
export function countDora(
  allTiles: Tile[],
  indicators: Tile[],
  mode: GameMode,
  nukiDoraCount: number,
): number {
  let count = 0;
  for (const indicator of indicators) {
    const dora = doraFromIndicator(indicator, mode);
    count += allTiles.filter(
      (t) => t.suit === dora.suit && t.rank === dora.rank,
    ).length;
    if (tileToIndex(dora) === NORTH_INDEX) {
      count += nukiDoraCount;
    }
  }
  return count;
}

export function countRedDora(allTiles: Tile[]): number {
  return allTiles.filter((t) => t.isRed).length;
}
