import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TabType } from '../../types';
import { TabNav } from '../../components/TabNav';
import { PlayerControls } from '../../components/PlayerControls';
import { CodeViewer } from '../../components/CodeViewer';

interface A15Step {
  phase: string;
  stage: string;
  targetIdx: number;
  targetVal: number | null;
  L: number;
  R: number;
  mid: number;
  rank: number | null;
  solvedB: (number | null)[];
  comment: string;
}

const CPP_CODE = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N;
    if (!(cin >> N)) return 0;

    vector<int> A(N);
    for (int i = 0; i < N; i++) {
        cin >> A[i];
    }

    // 1. A をコピーしてソート
    vector<int> T = A;
    sort(T.begin(), T.end());

    // 2. 重複を削除してユニーク化 (erase + unique)
    T.erase(unique(T.begin(), T.end()), T.end());

    // 3. 各要素 A[i] が T の何番目かを二分探索 (lower_bound) で特定
    for (int i = 0; i < N; i++) {
        // lower_bound は A[i] 以上の最初のイテレータを返す
        auto itr = lower_bound(T.begin(), T.end(), A[i]);
        // 0-indexed の位置に +1 して 1-indexed の順位にする
        int rank = (itr - T.begin()) + 1;

        cout << rank << (i == N - 1 ? "" : " ");
    }
    cout << "\\n";

    return 0;
}`;

const PYTHON_CODE = `import sys
import bisect

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return

    N = int(data[0])
    A = [int(x) for x in data[1 : N + 1]]

    # 1 & 2. 重複を取り除いて昇順にソートした辞書リストを作成
    T = sorted(set(A))

    # 3. 各 A[i] について二分探索 (bisect_left) で順位を求める
    B = []
    for a in A:
        # bisect_left は a の挿入位置 (0-indexed) を返すため +1 する
        rank = bisect.bisect_left(T, a) + 1
        B.append(str(rank))

    print(" ".join(B))

