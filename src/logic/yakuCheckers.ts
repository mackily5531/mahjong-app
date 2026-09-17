import type { GameMode } from "../types/gameMode";
import type { HandSettings } from "../types/handConfig";
import type { Group } from "./handGroups";
import { groupIndices } from "./handGroups";
import type { YakuResult } from "../types/yaku";
import type { Meld } from "../types/meld";

export interface HandContext {
  groups: Group[]; 
  pairIndex: number;
  isMenzen: boolean;
  winningIndex: number;
  winType: "tsumo" | "ron";
  settings: HandSettings;
  mode: GameMode;
}

export const WIND_INDEX: Record<string, number> = {
  east: 27,
  south: 28,
  west: 29,
  north: 30,
};
const SANGEN_INDICES = new Set([31, 32, 33]);

// 牌のインデックスが幺九牌(1/9牌または字牌)かどうか
export function isTerminalOrHonorIndex(i: number): boolean {
  if (i >= 27) return true;
  const r = i % 9;
  return r === 0 || r === 8;
}

// 牌のインデックスが字牌かどうか
function allIndices(ctx: HandContext): number[] {
  const indices = ctx.groups.flatMap(groupIndices);
  indices.push(ctx.pairIndex, ctx.pairIndex);
  return indices;
}

// 断幺九
export function checkTanyao(ctx: HandContext): YakuResult | null {
  const hasTerminalOrHonor = allIndices(ctx).some(isTerminalOrHonorIndex);
  return hasTerminalOrHonor ? null : { key: "tanyao", name: "断幺九", han: 1 };
}

// 役牌
export function checkYakuhai(ctx: HandContext): YakuResult[] {
  const results: YakuResult[] = [];
  const seatWindIndex = WIND_INDEX[ctx.settings.seatWind];
  const roundWindIndex = WIND_INDEX[ctx.settings.roundWind];

  for (const group of ctx.groups) {
    if (group.type !== "triplet") continue;
    const i = group.startIndex;
    if (SANGEN_INDICES.has(i)) {
      const names: Record<number, string> = {
        31: "役牌 白",
        32: "役牌 發",
        33: "役牌 中",
      };
      results.push({ key: `yakuhai-${i}`, name: names[i], han: 1 });
    }
    if (i === seatWindIndex) {
      results.push({ key: "yakuhai-seat", name: "役牌 自風", han: 1 });
    }
    if (i === roundWindIndex) {
      results.push({ key: "yakuhai-round", name: "役牌 場風", han: 1 });
    }
  }
  return results;
}

// 対々和
export function checkToitoi(ctx: HandContext): YakuResult | null {
  const allTriplets = ctx.groups.every((g) => g.type === "triplet");
  return allTriplets ? { key: "toitoi", name: "対々和", han: 2 } : null;
}

// 一盃口
export function checkIipeikou(ctx: HandContext): YakuResult | null {
  if (!ctx.isMenzen) return null;
  const sequences = ctx.groups
    .filter((g) => g.type === "sequence")
    .map((g) => g.startIndex);
  const seen = new Set<number>();
  for (const s of sequences) {
    if (seen.has(s)) return { key: "iipeikou", name: "一盃口", han: 1 };
    seen.add(s);
  }
  return null;
}

// 平和
export function checkPinfu(ctx: HandContext): YakuResult | null {
  if (!ctx.isMenzen) return null;
  if (!ctx.groups.every((g) => g.type === "sequence")) return null;

  const seatWindIndex = WIND_INDEX[ctx.settings.seatWind];
  const roundWindIndex = WIND_INDEX[ctx.settings.roundWind];
  if (
    SANGEN_INDICES.has(ctx.pairIndex) ||
    ctx.pairIndex === seatWindIndex ||
    ctx.pairIndex === roundWindIndex
  ) {
    return null; // 雀頭が役牌だと平和は成立しない
  }

  const waitGroup = ctx.groups.find((g) =>
    groupIndices(g).includes(ctx.winningIndex),
  );
  if (!waitGroup) return null;

  const s = waitGroup.startIndex;
  const isLowEdge = ctx.winningIndex === s + 2 && s % 9 === 0; // 1-2待ちで3
  const isHighEdge = ctx.winningIndex === s && (s + 2) % 9 === 8; // 8-9待ちで7
  const isKanchan = ctx.winningIndex === s + 1; // 嵌張

  if (isLowEdge || isHighEdge || isKanchan) return null;

  return { key: "pinfu", name: "平和", han: 1 };
}

