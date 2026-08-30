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
} from "./yakuCheckers";

export interface YakuEvaluationResult {
  yaku: YakuResult[];
  totalHan: number;
  isYakuless: boolean;
  groups: Group[];
  pairIndex: number;
  isChiitoitsu: boolean;
}

// 表示順: 立直→一発→ツモ→他の役(飜数が少ない順)→ドラ→抜きドラ→裏ドラ
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

function buildSituationalYaku(
  settings: HandSettings,
  winType: "tsumo" | "ron",
  isMenzen: boolean,
  melds: Meld[],
): YakuResult[] {
  const list: YakuResult[] = [];

  const riichi = checkRiichi(settings, melds);
  if (riichi) list.push(riichi);

  // 一発は嶺上開花・槍槓と複合しない(一発の巡目でカンが絡むと一発は消える)
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

// 役が1つもない場合はドラを乗せない(役無しでは和了自体が成立しないため)
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
  let bestGroups: Group[] = [];
  let bestPairIndex = -1;

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

    const totalHan = candidates.reduce((sum, y) => sum + y.han, 0);
    if (totalHan > bestHan) {
      bestHan = totalHan;
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
