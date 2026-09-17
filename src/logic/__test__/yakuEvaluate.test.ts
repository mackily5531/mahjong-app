import { describe, it, expect } from "vitest";
import { evaluateYaku } from "../yakuEvaluate";
import { defaultHandSettings } from "../../types/handConfig";
import type { Tile } from "../../types/tile";

// 「1m2m3m」のような文字列から Tile[] を組み立てるテスト用ヘルパー
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

describe("evaluateYaku", () => {
  it("平和・ツモ: 2飜20符", () => {
    const winningTile: Tile = { suit: "p", rank: 5 };
    const hand = [
      ...tiles("234567m"),
      ...tiles("34p"),
      ...tiles("789s"),
      ...tiles("11p"),
    ];

    const settings = defaultHandSettings("yonma");
    const result = evaluateYaku(
      hand,
      winningTile,
      [],
      "yonma",
      settings,
      "tsumo",
    );

    expect(result.isYakuless).toBe(false);
    expect(result.yaku.map((y) => y.key)).toEqual(
      expect.arrayContaining(["pinfu", "menzentsumo"]),
    );
    expect(result.totalHan).toBe(2);
  });

  it("断幺九+ドラ: 役無しにならない", () => {
    const winningTile: Tile = { suit: "p", rank: 3 };
    const hand = [
      ...tiles("234m"),
      ...tiles("567m"),
      ...tiles("33p"),
      ...tiles("678s"),
      ...tiles("22s"),
    ];

    const settings = defaultHandSettings("yonma");
    settings.doraIndicators = [{ suit: "p", rank: 2 }]; // ドラ表示牌2p→ドラは3p

    const result = evaluateYaku(
      hand,
      winningTile,
      [],
      "yonma",
      settings,
      "ron",
    );
    expect(result.isYakuless).toBe(false);
    expect(result.yaku.some((y) => y.key === "tanyao")).toBe(true);
    expect(result.yaku.some((y) => y.key === "dora")).toBe(true);
  });

  it("役無しの形はisYakulessがtrueになる", () => {
    const noYakuHand = [
      ...tiles("123m"),
      ...tiles("456p"),
      ...tiles("789s"),
      { suit: "z" as const, rank: 1 },
      { suit: "z" as const, rank: 1 },
      ...tiles("24s"),
    ];
    const winningTile: Tile = { suit: "s", rank: 3 };

    const settings = defaultHandSettings("yonma");
    const result = evaluateYaku(
      noYakuHand,
      winningTile,
      [],
      "yonma",
      settings,
      "ron",
    );
    expect(result.isYakuless).toBe(true);
  });
});
