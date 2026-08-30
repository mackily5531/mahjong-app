import type { Tile, Suit } from "../types/tile";
import type { GameMode } from "../types/gameMode";
import type { Meld, MeldType } from "../types/meld";

export function meldSlotBaseTiles(type: MeldType, mode: GameMode): Tile[] {
  const numberSuits: Suit[] = ["m", "p", "s"];
  const bases: Tile[] = [];

  if (type === "chi") {
    if (mode === "sanma") return []; // 三麻はチー無し(雀魂ルール)
    for (const suit of numberSuits) {
      for (let rank = 1; rank <= 7; rank++) {
        bases.push({ suit, rank });
      }
    }
    return bases;
  }

  for (const suit of numberSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      if (mode === "sanma" && suit === "m" && rank >= 2 && rank <= 8) continue;
      bases.push({ suit, rank });
    }
  }
  for (let rank = 1; rank <= 7; rank++) {
    bases.push({ suit: "z", rank });
  }
  return bases;
}

function hasRedFive(type: MeldType, base: Tile): boolean {
  if (base.suit === "z") return false; // 字牌には赤ドラが存在しない
  if (type === "chi") return base.rank >= 3 && base.rank <= 5; // 3-4-5,4-5-6,5-6-7のみ5を含む
  return base.rank === 5;
}

// 基準牌から実際の副露牌を組み立てる
// ankanは表示上「裏・表・表・裏」の並びになるため、赤5は index2(3枚目)に配置する
export function buildMeldTiles(
  type: MeldType,
  base: Tile,
  includeRed: boolean,
): Tile[] {
  if (type === "chi") {
    return [0, 1, 2].map((offset) => {
      const rank = base.rank + offset;
      return { suit: base.suit, rank, isRed: includeRed && rank === 5 };
    });
  }

  if (type === "pon") {
    return Array.from({ length: 3 }, (_, i) => ({
      suit: base.suit,
      rank: base.rank,
      isRed: includeRed && base.rank === 5 && i === 0,
    }));
  }

  if (type === "minkan") {
    return Array.from({ length: 4 }, (_, i) => ({
      suit: base.suit,
      rank: base.rank,
      isRed: includeRed && base.rank === 5 && i === 0,
    }));
  }

  // ankan
  return Array.from({ length: 4 }, (_, i) => ({
    suit: base.suit,
    rank: base.rank,
    isRed: includeRed && base.rank === 5 && i === 2,
  }));
}

export interface MeldOption {
  type: MeldType;
  base: Tile;
  includeRed: boolean;
  tiles: Tile[];
}

// パレットに並べる「選択肢カード」を全パターン生成する
export function generateMeldOptions(
  type: MeldType,
  mode: GameMode,
): MeldOption[] {
  const bases = meldSlotBaseTiles(type, mode);
  const options: MeldOption[] = [];

  for (const base of bases) {
    const canHaveRed = hasRedFive(type, base);

    if (type === "pon" || type === "chi") {
      options.push({
        type,
        base,
        includeRed: false,
        tiles: buildMeldTiles(type, base, false),
      });
      if (canHaveRed) {
        options.push({
          type,
          base,
          includeRed: true,
          tiles: buildMeldTiles(type, base, true),
        });
      }
    } else {
      // minkan / ankan: 赤5がある場合は自動で含める1パターンのみ
      options.push({
        type,
        base,
        includeRed: canHaveRed,
        tiles: buildMeldTiles(type, base, canHaveRed),
      });
    }
  }

  return options;
}

// この副露を追加しても、同じ牌(赤含む)が物理的に4枚を超えないか、赤5が2枚以上にならないか
export function canPlaceMeld(tiles: Tile[], usedTiles: Tile[]): boolean {
  const addCounts = new Map<string, number>();
  const addRedCounts = new Map<string, number>();
  for (const t of tiles) {
    const key = `${t.suit}${t.rank}`;
    addCounts.set(key, (addCounts.get(key) ?? 0) + 1);
    if (t.isRed) addRedCounts.set(key, (addRedCounts.get(key) ?? 0) + 1);
  }

  for (const [key, addCount] of addCounts) {
    const suit = key[0] as Suit;
    const rank = Number(key.slice(1));

    const current = usedTiles.filter(
      (t) => t.suit === suit && t.rank === rank,
    ).length;
    if (current + addCount > 4) return false;

    const addRed = addRedCounts.get(key) ?? 0;
    if (addRed > 0) {
      const currentRed = usedTiles.filter(
        (t) => t.suit === suit && t.rank === rank && t.isRed,
      ).length;
      if (currentRed + addRed > 1) return false; // 赤5は各色1枚のみ
    }
  }
  return true;
}

export function meldLabel(meld: Meld): string {
  const typeLabel: Record<MeldType, string> = {
    pon: "ポン",
    chi: "チー",
    minkan: "明槓",
    ankan: "暗槓",
  };
  return typeLabel[meld.type];
}

export type MeldDisplayItem = { kind: "tile"; tile: Tile } | { kind: "back" };

// 表示用の並び("裏"を挟むかどうか)を組み立てる
export function meldDisplayItems(
  type: MeldType,
  tiles: Tile[],
): MeldDisplayItem[] {
  if (type !== "ankan") {
    return tiles.map((tile) => ({ kind: "tile", tile }));
  }
  const [, t1, t2] = tiles;
  return [
    { kind: "back" },
    { kind: "tile", tile: t1 },
    { kind: "tile", tile: t2 },
    { kind: "back" },
  ];
}
