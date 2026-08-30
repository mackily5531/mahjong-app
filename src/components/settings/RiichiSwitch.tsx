import type { RiichiState } from "../../types/handConfig";
import styles from "./RiichiSwitch.module.css";

interface RiichiSwitchProps {
  value: RiichiState;
  onChange: (value: RiichiState) => void;
}

const OPTIONS: { value: RiichiState; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "riichi", label: "リーチ" },
  { value: "double", label: "ダブリー" },
];

export default function RiichiSwitch({ value, onChange }: RiichiSwitchProps) {
  return (
    <div className={styles.switch}>
      <span className={styles.label}>リーチ</span>
      <div className={styles.buttons}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={value === opt.value ? styles.active : ""}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
