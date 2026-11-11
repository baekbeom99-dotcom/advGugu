import { pointInRegion, type Ellipse, type Rect, type Region } from './geometry';
import { skyArc } from './sky';

export const SEAT_COLORS = {
  pink: '#F4AEBD',
  sky: '#A3D2E6',
  yellow: '#F4D97F',
  lime: '#C2DF97',
  purple: '#C3B6F2',
} as const;
export type SeatColor = keyof typeof SEAT_COLORS;

export interface SeatGeom {
  index: number;
  region: Region;
  facing: 0 | 180;
  badge: Rect;
  /** 콤보·아이템·대상 버튼 칸 */
  extras?: Rect;
}

export interface TableGeom {
  center: Ellipse;
  seats: SeatGeom[];
  hud: { rect: Rect; facing: 0 | 180 }[];
  /** 협동 불 게이지 자리 */
  gauges: { rect: Rect; facing: 0 | 180 }[];
  /** 게임 중 나가기 버튼 자리 */
  exit: Rect;
}

export interface TableOptions {
  tallHud?: boolean;
  sky?: boolean;
  coop?: boolean;
  hudBox?: { w: number; h: number };
}

export const EXIT_W = 60;
export const EXIT_H = 34;

/**
 * 모바일 세로 화면(Portrait, H > W) 및 태블릿 대응 좌석 계산기 (1~2인 전용)
 */
export function computeTable(playerCount: 1 | 2, W: number, H: number, opts: TableOptions = {}): TableGeom {
  const isPortrait = H >= W;
  const coop = !!opts.coop;
  const screen: Rect = { x: 0, y: 0, w: W, h: H };

  if (playerCount === 1) {
    if (opts.sky) return skyTable(W, H, screen);
    if (coop) return soloCoopTable(W, H, screen);
    return soloTable(W, H, screen);
  }

  // 2인 플레이
  return twoPlayerTable(W, H, screen, coop, isPortrait);
}

/** 1인 기본 테이블 */
function soloTable(W: number, H: number, screen: Rect): TableGeom {
  const isPortrait = H >= W;
  const centerR = isPortrait ? Math.min(W * 0.22, H * 0.12) : Math.min(W * 0.22, H * 0.22);
  const center = isPortrait ? skyArc(W, H, centerR, 0) : { cx: W / 2, cy: H * 0.28, rx: centerR, ry: centerR };

  // 플레이어 카드: 하단 원/타원
  const seatRx = isPortrait ? W * 0.46 : W * 0.38;
  const seatRy = isPortrait ? H * 0.24 : H * 0.36;
  const seatCy = H; // 화면 하단에 반원처럼 걸침
  const seatEllipse: Ellipse = { cx: W / 2, cy: seatCy, rx: seatRx, ry: seatRy };

  const hudW = Math.min(W * 0.42, 140);
  const hudH = isPortrait ? 52 : 36;
  const hudRect: Rect = { x: 14, y: 14, w: hudW, h: hudH };

  const badgeW = 90;
  const badgeH = 34;
  const badge: Rect = { x: 14, y: H - seatRy - badgeH - 10, w: badgeW, h: badgeH };
  const extras: Rect = { x: W - 14 - 110, y: H - seatRy - badgeH - 10, w: 110, h: badgeH };

  const exit: Rect = { x: W - EXIT_W - 14, y: 14, w: EXIT_W, h: EXIT_H };

  return {
    center,
    seats: [
      {
        index: 0,
        region: { ellipse: seatEllipse, clip: screen },
        facing: 0,
        badge,
        extras,
      },
    ],
    hud: [{ rect: hudRect, facing: 0 }],
    gauges: [],
    exit,
  };
}

