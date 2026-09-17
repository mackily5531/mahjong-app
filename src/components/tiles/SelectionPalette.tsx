import { useState } from "react";
import type { Tile } from "../../types/tile";
import type { GameMode } from "../../types/gameMode";
import type { Meld, MeldType } from "../../types/meld";
import TilePalette from "./TilePalette";
import MeldPalette from "./MeldPalette";
import styles from "./SelectionPalette.module.css";

interface SelectionPaletteProps {
  mode: GameMode;
  handTileCount: number;
  maxSelectable: number;
  usedTilesForCount: Tile[];
  onSelectTile: (tile: Tile) => void;
  onAddMeld: (meld: Meld) => void;
  canAddMeld: boolean;
}

type PaletteTab = "tiles" | MeldType;

function buildTabs(mode: GameMode): { tab: PaletteTab; label: string }[] {
  const tabs: { tab: PaletteTab; label: string }[] = [
    { tab: "tiles", label: "手牌" },
  ];
  tabs.push({ tab: "pon", label: "ポン" });
  if (mode === "yonma") {
    tabs.push({ tab: "chi", label: "チー" }); // 三麻はチー無し
  }
  tabs.push({ tab: "minkan", label: "明槓" });
  tabs.push({ tab: "ankan", label: "暗槓" });
  return tabs;
}

export default function SelectionPalette({
  mode,
  handTileCount,
  maxSelectable,
  usedTilesForCount,
  onSelectTile,
  onAddMeld,
  canAddMeld,
}: SelectionPaletteProps) {
  const [tab, setTab] = useState<PaletteTab>("tiles");

  const tabs = buildTabs(mode);
  const activeTab = mode === "sanma" && tab === "chi" ? "tiles" : tab;

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {tabs.map(({ tab: t, label }) => (
          <button
            key={t}
            type="button"
            className={activeTab === t ? styles.active : ""}
            onClick={() => setTab(t)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {activeTab === "tiles" ? (
          <TilePalette
            mode={mode}
            handTileCount={handTileCount}
            maxSelectable={maxSelectable}
            usedTilesForCount={usedTilesForCount}
            onSelect={onSelectTile}
          />
        ) : (
          <MeldPalette
            type={activeTab}
            mode={mode}
            onAdd={onAddMeld}
            canAdd={canAddMeld}
            usedTilesForCount={usedTilesForCount}
          />
        )}
      </div>
    </div>
  );
}
