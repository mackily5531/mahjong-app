import type { MeldDisplayItem } from "../../logic/meld";
import { tileImageUrl, tileBackImageUrl } from "../../types/tileImages";
import { tileLabel } from "../../types/tile";
import styles from "./MeldImages.module.css";

interface MeldImagesProps {
  items: MeldDisplayItem[];
}

export default function MeldImages({ items }: MeldImagesProps) {
  return (
    <div className={styles.row}>
      {items.map((item, i) =>
        item.kind === "back" ? (
          <img
            key={i}
            src={tileBackImageUrl()}
            alt="裏牌"
            className={styles.image}
            draggable={false}
          />
        ) : (
          <img
            key={i}
            src={tileImageUrl(item.tile)}
            alt={tileLabel(item.tile)}
            className={styles.image}
            draggable={false}
          />
        ),
      )}
    </div>
  );
}