/** 1인 하늘 테이블 */
function skyTable(W: number, H: number, screen: Rect): TableGeom {
  const isPortrait = H >= W;
  if (isPortrait) {
    const centerR = Math.min(W * 0.22, H * 0.12);
    const center = skyArc(W, H, centerR, 0);

    const seatRx = W * 0.46;
    const seatRy = H * 0.24;
    const seatEllipse: Ellipse = { cx: W / 2, cy: H, rx: seatRx, ry: seatRy };

    const hudW = Math.min(W * 0.42, 140);
    const hudH = 54;
    const hudRect: Rect = { x: 14, y: 14, w: hudW, h: hudH };

    const badgeW = 90;
    const badgeH = 34;
    const badge: Rect = { x: 14, y: H - seatRy - badgeH - 10, w: badgeW, h: badgeH };
    const extras: Rect = { x: W - 14 - 110, y: H - seatRy - badgeH - 10, w: 110, h: badgeH };

    const exit: Rect = { x: W - EXIT_W - 14, y: 14, w: EXIT_W, h: EXIT_H };

    return {
      center,
      seats: [
        {
          index: 0,
          region: { ellipse: seatEllipse, clip: screen },
          facing: 0,
          badge,
          extras,
        },
      ],
      hud: [{ rect: hudRect, facing: 0 }],
      gauges: [],
      exit,
    };
  }

  // Landscape
  const centerR = Math.min(W, H) * 0.15;
  const center = skyArc(W, H, centerR, 0);

  const seatRx = W * 0.32;
  const seatRy = H * 0.28;
  const seatEllipse: Ellipse = { cx: W / 2, cy: H, rx: seatRx, ry: seatRy };

  const hudRect: Rect = { x: 12, y: H - 48, w: 140, h: 36 };
  const extras: Rect = { x: W - 12 - 110, y: H - 48, w: 110, h: 36 };
  const exit: Rect = { x: W - EXIT_W - 12, y: 12, w: EXIT_W, h: EXIT_H };

  return {
    center,
    seats: [
      {
        index: 0,
        region: { ellipse: seatEllipse, clip: screen },
        facing: 0,
        badge: extras,
        extras,
      },
    ],
    hud: [{ rect: hudRect, facing: 0 }],
    gauges: [],
    exit,
  };
}

/** 1인 협동 테이블 (몬스터 사냥) */
function soloCoopTable(W: number, H: number, screen: Rect): TableGeom {
  const isPortrait = H >= W;
  // 거북이(보스)를 화면 중앙으로 이동 (불 쏘는 거리 확보)
  const centerR = isPortrait ? Math.min(W * 0.18, H * 0.09) : Math.min(W, H) * 0.18;
  const centerCy = isPortrait ? H * 0.40 : H * 0.30;
  const center: Ellipse = { cx: W / 2, cy: centerCy, rx: centerR, ry: centerR };

  // 불 게이지: 거북이보다 위쪽에 배치
  const gaugeW = isPortrait ? Math.min(W * 0.86, 320) : W * 0.7;
  const gaugeH = isPortrait ? 26 : 22;
  const gaugeY = isPortrait ? Math.max(H * 0.13, 76) : H * 0.52;
  const gauge: Rect = { x: (W - gaugeW) / 2, y: gaugeY, w: gaugeW, h: gaugeH };

  // 하단 플레이어 자리 (입력 영역과 겹치지 않고 불 쏘는 거리 110px 이상 확보)
  const seatRx = isPortrait ? W * 0.46 : W * 0.38;
  const seatRy = isPortrait ? H * 0.22 : H * 0.34;
  const seatEllipse: Ellipse = { cx: W / 2, cy: H, rx: seatRx, ry: seatRy };

  const hudW = Math.min(W * 0.42, 140);
  const hudH = isPortrait ? 52 : 36;
  const hudRect: Rect = { x: 14, y: 14, w: hudW, h: hudH };
  const badge: Rect = { x: 14, y: H - seatRy - 34 - 10, w: 90, h: 34 };
  const extras: Rect = { x: W - 14 - 110, y: H - seatRy - 34 - 10, w: 110, h: 34 };
  const exit: Rect = { x: W - EXIT_W - 14, y: 14, w: EXIT_W, h: EXIT_H };

  return {
    center,
    seats: [
      {
        index: 0,
        region: { ellipse: seatEllipse, clip: screen },
        facing: 0,
        badge,
        extras,
      },
    ],
    hud: [{ rect: hudRect, facing: 0 }],
    gauges: [{ rect: gauge, facing: 0 }],
    exit,
  };
}

