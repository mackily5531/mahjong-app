import { useMemo } from "react";
import MainScreen from "./components/MainScreen";
import ResultScreen from "./components/ResultScreen";
import { useHandState } from "./hooks/useHandState";
import { findWinningTiles } from "./logic/tenpai";
import "./App.css";

function App() {
  const hand = useHandState();

  const expectedConcealedCount = 13 - hand.melds.length * 3;
  const isReady = hand.concealedTiles.length === expectedConcealedCount;

  const winningTiles = useMemo(() => {
    const base = findWinningTiles(hand.concealedTiles, hand.melds, hand.mode);

    // 5m/5p/5sが上がり牌に含まれ、かつ赤5がまだ手牌・副露・ドラ表示牌のどこにも使われていない場合、
    // 赤5での和了も選択肢として追加する
    const redAlreadyUsed = (suit: "m" | "p" | "s") =>
      hand.globalUsedTiles.some(
        (t) => t.suit === suit && t.rank === 5 && t.isRed,
      );

    const withRed = base.flatMap((tile) => {
      if (tile.rank !== 5 || tile.suit === "z") return [tile];
      if (redAlreadyUsed(tile.suit)) return [tile];
      return [tile, { suit: tile.suit, rank: 5, isRed: true }];
    });

    return withRed;
  }, [hand.concealedTiles, hand.melds, hand.mode, hand.globalUsedTiles]);

  return (
    <div className="app-layout">
      <MainScreen
        mode={hand.mode}
        concealedTiles={hand.concealedTiles}
        melds={hand.melds}
        settings={hand.settings}
        maxSelectable={hand.maxSelectable}
        canAddMeld={hand.canAddMeld}
        globalUsedTiles={hand.globalUsedTiles}
        nukiDoraMax={hand.nukiDoraMax}
        onModeChange={hand.setMode}
        onSelectTile={hand.selectTile}
        onRemoveTile={hand.removeTile}
        onAddMeld={hand.addMeld}
        onRemoveMeld={hand.removeMeld}
        onSettingsChange={hand.updateSettings}
        onResetHand={hand.resetHand}
        onResetAll={hand.resetAll}
      />
      <ResultScreen
        isReady={isReady}
        winningTiles={winningTiles}
        concealedTiles={hand.concealedTiles}
        melds={hand.melds}
        mode={hand.mode}
        settings={hand.settings}
      />
    </div>
  );
}

export default App;
