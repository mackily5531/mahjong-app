export type GameMode = "yonma" | "sanma";

// 自風・場風。三麻では北家が存在しないため選択肢から除外する想定
export type Wind = "east" | "south" | "west" | "north";

export function availableWinds(mode: GameMode): Wind[] {
  return mode === "sanma"
    ? ["east", "south", "west"]
    : ["east", "south", "west", "north"];
}
