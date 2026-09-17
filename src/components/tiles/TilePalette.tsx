import type { Tile } from "../../types/tile";
import type { GameMode } from "../../types/gameMode";
import { generateTileKinds } from "../../types/tilePool";
import TileFace from "./TileFace";
import styles from "./TilePalette.module.css";

interface TilePaletteProps {
  mode: GameMode;
  handTileCount: number;
  maxSelectable: number;
  usedTilesForCount: Tile[];
  onSelect: (tile: Tile) => void;
}

const SUIT_ORDER: Tile["suit"][] = ["m", "p", "s", "z"];
const SUIT_TITLE: Record<Tile["suit"], string> = {
  m: "萬子",
  p: "筒子",
  s: "索子",
  z: "字牌",
};

// 牌の枚数を数える
function physicalCount(
  tiles: Tile[],
  suit: Tile["suit"],
  rank: number,
): number {
  return tiles.filter((t) => t.suit === suit && t.rank === rank).length;
}

function redCount(tiles: Tile[], suit: Tile["suit"], rank: number): number {
  return tiles.filter((t) => t.suit === suit && t.rank === rank && t.isRed)
    .length;
}

export default function TilePalette({
  mode,
  handTileCount,
  maxSelectable,
  usedTilesForCount,
  onSelect,
}: TilePaletteProps) {
  const kinds = generateTileKinds(mode);
  const handIsFull = handTileCount >= maxSelectable;

  return (
    <div className={styles.palette}>
      {SUIT_ORDER.map((suit) => {
        const suitKinds = kinds.filter((k) => k.suit === suit);
        if (suitKinds.length === 0) return null;
        return (
          <div key={suit} className={styles.row}>
            <span className={styles.suitLabel}>{SUIT_TITLE[suit]}</span>
            <div className={styles.tiles}>
              {suitKinds.map((tile) => {
                const usedOfThisRank = physicalCount(
                  usedTilesForCount,
                  tile.suit,
                  tile.rank,
                );
                // 赤5は現物が1枚しかないため、既に使われていたらこれ以上選べない
                const redUnavailable =
                  Boolean(tile.isRed) &&
                  redCount(usedTilesForCount, tile.suit, tile.rank) >= 1;
                const disabled =
                  handIsFull || usedOfThisRank >= 4 || redUnavailable;
                return (
                  <TileFace
                    key={`${tile.suit}${tile.rank}${tile.isRed ? "r" : ""}`}
                    tile={tile}
                    disabled={disabled}
                    onClick={() => onSelect(tile)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
