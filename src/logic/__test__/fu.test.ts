import { describe, it, expect } from 'vitest';
import { evaluateYaku } from '../yakuEvaluate';
import { calculateFu } from '../fu';
import { tileToIndex } from '../tileIndex';
import { WIND_INDEX } from '../yakuCheckers';
import { defaultHandSettings } from '../../types/handConfig';
import type { Tile } from '../../types/tile';

function tiles(spec: string): Tile[] {
  const result: Tile[] = [];
  for (const chunk of spec.trim().split(/\s+/)) {
    const suit = chunk[chunk.length - 1] as Tile['suit'];
    const ranks = chunk.slice(0, -1);
    for (const r of ranks) {
      result.push({ suit, rank: Number(r) });
    }
  }
  return result;
}

// 233333p 555s 777s 55m 99p のシャンポン待ち(5mまたは9pで和了)
// 対々和+三暗刻(+門前清自摸和)で飜数はどちらも同じだが、
// 9pは老頭牌の暗刻(8符)、5mは中張牌の暗刻(4符)なので符が変わる
const hand = [...tiles('222p'), ...tiles('555s'), ...tiles('777s'), ...tiles('55m'), ...tiles('99p')];
const settings = defaultHandSettings('yonma');

function fuFor(winningTile: Tile) {
  const result = evaluateYaku(hand, winningTile, [], 'yonma', settings, 'tsumo');
  const fu = calculateFu({
    groups: result.groups,
    pairIndex: result.pairIndex,
    winningIndex: tileToIndex(winningTile),
    winType: 'tsumo',
    isMenzen: true,
    seatWindIndex: WIND_INDEX[settings.seatWind],
    roundWindIndex: WIND_INDEX[settings.roundWind],
    isPinfu: false,
    isChiitoitsu: false,
  });
  return { result, fu };
}

describe('シャンポン待ちの符計算', () => {
  it('中張牌(5m)の暗刻は符が低い', () => {
    const { result, fu } = fuFor({ suit: 'm', rank: 5 });
    expect(result.isYakuless).toBe(false);
    expect(fu.roundedTotal).toBe(40);
  });

  it('老頭牌(9p)の暗刻は符が高い', () => {
    const { result, fu } = fuFor({ suit: 'p', rank: 9 });
    expect(result.isYakuless).toBe(false);
    expect(fu.roundedTotal).toBe(50);
  });

  it('飜数はどちらの待ちでも同じ', () => {
    const a = fuFor({ suit: 'm', rank: 5 });
    const b = fuFor({ suit: 'p', rank: 9 });
    expect(a.result.totalHan).toBe(b.result.totalHan);
  });
});