// 混一色/清一色
export function checkHonitsuChinitsu(ctx: HandContext): YakuResult | null {
  const indices = allIndices(ctx);
  const suits = new Set(
    indices.filter((i) => i < 27).map((i) => Math.floor(i / 9)),
  );
  const hasHonor = indices.some((i) => i >= 27);

  if (suits.size !== 1) return null; // 2色以上、または数牌が無い

  return hasHonor
    ? { key: "honitsu", name: "混一色", han: ctx.isMenzen ? 3 : 2 }
    : { key: "chinitsu", name: "清一色", han: ctx.isMenzen ? 6 : 5 };
}

// 立直
export function checkRiichi(
  settings: HandSettings,
  melds: Meld[],
): YakuResult | null {
  const hasCall = melds.some(
    (m) => m.type === "pon" || m.type === "chi" || m.type === "minkan",
  );
  if (hasCall) return null; // ポン・チー・明槓があるとリーチ自体不成立

  const hasAnyCallOrNuki =
    melds.length > 0 || (settings.nukiDoraCount ?? 0) > 0;

  if (settings.riichiState === "double") {
    // 暗槓や抜きドラがあるとダブル立直は崩れ、通常の立直として扱う
    if (hasAnyCallOrNuki) return { key: "riichi", name: "立直", han: 1 };
    return { key: "doubleriichi", name: "ダブル立直", han: 2 };
  }
  if (settings.riichiState === "riichi") {
    return { key: "riichi", name: "立直", han: 1 };
  }
  return null;
}

// 一発
export function checkIppatsu(settings: HandSettings): YakuResult | null {
  return settings.isIppatsu && settings.riichiState !== "none"
    ? { key: "ippatsu", name: "一発", han: 1 }
    : null;
}

// 嶺上開花
export function checkRinshan(
  settings: HandSettings,
  melds: Meld[],
  winType: "tsumo" | "ron",
): YakuResult | null {
  if (winType !== "tsumo") return null; // 嶺上開花はツモ限定
  const hasKanOrNuki =
    melds.some((m) => m.type === "minkan" || m.type === "ankan") ||
    (settings.nukiDoraCount ?? 0) > 0;
  if (!hasKanOrNuki) return null;
  return settings.isRinshan
    ? { key: "rinshan", name: "嶺上開花", han: 1 }
    : null;
}

// 槍槓
export function checkChankan(
  settings: HandSettings,
  winType: "tsumo" | "ron",
): YakuResult | null {
  if (winType !== "ron") return null; // 槍槓はロン限定
  return settings.isChankan ? { key: "chankan", name: "槍槓", han: 1 } : null;
}

// 海底摸月/河底撈魚
export function checkHaiteiHoutei(
  settings: HandSettings,
  winType: "tsumo" | "ron",
  hasRinshanOrChankan: boolean,
): YakuResult | null {
  if (!settings.isHaitei) return null;
  if (hasRinshanOrChankan) return null; // 嶺上開花・槍槓とは複合しない
  return winType === "tsumo"
    ? { key: "haitei", name: "海底摸月", han: 1 }
    : { key: "houtei", name: "河底撈魚", han: 1 };
}

// 三色同順
export function checkSanshokuDoujun(ctx: HandContext): YakuResult | null {
  const sequenceStarts = new Set(
    ctx.groups.filter((g) => g.type === "sequence").map((g) => g.startIndex),
  );
  for (let rank = 0; rank <= 6; rank++) {
    if (
      sequenceStarts.has(rank) &&
      sequenceStarts.has(rank + 9) &&
      sequenceStarts.has(rank + 18)
    ) {
      return { key: "sanshoku", name: "三色同順", han: ctx.isMenzen ? 2 : 1 };
    }
  }
  return null;
}

