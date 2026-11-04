import { ProblemMeta } from '../types';
import { A14View } from './a14/A14View';
import { A15View } from './a15/A15View';

export const PROBLEMS: ProblemMeta[] = [
  {
    id: 'A14',
    title: 'Four Boxes',
    subtitle: '半分全列挙 × 二分探索',
    chapter: '第3章: 二分探索',
    category: '二分探索',
    difficulty: 'Medium',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_n',
    component: A14View,
  },
  {
    id: 'A15',
    title: 'Compression',
    subtitle: '座標圧縮 × 二分探索',
    chapter: '第3章: 二分探索',
    category: '二分探索',
    difficulty: 'Easy',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_o',
    component: A15View,
  },
];

export const getProblemById = (id: string): ProblemMeta => {
  const normalized = id.toUpperCase();
  return PROBLEMS.find(p => p.id.toUpperCase() === normalized) || PROBLEMS[0];
};
