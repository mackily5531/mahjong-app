import { useState } from "react";
import type { Tile } from "../types/tile";
import type { Meld } from "../types/meld";
import type { GameMode } from "../types/gameMode";
import type { HandSettings } from "../types/handConfig";
import { evaluateYaku } from "../logic/yakuEvaluate";
import { evaluateYakuman } from "../logic/yakumanCheckers";
import { calculateFu } from "../logic/fu";
import { calculateScore } from "../logic/score";
import { tileToIndex } from "../logic/tileIndex";
import { WIND_INDEX } from "../logic/yakuCheckers";
import TileFace from "./tiles/TileFace";
import styles from "./ResultScreen.module.css";
import ScoreDetail from "./ScoreDetail";

interface ResultScreenProps {
  isReady: boolean;
  winningTiles: Tile[];
  concealedTiles: Tile[];
  melds: Meld[];
  mode: GameMode;
  settings: HandSettings;
}

type WinType = "tsumo" | "ron";

interface ResultRow {
  tile: Tile;
  winType: WinType;
}

export default function ResultScreen({
  isReady,
  winningTiles,
  concealedTiles,
  melds,
  mode,
  settings,
}: ResultScreenProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!isReady) {
    // 牌が揃っていない場合はメッセージを表示
    return (
      <div className={styles.panel}>
        <p className={styles.message}>牌を選択してください</p>
      </div>
    );
  }

  if (winningTiles.length === 0) {
    // 和了牌がない場合はノーテン表示
    return (
      <div className={styles.panel}>
        <p className={styles.message}>ノーテン</p>
      </div>
    );
  }

  const isMenzen = melds.every((m) => m.type === "ankan");
  const isDealer = settings.seatWind === "east";
  const playerCount = mode === "sanma" ? 3 : 4;

  const rows: ResultRow[] = winningTiles.flatMap((tile) => [
    { tile, winType: "tsumo" as const },
    { tile, winType: "ron" as const },
  ]);

  return (
    <div className={styles.panel}>
      <div className={styles.rows}>
        {rows.map((row, i) => {
          const key = `${i}-${row.winType}`;
          const isOpen = openKey === key;

          const yakumanResult = evaluateYakuman(
            concealedTiles,
            row.tile,
            melds,
            row.winType,
            settings,
          );
          const isYakuman = yakumanResult.totalMultiplier > 0;

          const result = isYakuman
            ? null
            : evaluateYaku(
                concealedTiles,
                row.tile,
                melds,
                mode,
                settings,
                row.winType,
              );

          const fuResult =
            !isYakuman && result && !result.isYakuless
              ? calculateFu({
                  groups: result.groups,
                  pairIndex: result.pairIndex,
                  winningIndex: tileToIndex(row.tile),
                  winType: row.winType,
                  isMenzen,
                  seatWindIndex: WIND_INDEX[settings.seatWind],
                  roundWindIndex: WIND_INDEX[settings.roundWind],
                  isPinfu: result.yaku.some((y) => y.key === "pinfu"),
                  isChiitoitsu: result.isChiitoitsu,
                })
              : null;

          const isYakuless = !isYakuman && (!result || result.isYakuless);

          const scoreResult = isYakuman
            ? calculateScore(
                0,
                0,
                row.winType,
                isDealer,
                playerCount,
                settings.honba,
                settings.kyotaku,
                yakumanResult.totalMultiplier,
              )
            : fuResult && result
              ? calculateScore(
                  fuResult.roundedTotal,
                  result.totalHan,
                  row.winType,
                  isDealer,
                  playerCount,
                  settings.honba,
                  settings.kyotaku,
                )
              : null;

          return (
            <div key={key} className={styles.rowWrapper}>
              <button
                type="button"
                className={styles.row}
                onClick={() => setOpenKey(isOpen ? null : key)}
              >
                <TileFace tile={row.tile} />
                <span className={styles.winTypeLabel}>
                  {row.winType === "tsumo" ? "ツモ" : "ロン"}
                </span>

                {isYakuless ? ( // 役無しの場合は役無しタグを表示
                  <span className={styles.yakulessTag}>役無し</span>
                ) : (
                  <div className={styles.pointsBlock}>
                    <div className={styles.pointsMain}>
                      {scoreResult?.rankName && (
                        <span className={styles.rankTag}>
                          {scoreResult.rankName}
                        </span>
                      )}
                      {row.winType === "tsumo" && // ツモの点数表記を作成
                      scoreResult?.tsumoLabelBase ? (
                        scoreResult.tsumoLabelBase !==
                        scoreResult.tsumoLabelTotal ? (
                          <span className={styles.points}>
                            {scoreResult.tsumoLabelBase} →{" "}
                            {scoreResult.tsumoLabelTotal}
                          </span>
                        ) : (
                          <span className={styles.points}>
                            {scoreResult.tsumoLabelBase}
                          </span>
                        )
                      ) : scoreResult && // ロンの点数表記を作成
                        scoreResult.basePoints !== scoreResult.totalPoints ? (
                        <span className={styles.points}>
                          {scoreResult.basePoints}点 → {scoreResult.totalPoints}
                          点
                        </span>
                      ) : (
                        <span className={styles.points}>
                          {scoreResult?.totalPoints}点
                        </span>
                      )}
                      {scoreResult?.kyotakuLabel && (
                        <span className={styles.bonus}>
                          {scoreResult.kyotakuLabel}
                        </span>
                      )}
                    </div>

                    {!isYakuman && fuResult && result && (
                      <span className={styles.fuHan}>
                        {fuResult.roundedTotal}符 {result.totalHan}飜
                      </span>
                    )}
                  </div>
                )}
              </button>
              {isOpen && ( // 展開部分
                <div className={styles.detail}>
                  {isYakuless ? (
                    <p className={styles.yakuless}>役無しです</p>
                  ) : isYakuman ? (
                    <ScoreDetail
                      isYakuman
                      yakumanList={yakumanResult.yakuman}
                      rankName={scoreResult?.rankName ?? null}
                      points={scoreResult?.basePoints ?? 0}
                      winType={row.winType}
                      payments={scoreResult?.payments}
                    />
                  ) : (
                    result &&
                    fuResult && (
                      <ScoreDetail
                        isYakuman={false}
                        yakuList={result.yaku}
                        fuItems={fuResult.items}
                        fuRawTotal={fuResult.rawTotal}
                        fuRoundedTotal={fuResult.roundedTotal}
                        totalHan={result.totalHan}
                        rankName={scoreResult?.rankName ?? null}
                        points={scoreResult?.basePoints ?? 0}
                        winType={row.winType}
                        payments={scoreResult?.payments}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
