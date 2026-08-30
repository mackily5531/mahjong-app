import type { Tile } from "../types/tile";
import type { GameMode } from "../types/gameMode";
import type { Meld } from "../types/meld";
import type { HandSettings } from "../types/handConfig";
import SelectionPalette from "./tiles/SelectionPalette";
import HandRow from "./tiles/HandRow";
import SettingsPanel from "./SettingsPanel";
import styles from "./MainScreen.module.css";
import ResetButtons from "./tiles/ResetButtons";

interface MainScreenProps {
  mode: GameMode;
  concealedTiles: Tile[];
  melds: Meld[];
  settings: HandSettings;
  maxSelectable: number;
  canAddMeld: boolean;
  globalUsedTiles: Tile[];
  nukiDoraMax: number;
  onModeChange: (mode: GameMode) => void;
  onSelectTile: (tile: Tile) => void;
  onRemoveTile: (index: number) => void;
  onAddMeld: (meld: Meld) => void;
  onRemoveMeld: (index: number) => void;
  onSettingsChange: (patch: Partial<HandSettings>) => void;
  onResetHand: () => void;
  onResetAll: () => void;
}

export default function MainScreen({
  mode,
  concealedTiles,
  melds,
  settings,
  maxSelectable,
  canAddMeld,
  globalUsedTiles,
  nukiDoraMax,
  onModeChange,
  onSelectTile,
  onRemoveTile,
  onAddMeld,
  onRemoveMeld,
  onSettingsChange,
  onResetHand,
  onResetAll,
}: MainScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={mode === "yonma" ? styles.active : ""}
          onClick={() => onModeChange("yonma")}
        >
          四麻
        </button>
        <button
          type="button"
          className={mode === "sanma" ? styles.active : ""}
          onClick={() => onModeChange("sanma")}
        >
          三麻
        </button>
      </div>

      <ResetButtons onResetHand={onResetHand} onResetAll={onResetAll} />

      <HandRow
        tiles={concealedTiles}
        melds={melds}
        maxSelectable={maxSelectable}
        onRemoveTile={onRemoveTile}
        onRemoveMeld={onRemoveMeld}
      />

      <SelectionPalette
        mode={mode}
        handTileCount={concealedTiles.length}
        maxSelectable={maxSelectable}
        usedTilesForCount={globalUsedTiles}
        onSelectTile={onSelectTile}
        onAddMeld={onAddMeld}
        canAddMeld={canAddMeld}
      />

      <SettingsPanel
        mode={mode}
        settings={settings}
        onChange={onSettingsChange}
        globalUsedTiles={globalUsedTiles}
        nukiDoraMax={nukiDoraMax}
      />
    </div>
  );
}
