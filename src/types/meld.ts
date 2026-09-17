import type { Tile } from "./tile";

export type MeldType = "pon" | "chi" | "minkan" | "ankan";

export interface Meld {
  type: MeldType;
  tiles: Tile[]; // pon/ankan/minkanは同一牌3枚/4枚,chiは連続3枚
}

// 1副露毎に手牌の選択可能枚数を3枚減らす
export const MELD_TILE_COUNT = 3;
