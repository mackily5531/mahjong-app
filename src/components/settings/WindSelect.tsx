import type { Wind } from "../../types/gameMode";
import styles from "./WindSelect.module.css";

const WIND_LABEL: Record<Wind, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

interface WindSelectProps {
  label: string;
  value: Wind;
  options: Wind[];
  onChange: (wind: Wind) => void;
}

export default function WindSelect({
  label,
  value,
  options,
  onChange,
}: WindSelectProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.buttons}>
        {options.map((w) => (
          <button
            key={w}
            type="button"
            className={value === w ? styles.active : ""}
            onClick={() => onChange(w)}
          >
            {WIND_LABEL[w]}
          </button>
        ))}
      </div>
    </div>
  );
}
