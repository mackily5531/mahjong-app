import type { YakuResult } from "../types/yaku";
import type { FuBreakdownItem } from "../logic/fu";
import type { YakumanResult } from "../logic/yakumanCheckers";
import styles from "./ScoreDetail.module.css";

interface ScoreDetailProps {
  isYakuman: boolean;
  yakumanList?: YakumanResult[];
  yakuList?: YakuResult[];
  fuItems?: FuBreakdownItem[];
  fuRawTotal?: number;
  fuRoundedTotal?: number;
  totalHan?: number;
  rankName: string | null;
  points: number;
  winType?: "tsumo" | "ron";
  payments?: { label: string; baseAmount: number; amount: number }[];
}

export default function ScoreDetail({
  isYakuman,
  yakumanList,
  yakuList,
  fuItems,
  fuRawTotal,
  fuRoundedTotal,
  totalHan,
  rankName,
  points,
  winType,
  payments,
}: ScoreDetailProps) {
  if (isYakuman) {
    return (
      <div className={styles.wrapper}>
        <ul className={styles.column}>
          {yakumanList?.map((y) => (
            <li key={y.key}>
              <span>{y.name}</span>
              <span className={styles.han}>
                {y.multiplier === 2 ? "ダブル役満" : "役満"}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.summary}>
          {rankName && <span className={styles.rankTag}>{rankName}</span>}
          <span className={styles.points}>{points}点</span>
        </div>

        {winType === "tsumo" && payments && payments.length > 0 && (
          <ul className={styles.column}>
            {payments.map((p, i) => (
              <li key={i}>
                <span>{p.label}</span>
                <span className={styles.han}>
                  {p.baseAmount !== p.amount
                    ? `${p.baseAmount}点 → ${p.amount}点`
                    : `${p.amount}点`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.columns}>
        <ul className={styles.column}>
          {fuItems?.map((item, i) => (
            <li key={i}>
              <span>{item.label}</span>
              <span className={styles.han}>{item.fu}符</span>
            </li>
          ))}
          <li className={styles.fuTotalLine}>
            <span>
              切り上げ({fuRawTotal}→{fuRoundedTotal})
            </span>
          </li>
        </ul>

        <ul className={styles.column}>
          {yakuList?.map((y) => (
            <li key={y.key}>
              <span>{y.name}</span>
              <span className={styles.han}>{y.han}飜</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.summary}>
        <span className={styles.fuHan}>
          {fuRoundedTotal}符 {totalHan}飜
        </span>
        {rankName && <span className={styles.rankTag}>{rankName}</span>}
        <span className={styles.points}>{points}点</span>
      </div>

      {winType === "tsumo" && payments && payments.length > 0 && (
        <ul className={styles.column}>
          {payments.map((p, i) => (
            <li key={i}>
              <span>{p.label}</span>
              <span className={styles.han}>
                {p.baseAmount !== p.amount
                  ? `${p.baseAmount}点 → ${p.amount}点`
                  : `${p.amount}点`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
