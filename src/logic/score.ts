function computeBasePoints(
  fu: number,
  han: number,
): { base: number; rankName: string | null } {
  if (han >= 13) return { base: 8000, rankName: "数え役満" };
  if (han >= 11) return { base: 6000, rankName: "三倍満" };
  if (han >= 8) return { base: 4000, rankName: "倍満" };
  if (han >= 6) return { base: 3000, rankName: "跳満" };
  if (han === 5) return { base: 2000, rankName: "満貫" };

  const raw = fu * Math.pow(2, 2 + han);
  if (raw >= 2000) return { base: 2000, rankName: "満貫" };
  return { base: raw, rankName: null };
}

function roundUp100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

export interface PaymentItem {
  label: string;
  baseAmount: number; // 本場を含まない1人あたりの金額
  amount: number; // 本場を含む1人あたりの金額
}

export interface ScoreResult {
  rankName: string | null;
  basePoints: number;
  totalPoints: number;
  kyotakuLabel: string | null;
  payments: PaymentItem[];
  tsumoLabelBase: string | null; // 本場を含まない表記(「1000オール」等)
  tsumoLabelTotal: string | null; // 本場を含む表記(本場が無い場合はbaseと同じ値)
}

export function calculateScore(
  fu: number,
  han: number,
  winType: "tsumo" | "ron",
  isDealer: boolean,
  playerCount: number,
  honba: number,
  kyotaku: number,
  yakumanMultiplier?: number,
): ScoreResult {
  let base: number;
  let rankName: string | null;

  if (yakumanMultiplier && yakumanMultiplier > 0) {
    base = 8000 * yakumanMultiplier;
    const rankNames: Record<number, string> = {
      1: "役満",
      2: "ダブル役満",
      3: "トリプル役満",
      4: "四倍役満",
    };
    rankName = rankNames[yakumanMultiplier] ?? `${yakumanMultiplier}倍役満`;
  } else {
    const computed = computeBasePoints(fu, han);
    base = computed.base;
    rankName = computed.rankName;
  }

  // 三麻はロン時の本場が200点(四麻は300点)。ツモは人数に関わらず1人100点/本
  const honbaRonUnit = playerCount === 3 ? 200 : 300;
  const kyotakuLabel = kyotaku > 0 ? `(+${kyotaku * 1000}点)` : null;
  const payments: PaymentItem[] = [];
  let basePoints: number;
  let totalPoints: number;

  if (winType === "ron") {
    const raw = isDealer ? base * 6 : base * 4;
    basePoints = roundUp100(raw);
    totalPoints = basePoints + honba * honbaRonUnit;
  } else {
    const honbaPerPayer = honba * 100;
    if (isDealer) {
      const eachBase = roundUp100(base * 2);
      const each = eachBase + honbaPerPayer;
      const payerCount = playerCount - 1;
      payments.push({
        label: `子(${payerCount}人)各`,
        baseAmount: eachBase,
        amount: each,
      });
      basePoints = eachBase * payerCount;
      totalPoints = each * payerCount;
    } else {
      const dealerPayBase = roundUp100(base * 2);
      const otherPayBase = roundUp100(base * 1);
      const dealerPay = dealerPayBase + honbaPerPayer;
      const otherPay = otherPayBase + honbaPerPayer;
      const otherCount = playerCount - 2;
      payments.push({
        label: "親",
        baseAmount: dealerPayBase,
        amount: dealerPay,
      });
      basePoints = dealerPayBase;
      totalPoints = dealerPay;
      if (otherCount > 0) {
        payments.push({
          label: `子(${otherCount}人)各`,
          baseAmount: otherPayBase,
          amount: otherPay,
        });
        basePoints += otherPayBase * otherCount;
        totalPoints += otherPay * otherCount;
      }
    }
  }

  let tsumoLabelBase: string | null = null;
  let tsumoLabelTotal: string | null = null;
  if (winType === "tsumo") {
    if (isDealer) {
      tsumoLabelBase = `${payments[0].baseAmount}オール`;
      tsumoLabelTotal = `${payments[0].amount}オール`;
    } else {
      const dealerBase = payments[0].baseAmount;
      const otherBase = payments[1]?.baseAmount ?? payments[0].baseAmount;
      const dealerTotal = payments[0].amount;
      const otherTotal = payments[1]?.amount ?? payments[0].amount;
      tsumoLabelBase = `${dealerBase}・${otherBase}`;
      tsumoLabelTotal = `${dealerTotal}・${otherTotal}`;
    }
  }

  return {
    rankName,
    basePoints,
    totalPoints,
    kyotakuLabel,
    payments,
    tsumoLabelBase,
    tsumoLabelTotal,
  };
}
