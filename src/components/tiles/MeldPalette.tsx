import type { Tile } from "../../types/tile";
import type { GameMode } from "../../types/gameMode";
import type { Meld, MeldType } from "../../types/meld";
import { generateMeldOptions, canPlaceMeld } from "../../logic/meld";
import MeldOptionCard from "./MeldOptionCard";
import styles from "./MeldPalette.module.css";

interface MeldPaletteProps {
  type: MeldType;
  mode: GameMode;
  onAdd: (meld: Meld) => void;
  canAdd: boolean;
  usedTilesForCount: Tile[];
}

export default function MeldPalette({
  type,
  mode,
  onAdd,
  canAdd,
  usedTilesForCount,
}: MeldPaletteProps) {
  const options = generateMeldOptions(type, mode);

  return (
    <div className={styles.grid}>
      {options.map((option, i) => {
        const disabled =
          !canAdd || !canPlaceMeld(option.tiles, usedTilesForCount);
        return (
          <MeldOptionCard
            key={i}
            option={option}
            disabled={disabled}
            onSelect={() => onAdd({ type: option.type, tiles: option.tiles })}
          />
        );
      })}
    </div>
  );
}
