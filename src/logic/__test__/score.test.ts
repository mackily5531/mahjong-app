import { describe, it, expect } from "vitest";
import { calculateScore } from "../score";

describe("calculateScore", () => {
  it("子・ロン・1飜30符 = 1000点", () => {
    const result = calculateScore(30, 1, "ron", false, 4, 0, 0);
    expect(result.rankName).toBeNull();
    expect(result.basePoints).toBe(1000);
    expect(result.totalPoints).toBe(1000);
  });

  it("親・ロン・3飜30符 = 5800点", () => {
    const result = calculateScore(30, 3, "ron", true, 4, 0, 0);
    expect(result.basePoints).toBe(5800);
  });

  it("子・ツモ・2飜30符 = 500・1000(合計2000点)", () => {
    const result = calculateScore(30, 2, "tsumo", false, 4, 0, 0);
    // 子ツモ: 親が1人分(2倍)、他家2人が1人分ずつ
    const dealerPayment = result.payments.find((p) => p.label === "親");
    const otherPayment = result.payments.find((p) => p.label.startsWith("子"));
    expect(dealerPayment?.amount).toBe(1000);
    expect(otherPayment?.amount).toBe(500);
  });

  it("親・ツモ・2飜30符 = 1000オール", () => {
    const result = calculateScore(30, 2, "tsumo", true, 4, 0, 0);
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].amount).toBe(1000);
  });

  it("5飜は符に関わらず満貫(子ロン8000点)", () => {
    const low = calculateScore(20, 5, "ron", false, 4, 0, 0);
    const high = calculateScore(60, 5, "ron", false, 4, 0, 0);
    expect(low.rankName).toBe("満貫");
    expect(high.rankName).toBe("満貫");
    expect(low.basePoints).toBe(8000);
    expect(high.basePoints).toBe(8000);
  });

  it("4飜40符は計算上2000点を超えるため満貫扱い", () => {
    // 40 * 2^(2+4) = 2560 → 2000点超えなので満貫に切り上げ
    const result = calculateScore(40, 4, "ron", false, 4, 0, 0);
    expect(result.rankName).toBe("満貫");
    expect(result.basePoints).toBe(8000);
  });

  it("本場: 四麻ロンは1本場+300点(基本点には影響しない)", () => {
    const noHonba = calculateScore(30, 1, "ron", false, 4, 1, 0);
    expect(noHonba.basePoints).toBe(1000);
    expect(noHonba.totalPoints).toBe(1300);
  });

  it("本場: 三麻ロンは1本場+200点", () => {
    const result = calculateScore(30, 1, "ron", false, 3, 1, 0);
    expect(result.totalPoints).toBe(1200);
  });

  it("本場: ツモは1人あたり+100点(親ツモの場合の全体増分を確認)", () => {
    const result = calculateScore(30, 2, "tsumo", true, 4, 1, 0);
    // 2飜30符の基本点2倍(1000点)が1本場で1100点になる
    expect(result.payments[0].baseAmount).toBe(1000);
    expect(result.payments[0].amount).toBe(1100);
  });

  it("供託は合計点に加算されず、注記のみ", () => {
    const result = calculateScore(30, 1, "ron", false, 4, 0, 2);
    expect(result.totalPoints).toBe(1000); // 供託2本(2000点)は含まれない
    expect(result.kyotakuLabel).toBe("(+2000点)");
  });

  it("役満(ダブル役満)は8000×倍率が基本点になる", () => {
    const result = calculateScore(0, 0, "ron", false, 4, 0, 0, 2);
    expect(result.rankName).toBe("ダブル役満");
    expect(result.basePoints).toBe(64000); // 基本点16000(8000×2) × 子ロン4倍
  });
});
