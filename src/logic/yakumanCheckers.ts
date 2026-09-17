import type { Tile } from "../types/tile";
import type { Meld } from "../types/meld";
import { buildCounts, tileToIndex } from "./tileIndex";
import {
  decomposeConcealedPart,
  meldToGroup,
  groupIndices,
} from "./handGroups";
import type { Group } from "./handGroups";
import { isKokushi } from "./winCheck";
import type { HandSettings } from "../types/handConfig";

export interface YakumanResult {
  key: string;
  name: string;
  multiplier: number; // 1 = 役満, 2 = ダブル役満
}

const SANGEN_INDICES = [31, 32, 33];
const WIND_INDICES = [27, 28, 29, 30];
const GREEN_INDICES = new Set([19, 20, 21, 23, 25, 32]); // 2s,3s,4s,6s,8s,發

interface YakumanContext {
  groups: Group[];
  pairIndex: number;
  winningIndex: number;
  winType: "tsumo" | "ron";
}

// 国士無双
function checkKokushi(
  counts: number[],
  winningIndex: number,
): YakumanResult | null {
  if (!isKokushi(counts)) return null;
  const withoutWinning = counts.slice();
  withoutWinning[winningIndex]--;
  const thirteenWait = withoutWinning[winningIndex] >= 1; // 和了前から既にその牌を持っていた=十三面待ち
  return {
    key: "kokushi",
    name: thirteenWait ? "国士無双十三面待ち" : "国士無双",
    multiplier: thirteenWait ? 2 : 1,
  };
}

// 四暗刻
function checkSuuankou(ctx: YakumanContext): YakumanResult | null {
  let ankoCount = 0;
  for (const g of ctx.groups) {
    if (g.type !== "triplet") continue;
    const isWinningTriplet =
      g.startIndex === ctx.winningIndex && ctx.winningIndex !== ctx.pairIndex;
    const effectiveOpen =
      isWinningTriplet && ctx.winType === "ron" ? true : g.isOpen;
    if (!effectiveOpen) ankoCount++;
  }
  if (ankoCount < 4) return null;
  const isTanki = ctx.winningIndex === ctx.pairIndex; // 単騎待ちで和了した場合は「四暗刻単騎」として扱う
  return {
    key: "suuankou",
    name: isTanki ? "四暗刻単騎" : "四暗刻",
    multiplier: isTanki ? 2 : 1,
  };
}

// 大三元
function checkDaisangen(ctx: YakumanContext): YakumanResult | null {
  const count = ctx.groups.filter(
    (g) => g.type === "triplet" && SANGEN_INDICES.includes(g.startIndex),
  ).length;
  return count === 3
    ? { key: "daisangen", name: "大三元", multiplier: 1 }
    : null;
}

function allIndices(ctx: YakumanContext): number[] {
  const indices = ctx.groups.flatMap(groupIndices);
  indices.push(ctx.pairIndex, ctx.pairIndex);
  return indices;
}

// 字一色
function checkTsuuiisou(ctx: YakumanContext): YakumanResult | null {
  return allIndices(ctx).every((i) => i >= 27)
    ? { key: "tsuuiisou", name: "字一色", multiplier: 1 }
    : null;
}

// 清老頭
function checkChinroutou(ctx: YakumanContext): YakumanResult | null {
  const allTerminal = allIndices(ctx).every(
    (i) => i < 27 && (i % 9 === 0 || i % 9 === 8),
  );
  return allTerminal
    ? { key: "chinroutou", name: "清老頭", multiplier: 1 }
    : null;
}

// 緑一色
function checkRyuuiisou(ctx: YakumanContext): YakumanResult | null {
  return allIndices(ctx).every((i) => GREEN_INDICES.has(i))
    ? { key: "ryuuiisou", name: "緑一色", multiplier: 1 }
    : null;
}

// 小四喜
function checkShousuushii(ctx: YakumanContext): YakumanResult | null {
  const windTriplets = ctx.groups.filter(
    (g) => g.type === "triplet" && WIND_INDICES.includes(g.startIndex),
  ).length;
  const pairIsWind = WIND_INDICES.includes(ctx.pairIndex);
  return windTriplets === 3 && pairIsWind
    ? { key: "shousuushii", name: "小四喜", multiplier: 1 }
    : null;
}

// 大四喜
function checkDaisuushii(ctx: YakumanContext): YakumanResult | null {
  const windTriplets = ctx.groups.filter(
    (g) => g.type === "triplet" && WIND_INDICES.includes(g.startIndex),
  ).length;
  return windTriplets === 4
    ? { key: "daisuushii", name: "大四喜", multiplier: 2 }
    : null;
}

