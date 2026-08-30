import type { Tile, Suit } from "../types/tile";
import type { Meld } from "../types/meld";

interface UsageSource {
  concealedTiles: Tile[];
  melds: Meld[];
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
  nukiDoraCount?: number;
}

// 手牌・副露・ドラ表示牌・裏ドラ表示牌・抜きドラをすべて「物理的に使用済みの牌」として1つの配列にまとめる
export function buildGlobalUsedTiles(source: UsageSource): Tile[] {
  const nukiTiles: Tile[] = Array.from(
    { length: source.nukiDoraCount ?? 0 },
    () => ({
      suit: "z" as Suit,
      rank: 4, // 北
    }),
  );

  return [
    ...source.concealedTiles,
    ...source.melds.flatMap((m) => m.tiles),
    ...source.doraIndicators,
    ...source.uraDoraIndicators,
    ...nukiTiles,
  ];
}

export function countTileKind(tiles: Tile[], suit: Suit, rank: number): number {
  return tiles.filter((t) => t.suit === suit && t.rank === rank).length;
}