/** 2인 테이블: 세로 화면에서 상단(P2, 180도) - 중앙 카드 - 하단(P1, 0도) 3단 배치 */
function twoPlayerTable(W: number, H: number, screen: Rect, coop: boolean, isPortrait: boolean): TableGeom {
  if (isPortrait) {
    // 세로 화면 (Portrait) 3단 수직 구조: 보스 및 게이지와 플레이어 거북이가 겹치지 않게 조절
    const centerR = coop ? Math.min(W * 0.16, H * 0.08) : Math.min(W * 0.20, H * 0.10);
    const centerCy = H / 2;
    const center: Ellipse = { cx: W / 2, cy: centerCy, rx: centerR, ry: centerR };

    // 좌석 타원 반지름
    const seatRx = W * 0.46;
    const seatRy = coop ? H * 0.18 : H * 0.21;

    // P1 (하단, 0도)
    const p1Center = { cx: W / 2, cy: H };
    const p1Ellipse: Ellipse = { ...p1Center, rx: seatRx, ry: seatRy };

    // P2 (상단, 180도)
    const p2Center = { cx: W / 2, cy: 0 };
    const p2Ellipse: Ellipse = { ...p2Center, rx: seatRx, ry: seatRy };

    const badgeW = 88;
    const badgeH = 28;

    // 배지와 콤보/아이템 버튼 배치
    // P1: 하단 좌석 위쪽 테두리 부근
    const p1Badge: Rect = { x: 14, y: H - seatRy - badgeH - 8, w: badgeW, h: badgeH };
    const p1Extras: Rect = { x: W - 14 - 96, y: H - seatRy - badgeH - 8, w: 96, h: badgeH };

    // P2: 상단 좌석 아래쪽 테두리 부근 (180도 회전 고려)
    const p2Badge: Rect = { x: W - 14 - badgeW, y: seatRy + 8, w: badgeW, h: badgeH };
    const p2Extras: Rect = { x: 14, y: seatRy + 8, w: 96, h: badgeH };

    // 협동 불 게이지: 조작 영역과 더 가까이 배치하여 거북이와 겹치지 않게
    const gauges: TableGeom['gauges'] = [];
    const gW = Math.min(W * 0.84, 300);
    const gH = 24;
    // 하단 P1 게이지: P1 조작 영역 바로 위 (H * 0.70 부근)
    const botY = Math.min(H * 0.71, H - seatRy - badgeH - gH - 10);
    // 상단 P2 게이지: P2 조작 영역 바로 아래 (H * 0.29 부근)
    const topY = Math.max(H * 0.29 - gH, seatRy + badgeH + 10);
    if (coop) {
      gauges.push({ rect: { x: (W - gW) / 2, y: botY, w: gW, h: gH }, facing: 0 });
      gauges.push({ rect: { x: (W - gW) / 2, y: topY, w: gW, h: gH }, facing: 180 });
    }

    // HUD: 공용 정보 칸 (같이하기에서 게임정보 박스는 사용자 기준 게이지 우측 상단에 배치)
    const hudW = coop ? Math.min(W * 0.44, 150) : 76;
    const hudH = coop ? 34 : 26;
    const hud0: Rect = coop
      ? { x: W - hudW - 14, y: botY - hudH - 6, w: hudW, h: hudH }
      : { x: 10, y: centerCy + 6, w: hudW, h: hudH };
    const hud1: Rect = coop
      ? { x: 14, y: topY + gH + 6, w: hudW, h: hudH }
      : { x: 10, y: centerCy - (coop ? 40 : 32), w: hudW, h: hudH };

    // 나가기 버튼: 중앙 우측 테두리
    const exit: Rect = { x: W - EXIT_W - 8, y: centerCy - EXIT_H / 2, w: EXIT_W, h: EXIT_H };

    return {
      center,
      seats: [
        {
          index: 0,
          region: { ellipse: p1Ellipse, clip: screen },
          facing: 0,
          badge: p1Badge,
          extras: p1Extras,
        },
        {
          index: 1,
          region: { ellipse: p2Ellipse, clip: screen },
          facing: 180,
          badge: p2Badge,
          extras: p2Extras,
        },
      ],
      hud: [
        { rect: hud0, facing: 0 },
        { rect: hud1, facing: 180 },
      ],
      gauges,
      exit,
    };
  }

  // 가로 화면(Landscape) 2인: 상/하 엇갈림 반원 배치
  const centerR = coop ? Math.min(W, H) * 0.16 : Math.min(W, H) * 0.19;
  const center: Ellipse = { cx: W / 2, cy: H / 2, rx: centerR, ry: centerR };

  const r = Math.min(H * 0.44, W * 0.32);
  const bottom = { cx: W * 0.72, cy: H };
  const top = { cx: W * 0.28, cy: 0 };

  const bw = 100;
  const bh = 34;
  const cos = Math.cos((25 * Math.PI) / 180), sin = Math.sin((25 * Math.PI) / 180);

  const hud0: Rect = { x: 16, y: H - 16 - 36, w: 120, h: 36 };
  const hud1: Rect = { x: W - 16 - 120, y: 16, w: 120, h: 36 };

  const exit: Rect = { x: 16, y: H / 2 - EXIT_H / 2, w: EXIT_W, h: EXIT_H };

  const gauges: TableGeom['gauges'] = [];
  if (coop) {
    const gh = 20;
    gauges.push({ rect: { x: 16, y: hud0.y - 8 - gh, w: 140, h: gh }, facing: 0 });
    gauges.push({ rect: { x: W - 16 - 140, y: hud1.y + 36 + 8, w: 140, h: gh }, facing: 180 });
  }

  const p0Extras: Rect = { x: bottom.cx - r * cos - 110, y: bottom.cy - r * sin, w: 104, h: bh };
  const p1Extras: Rect = { x: top.cx + r * cos + 10, y: top.cy + r * sin - bh, w: 104, h: bh };

  return {
    center,
    seats: [
      {
        index: 0,
        region: { ellipse: { ...bottom, rx: r, ry: r }, clip: screen },
        facing: 0,
        badge: { x: bottom.cx - r * cos, y: bottom.cy - r * sin, w: bw, h: bh },
        extras: p0Extras,
      },
      {
        index: 1,
        region: { ellipse: { ...top, rx: r, ry: r }, clip: screen },
        facing: 180,
        badge: { x: top.cx + r * cos - bw, y: top.cy + r * sin, w: bw, h: bh },
        extras: p1Extras,
      },
    ],
    hud: [
      { rect: hud0, facing: 0 },
      { rect: hud1, facing: 180 },
    ],
    gauges,
    exit,
  };
}