// 九蓮宝燈
function checkChuurenPoutou(
  counts14: number[],
  winningIndex: number,
): YakumanResult | null {
  const usedSuits = new Set<number>();
  for (let i = 0; i < 27; i++)
    if (counts14[i] > 0) usedSuits.add(Math.floor(i / 9));
  for (let i = 27; i < 34; i++) if (counts14[i] > 0) return null; // 字牌混在で不成立
  if (usedSuits.size !== 1) return null;

  const suit = [...usedSuits][0];
  const base = suit * 9;
  const required = [3, 1, 1, 1, 1, 1, 1, 1, 3]; // 1112345678999
  for (let r = 0; r < 9; r++) {
    if (counts14[base + r] < required[r]) return null;
  }
  const total = counts14.slice(base, base + 9).reduce((s, c) => s + c, 0);
  if (total !== 14) return null;

  const withoutWinning = counts14.slice();
  withoutWinning[winningIndex]--;
  const isPure = required.every((req, r) => withoutWinning[base + r] === req); // 和了前から既にその牌を持っていた=純正九蓮宝燈

  return {
    key: "chuurenpoutou",
    name: isPure ? "純正九蓮宝燈" : "九蓮宝燈",
    multiplier: isPure ? 2 : 1,
  };
}

// 四槓子
function checkSuukantsu(melds: Meld[]): YakumanResult | null {
  const kanCount = melds.filter(
    (m) => m.type === "minkan" || m.type === "ankan",
  ).length;
  return kanCount === 4
    ? { key: "suukantsu", name: "四槓子", multiplier: 1 }
    : null;
}

// 天和/地和: 自風が東なら天和、それ以外なら地和として扱う。
function checkTenhouChihou(
  melds: Meld[],
  settings: HandSettings,
): YakumanResult[] {
  if (!settings.isTenhouChihou) return [];
  const noCalls = melds.length === 0 && (settings.nukiDoraCount ?? 0) === 0;
  if (!noCalls) return [];

  const name = settings.seatWind === "east" ? "天和" : "地和";
  return [{ key: "tenhouchihou", name, multiplier: 1 }];
}

export interface YakumanEvaluationResult {
  yakuman: YakumanResult[];
  totalMultiplier: number;
}

// 役満判定を行う
export function evaluateYakuman(
  concealedTiles: Tile[],
  winningTile: Tile,
  melds: Meld[],
  winType: "tsumo" | "ron",
  settings: HandSettings,
): YakumanEvaluationResult {
  const winningIndex = tileToIndex(winningTile);
  const counts14 = buildCounts([...concealedTiles, winningTile]);

  const found: YakumanResult[] = [];

  if (melds.length === 0) {
    const kokushi = checkKokushi(counts14, winningIndex);
    if (kokushi) found.push(kokushi);
    const chuuren = checkChuurenPoutou(counts14, winningIndex);
    if (chuuren) found.push(chuuren);
  }

  found.push(...checkTenhouChihou(melds, settings));

  const suukantsu = checkSuukantsu(melds);
  if (suukantsu) found.push(suukantsu);

  const neededSets = 4 - melds.length;
  const meldGroups = melds.map(meldToGroup);
  const decompositions = decomposeConcealedPart(counts14.slice(), neededSets);

  let bestStandard: YakumanResult[] = [];
  let bestMultiplier = -1;

  for (const decomposition of decompositions) {
    const ctx: YakumanContext = {
      groups: [...meldGroups, ...decomposition.groups],
      pairIndex: decomposition.pairIndex,
      winningIndex,
      winType,
    };

    const candidates: YakumanResult[] = [];
    const suuankou = checkSuuankou(ctx);
    if (suuankou) candidates.push(suuankou);
    const daisangen = checkDaisangen(ctx);
    if (daisangen) candidates.push(daisangen);
    const tsuuiisou = checkTsuuiisou(ctx);
    if (tsuuiisou) candidates.push(tsuuiisou);
    const chinroutou = checkChinroutou(ctx);
    if (chinroutou) candidates.push(chinroutou);
    const ryuuiisou = checkRyuuiisou(ctx);
    if (ryuuiisou) candidates.push(ryuuiisou);
    const shousuushii = checkShousuushii(ctx);
    if (shousuushii) candidates.push(shousuushii);
    const daisuushii = checkDaisuushii(ctx);
    if (daisuushii) candidates.push(daisuushii);

    const multiplier = candidates.reduce((sum, y) => sum + y.multiplier, 0);
    if (multiplier > bestMultiplier) {
      bestMultiplier = multiplier;
      bestStandard = candidates;
    }
  }

  const all = [...found, ...bestStandard];
  const totalMultiplier = all.reduce((sum, y) => sum + y.multiplier, 0);
  return { yakuman: all, totalMultiplier };
}
