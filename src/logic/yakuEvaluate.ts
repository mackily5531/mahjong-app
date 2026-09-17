import type { Tile } from "../types/tile";
import type { Meld } from "../types/meld";
import type { GameMode } from "../types/gameMode";
import type { HandSettings } from "../types/handConfig";
import type { YakuResult } from "../types/yaku";
import type { Group } from "./handGroups";
import { buildCounts, tileToIndex } from "./tileIndex";
import { decomposeConcealedPart, meldToGroup } from "./handGroups";
import { isSevenPairs } from "./winCheck";
import { countDora, countRedDora } from "./dora";
import { calculateFu } from "./fu";
import type { HandContext } from "./yakuCheckers";
import {
  checkTanyao,
  checkYakuhai,
  checkToitoi,
  checkIipeikou,
  checkPinfu,
  checkHonitsuChinitsu,
  checkRiichi,
  checkIppatsu,
  checkRinshan,
  checkChankan,
  checkHaiteiHoutei,
  checkSanshokuDoujun,
  checkIttsuu,
  checkSanankou,
  checkChantaJunchan,
  checkSanshokuDoukou,
  checkShousangen,
  checkHonroutou,
  WIND_INDEX,
} from "./yakuCheckers";

export interface YakuEvaluationResult {
  yaku: YakuResult[];
  totalHan: number;
  isYakuless: boolean;
  groups: Group[];
  pairIndex: number;
  isChiitoitsu: boolean;
}

// 役リストをソートする
function sortYaku(list: YakuResult[]): YakuResult[] {
  const order: Record<string, number> = {
    doubleriichi: 0,
    riichi: 0,
    ippatsu: 1,
    menzentsumo: 2,
    dora: 20,
    nukidora: 21,
    uradora: 22,
  };
  return [...list].sort((a, b) => {
    const rankA = order[a.key] ?? 10;
    const rankB = order[b.key] ?? 10;
    if (rankA !== rankB) return rankA - rankB;
    if (rankA === 10) return a.han - b.han;
    return 0;
  });
}

// 状況役(立直・一発・門前清自摸和・嶺上開花・槍槓・海底撈月/河底撈魚)を判定する
function buildSituationalYaku(
  settings: HandSettings,
  winType: "tsumo" | "ron",
  isMenzen: boolean,
  melds: Meld[],
): YakuResult[] {
  const list: YakuResult[] = [];

  const riichi = checkRiichi(settings, melds);
  if (riichi) list.push(riichi);

  const rinshan = checkRinshan(settings, melds, winType);
  const chankan = checkChankan(settings, winType);
  const hasRinshanOrChankan = Boolean(rinshan) || Boolean(chankan);

  if (!hasRinshanOrChankan) {
    const ippatsu = checkIppatsu(settings);
    if (ippatsu) list.push(ippatsu);
  }

  if (isMenzen && winType === "tsumo")
    list.push({ key: "menzentsumo", name: "門前清自摸和", han: 1 });

  if (rinshan) list.push(rinshan);
  if (chankan) list.push(chankan);

  const haitei = checkHaiteiHoutei(settings, winType, hasRinshanOrChankan);
  if (haitei) list.push(haitei);

  return list;
}

// ドラ役を追加する
function appendDoraYaku(
  base: YakuResult[],
  allTiles: Tile[],
  settings: HandSettings,
  mode: GameMode,
): YakuResult[] {
  if (base.length === 0) return base;

  const list = [...base];
  const nukiDoraCount = settings.nukiDoraCount ?? 0;
  const doraHan =
    countDora(allTiles, settings.doraIndicators, mode, nukiDoraCount) +
    countRedDora(allTiles);
  if (doraHan > 0) list.push({ key: "dora", name: "ドラ", han: doraHan });

  if (nukiDoraCount > 0)
    list.push({ key: "nukidora", name: "抜きドラ", han: nukiDoraCount });

  if (settings.riichiState !== "none") {
    const uraDoraHan = countDora(allTiles, settings.uraDoraIndicators, mode, 0);
    if (uraDoraHan > 0)
      list.push({ key: "uradora", name: "裏ドラ", han: uraDoraHan });
  }

  return list;
}

