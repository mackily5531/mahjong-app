export type GameMode = "yonma" | "sanma";

// 自風・場風
export type Wind = "east" | "south" | "west" | "north";

export function availableWinds(mode: GameMode): Wind[] {
  return mode === "sanma"
    ? ["east", "south", "west"]
    : ["east", "south", "west", "north"];
}
