import type { Tile } from "./tile";

export type MeldType = "pon" | "chi" | "minkan" | "ankan";

export interface Meld {
  type: MeldType;
  tiles: Tile[]; // pon/ankan/minkanは同一牌3枚(minkan/ankanは実質4枚目を別管理してもよい), chiは連続3枚
}

// 1つの副露(鳴き)は手牌の選択可能枚数を3枚減らす、というのがメイン画面の仕様
export const MELD_TILE_COUNT = 3;
