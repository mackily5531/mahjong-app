import type { MeldOption } from "../../logic/meld";
import { meldDisplayItems } from "../../logic/meld";
import MeldImages from "./MeldImages";
import styles from "./MeldOptionCard.module.css";

interface MeldOptionCardProps {
  option: MeldOption;
  disabled: boolean;
  onSelect: () => void;
}

export default function MeldOptionCard({
  option,
  disabled,
  onSelect,
}: MeldOptionCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={onSelect}
      disabled={disabled}
    >
      <MeldImages items={meldDisplayItems(option.type, option.tiles)} />
    </button>
  );
}
