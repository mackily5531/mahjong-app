import type { Tile } from "../../types/tile";
import { tileLabel } from "../../types/tile";
import { tileImageUrl } from "../../types/tileImages";
import styles from "./TileFace.module.css";

interface TileFaceProps {
  tile: Tile;
  onClick?: () => void;
  disabled?: boolean;
}

export default function TileFace({ tile, onClick, disabled }: TileFaceProps) {
  return (
    <button
      type="button"
      className={`${styles.tile} ${disabled ? styles.disabled : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <img
        src={tileImageUrl(tile)}
        alt={tileLabel(tile)}
        className={styles.image}
        draggable={false}
      />
    </button>
  );
}