export const FLOOR_BAND_RATIO = 0.15;

export function floorBand(e: Ellipse): Rect {
  const h = 2 * e.ry * FLOOR_BAND_RATIO;
  return { x: e.cx - e.rx, y: e.cy + e.ry - h, w: 2 * e.rx, h };
}

export const NAME_OFFSET = 12;
const NAME_ARC_PX = 180;
const NAME_SAMPLES = 9;

export function nameArc(seat: SeatGeom, W: number, H: number, avoid: Rect[] = []): { d: string; points: [number, number][] } {
  const { cx, cy, rx, ry } = seat.region.ellipse;
  const Rx = rx + NAME_OFFSET, Ry = ry + NAME_OFFSET;
  const half = NAME_ARC_PX / 2 / ((Rx + Ry) / 2);
  const at = (a: number): [number, number] => [cx + Rx * Math.cos(a), cy + Ry * Math.sin(a)];
  const mid = seat.facing === 0 ? (270 * Math.PI) / 180 : (90 * Math.PI) / 180;
  const [x0, y0] = at(mid - half), [x1, y1] = at(mid + half);
  const f = (v: number) => v.toFixed(1);
  const points: [number, number][] = Array.from({ length: NAME_SAMPLES }, (_, i) => at(mid - half + (2 * half * i) / (NAME_SAMPLES - 1)));
  return { d: `M${f(x0)} ${f(y0)} A${f(Rx)} ${f(Ry)} 0 0 1 ${f(x1)} ${f(y1)}`, points };
}

export function paperShades(hex: string): [string, string] {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const shade = (f: number) => '#' + rgb.map(c => Math.round(c * (1 - f)).toString(16).padStart(2, '0')).join('');
  return [shade(0.12), shade(0.25)];
}
