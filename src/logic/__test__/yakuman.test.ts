import { describe, it, expect } from "vitest";
import { evaluateYakuman } from "../yakumanCheckers";
import { defaultHandSettings } from "../../types/handConfig";
import type { Tile } from "../../types/tile";

function tiles(spec: string): Tile[] {
  const result: Tile[] = [];
  for (const chunk of spec.trim().split(/\s+/)) {
    const suit = chunk[chunk.length - 1] as Tile["suit"];
    const ranks = chunk.slice(0, -1);
    for (const r of ranks) {
      result.push({ suit, rank: Number(r) });
    }
  }
  return result;
}

describe("evaluateYakuman", () => {
  it("国士無双(通常形): 13枚の時点で1種類欠けている状態で完成", () => {
    // 13種のうち9m以外を1枚ずつ(12枚)+1mをもう1枚(13枚)持ち、9mを引いて和了
    // → 13枚時点で「9mだけ無い」ので、9mを引くことでしか和了できない=通常形
    const hand = [
      ...tiles("1m"),
      ...tiles("1m"), // 1mを対子として先に持っておく(雀頭役)
      ...tiles("19p"),
      ...tiles("19s"),
      ...tiles("1234567z"),
    ];
    const winningTile: Tile = { suit: "m", rank: 9 };

    const settings = defaultHandSettings("yonma");
    const result = evaluateYakuman(hand, winningTile, [], "ron", settings);

    expect(result.totalMultiplier).toBe(1);
    expect(result.yakuman.some((y) => y.key === "kokushi")).toBe(true);
  });

  it("国士無双十三面待ち: 13枚の時点で13種すべて揃っている", () => {
    // 13種類を1枚ずつ(13枚)持った状態で、そのうちの1種(1m)をもう1枚引いて和了
    const hand = [
      ...tiles("19m"),
      ...tiles("19p"),
      ...tiles("19s"),
      ...tiles("1234567z"),
    ];
    const winningTile: Tile = { suit: "m", rank: 1 };

    const settings = defaultHandSettings("yonma");
    const result = evaluateYakuman(hand, winningTile, [], "ron", settings);

    expect(result.totalMultiplier).toBe(2);
    expect(result.yakuman[0].name).toBe("国士無双十三面待ち");
  });
});
