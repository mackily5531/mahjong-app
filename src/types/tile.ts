// 牌の種類: m=萬子, p=筒子, s=索子, z=字牌
export type Suit = "m" | "p" | "s" | "z";

// z(字牌)のrank対応: 1=東 2=南 3=西 4=北 5=白 6=發 7=中
export interface Tile {
  suit: Suit;
  rank: number; // m/p/s: 1-9, z: 1-7
  isRed?: boolean; // 赤ドラ(5m/5p/5sのみtrueになりうる)
}

// 牌を一意な文字列キーに変換(Reactのkeyや比較に使う)
export function tileKey(tile: Tile): string {
  return `${tile.suit}${tile.rank}${tile.isRed ? "r" : ""}`;
}

// 赤ドラかどうかを無視した「同じ牌か」の判定(組み合わせ・順子判定用)
export function isSameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export const SUIT_LABEL: Record<Suit, string> = {
  m: "萬",
  p: "筒",
  s: "索",
  z: "",
};

export const HONOR_LABEL: Record<number, string> = {
  1: "東",
  2: "南",
  3: "西",
  4: "北",
  5: "白",
  6: "發",
  7: "中",
};

export function tileLabel(tile: Tile): string {
  if (tile.suit === "z") return HONOR_LABEL[tile.rank] ?? "?";
  return `${tile.rank}${SUIT_LABEL[tile.suit]}`;
}
