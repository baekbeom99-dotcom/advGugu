import type { Ellipse } from './geometry';
import type { TableGeom } from './seats';

/** 해(또는 달)가 왼쪽 중간에서 오른쪽 중간까지 가는 데 걸리는 정답 수 */
export const SKY_STEPS = 7;
/** 화면 가장자리와 해 사이 여백 (짧은 변 대비) */
export const SKY_MARGIN = 0.03;

/**
 * 혼자 하기 거북이 뒤통수(엄지손가락 모양 기둥). 자리 타원 반지름 단위:
 * 가로 반폭 halfWidth, 꼭대기는 등껍질 아래 끝에서 top배 높이.
 */
export const TURTLE_HEAD = { halfWidth: 0.36, top: 1.3 } as const;

export type SkyBody = 'sun' | 'moon';
/** t: 0 왼쪽 중간(뜰 때) → 0.5 위 가운데 → 1 오른쪽 중간(질 때) */
export interface SkyPhase { body: SkyBody; t: number }

/** 정답 수로 지금 해·달과 위치를 정한다. 해가 오른쪽에 닿으면 왼쪽에서 달이 뜬다 */
export function skyPhase(correct: number): SkyPhase {
  const k = ((correct % (2 * SKY_STEPS)) + 2 * SKY_STEPS) % (2 * SKY_STEPS);
  return { body: k < SKY_STEPS ? 'sun' : 'moon', t: (k % SKY_STEPS) / (SKY_STEPS - 1) };
}

/** 반지름 R인 해의 중심. 세로 화면에서는 상단 하늘 영역에서 완만한 호를 그리며 이동하고, 가로 화면에서는 수평선에서 떠서 위로 반타원을 그린다 */
export function skyArc(W: number, H: number, R: number, t: number): Ellipse {
  const isPortrait = H >= W;
  if (isPortrait) {
    // 세로 화면: 수면으로 내려오지 않고 하늘 상단 영역(H*0.20 ~ H*0.30)에서 완만한 포물선 호를 그림
    // 좌우 여백 확보 (화면 테두리 안쪽 최소 18px 확보하여 카드가 절대 잘리지 않음)
    const minCx = R + 18;
    const maxCx = W - R - 18;
    const ampX = Math.max(0, (maxCx - minCx) / 2);
    const midX = W / 2;
    const angle = Math.PI * t;
    const cx = midX - ampX * Math.cos(angle);

    // Y축: t=0(뜰 때)와 t=1(질 때)는 H * 0.30, t=0.5(한낮/정점)은 H * 0.20
    // 수면(보통 H*0.48 이상)까지 절대 내려오지 않고 하늘 영역에서 유려하게 이동
    const baseY = H * 0.30;
    const ampY = H * 0.10;
    const cy = baseY - ampY * Math.sin(angle);

    return { cx, cy, rx: R, ry: R };
  }
  const m = SKY_MARGIN * Math.min(W, H);
  const a = W / 2 - m - R, b = H / 2 - m - R;
  const angle = Math.PI * t;
  return { cx: W / 2 - a * Math.cos(angle), cy: H / 2 - b * Math.sin(angle), rx: R, ry: R };
}

export function skyCenter(table: TableGeom, W: number, H: number, t: number): Ellipse {
  return skyArc(W, H, table.center.rx, t);
}

type Keys = [string, string, string];
const PALETTE: Record<SkyBody, { sky: Keys; sea: Keys }> = {
  // 해 뜰 녘 → 한낮 → 해 질 녘
  sun: { sky: ['#ffc2a8', '#9adcff', '#ffa877'], sea: ['#5f93bd', '#3aa3d4', '#4f6fa6'] },
  // 초저녁 → 한밤 → 새벽 전
  moon: { sky: ['#5d4f9c', '#262d5e', '#4c4188'], sea: ['#2d4079', '#17214b', '#2a3b74'] },
};

function mix(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const c = [16, 8, 0].map(s => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function along(keys: Keys, t: number): string {
  return t <= 0.5 ? mix(keys[0], keys[1], t / 0.5) : mix(keys[1], keys[2], (t - 0.5) / 0.5);
}

/** 해·달 위치에 어울리는 하늘·바다 색 */
export function skyPalette(p: SkyPhase): { sky: string; sea: string } {
  const k = PALETTE[p.body];
  return { sky: along(k.sky, p.t), sea: along(k.sea, p.t) };
}
