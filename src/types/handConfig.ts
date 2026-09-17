import type { GameMode, Wind } from "./gameMode";
import type { Tile } from "./tile";
import type { Meld } from "./meld";


// 手牌の状態
export type RiichiState = "none" | "riichi" | "double";

export interface HandConfig {
  mode: GameMode;
  concealedTiles: Tile[];
  melds: Meld[];
  doraIndicators: Tile[];
  uraDoraIndicators: Tile[];
  honba: number;
  kyotaku: number;
  seatWind: Wind;
  roundWind: Wind;
  isRinshan: boolean;
  isChankan: boolean;
  isIppatsu: boolean;
  riichiState: RiichiState;
  isHaitei: boolean;
  isTenhouChihou: boolean;
  nukiDoraCount?: number;
}

export type HandSettings = Omit<
  HandConfig,
  "mode" | "concealedTiles" | "melds"
>;

export function defaultHandSettings(mode: GameMode): HandSettings {
  return {
    doraIndicators: [],
    uraDoraIndicators: [],
    honba: 0,
    kyotaku: 0,
    seatWind: "east",
    roundWind: "east",
    isRinshan: false,
    isChankan: false,
    isIppatsu: false,
    riichiState: "none",
    isHaitei: false,
    isTenhouChihou: false,
    nukiDoraCount: mode === "sanma" ? 0 : undefined,
  };
}
