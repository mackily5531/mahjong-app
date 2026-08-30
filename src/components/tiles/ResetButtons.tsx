import styles from "./ResetButtons.module.css";

interface ResetButtonsProps {
  onResetHand: () => void;
  onResetAll: () => void;
}

export default function ResetButtons({
  onResetHand,
  onResetAll,
}: ResetButtonsProps) {
  return (
    <div className={styles.row}>
      <button type="button" className={styles.hand} onClick={onResetHand}>
        手牌リセット
      </button>
      <button type="button" className={styles.all} onClick={onResetAll}>
        全リセット
      </button>
    </div>
  );
}