export function evaluateYaku(
  concealedTiles: Tile[],
  winningTile: Tile,
  melds: Meld[],
  mode: GameMode,
  settings: HandSettings,
  winType: "tsumo" | "ron",
): YakuEvaluationResult {
  const isMenzen = melds.every((m) => m.type === "ankan");
  const winningIndex = tileToIndex(winningTile);
  const counts = buildCounts([...concealedTiles, winningTile]);
  const situational = buildSituationalYaku(settings, winType, isMenzen, melds);
  const allTiles = [
    ...concealedTiles,
    winningTile,
    ...melds.flatMap((m) => m.tiles),
  ];

  // 七対子ルート
  if (melds.length === 0 && isSevenPairs(counts)) {
    const base: YakuResult[] = [
      ...situational,
      { key: "chiitoitsu", name: "七対子", han: 2 },
    ];

    const indices: number[] = [];
    for (let i = 0; i < 34; i++) if (counts[i] > 0) indices.push(i, i);

    const tanyao = indices.every(
      (i) => !(i >= 27 || i % 9 === 0 || i % 9 === 8),
    );
    if (tanyao) base.push({ key: "tanyao", name: "断幺九", han: 1 });

    const suits = new Set(
      indices.filter((i) => i < 27).map((i) => Math.floor(i / 9)),
    );
    const hasHonor = indices.some((i) => i >= 27);
    if (suits.size === 1) {
      base.push(
        hasHonor
          ? { key: "honitsu", name: "混一色", han: 3 }
          : { key: "chinitsu", name: "清一色", han: 6 },
      );
    }

    const withDora = appendDoraYaku(base, allTiles, settings, mode);
    const sorted = sortYaku(withDora);
    const totalHan = sorted.reduce((sum, y) => sum + y.han, 0);
    return {
      yaku: sorted,
      totalHan,
      isYakuless: base.length === 0,
      groups: [],
      pairIndex: -1,
      isChiitoitsu: true,
    };
  }

  // 通常形ルート
  const neededSets = 4 - melds.length;
  const meldGroups = melds.map(meldToGroup);
  const decompositions = decomposeConcealedPart(counts.slice(), neededSets);

  let best: YakuResult[] = [];
  let bestHan = -1;
  let bestFu = -1;
  let bestGroups: Group[] = [];
  let bestPairIndex = -1;

  // すべての分解パターンを試し、役の合計飜数が最大になるものを採用する
  for (const decomposition of decompositions) {
    const ctx: HandContext = {
      groups: [...meldGroups, ...decomposition.groups],
      pairIndex: decomposition.pairIndex,
      isMenzen,
      winningIndex,
      winType,
      settings,
      mode,
    };

    // 役を判定する
    const candidates: YakuResult[] = [...situational];
    const tanyao = checkTanyao(ctx);
    if (tanyao) candidates.push(tanyao);
    candidates.push(...checkYakuhai(ctx));
    const toitoi = checkToitoi(ctx);
    if (toitoi) candidates.push(toitoi);
    const iipeikou = checkIipeikou(ctx);
    if (iipeikou) candidates.push(iipeikou);
    const pinfu = checkPinfu(ctx);
    if (pinfu) candidates.push(pinfu);
    const honchin = checkHonitsuChinitsu(ctx);
    if (honchin) candidates.push(honchin);
    const sanshoku = checkSanshokuDoujun(ctx);
    if (sanshoku) candidates.push(sanshoku);
    const ittsuu = checkIttsuu(ctx);
    if (ittsuu) candidates.push(ittsuu);
    const sanankou = checkSanankou(ctx);
    if (sanankou) candidates.push(sanankou);
    const chanta = checkChantaJunchan(ctx);
    if (chanta) candidates.push(chanta);
    const sanshokudoukou = checkSanshokuDoukou(ctx);
    if (sanshokudoukou) candidates.push(sanshokudoukou);
    const shousangen = checkShousangen(ctx);
    if (shousangen) candidates.push(shousangen);
    const honroutou = checkHonroutou(ctx);
    if (honroutou) candidates.push(honroutou);

    if (candidates.length === 0) continue; // 役が無い分解は比較対象にしない

    const totalHan = candidates.reduce((sum, y) => sum + y.han, 0);

    // 飜数が現状のベストより低ければ、符を見るまでもなく不採用
    if (totalHan < bestHan) continue;

    // 符計算を行う
    const fuResult = calculateFu({
      groups: ctx.groups,
      pairIndex: ctx.pairIndex,
      winningIndex,
      winType,
      isMenzen,
      seatWindIndex: WIND_INDEX[settings.seatWind],
      roundWindIndex: WIND_INDEX[settings.roundWind],
      isPinfu: candidates.some((y) => y.key === "pinfu"),
      isChiitoitsu: false,
    });

    // 飜数が同じ場合は符の多い方を採用する
    const isBetter =
      totalHan > bestHan ||
      (totalHan === bestHan && fuResult.roundedTotal > bestFu);

    if (isBetter) {
      bestHan = totalHan;
      bestFu = fuResult.roundedTotal;
      best = candidates;
      bestGroups = ctx.groups;
      bestPairIndex = ctx.pairIndex;
    }
  }

  const withDora = appendDoraYaku(best, allTiles, settings, mode);
  const sorted = sortYaku(withDora);
  const totalHan = sorted.reduce((sum, y) => sum + y.han, 0);
  return {
    yaku: sorted,
    totalHan,
    isYakuless: best.length === 0,
    groups: bestGroups,
    pairIndex: bestPairIndex,
    isChiitoitsu: false,
  };
}
