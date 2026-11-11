import type { GameState } from './state';

/** 상대방 인덱스 (나를 뺀 모든 사람) */
export function opponentsOf(s: GameState, player: number): number[] {
  return s.players
    .map((_, i) => i)
    .filter(i => i !== player);
}

export interface Standing {
  /** 공동 순위는 같은 수 (1, 1 …) */
  rank: number;
  label: string;
  players: number[];
  /** 점수·장수 */
  value: number;
  winner: boolean;
  /** 폭탄 돌리기에서 진 쪽 중 가장 많이 든 항목 */
  bomb: boolean;
}

type Entry = Omit<Standing, 'rank' | 'winner' | 'bomb'>;

function entries(s: GameState): Entry[] {
  const { config } = s;
  if (config.mode === 'soloSurvival') return [{ label: config.players[0].name, players: [0], value: s.mode.correct }];
  if (config.mode === 'coop') return [{ label: '우리 팀', players: config.players.map((_, i) => i), value: s.coop?.stage ?? 1 }];
  return config.players.map((p, i) => ({ label: p.name, players: [i], value: s.players[i].score }));
}

/** 결과 순위. 폭탄 돌리기는 적게 든 쪽이 위이고, 0장인 사람이 1위다 */
export function standings(s: GameState): Standing[] {
  const isBomb = s.config.mode === 'bomb';
  const list = entries(s);
  const sorted = [...list].sort((a, b) => isBomb ? a.value - b.value : b.value - a.value);
  const top = sorted[0]?.value;
  const bottom = sorted[sorted.length - 1]?.value;

  let currentRank = 1;
  return sorted.map((entry, idx) => {
    if (idx > 0 && entry.value !== sorted[idx - 1].value) {
      currentRank = idx + 1;
    }
    const isWinner = isBomb ? entry.value === 0 || entry.value === top : entry.value === top && entry.value > 0;
    const isBombLoser = isBomb && entry.value === bottom && entry.value > 0;
    return {
      ...entry,
      rank: currentRank,
      winner: isWinner,
      bomb: isBombLoser,
    };
  });
}

/** 팀 총점 (팀 대결 미사용 시 항상 null) */
export function teamTotals(_s: GameState): number[] | null {
  return null;
}
