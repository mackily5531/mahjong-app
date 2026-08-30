import type { Group } from "./handGroups";
import { groupIndices } from "./handGroups";
import { indexToTile } from "./tileIndex";
import { tileLabel } from "../types/tile";

const SANGEN_INDICES = new Set([31, 32, 33]);

function isTerminalOrHonor(i: number): boolean {
  if (i >= 27) return true;
  const r = i % 9;
  return r === 0 || r === 8;
}

function tripletFu(index: number, isOpen: boolean, isKan: boolean): number {
  const honorOrTerminal = isTerminalOrHonor(index);
  if (isKan)
    return isOpen ? (honorOrTerminal ? 16 : 8) : honorOrTerminal ? 32 : 16;
  return isOpen ? (honorOrTerminal ? 4 : 2) : honorOrTerminal ? 8 : 4;
}

export interface FuBreakdownItem {
  label: string;
  fu: number;
}

export interface FuResult {
  items: FuBreakdownItem[];
  rawTotal: number;
  roundedTotal: number;
}

export interface FuContext {
  groups: Group[]; // 副露+濃厚、合計4組(七対子の場合は空でよい)
  pairIndex: number;
  winningIndex: number;
  winType: "tsumo" | "ron";
  isMenzen: boolean;
  seatWindIndex: number;
  roundWindIndex: number;
  isPinfu: boolean;
  isChiitoitsu: boolean;
}

export function calculateFu(ctx: FuContext): FuResult {
  if (ctx.isChiitoitsu) {
    const items = [{ label: "七対子", fu: 25 }];
    return { items, rawTotal: 25, roundedTotal: 25 };
  }

  if (ctx.isPinfu) {
    if (ctx.winType === "ron") {
      const items = [
        { label: "副底", fu: 20 },
        { label: "平和・ロン", fu: 10 },
      ];
      return { items, rawTotal: 30, roundedTotal: 30 };
    }
    const items = [{ label: "副底", fu: 20 }];
    return { items, rawTotal: 20, roundedTotal: 20 };
  }

  const items: FuBreakdownItem[] = [{ label: "副底", fu: 20 }];

  if (ctx.isMenzen && ctx.winType === "ron") {
    items.push({ label: "門前加符", fu: 10 });
  }
  if (ctx.winType === "tsumo") {
    items.push({ label: "自摸", fu: 2 });
  }

  const isTanki = ctx.winningIndex === ctx.pairIndex;
  if (isTanki) {
    items.push({ label: "単騎待ち", fu: 2 });
  }

  if (SANGEN_INDICES.has(ctx.pairIndex)) {
    items.push({ label: "雀頭(三元牌)", fu: 2 });
  } else {
    let windFu = 0;
    if (ctx.pairIndex === ctx.seatWindIndex) windFu += 2;
    if (ctx.pairIndex === ctx.roundWindIndex) windFu += 2;
    if (windFu > 0) items.push({ label: "雀頭(風牌)", fu: windFu });
  }

  for (const group of ctx.groups) {
    if (group.type === "sequence") {
      const indices = groupIndices(group);
      if (!isTanki && indices.includes(ctx.winningIndex)) {
        const s = group.startIndex;
        const isPenchan =
          (s % 9 === 0 && ctx.winningIndex === s + 2) ||
          ((s + 2) % 9 === 8 && ctx.winningIndex === s);
        const isKanchan = ctx.winningIndex === s + 1;
        if (isPenchan) items.push({ label: "辺張待ち", fu: 2 });
        else if (isKanchan) items.push({ label: "嵌張待ち", fu: 2 });
      }
      continue;
    }

    // 刻子・槓子: ロンで完成したシャンポン待ちの刻子は明刻扱い
    const isWinningTriplet = !isTanki && group.startIndex === ctx.winningIndex;
    const effectiveOpen =
      isWinningTriplet && ctx.winType === "ron" ? true : group.isOpen;

    const fu = tripletFu(group.startIndex, effectiveOpen, Boolean(group.isKan));
    const kindLabel = group.isKan
      ? effectiveOpen
        ? "明槓"
        : "暗槓"
      : effectiveOpen
        ? "明刻"
        : "暗刻";
    items.push({
      label: `${kindLabel}(${tileLabel(indexToTile(group.startIndex))})`,
      fu,
    });
  }

  const rawTotal = items.reduce((sum, i) => sum + i.fu, 0);
  const roundedTotal = Math.ceil(rawTotal / 10) * 10;
  return { items, rawTotal, roundedTotal };
}
