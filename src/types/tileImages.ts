import type { Tile, Suit } from "./tile";

const SUIT_PREFIX: Record<Suit, string> = {
  m: "manzu",
  p: "pinzu",
  s: "souzu",
  z: "jihai",
};

// 例: 5萬 → "manzu05", 赤5萬 → "manzu05r"
export function tileImageBaseName(tile: Tile): string {
  const rankStr = String(tile.rank).padStart(2, "0");
  const redSuffix = tile.isRed ? "r" : "";
  return `${SUIT_PREFIX[tile.suit]}${rankStr}${redSuffix}`;
}

// src/assets/tiles配下のpngをビルド時に一括取得し、ファイル名→URLの対応表を作る
const imageModules = import.meta.glob("../assets/tiles/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const imageMap: Record<string, string> = {};
for (const path in imageModules) {
  const fileName = path.split("/").pop()?.replace(".png", "") ?? "";
  imageMap[fileName] = imageModules[path].default;
}

// 牌画像のURLを取得する
export function tileImageUrl(tile: Tile): string {
  const key = tileImageBaseName(tile);
  const url = imageMap[key];
  if (!url) {
    console.warn(`牌画像が見つかりません: ${key}.png`);
  }
  return url ?? "";
}

export function tileBackImageUrl(): string {
  const url = imageMap["haiura"];
  if (!url) {
    console.warn("牌画像が見つかりません: haiura.png");
  }
  return url ?? "";
}
