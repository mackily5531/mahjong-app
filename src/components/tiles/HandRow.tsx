import type { Tile } from "../../types/tile";
import type { Meld } from "../../types/meld";
import { meldDisplayItems, meldLabel } from "../../logic/meld";
import TileFace from "./TileFace";
import MeldImages from "./MeldImages";
import styles from "./HandRow.module.css";

interface HandRowProps {
  tiles: Tile[];
  melds: Meld[];
  maxSelectable: number;
  onRemoveTile: (index: number) => void;
  onRemoveMeld: (index: number) => void;
}

const SUIT_ORDER: Record<Tile["suit"], number> = { m: 0, p: 1, s: 2, z: 3 };

export default function HandRow({
  tiles,
  melds,
  maxSelectable,
  onRemoveTile,
  onRemoveMeld,
}: HandRowProps) {
  const withIndex = tiles.map((tile, index) => ({ tile, index }));
  withIndex.sort((a, b) => {
    if (a.tile.suit !== b.tile.suit)
      return SUIT_ORDER[a.tile.suit] - SUIT_ORDER[b.tile.suit];
    if (a.tile.rank !== b.tile.rank) return a.tile.rank - b.tile.rank;
    return (a.tile.isRed ? 0 : 1) - (b.tile.isRed ? 0 : 1);
  });

  return (
    <div className={styles.hand}>
      <div className={styles.header}>
        <span>手牌</span>
        <span className={styles.count}>
          {tiles.length} / {maxSelectable}
        </span>
      </div>
      <div className={styles.row}>
        <div className={styles.concealed}>
          {withIndex.map(({ tile, index }) => (
            <TileFace
              key={`${tile.suit}${tile.rank}${tile.isRed ? "r" : ""}-${index}`}
              tile={tile}
              onClick={() => onRemoveTile(index)}
            />
          ))}
          {tiles.length === 0 && melds.length === 0 && (
            <span className={styles.empty}>牌を選択してください</span>
          )}
        </div>

        {melds.length > 0 && (
          <div className={styles.melds}>
            {melds.map((meld, index) => (
              <button
                key={index}
                type="button"
                className={styles.meldGroup}
                onClick={() => onRemoveMeld(index)}
                title={`${meldLabel(meld)}を削除`}
              >
                <MeldImages items={meldDisplayItems(meld.type, meld.tiles)} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
