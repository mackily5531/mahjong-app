import styles from "./CounterField.module.css";

interface CounterFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function CounterField({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: CounterFieldProps) {
  const atMax = typeof max === "number" && value >= max;
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
        >
          -
        </button>
        <span className={styles.value}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max ?? Infinity, value + step))}
          disabled={atMax}
        >
          +
        </button>
      </div>
    </div>
  );
}