// 一気通貫
export function checkIttsuu(ctx: HandContext): YakuResult | null {
  const sequenceStarts = new Set(
    ctx.groups.filter((g) => g.type === "sequence").map((g) => g.startIndex),
  );
  for (const base of [0, 9, 18]) {
    if (
      sequenceStarts.has(base) &&
      sequenceStarts.has(base + 3) &&
      sequenceStarts.has(base + 6)
    ) {
      return { key: "ittsuu", name: "一気通貫", han: ctx.isMenzen ? 2 : 1 };
    }
  }
  return null;
}

// 三暗刻
export function checkSanankou(ctx: HandContext): YakuResult | null {
  let ankoCount = 0;
  for (const group of ctx.groups) {
    if (group.type !== "triplet") continue;
    const isWinningTriplet = group.startIndex === ctx.winningIndex;
    const effectiveOpen =
      isWinningTriplet && ctx.winType === "ron" ? true : group.isOpen;
    if (!effectiveOpen) ankoCount++;
  }
  return ankoCount >= 3 ? { key: "sanankou", name: "三暗刻", han: 2 } : null;
}

function groupHasTerminalOrHonor(group: Group): boolean {
  if (group.type === "triplet") return isTerminalOrHonorIndex(group.startIndex);
  const rankInSuit = group.startIndex % 9;
  return rankInSuit === 0 || rankInSuit === 6; // 1-2-3 または 7-8-9
}

// チャンタ/純全帯幺九
export function checkChantaJunchan(ctx: HandContext): YakuResult | null {
  const pairOk = isTerminalOrHonorIndex(ctx.pairIndex);
  const groupsOk = ctx.groups.every(groupHasTerminalOrHonor);
  if (!pairOk || !groupsOk) return null;

  const hasHonor =
    ctx.pairIndex >= 27 ||
    ctx.groups.some((g) => g.type === "triplet" && g.startIndex >= 27);
  return hasHonor
    ? { key: "chanta", name: "チャンタ", han: ctx.isMenzen ? 2 : 1 }
    : { key: "junchan", name: "純全帯幺九", han: ctx.isMenzen ? 3 : 2 };
}

// 三色同刻
export function checkSanshokuDoukou(ctx: HandContext): YakuResult | null {
  const tripletRanks = new Set(
    ctx.groups
      .filter((g) => g.type === "triplet" && g.startIndex < 27)
      .map((g) => g.startIndex),
  );
  for (let rank = 0; rank <= 8; rank++) {
    if (
      tripletRanks.has(rank) &&
      tripletRanks.has(rank + 9) &&
      tripletRanks.has(rank + 18)
    ) {
      return { key: "sanshokudoukou", name: "三色同刻", han: 2 };
    }
  }
  return null;
}

// 小三元
export function checkShousangen(ctx: HandContext): YakuResult | null {
  const dragonTriplets = ctx.groups.filter(
    (g) => g.type === "triplet" && SANGEN_INDICES.has(g.startIndex),
  );
  const pairIsDragon = SANGEN_INDICES.has(ctx.pairIndex);
  return dragonTriplets.length === 2 && pairIsDragon
    ? { key: "shousangen", name: "小三元", han: 2 }
    : null;
}

// 混老頭
export function checkHonroutou(ctx: HandContext): YakuResult | null {
  const noSequence = ctx.groups.every((g) => g.type === "triplet");
  const allTerminalOrHonor =
    ctx.groups.every((g) => isTerminalOrHonorIndex(g.startIndex)) &&
    isTerminalOrHonorIndex(ctx.pairIndex);
  return noSequence && allTerminalOrHonor
    ? { key: "honroutou", name: "混老頭", han: 2 }
    : null;
}
