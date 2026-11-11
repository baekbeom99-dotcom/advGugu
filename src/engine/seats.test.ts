import { describe, it, expect } from 'vitest';
import { computeTable } from './seats';

describe('seats: 스마트폰 세로 화면 (Portrait) 1인 및 2인 레이아웃', () => {
  const mobileViewport = { w: 390, h: 844 }; // iPhone 12/13/14 기준

  it('1인 세로 화면: 상단 중앙 카드 + 하단 플레이어 자리', () => {
    const table = computeTable(1, mobileViewport.w, mobileViewport.h);
    expect(table.seats).toHaveLength(1);
    expect(table.center.cy).toBeLessThan(mobileViewport.h / 2); // 상단에 위치
    expect(table.seats[0].region.ellipse.cy).toBe(mobileViewport.h); // 하단 가장자리
    expect(table.seats[0].facing).toBe(0);
    expect(table.exit).toBeDefined();
  });

  it('2인 세로 화면: P1(하단, 0도), P2(상단, 180도 마주보기), 중앙 카드', () => {
    const table = computeTable(2, mobileViewport.w, mobileViewport.h);
    expect(table.seats).toHaveLength(2);

    const [p1, p2] = table.seats;
    expect(p1.facing).toBe(0);
    expect(p1.region.ellipse.cy).toBe(mobileViewport.h);

    expect(p2.facing).toBe(180);
    expect(p2.region.ellipse.cy).toBe(0);

    // 중앙 카드는 화면 정중앙 (cy ≈ H / 2)
    expect(Math.abs(table.center.cy - mobileViewport.h / 2)).toBeLessThan(10);

    // 각 플레이어별 배지 및 콤보/아이템 칸이 존재함
    expect(p1.badge).toBeDefined();
    expect(p1.extras).toBeDefined();
    expect(p2.badge).toBeDefined();
    expect(p2.extras).toBeDefined();
  });

  it('협동 모드 세로 화면: 불 게이지(gauges) 생성', () => {
    const table = computeTable(2, mobileViewport.w, mobileViewport.h, { coop: true });
    expect(table.gauges.length).toBeGreaterThanOrEqual(1);
  });
});
