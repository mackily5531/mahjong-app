import { useState } from "react";
import type { Tile } from "../../types/tile";
import type { GameMode } from "../../types/gameMode";
import { generateTileKinds } from "../../types/tilePool";
import { countTileKind } from "../../logic/tileUsage";
import TileFace from "../tiles/TileFace";
import styles from "./DoraIndicatorRow.module.css";

interface DoraIndicatorRowProps {
  label: string;
  mode: GameMode;
  indicators: Tile[];
  globalUsedTiles: Tile[]; // 手牌・副露・他のドラ表示牌・抜きドラを含む全使用済み牌
  onChange: (tiles: Tile[]) => void;
  max: number;
}

export default function DoraIndicatorRow({
  label,
  mode,
  indicators,
  globalUsedTiles,
  onChange,
  max,
}: DoraIndicatorRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const kinds = generateTileKinds(mode).filter((t) => !t.isRed);

  function handleAdd(tile: Tile) {
    if (indicators.length >= max) return;
    // globalUsedTilesには自分自身(indicators)も含まれているので、そのまま4枚上限として比較できる
    if (countTileKind(globalUsedTiles, tile.suit, tile.rank) >= 4) return;
    onChange([...indicators, tile]);
  }

  function handleRemove(index: number) {
    onChange(indicators.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.count}>
          {indicators.length} / {max}
        </span>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setPickerOpen((v) => !v)}
        >
          {pickerOpen ? "閉じる" : "追加"}
        </button>
      </div>

      <div className={styles.selected}>
        {indicators.map((tile, index) => (
          <TileFace
            key={index}
            tile={tile}
            onClick={() => handleRemove(index)}
          />
        ))}
      </div>

      {pickerOpen && (
        <div className={styles.picker}>
          {kinds.map((tile) => {
            const disabled =
              indicators.length >= max ||
              countTileKind(globalUsedTiles, tile.suit, tile.rank) >= 4;
            return (
              <TileFace
                key={`${tile.suit}${tile.rank}`}
                tile={tile}
                disabled={disabled}
                onClick={() => handleAdd(tile)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
