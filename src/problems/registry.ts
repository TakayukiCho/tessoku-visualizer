import { ProblemMeta } from '../types';
import { A14View } from './a14/A14View';
import { A15View } from './a15/A15View';
import { A16View } from './a16/A16View';
import { A17View } from './a17/A17View';
import { A18View } from './a18/A18View';
import { A19View } from './a19/A19View';
import { A20View } from './a20/A20View';

export const PROBLEMS: ProblemMeta[] = [
  // ========== 第3章: 二分探索 ==========
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

  // ========== 第4章: 動的計画法 (DP) ==========
  {
    id: 'A16',
    title: 'Dungeon 1',
    subtitle: '基本動的計画法 (最小コスト)',
    chapter: '第4章: 動的計画法',
    category: '動的計画法',
    difficulty: 'Easy',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_p',
    component: A16View,
  },
  {
    id: 'A17',
    title: 'Dungeon 2',
    subtitle: 'DP 経路復元 (バックトラック)',
    chapter: '第4章: 動的計画法',
    category: '動的計画法',
    difficulty: 'Easy',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_q',
    component: A17View,
  },
  {
    id: 'A18',
    title: 'Subset Sum',
    subtitle: '部分和問題 (2次元真偽値DP)',
    chapter: '第4章: 動的計画法',
    category: '動的計画法',
    difficulty: 'Medium',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_r',
    component: A18View,
  },
  {
    id: 'A19',
    title: 'Knapsack 1',
    subtitle: '0-1 ナップサック問題 (最大価値)',
    chapter: '第4章: 動的計画法',
    category: '動的計画法',
    difficulty: 'Medium',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_s',
    component: A19View,
  },
  {
    id: 'A20',
    title: 'LCS',
    subtitle: '最長共通部分列 (文字列グリッドDP)',
    chapter: '第4章: 動的計画法',
    category: '動的計画法',
    difficulty: 'Medium',
    atcoderUrl: 'https://atcoder.jp/contests/tessoku-book/tasks/tessoku_book_t',
    component: A20View,
  },
];

export const getProblemById = (id: string): ProblemMeta => {
  const normalized = id.toUpperCase();
  return PROBLEMS.find(p => p.id.toUpperCase() === normalized) || PROBLEMS[0];
};
