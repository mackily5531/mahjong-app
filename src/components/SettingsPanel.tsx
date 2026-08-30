import type { GameMode } from "../types/gameMode";
import { availableWinds } from "../types/gameMode";
import type { Tile } from "../types/tile";
import type { HandSettings } from "../types/handConfig";
import DoraIndicatorRow from "./settings/DoraIndicatorRow";
import CounterField from "./settings/CounterField";
import WindSelect from "./settings/WindSelect";
import ToggleField from "./settings/ToggleField";
import RiichiSwitch from "./settings/RiichiSwitch";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  mode: GameMode;
  settings: HandSettings;
  onChange: (patch: Partial<HandSettings>) => void;
  globalUsedTiles: Tile[];
  nukiDoraMax: number;
}

export default function SettingsPanel({
  mode,
  settings,
  onChange,
  globalUsedTiles,
  nukiDoraMax,
}: SettingsPanelProps) {
  const winds = availableWinds(mode);

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <DoraIndicatorRow
          label="ドラ表示牌"
          mode={mode}
          indicators={settings.doraIndicators}
          globalUsedTiles={globalUsedTiles}
          onChange={(tiles) => onChange({ doraIndicators: tiles })}
          max={5}
        />
        <DoraIndicatorRow
          label="裏ドラ表示牌"
          mode={mode}
          indicators={settings.uraDoraIndicators}
          globalUsedTiles={globalUsedTiles}
          onChange={(tiles) => onChange({ uraDoraIndicators: tiles })}
          max={5}
        />
        {mode === "sanma" && (
          <CounterField
            label="抜きドラ"
            value={settings.nukiDoraCount ?? 0}
            onChange={(v) => onChange({ nukiDoraCount: v })}
            max={nukiDoraMax}
          />
        )}
      </div>

      <div className={styles.section}>
        <CounterField
          label="本場"
          value={settings.honba}
          onChange={(v) => onChange({ honba: v })}
        />
        <CounterField
          label="供託(本)"
          value={settings.kyotaku}
          onChange={(v) => onChange({ kyotaku: v })}
        />
      </div>

      <div className={styles.section}>
        <WindSelect
          label="自風"
          value={settings.seatWind}
          options={winds}
          onChange={(w) => onChange({ seatWind: w })}
        />
        <WindSelect
          label="場風"
          value={settings.roundWind}
          options={winds}
          onChange={(w) => onChange({ roundWind: w })}
        />
      </div>

      <div className={styles.section}>
        <RiichiSwitch
          value={settings.riichiState}
          onChange={(v) => onChange({ riichiState: v })}
        />
      </div>

      <div className={styles.flags}>
        <ToggleField
          label="一発"
          checked={settings.isIppatsu}
          onChange={(v) => onChange({ isIppatsu: v })}
        />
        <ToggleField
          label="嶺上開花"
          checked={settings.isRinshan}
          onChange={(v) => onChange({ isRinshan: v })}
        />
        <ToggleField
          label="槍槓"
          checked={settings.isChankan}
          onChange={(v) => onChange({ isChankan: v })}
        />
        <ToggleField
          label="海底/河底"
          checked={settings.isHaitei}
          onChange={(v) => onChange({ isHaitei: v })}
        />
        <ToggleField
          label="天和/地和"
          checked={settings.isTenhouChihou}
          onChange={(v) => onChange({ isTenhouChihou: v })}
        />
      </div>
    </div>
  );
}
