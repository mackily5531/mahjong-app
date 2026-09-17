import type { Tile, Suit } from "../types/tile";

const SUIT_OFFSET: Record<Suit, number> = { m: 0, p: 9, s: 18, z: 27 };

// 牌を0-33のインデックスに変換する
export function tileToIndex(tile: Tile): number {
  return SUIT_OFFSET[tile.suit] + (tile.rank - 1);
}

// インデックスから牌に変換する
export function indexToTile(index: number): Tile {
  const suit: Suit =
    index < 9 ? "m" : index < 18 ? "p" : index < 27 ? "s" : "z";
  const rank = index - SUIT_OFFSET[suit] + 1;
  return { suit, rank };
}

// 牌の配列からインデックスの配列を作る
export function buildCounts(tiles: Tile[]): number[] {
  const counts = new Array(34).fill(0);
  for (const t of tiles) counts[tileToIndex(t)]++;
  return counts;
}
