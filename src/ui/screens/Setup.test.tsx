import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { INITIALS } from '../../content/hangul';
import type { PlayerConfig } from '../../engine/state';
import { fitSetup, Setup } from './Setup';
import { createSymbolSet } from '../../content/registry';
import { EMPTY_RECORDS } from '../../services/records';

const SET_ID = createSymbolSet({ kind: 'consonant', includeDouble: false }).id;

/** 글자 세트를 다 불러와 슬라이더 최대값이 정해질 때까지 기다린다 */
const waitLoaded = () =>
  waitFor(() => expect(screen.getByRole('slider', { name: '플레이어 1 글자 수' })).not.toHaveAttribute('max', '3'));

test('자음 14개 세트에서는 카드당 글자 수 최대값이 7이고, 부족하다는 안내는 보여주지 않는다', async () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('radio', { name: '자음' }));
  await waitFor(() => expect(screen.getByRole('slider', { name: '플레이어 1 글자 수' })).toHaveAttribute('max', '7'));
  expect(screen.queryByText(/심볼이 부족해서/)).not.toBeInTheDocument();
});

test('시작하면 설정과 불러온 심볼을 넘긴다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="versus" onStart={onStart} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: '시작' }));
  await waitFor(() => expect(onStart).toHaveBeenCalled());
  const [config, symbols] = onStart.mock.calls[0];
  expect(config.players).toHaveLength(2);
  expect(config.mode).toBe('score');
  expect(symbols.length).toBeGreaterThanOrEqual(config.players[0].cardSize * 2 - 1);
});

test('혼자 하기는 1명으로 시작한다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="solo" onStart={onStart} onBack={() => {}} />);
  expect(screen.queryByRole('group', { name: '인원' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '시작' }));
  await waitFor(() => expect(onStart).toHaveBeenCalled());
  expect(onStart.mock.calls[0][0].players).toHaveLength(1);
});

test('같은 자리 색은 두 명이 고를 수 없다', async () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  await waitLoaded();
  expect(within(screen.getByRole('group', { name: '플레이어 2 색' })).getByRole('radio', { name: '핑크' })).toBeDisabled();
});

const setRange = (el: HTMLElement, n: number) => fireEvent.change(el, { target: { value: String(n) } });
const startWith = async (onStart: ReturnType<typeof vi.fn>) => {
  fireEvent.click(screen.getByRole('button', { name: '시작' }));
  await waitFor(() => expect(onStart).toHaveBeenCalled());
  return onStart.mock.calls[0][0];
};

test('플레이어마다 심볼 수를 따로 정한다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="versus" onStart={onStart} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('radio', { name: '알파벳' }));
  await waitFor(() => expect(screen.getByRole('slider', { name: '플레이어 2 글자 수' })).toHaveAttribute('max', '8'));
  setRange(screen.getByRole('slider', { name: '플레이어 1 글자 수' }), 3);
  setRange(screen.getByRole('slider', { name: '플레이어 2 글자 수' }), 8);
  const cfg = await startWith(onStart);
  expect(cfg.players.map((p: PlayerConfig) => p.cardSize)).toEqual([3, 8]);
});

test('폭탄 돌리기를 고르면 시작 카드와 넘길 사람 설정이 나온다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="versus" onStart={onStart} onBack={() => {}} />);
  expect(screen.queryByRole('radio', { name: '7장' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: '폭탄 돌리기' }));
  fireEvent.click(screen.getByRole('radio', { name: '7장' }));
  fireEvent.click(screen.getByRole('radio', { name: '직접 고르기' }));
  expect(await startWith(onStart)).toMatchObject({ mode: 'bomb', bomb: { startHand: 7, target: 'choose' } });
});

