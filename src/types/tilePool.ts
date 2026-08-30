import type { Suit, Tile } from "./tile";
import type { GameMode } from "./gameMode";

// UIの牌選択パレットに表示する「牌の種類」一覧を生成する
// (同じ種類を最大何枚選べるかはUI側で別途カウント管理する)
export function generateTileKinds(mode: GameMode): Tile[] {
  const kinds: Tile[] = [];
  const numberSuits: Suit[] = ["m", "p", "s"];

  for (const suit of numberSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      // 三麻: 萬子の2〜8は無し(1mと9mのみ有効)
      if (mode === "sanma" && suit === "m" && rank >= 2 && rank <= 8) continue;

      kinds.push({ suit, rank, isRed: false });
      if (rank === 5) {
        kinds.push({ suit, rank, isRed: true }); // 赤5は別枠のパレット項目として用意
      }
    }
  }

  for (let rank = 1; rank <= 7; rank++) {
    kinds.push({ suit: "z", rank, isRed: false });
  }

  return kinds;
}
