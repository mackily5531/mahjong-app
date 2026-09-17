import type { Suit, Tile } from "./tile";
import type { GameMode } from "./gameMode";

// 牌の種類一覧を生成する
export function generateTileKinds(mode: GameMode): Tile[] {
  const kinds: Tile[] = [];
  const numberSuits: Suit[] = ["m", "p", "s"];

  for (const suit of numberSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      // 三麻: 萬子の2〜8は無し
      if (mode === "sanma" && suit === "m" && rank >= 2 && rank <= 8) continue;

      kinds.push({ suit, rank, isRed: false });
      if (rank === 5) {
        kinds.push({ suit, rank, isRed: true }); // 赤ドラは別枠の項目として用意
      }
    }
  }

  for (let rank = 1; rank <= 7; rank++) {
    kinds.push({ suit: "z", rank, isRed: false });
  }

  return kinds;
}
