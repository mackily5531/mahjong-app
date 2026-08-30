import { useState } from "react";
import type { Tile } from "../types/tile";
import type { GameMode } from "../types/gameMode";
import type { Meld } from "../types/meld";
import { MELD_TILE_COUNT } from "../types/meld";
import type { HandSettings } from "../types/handConfig";
import { defaultHandSettings } from "../types/handConfig";
import { buildGlobalUsedTiles, countTileKind } from "../logic/tileUsage";

const MAX_HAND_TILES = 13;

export function useHandState() {
  const [mode, setModeState] = useState<GameMode>("yonma");
  const [concealedTiles, setConcealedTiles] = useState<Tile[]>([]);
  const [melds, setMelds] = useState<Meld[]>([]);
  const [settings, setSettings] = useState<HandSettings>(
    defaultHandSettings("yonma"),
  );

  const maxSelectable = MAX_HAND_TILES - melds.length * MELD_TILE_COUNT;
  const canAddMeld =
    concealedTiles.length + (melds.length + 1) * MELD_TILE_COUNT <=
    MAX_HAND_TILES;

  const globalUsedTiles = buildGlobalUsedTiles({
    concealedTiles,
    melds,
    doraIndicators: settings.doraIndicators,
    uraDoraIndicators: settings.uraDoraIndicators,
    nukiDoraCount: settings.nukiDoraCount,
  });

  const northUsageExcludingNuki = countTileKind(
    buildGlobalUsedTiles({
      concealedTiles,
      melds,
      doraIndicators: settings.doraIndicators,
      uraDoraIndicators: settings.uraDoraIndicators,
      nukiDoraCount: 0,
    }),
    "z",
    4,
  );
  const nukiDoraMax = Math.max(0, 4 - northUsageExcludingNuki);

  function setMode(nextMode: GameMode) {
    setModeState(nextMode);
    setConcealedTiles([]);
    setMelds([]);
    setSettings(defaultHandSettings(nextMode));
  }

  function selectTile(tile: Tile) {
    if (concealedTiles.length >= maxSelectable) return;
    setConcealedTiles((prev) => [...prev, tile]);
  }

  function removeTile(index: number) {
    setConcealedTiles((prev) => prev.filter((_, i) => i !== index));
  }

  function addMeld(meld: Meld) {
    setMelds((prev) => [...prev, meld]);
  }

  function removeMeld(index: number) {
    setMelds((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSettings(patch: Partial<HandSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }
  function resetHand() {
    setConcealedTiles([]);
    setMelds([]);
  }

  function resetAll() {
    setConcealedTiles([]);
    setMelds([]);
    setSettings(defaultHandSettings(mode));
  }

  return {
    mode,
    concealedTiles,
    melds,
    settings,
    maxSelectable,
    canAddMeld,
    globalUsedTiles,
    nukiDoraMax,
    setMode,
    selectTile,
    removeTile,
    addMeld,
    removeMeld,
    updateSettings,
    resetHand,
    resetAll,
  };
}