test('대결 방식은 점수제와 폭탄 돌리기 둘이고, 폭탄 돌리기를 고르면 규칙 설명이 나온다', () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  expect(screen.queryByRole('radio', { name: '탑 쌓기' })).not.toBeInTheDocument();
  expect(screen.queryByText(/카드가 먼저 0장이 되면 이겨요/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: '폭탄 돌리기' }));
  expect(screen.getByText(/카드가 먼저 0장이 되면 이겨요/)).toBeInTheDocument();
});

test('덧붙는 요소는 기본으로 켜져 있고 끌 수 있다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="versus" onStart={onStart} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('switch', { name: '아이템' }));
  expect((await startWith(onStart)).rules).toEqual({ combo: true, finalRound: true, items: false });
});

test('시작 버튼을 빠르게 두 번 눌러도 한 번만 시작한다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="versus" onStart={onStart} onBack={() => {}} />);
  const start = screen.getByRole('button', { name: '시작' });
  fireEvent.click(start); fireEvent.click(start);
  await waitFor(() => expect(onStart).toHaveBeenCalled());
  await new Promise(r => setTimeout(r, 20));
  expect(onStart).toHaveBeenCalledTimes(1);
});

test('협동은 1~2명이고 대결 방식이 없다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="coop" onStart={onStart} onBack={() => {}} />);
  await waitLoaded();
  expect(screen.getByRole('heading', { name: '협동' })).toBeInTheDocument();
  expect(within(screen.getByRole('group', { name: '인원' })).getAllByRole('radio')).toHaveLength(2);
  expect(screen.queryByRole('group', { name: '대결 방식' })).not.toBeInTheDocument();
  expect(await startWith(onStart)).toMatchObject({ mode: 'coop', teams: null, rules: { combo: false, finalRound: false, items: false } });
});

test('혼자 하기: 스테이지 도전은 열린 단계까지 고를 수 있고 심볼 수 슬라이더가 없다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="solo" onStart={onStart} onBack={() => {}} records={{ ...EMPTY_RECORDS, unlocked: { [SET_ID]: 3 } }} />);
  await waitLoaded();
  fireEvent.click(screen.getByRole('radio', { name: '스테이지 도전' }));
  expect(within(screen.getByRole('group', { name: '단계' })).getAllByRole('radio')).toHaveLength(3);
  expect(screen.queryByRole('slider', { name: '플레이어 1 글자 수' })).not.toBeInTheDocument();
  expect(await startWith(onStart)).toMatchObject({ mode: 'soloStage', stage: 3, rules: { items: true } });
});

test('혼자 하기: 몬스터 사냥을 고르면 협동 규칙으로 시작한다', async () => {
  const onStart = vi.fn();
  render(<Setup kind="solo" onStart={onStart} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('radio', { name: '몬스터 사냥' }));
  const cfg = await startWith(onStart);
  expect(cfg.mode).toBe('coop');
  expect(cfg.players).toHaveLength(1);
});

test('켜고 끄는 설정은 스위치로 보여준다', () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  expect(screen.getByRole('switch', { name: '읽어주기' })).toBeChecked();
  expect(screen.getByRole('switch', { name: '글자 회전' })).not.toBeChecked();
});

test('초성 고르기 팝업으로 바꿀 수 있다', async () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('radio', { name: '글자' }));
  expect(screen.getByRole('dialog', { name: '초성 고르기' })).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('radio', { name: 'ㄴ' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '초성 고르기' })).toHaveTextContent('ㄴ');
});

test('초성 고르기 팝업은 닫기 버튼으로 닫힌다', async () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('radio', { name: '글자' }));
  fireEvent.click(screen.getByRole('button', { name: '닫기' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('이름 입력칸 길이는 이름 길이에 맞춰 늘고 준다', () => {
  render(<Setup kind="versus" onStart={() => {}} onBack={() => {}} />);
  const input = screen.getByLabelText('플레이어 1 이름');
  fireEvent.change(input, { target: { value: '가나다라마바사' } });
  expect(input).toHaveStyle({ width: '8.4em' });
});
