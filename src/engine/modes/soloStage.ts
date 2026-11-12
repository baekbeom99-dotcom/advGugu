import { maxCardSize, MAX_CARD_SIZE } from '../../content/registry';
import { flowingDt, SOLO_FIELDS, soloCorrect, soloWrong } from '../solo/scoring';
import type { Mode } from '../state';

export const STAGE_COUNT = 20;
export const STAGE_TIME_MS = 20000;

/** 단계별 오답 패널티: 단계가 올라갈수록 틀렸을 때 시간이 더 많이 깎인다 (1~5단계 2초, 6~10단계 2.5초, 11단계 이상 3초) */
export function stagePenaltyMs(stage: number): number {
  if (stage >= 11) return 3000;
  if (stage >= 6) return 2500;
  return 2000;
}

export function stageParams(n: number, poolSize: number): { target: number; cardSize: number; timeMs: number } {
  return {
    target: Math.min(20, 6 + n),
    cardSize: Math.min(MAX_CARD_SIZE, maxCardSize(poolSize), 3 + Math.floor((n - 1) / 2)),
    timeMs: STAGE_TIME_MS,
  };
}

/** 클리어할 때 남은 시간 비율로 별을 준다 */
export function stageStars(timeLeft: number, timeMs: number): 1 | 2 | 3 {
  const ratio = timeLeft / timeMs;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}

export const soloStage: Mode = {
  init: config => ({
    ...SOLO_FIELDS,
    timeLeft: STAGE_TIME_MS,
    target: stageParams(config.stage ?? 1, 0).target,
    cleared: 0,
    stars: 0,
  }),
  onCorrect: s => {
    const { mode, events } = soloCorrect(s);
    const cleared = mode.correct >= mode.target;
    const next = cleared ? { ...mode, cleared: 1, stars: stageStars(mode.timeLeft, STAGE_TIME_MS) } : mode;
    return { state: { ...s, mode: next }, nextRound: !cleared, events };
  },
  onWrong: s => {
    const penalty = stagePenaltyMs(s.config.stage ?? 1);
    return { ...s, mode: { ...soloWrong(s.mode), timeLeft: s.mode.timeLeft - penalty } };
  },
  onTick: (s, dt) => ({ state: { ...s, mode: { ...s.mode, timeLeft: s.mode.timeLeft - flowingDt(s, dt) } } }),
  isOver: s => s.mode.cleared === 1 || s.mode.timeLeft <= 0,
};