if __name__ == "__main__":
    main()`;

interface A15ViewProps {
  onSetHeaderBadge?: (badge: React.ReactNode) => void;
}

export const A15View: React.FC<A15ViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const [arrayA, setArrayA] = useState<number[]>([46, 80, 11, 77, 46]);

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(800);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3のスライダーN
  const [sliderN, setSliderN] = useState<number>(100000);

  // タブ1のホバー
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">要素数</span>
          <span className="text-base md:text-lg font-black font-mono text-indigo-900">
            N = {arrayA.length}
          </span>
        </div>
      );
    }
  }, [arrayA.length, onSetHeaderBadge]);

  // 昇順ソート配列 & 重複削除ユニーク配列 T
  const sortedA = useMemo(() => [...arrayA].sort((x, y) => x - y), [arrayA]);
  const T = useMemo(() => Array.from(new Set(sortedA)), [sortedA]);

  // 正解配列 B
  const B = useMemo(() => arrayA.map(val => T.indexOf(val) + 1), [arrayA, T]);

  // ステップ事前生成
  const steps: A15Step[] = useMemo(() => {
    const list: A15Step[] = [];
    const n = arrayA.length;

    // Step 0: 初期待機
    list.push({
      phase: '初期待機',
      stage: 'init',
      targetIdx: -1,
      targetVal: null,
      L: -1,
      R: -1,
      mid: -1,
      rank: null,
      solvedB: new Array(n).fill(null),
      comment: '座標圧縮シミュレーション開始前です。「1手進む」を押して実行を開始しましょう。',
    });

    // Step 1: コピー & ソート完了
    list.push({
      phase: 'ステップ1: ソート',
      stage: 'sorted',
      targetIdx: -1,
      targetVal: null,
      L: -1,
      R: -1,
      mid: -1,
      rank: null,
      solvedB: new Array(n).fill(null),
      comment: `元の配列 A を複製し、昇順に並べ替えました。<br><span class="font-mono text-indigo-300 font-bold">[${sortedA.join(', ')}]</span><br>これで値の大小関係が整理されました。`,
    });

    // Step 2: 重複削除 (ユニーク化) 完了
    list.push({
      phase: 'ステップ2: 重複削除',
      stage: 'unique',
      targetIdx: -1,
      targetVal: null,
      L: -1,
      R: -1,
      mid: -1,
      rank: null,
      solvedB: new Array(n).fill(null),
      comment: `隣り合う同一の値を取り除き、ユニーク配列 T を作りました。<br><span class="font-mono text-emerald-300 font-bold">T = [${T.join(', ')}]</span><br>各要素のインデックス（0-indexed）に 1 を足したものが、その値の順位になります！`,
    });

    // Step 3: 各要素 A[i] について二分探索
    const currentB: (number | null)[] = new Array(n).fill(null);

    for (let i = 0; i < n; i++) {
      const targetVal = arrayA[i];

      list.push({
        phase: `ステップ3: A[${i}] の二分探索開始`,
        stage: 'bs_start',
        targetIdx: i,
        targetVal,
        L: 0,
        R: T.length - 1,
        mid: -1,
        rank: null,
        solvedB: [...currentB],
        comment: `元の配列の [${i}] 番目の値 <strong>A[${i}] = ${targetVal}</strong> の順位を求めます。<br>ユニーク配列 T の範囲 [0 ～ ${T.length - 1}] から二分探索（lower_bound）を開始します。`,
      });

      let L = 0;
      let R = T.length - 1;

      while (L <= R) {
        const mid = Math.floor((L + R) / 2);
        const midVal = T[mid];

        if (midVal === targetVal) {
          const rank = mid + 1;
          currentB[i] = rank;
          list.push({
            phase: `A[${i}] の順位確定！`,
            stage: 'bs_match',
            targetIdx: i,
            targetVal,
            L,
            R,
            mid,
            rank,
            solvedB: [...currentB],
            comment: `🎉 中央の <strong>T[${mid}] = ${midVal}</strong> が探していた値 <strong>${targetVal}</strong> と一致しました！<br>よって、A[${i}] の順位は <span class="text-emerald-300 font-bold font-mono">mid + 1 = ${rank}</span> に決定！ <strong>B[${i}] = ${rank}</strong> となります。`,
          });
          break;
        } else if (midVal < targetVal) {
          list.push({
            phase: `A[${i}] の二分探索 (絞り込み)`,
            stage: 'bs_less',
            targetIdx: i,
            targetVal,
            L,
            R,
            mid,
            rank: null,
            solvedB: [...currentB],
            comment: `中央値 <strong>T[${mid}] = ${midVal}</strong> を検査。<br>T[${mid}] (${midVal}) &lt; ${targetVal} なので、${midVal} 以下の左側にはありません。<br>➜ 探索範囲を <strong>右半分 [${mid + 1} ～ ${R}]</strong> に絞り込みます。`,
          });
          L = mid + 1;
        } else {
          list.push({
            phase: `A[${i}] の二分探索 (絞り込み)`,
            stage: 'bs_greater',
            targetIdx: i,
            targetVal,
            L,
            R,
            mid,
            rank: null,
            solvedB: [...currentB],
            comment: `中央値 <strong>T[${mid}] = ${midVal}</strong> を検査。<br>T[${mid}] (${midVal}) &gt; ${targetVal} なので、${midVal} 以上の右側にはありません。<br>➜ 探索範囲を <strong>左半分 [${L} ～ ${mid - 1}]</strong> に絞り込みます。`,
          });
          R = mid - 1;
        }
      }
    }

    // 完了ステップ
    list.push({
      phase: '座標圧縮 完了！',
      stage: 'complete',
      targetIdx: -1,
      targetVal: null,
      L: -1,
      R: -1,
      mid: -1,
      rank: null,
      solvedB: [...currentB],
      comment: `🎉 すべての要素の順位が求まり、答えの配列 <span class="text-emerald-300 font-mono font-bold">B = [${currentB.join(', ')}]</span> が完成しました！<br>時間計算量はソートと二分探索を合わせて <strong>O(N log N)</strong> で非常に高速です。`,
    });

    return list;
  }, [arrayA, sortedA, T]);

  // 自動再生タイマー
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  const handleStepNext = () => {
    if (currentStepIdx < steps.length - 1) setCurrentStepIdx(prev => prev + 1);
  };

  const handleStepPrev = () => {
    if (currentStepIdx > 0) setCurrentStepIdx(prev => prev - 1);
  };

  const handleTogglePlay = () => setIsPlaying(prev => !prev);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const loadPreset = (preset: number) => {
    if (preset === 1) setArrayA([46, 80, 11, 77, 46]);
    else setArrayA([1000, 3, 50, 3, 1000]);
    handleReset();
  };

  const randomize = () => {
    const n = 5 + Math.floor(Math.random() * 2);
    const pool = [12, 45, 99, 100, 300, 777, 1000, 50000, 1000000];
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      arr.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setArrayA(arr);
    handleReset();
  };

  const currentStep = steps[currentStepIdx] || steps[0];
  const maxA = Math.max(...arrayA);

  // タブ3の計算
  const compNaiveOps = sliderN * sliderN;
  const compLog2N = Math.log2(Math.max(2, sliderN));
  const compFastOps = Math.round(sliderN * compLog2N);
  const compFastSec = compFastOps / 1e8;

  return (
    <div className="flex flex-col gap-6">
      {/* タブナビゲーション */}
      <TabNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        playTabLabel="① ルール体験 & 座標圧縮"
        algoTabLabel="② 3ステップ詳細ビジュアライザー"
        complexityTabLabel="③ なぜ座標圧縮が必要？（巨大な値とメモリ）"
      />

      <main className="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        {/* ==================== タブ 1: ルール体験 & 座標圧縮 ==================== */}
        {activeTab === 'play' && (
          <section className="flex flex-col gap-6">
            {/* 概要カード */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>💡</span> 座標圧縮（Compression）とは？
                </h2>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  与えられた数列 <strong className="text-indigo-600 font-mono">A</strong> の各要素を、<strong>「全体の中で小さい方から何番目か（1始まりの順位）」</strong>に変換する操作です。<br className="hidden md:inline" />
                  同じ値の要素は<strong>同じ順位</strong>になります。大小関係を完全に保ったまま、コンパクトな整数列 <strong className="text-emerald-600 font-mono">B</strong> へ変換します！
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => loadPreset(1)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  例1: [46, 80, 11, 77, 46]
                </button>
                <button
                  onClick={() => loadPreset(2)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  例2: [1000, 3, 50, 3, 1000]
                </button>
                <button
                  onClick={randomize}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  🎲 ランダム生成
                </button>
              </div>
            </div>

            {/* 入力と圧縮結果のビジュアル対比カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 元の配列 A */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-md">元の配列 A (元の値)</span>
                    <span className="text-xs text-slate-400 font-mono">N = {arrayA.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">元の値は非常に大きい値（最大 10⁹ など）も含まれます。</p>
                  <div className="flex flex-wrap gap-2.5 min-h-[70px] items-center">
                    {arrayA.map((val, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className={`flex flex-col items-center justify-center min-w-[56px] px-3 py-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-mono text-xs shadow-sm transition-all duration-200 cursor-pointer ${
                          hoveredIdx === idx ? 'ring-4 ring-indigo-400 scale-110 bg-blue-100' : 'hover:scale-105'
                        }`}
                      >
                        <span className="text-[9px] text-blue-400 font-sans font-semibold">A[{idx}]</span>
                        <span className="text-base font-black">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>最小値: <strong className="text-blue-600 font-mono font-bold">{Math.min(...arrayA)}</strong></span>
                  <span>最大値: <strong className="text-blue-600 font-mono font-bold">{Math.max(...arrayA)}</strong></span>
                </div>
              </div>

              {/* 圧縮後の配列 B */}
              <div className="bg-white border-2 border-emerald-300 bg-emerald-50/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                    <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-md">圧縮後の配列 B (1始まりの順位)</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">範囲: 1 ～ {T.length}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">大小関係を保ったまま、1からの連続する整数にギュッと圧縮！</p>
                  <div className="flex flex-wrap gap-2.5 min-h-[70px] items-center">
                    {B.map((rank, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className={`flex flex-col items-center justify-center min-w-[56px] px-3 py-2 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-mono text-xs shadow-sm transition-all duration-200 cursor-pointer ${
                          hoveredIdx === idx ? 'ring-4 ring-indigo-400 scale-110 bg-emerald-200' : 'hover:scale-105'
                        }`}
                      >
                        <span className="text-[9px] text-emerald-600 font-sans font-semibold">B[{idx}]</span>
                        <span className="text-base font-black text-emerald-700">{rank}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                  <span>✨</span> どんなに元の数が大きくても、最大順位は「ユニークな値の個数以下」になります。
                </div>
              </div>
            </div>

            {/* 視覚的ビフォー・アフター グラフ対比 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                <span>📊</span> 値のスケール変化ビジュアライザー
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                各要素がどの順位に対応しているかがバーチャートで一目瞭然です。
              </p>

              <div className="space-y-3">
                {arrayA.map((val, idx) => {
                  const rank = B[idx];
                  const percentA = Math.max(12, Math.round((val / maxA) * 100));
                  const percentB = Math.max(12, Math.round((rank / T.length) * 100));
                  const isHovered = hoveredIdx === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                        isHovered ? 'bg-indigo-50/70 border-indigo-200' : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs w-28 shrink-0">
                        <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          A[{idx}] = {val}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-10">元の値:</span>
                          <div className="h-3.5 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${percentA}%` }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-10">圧縮後:</span>
                          <div className="h-3.5 bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${percentB}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs shrink-0 pl-2">
                        <span className="text-slate-400">➜</span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs">
                          順位: {rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ==================== タブ 2: 3ステップ詳細ビジュアライザー ==================== */}
        {activeTab === 'algo' && (
          <section className="flex flex-col gap-6">
            <PlayerControls
              currentStep={currentStepIdx}
              totalSteps={steps.length - 1}
              isPlaying={isPlaying}
              speed={speed}
              onStepNext={handleStepNext}
              onStepPrev={handleStepPrev}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onChangeSpeed={setSpeed}
              onSeek={setCurrentStepIdx}
            />

            {/* リアルタイム状況解説ボード */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs uppercase font-mono tracking-widest text-slate-400">Execution Monitor</span>
                </div>
                <div className={`text-xs font-bold px-2.5 py-1 rounded ${
                  currentStep.stage === 'complete'
                    ? 'bg-emerald-500 text-white animate-bounce-short'
                    : currentStep.stage === 'bs_match'
                    ? 'bg-emerald-600 text-white'
                    : currentStepIdx === 0
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-indigo-600 text-white'
                }`}>
                  {currentStep.stage === 'complete' ? '圧縮完了' : currentStep.stage === 'bs_match' ? '順位確定' : currentStepIdx === 0 ? '待機中' : '実行中'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">現在のフェーズ</div>
                  <div className="text-sm font-bold font-mono text-indigo-300">
                    {currentStep.phase}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">二分探索の対象 A[i]</div>
                  <div className="text-xl font-bold font-mono text-blue-300 flex items-center justify-between">
                    <span>{currentStep.targetVal !== null ? currentStep.targetVal : '--'}</span>
                    <span className="text-xs font-normal text-slate-400">
                      {currentStep.targetIdx >= 0 ? `A[${currentStep.targetIdx}]` : 'i: --'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">探索ポインタ [L, Mid, R]</div>
                  <div className="text-xl font-bold font-mono text-amber-300 flex items-center gap-2">
                    {currentStep.L >= 0 && currentStep.R >= 0 ? (
                      <span>
                        <span className="text-blue-400">L:{currentStep.L}</span> |{' '}
                        <span className="text-pink-400">M:{currentStep.mid >= 0 ? currentStep.mid : '-'}</span> |{' '}
                        <span className="text-blue-400">R:{currentStep.R}</span>
                      </span>
                    ) : (
                      'L: - | M: - | R: -'
                    )}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">求まった順位 (答え)</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {currentStep.rank !== null ? `第 ${currentStep.rank} 位` : '--'}
                  </div>
                </div>
              </div>

              <div
                className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200 font-sans"
                dangerouslySetInnerHTML={{ __html: currentStep.comment }}
              />
            </div>

            {/* ステップ 1 & 2: 参照配列 T の作成 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-slate-900">ソート＆重複削除で「辞書配列 T」を作成</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  currentStepIdx >= 2 ? 'bg-emerald-100 text-emerald-800' : currentStepIdx >= 1 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {currentStepIdx >= 2 ? '辞書配列 T 完成済' : currentStepIdx >= 1 ? 'ソート完了' : '準備中'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ① 元の A */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>元の配列 A</span>
                    <span className="text-[10px] text-slate-400">そのまま</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {arrayA.map((v, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-all ${
                          idx === currentStep.targetIdx ? 'bg-indigo-600 text-white border-indigo-700 scale-105 shadow' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ② ソート後 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>コピーして昇順ソート</span>
                    <span className="text-[10px] text-indigo-500 font-mono">O(N log N)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedA.map((v, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-all ${
                          currentStepIdx >= 1 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {currentStepIdx >= 1 ? v : '?'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ③ ユニーク T */}
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center justify-between">
                    <span>重複削除 (ユニーク配列 T)</span>
                    <span className="text-[10px] text-emerald-600 font-mono">T.erase(unique)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {T.map((v, idx) => (
                      <div
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-all ${
                          currentStepIdx >= 2 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {currentStepIdx >= 2 ? (
                          <>
                            {v} <span className="text-[9px] opacity-60">#{idx + 1}</span>
                          </>
                        ) : (
                          '?'
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ステップ 3: 二分探索 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-bold text-slate-900">二分探索で T の中のインデックス（順位）を特定</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-400 inline-block"></span> 探索範囲 [L, R]</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-500 text-white inline-block"></span> 中央値 (Mid)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 text-white inline-block"></span> 一致 (Match)</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-2">
                  配列 T から値を探します。見つかった位置 <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">mid + 1</code> が、その要素の1始まりの順位になります。
                </div>
                <div className="flex flex-wrap gap-2 pt-4 pb-2 overflow-x-auto min-h-[90px] items-end">
                  {currentStepIdx < 2 ? (
                    <div className="text-xs text-slate-400 italic">ステップ2完了後に二分探索の様子が表示されます。</div>
                  ) : (
                    T.map((item, idx) => {
                      const inRange = currentStep.L >= 0 && currentStep.R >= 0 && idx >= currentStep.L && idx <= currentStep.R;
                      const isMid = idx === currentStep.mid;
                      const isMatch = currentStep.stage === 'bs_match' && idx === currentStep.mid;

                      let cls = 'relative flex flex-col items-center justify-center min-w-[62px] px-2.5 py-2.5 rounded-xl border text-xs font-mono transition-all duration-200 ';
                      if (isMatch) {
                        cls += 'bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-300 font-black scale-110 shadow-lg z-10 animate-bounce-short';
                      } else if (isMid) {
                        cls += 'bg-pink-500 text-white border-pink-600 ring-2 ring-pink-300 font-black scale-105 shadow-md z-10';
                      } else if (inRange) {
                        cls += 'bg-blue-50 text-blue-900 border-blue-300 font-bold';
                      } else {
                        cls += 'bg-slate-100 text-slate-400 border-slate-200 opacity-40';
                      }

                      let marker = null;
                      if (idx === currentStep.L && idx === currentStep.R && !isMatch) {
                        marker = <span className="absolute -top-5 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded">L=R</span>;
                      } else if (idx === currentStep.L && !isMatch) {
                        marker = <span className="absolute -top-5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded">L</span>;
                      } else if (idx === currentStep.R && !isMatch) {
                        marker = <span className="absolute -top-5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded">R</span>;
                      }

                      return (
                        <div key={idx} className={cls}>
                          {marker}
                          <span className="text-[9px] opacity-70">T[{idx}]</span>
                          <span className="text-base font-black">{item}</span>
                          <span className="text-[9px] font-sans opacity-80 mt-0.5">順位: {idx + 1}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 確定した答え配列 B */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>完成しつつある答え配列 B:</span>
                  <span className="text-[11px] text-emerald-600 font-mono font-bold">
                    進捗: {currentStep.solvedB.filter(x => x !== null).length} / {arrayA.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {arrayA.map((_, idx) => {
                    const rank = currentStep.solvedB[idx];
                    const isCurrent = idx === currentStep.targetIdx && currentStep.stage === 'bs_match';

                    let cls = 'flex flex-col items-center justify-center min-w-[56px] px-3 py-2 rounded-xl border text-xs font-mono transition-all ';
                    if (rank !== null) {
                      cls += isCurrent
                        ? 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 font-black scale-105 shadow animate-bounce-short'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
                    } else {
                      cls += 'bg-slate-100 text-slate-400 border-dashed border-slate-300';
                    }

                    return (
                      <div key={idx} className={cls}>
                        <span className="text-[9px] opacity-70 font-sans">B[{idx}]</span>
                        <span className="text-base font-black">{rank !== null ? rank : '?'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== タブ 3: なぜ座標圧縮が必要？ ==================== */}
        {activeTab === 'complexity' && (
          <section className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span>💥</span> なぜそのまま配列の添字にしてはいけないのか？
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                競プロでは「数値 X が何回出現したか」や「区間 [L, R] の総和」を計算するために、<strong>値をそのまま配列のインデックスにする</strong>手法（バケット配列や累積和、いもす法、セグメントツリーなど）を頻繁に使います。<br />
                しかし、この問題のように値が <strong className="text-red-500 font-mono">A_i ≤ 10⁹ (10億)</strong> になると、致命的な問題が生じます。
              </p>

              {/* 比較カード */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
                {/* そのまま */}
                <div className="border-2 border-red-200 bg-red-50/40 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">値をそのまま配列にする場合</span>
                      <span className="text-xs font-mono font-bold text-red-600">A[10⁹]</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-4">
                      サイズ 10⁹ の整数型配列をメモリ上に確保しようとする
                    </div>
                    <div className="space-y-3 font-mono">
                      <div>
                        <div className="text-[11px] text-slate-500">必要なメモリ容量:</div>
                        <div className="text-2xl font-black text-red-600">約 4,000 MB (4 GB!)</div>
                        <div className="text-xs text-red-500 font-sans font-bold">（AtCoderの制限 1024MB を大幅超過）</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">判定結果:</div>
                        <div className="text-lg font-bold text-slate-800">MLE (Memory Limit Exceeded)</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-red-200/60 flex items-center gap-2 text-xs font-bold text-red-700">
                    <span>❌</span> メモリ確保すらできずランタイムエラー (RE) または MLE
                  </div>
                </div>

                {/* 座標圧縮 */}
                <div className="border-2 border-emerald-300 bg-emerald-50/40 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">座標圧縮を使う場合</span>
                      <span className="text-xs font-mono font-bold text-emerald-700">O(N log N)</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-4">
                      値の種類数（最大でも N ≤ 10⁵）だけの配列に圧縮
                    </div>
                    <div className="space-y-3 font-mono">
                      <div>
                        <div className="text-[11px] text-slate-500">必要なメモリ容量:</div>
                        <div className="text-2xl font-black text-emerald-600">約 0.8 MB（たったの数百KB！）</div>
                        <div className="text-xs text-emerald-600 font-sans font-bold">（制限の 0.1% 未満）</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">所要実行時間:</div>
                        <div className="text-lg font-bold text-slate-800">約 0.05 秒（余裕の高速AC）</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <span>⭕</span> AC（メモリ制限・時間制限ともに完璧クリア）
                  </div>
                </div>
              </div>

              {/* インタラクティブ比較スライダー */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="sliderValN" className="text-sm font-bold text-slate-700">要素数 N を変更してみる:</label>
                  <span className="font-mono text-xl font-black text-indigo-600">N = {sliderN.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  id="sliderValN"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={sliderN}
                  onChange={e => setSliderN(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>N=1,000</span>
                  <span>N=50,000</span>
                  <span>N=100,000 (最大値)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">愚直な全探索 (O(N²)):</span>
                    <div className="font-mono font-bold text-red-600 text-base">
                      {compNaiveOps >= 1e9
                        ? `約 ${(compNaiveOps / 1e8).toFixed(1)} 億回 (TLE)`
                        : compNaiveOps >= 1e6
                        ? `約 ${(compNaiveOps / 1e6).toFixed(1)} 百万回`
                        : `${compNaiveOps.toLocaleString()} 回`}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">二分探索による座標圧縮 (O(N log N)):</span>
                    <div className="font-mono font-bold text-emerald-600 text-base">
                      約 {(compFastOps / 1e6).toFixed(2)} 百万回 ({compFastSec < 0.001 ? '< 0.001' : compFastSec.toFixed(3)} 秒)
                    </div>
                  </div>
                </div>
              </div>

              {/* アルゴリズムの核心 */}
              <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span>✨</span> 競技プログラミングの鉄則: 「重要なのは値そのものではなく、大小関係」
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  数列の中に 10⁹ や 10¹⁸ といった巨大な数が含まれていても、登場する数値の種類は高々 N 種類（10⁵ 個）しかありません。<br />
                  <strong>「値の大小関係（何番目に大きいか・小さいか）だけが必要」</strong>な問題では、座標圧縮によって 1 ～ N のコンパクトな整数に置き換えることで、<br />
                  <span className="inline-block my-2 px-3 py-1 rounded bg-slate-800 font-mono text-pink-300 font-bold text-sm">
                    配列の添字として使えるようになり、いもす法やセグ木などの高速アルゴリズムと合体可能になる
                  </span><br />
                  という絶大なメリットが生まれます。
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ==================== タブ 4: 解法コード ==================== */}
        {activeTab === 'code' && (
          <section className="flex flex-col gap-6">
            <CodeViewer
              title="模範解答コード (A15 - Compression)"
              description="C++ の std::lower_bound または Python の bisect_left による定石実装です。"
              cppCode={CPP_CODE}
              pythonCode={PYTHON_CODE}
            />
          </section>
        )}
      </main>
    </div>
  );
};
