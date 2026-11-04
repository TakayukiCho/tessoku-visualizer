import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TabType, ProblemViewProps } from '../../types';
import {
  ProblemLayout,
  PlayerControls,
  CodeViewer,
  ExecutionMonitor,
  PointerBadge,
  ComplexityCard,
  Button,
  Slider,
  Badge,
} from '../../components';

interface A14Step {
  type: string;
  pIdx: number;
  target: number | null;
  L: number;
  R: number;
  mid: number;
  found: boolean;
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
    long long K;
    if (!(cin >> N >> K)) return 0;

    vector<long long> A(N), B(N), C(N), D(N);
    for (int i = 0; i < N; i++) cin >> A[i];
    for (int i = 0; i < N; i++) cin >> B[i];
    for (int i = 0; i < N; i++) cin >> C[i];
    for (int i = 0; i < N; i++) cin >> D[i];

    // 1. 前半グループ (A + B) の和をすべて列挙 (N^2 通り)
    vector<long long> P;
    P.reserve(N * N);
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            P.push_back(A[i] + B[j]);
        }
    }

    // 2. 後半グループ (C + D) の和をすべて列挙 (N^2 通り)
    vector<long long> Q;
    Q.reserve(N * N);
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            Q.push_back(C[i] + D[j]);
        }
    }

    // 3. 後半配列 Q を昇順にソート (二分探索のため)
    sort(Q.begin(), Q.end());

    // 4. P の各要素に対し、相方 (K - p) が Q に存在するか二分探索
    for (long long p : P) {
        long long target = K - p;
        if (binary_search(Q.begin(), Q.end(), target)) {
            cout << "Yes\\n";
            return 0; // 見つかったら即座に終了
        }
    }

    cout << "No\\n";
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
    K = int(data[1])

    idx = 2
    A = [int(x) for x in data[idx : idx + N]]; idx += N
    B = [int(x) for x in data[idx : idx + N]]; idx += N
    C = [int(x) for x in data[idx : idx + N]]; idx += N
    D = [int(x) for x in data[idx : idx + N]]; idx += N

    # 1. 前半 (A + B) の和を列挙 (N^2 通り)
    P = [a + b for a in A for b in B]

    # 2. 後半 (C + D) の和を列挙 (N^2 通り)
    Q = [c + d for c in C for d in D]

    # 3. 後半配列 Q をソート
    Q.sort()

    # 4. P の各要素に対し、K - p を二分探索 (bisect)
    len_q = len(Q)
    for p in P:
        target = K - p
        pos = bisect.bisect_left(Q, target)
        if pos < len_q and Q[pos] == target:
            print("Yes")
            return

    print("No")

if __name__ == "__main__":
    main()`;

export const A14View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const [targetK, setTargetK] = useState<number>(50);
  const [cards, setCards] = useState<{ A: number[]; B: number[]; C: number[]; D: number[] }>({
    A: [5, 12, 17],
    B: [3, 8, 15],
    C: [4, 10, 20],
    D: [6, 15, 23],
  });
  const [selected, setSelected] = useState<{ A: number | null; B: number | null; C: number | null; D: number | null }>({
    A: null,
    B: null,
    C: null,
    D: null,
  });

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(800);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3のスライダーN
  const [sliderN, setSliderN] = useState<number>(1000);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">目標合計値</span>
          <span>K = {targetK}</span>
        </Badge>
      );
    }
  }, [targetK, onSetHeaderBadge]);

  // 前半 P
  const P = useMemo(() => {
    const list: { val: number; fromA: number; fromB: number }[] = [];
    cards.A.forEach(a => {
      cards.B.forEach(b => {
        list.push({ val: a + b, fromA: a, fromB: b });
      });
    });
    return list;
  }, [cards.A, cards.B]);

  // 後半 Q
  const Q = useMemo(() => {
    const list: { val: number; fromC: number; fromD: number }[] = [];
    cards.C.forEach(c => {
      cards.D.forEach(d => {
        list.push({ val: c + d, fromC: c, fromD: d });
      });
    });
    return list.sort((x, y) => x.val - y.val);
  }, [cards.C, cards.D]);

  // ステップ事前生成
  const steps: A14Step[] = useMemo(() => {
    const list: A14Step[] = [];
    list.push({
      type: 'init',
      pIdx: -1,
      target: null,
      L: -1,
      R: -1,
      mid: -1,
      found: false,
      comment: '探索開始前です。「1手進む」を押して二分探索を始めましょう。',
    });

    let foundGlobal = false;
    for (let pIdx = 0; pIdx < P.length; pIdx++) {
      if (foundGlobal) break;

      const currentP = P[pIdx].val;
      const targetQ = targetK - currentP;

      list.push({
        type: 'start_p',
        pIdx,
        target: targetQ,
        L: 0,
        R: Q.length - 1,
        mid: -1,
        found: false,
        comment: `配列 P の [${pIdx}] 番目の値 <strong>p = ${currentP}</strong> に着目。<br>探す相方の値は <strong>target = K - p = ${targetK} - ${currentP} = ${targetQ}</strong> です。配列 Q の全体 [0 ～ ${Q.length - 1}] から二分探索を開始します。`,
      });

      let L = 0;
      let R = Q.length - 1;

      while (L <= R) {
        const mid = Math.floor((L + R) / 2);
        const midVal = Q[mid].val;

        if (midVal === targetQ) {
          list.push({
            type: 'found',
            pIdx,
            target: targetQ,
            L,
            R,
            mid,
            found: true,
            comment: `🎉 <strong>発見！</strong> 中央の <strong>Q[${mid}] = ${midVal}</strong> が探していた値 <strong>${targetQ}</strong> と完全一致しました！<br><span class="text-emerald-300 font-mono font-bold">P[${pIdx}] (${currentP}) + Q[${mid}] (${midVal}) = ${targetK}</span> が成立するため、判定結果は <strong>Yes</strong> です！`,
          });
          foundGlobal = true;
          break;
        } else if (midVal < targetQ) {
          list.push({
            type: 'mid_less',
            pIdx,
            target: targetQ,
            L,
            R,
            mid,
            found: false,
            comment: `中央値 <strong>Q[${mid}] = ${midVal}</strong> を検査。<br>Q[${mid}] (${midVal}) &lt; target (${targetQ}) なので、${midVal} 以下の左側には target は存在しません。<br>➜ 探索範囲を <strong>右半分 [${mid + 1} ～ ${R}]</strong> に絞り込みます。`,
          });
          L = mid + 1;
        } else {
          list.push({
            type: 'mid_greater',
            pIdx,
            target: targetQ,
            L,
            R,
            mid,
            found: false,
            comment: `中央値 <strong>Q[${mid}] = ${midVal}</strong> を検査。<br>Q[${mid}] (${midVal}) &gt; target (${targetQ}) なので、${midVal} 以上の右側には target は存在しません。<br>➜ 探索範囲を <strong>左半分 [${L} ～ ${mid - 1}]</strong> に絞り込みます。`,
          });
          R = mid - 1;
        }
      }

      if (!foundGlobal) {
        list.push({
          type: 'p_not_found',
          pIdx,
          target: targetQ,
          L,
          R,
          mid: -1,
          found: false,
          comment: `探索範囲が交差（L &gt; R）したため、配列 Q 内に <strong>${targetQ}</strong> は存在しませんでした。<br>次の P の要素へ進みます。`,
        });
      }
    }

    if (!foundGlobal) {
      list.push({
        type: 'all_failed',
        pIdx: P.length - 1,
        target: null,
        L: -1,
        R: -1,
        mid: -1,
        found: false,
        comment: `配列 P のすべての要素について探索しましたが、和が ${targetK} になる組み合わせはありませんでした。<br>判定結果は <strong>No</strong> です。`,
      });
    }

    return list;
  }, [P, Q, targetK]);

  // 自動再生タイマー
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
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

  const toggleSelectCard = (box: 'A' | 'B' | 'C' | 'D', val: number) => {
    setSelected(prev => ({
      ...prev,
      [box]: prev[box] === val ? null : val,
    }));
  };

  const resetSelection = () => setSelected({ A: null, B: null, C: null, D: null });

  const randomizeProblem = () => {
    const target = 50;
    setTargetK(target);
    const a = 5 + Math.floor(Math.random() * 15);
    const b = 5 + Math.floor(Math.random() * 15);
    const c = 5 + Math.floor(Math.random() * 15);
    const d = target - (a + b + c);

    const makeBox = (mustVal: number) => {
      const s = new Set<number>([mustVal]);
      while (s.size < 3) s.add(2 + Math.floor(Math.random() * 25));
      return Array.from(s).sort((x, y) => x - y);
    };

    setCards({
      A: makeBox(a),
      B: makeBox(b),
      C: makeBox(c),
      D: makeBox(d > 0 ? d : 15),
    });
    resetSelection();
    handleReset();
  };

  const currentStep = steps[currentStepIdx] || steps[0];

  // タブ3の計算量計算
  const naiveOps = Math.pow(sliderN, 4);
  const naiveSec = naiveOps / 1e8;
  const log2N = Math.log2(Math.max(2, sliderN * sliderN));
  const meetOps = Math.round(sliderN * sliderN * log2N);
  const meetSec = meetOps / 1e8;

  // タブ1の合計
  const allSelected = selected.A !== null && selected.B !== null && selected.C !== null && selected.D !== null;
  const currentSum = (selected.A || 0) + (selected.B || 0) + (selected.C || 0) + (selected.D || 0);

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            4 つの箱 <strong className="text-red-500">A</strong>, <strong className="text-blue-500">B</strong>, <strong className="text-emerald-500">C</strong>, <strong className="text-amber-500">D</strong> からカードを <strong>1 枚ずつ</strong> 選びます。<br className="hidden md:inline" />
            選んだ 4 枚の合計をちょうど <strong>K ({targetK})</strong> にできるでしょうか？ カードをクリックして試してみましょう！
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={resetSelection} variant="outline" size="sm">
            🔄 選択クリア
          </Button>
          <Button onClick={randomizeProblem} variant="primary" size="sm">
            🎲 新しい問題生成
          </Button>
        </div>
      </div>

      {/* 判定ボード */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
        <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">リアルタイム合計シミュレーター</div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-lg md:text-2xl font-bold font-mono">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 flex flex-col items-center justify-center text-red-600">
            <span className="text-[10px] font-sans font-bold text-red-400 uppercase">箱 A</span>
            <span className="text-xl md:text-2xl font-black">{selected.A !== null ? selected.A : '?'}</span>
          </div>
          <span className="text-slate-400 font-normal">+</span>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center text-blue-600">
            <span className="text-[10px] font-sans font-bold text-blue-400 uppercase">箱 B</span>
            <span className="text-xl md:text-2xl font-black">{selected.B !== null ? selected.B : '?'}</span>
          </div>
          <span className="text-slate-400 font-normal">+</span>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center text-emerald-600">
            <span className="text-[10px] font-sans font-bold text-emerald-400 uppercase">箱 C</span>
            <span className="text-xl md:text-2xl font-black">{selected.C !== null ? selected.C : '?'}</span>
          </div>
          <span className="text-slate-400 font-normal">+</span>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center text-amber-600">
            <span className="text-[10px] font-sans font-bold text-amber-400 uppercase">箱 D</span>
            <span className="text-xl md:text-2xl font-black">{selected.D !== null ? selected.D : '?'}</span>
          </div>
          <span className="text-slate-400 font-normal">=</span>
          <div className="px-5 py-3 rounded-xl bg-slate-100 min-w-[100px] flex flex-col items-center justify-center border border-slate-300">
            <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">現在の合計</span>
            <span className={`text-2xl md:text-3xl font-black ${
              allSelected
                ? currentSum === targetK ? 'text-emerald-600 animate-bounce-short' : 'text-red-600'
                : 'text-slate-700'
            }`}>
              {currentSum}
            </span>
          </div>
        </div>

        <div className="mt-5">
          {allSelected ? (
            currentSum === targetK ? (
              <Badge variant="emerald" size="lg" className="animate-pulse-fast">
                <span>🎉</span> 判定: Yes! (合計がちょうど K = {targetK} になりました！)
              </Badge>
            ) : (
              <Badge variant="red" size="md">
                <span>❌</span> 判定: 合計 {currentSum} (目標 {targetK} と一致しません)
              </Badge>
            )
          ) : (
            <Badge variant="slate" size="md">
              <span>👆 各箱から 1 枚ずつカードを選んでください</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 4つの箱グリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['A', 'B', 'C', 'D'] as const).map(boxKey => {
          const colors = {
            A: { border: 'border-red-200', text: 'text-red-500', headerBg: 'bg-red-500', btnActive: 'bg-red-500 text-white ring-2 ring-red-400', btnIdle: 'bg-red-50/60 hover:bg-red-100 text-red-700 border-red-200' },
            B: { border: 'border-blue-200', text: 'text-blue-500', headerBg: 'bg-blue-500', btnActive: 'bg-blue-500 text-white ring-2 ring-blue-400', btnIdle: 'bg-blue-50/60 hover:bg-blue-100 text-blue-700 border-blue-200' },
            C: { border: 'border-emerald-200', text: 'text-emerald-500', headerBg: 'bg-emerald-500', btnActive: 'bg-emerald-500 text-white ring-2 ring-emerald-400', btnIdle: 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 border-emerald-200' },
            D: { border: 'border-amber-200', text: 'text-amber-500', headerBg: 'bg-amber-500', btnActive: 'bg-amber-500 text-white ring-2 ring-amber-400', btnIdle: 'bg-amber-50/60 hover:bg-amber-100 text-amber-700 border-amber-200' },
          }[boxKey];

          return (
            <div key={boxKey} className={`bg-white rounded-2xl border-2 ${colors.border} p-4 shadow-sm flex flex-col`}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className={`${colors.headerBg} text-white font-black text-xs px-2.5 py-1 rounded-md`}>箱 {boxKey}</span>
                <span className={`text-xs ${colors.text} font-semibold`}>{cards[boxKey].length} 枚</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {cards[boxKey].map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleSelectCard(boxKey, val)}
                    className={`w-full py-2 px-3 rounded-xl border text-sm font-bold font-mono transition-all transform active:scale-95 flex items-center justify-between ${
                      selected[boxKey] === val ? colors.btnActive : colors.btnIdle
                    }`}
                  >
                    <span>カード #{idx + 1}</span>
                    <span className="text-base font-black">{val}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  // ==================== タブ 2 コンテンツ ====================
  const algoContent = (
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

      {/* 実行モニター (Organism) */}
      <ExecutionMonitor
        statusText={
          currentStep.found
            ? 'Yes! 解を発見'
            : currentStep.type === 'all_failed'
            ? 'No! 存在しません'
            : currentStepIdx === 0
            ? '待機中'
            : '探索実行中'
        }
        statusVariant={
          currentStep.found
            ? 'success'
            : currentStep.type === 'all_failed'
            ? 'danger'
            : currentStepIdx === 0
            ? 'idle'
            : 'running'
        }
        items={[
          {
            label: '現在の P の値 (A + B)',
            value: <span className="text-indigo-300">p = {currentStep.pIdx >= 0 ? P[currentStep.pIdx].val : '--'}</span>,
            subValue: currentStep.pIdx >= 0 ? `インデックス: [${currentStep.pIdx}]` : '未選択',
          },
          {
            label: 'Q の中で探すべき相方の値',
            value: <span className="text-pink-400">target = {currentStep.target !== null ? currentStep.target : '--'}</span>,
          },
          {
            label: '二分探索のポインタ [L, Mid, R]',
            value: <PointerBadge L={currentStep.L} mid={currentStep.mid} R={currentStep.R} />,
          },
        ]}
        commentaryHtml={currentStep.comment}
      />

      {/* 配列 P の表示 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
              前半グループの和: 配列 P = [箱A + 箱B]
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">箱A と 箱B の全組み合わせ（計 {P.length} 通り）</p>
          </div>
          <Badge variant="indigo" size="sm">左から1つずつ走査</Badge>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 pb-1 overflow-x-auto">
          {P.map((item, idx) => {
            const isActive = idx === currentStep.pIdx;
            const isMatched = currentStep.found && idx === currentStep.pIdx;
            let cls = 'flex flex-col items-center justify-center min-w-[54px] px-2 py-1.5 rounded-xl border text-xs font-mono transition-all duration-200 ';
            if (isMatched) cls += 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-400 font-bold scale-105 shadow-md';
            else if (isActive) cls += 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300 font-bold scale-105 shadow-sm';
            else cls += 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';

            return (
              <div key={idx} className={cls}>
                <span className="text-[9px] opacity-70">P[{idx}]</span>
                <span className="text-sm font-black">{item.val}</span>
                <span className="text-[8px] opacity-60">({item.fromA}+{item.fromB})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 配列 Q の表示 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              後半グループの和: 配列 Q = [箱C + 箱D] （昇順ソート済み）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">二分探索を行うため昇順ソート済み（計 {Q.length} 通り）</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-400 inline-block"></span> 探索範囲 [L, R]</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-500 text-white inline-block"></span> 中央値 (Mid)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 text-white inline-block"></span> 発見 (Match)</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 pb-2 overflow-x-auto min-h-[90px] items-end">
          {Q.map((item, idx) => {
            const inRange = currentStep.L >= 0 && currentStep.R >= 0 && idx >= currentStep.L && idx <= currentStep.R;
            const isMid = idx === currentStep.mid;
            const isFound = currentStep.found && idx === currentStep.mid;

            let cls = 'relative flex flex-col items-center justify-center min-w-[54px] px-2 py-2 rounded-xl border text-xs font-mono transition-all duration-200 ';
            if (isFound) cls += 'bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-300 font-black scale-110 shadow-lg z-10 animate-bounce-short';
            else if (isMid) cls += 'bg-pink-500 text-white border-pink-600 ring-2 ring-pink-300 font-black scale-105 shadow-md z-10';
            else if (inRange) cls += 'bg-blue-50 text-blue-900 border-blue-300 font-bold';
            else cls += 'bg-slate-100 text-slate-400 border-slate-200 opacity-40';

            let marker = null;
            if (idx === currentStep.L && idx === currentStep.R && !currentStep.found) {
              marker = <span className="absolute -top-5 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1 rounded">L=R</span>;
            } else if (idx === currentStep.L && !currentStep.found) {
              marker = <span className="absolute -top-5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded">L</span>;
            } else if (idx === currentStep.R && !currentStep.found) {
              marker = <span className="absolute -top-5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded">R</span>;
            }

            return (
              <div key={idx} className={cls}>
                {marker}
                <span className="text-[9px] opacity-70">Q[{idx}]</span>
                <span className="text-sm font-black">{item.val}</span>
                <span className="text-[8px] opacity-60">({item.fromC}+{item.fromD})</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  // ==================== タブ 3 コンテンツ ====================
  const complexityContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span>💥</span> なぜ 4 重ループだと間に合わないのか？
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          この問題の制約は <strong className="text-indigo-600">N ≤ 1000</strong>、制限時間は <strong className="text-indigo-600">5.0 秒</strong> です。<br />
          一般的なオンラインジャッジ（AtCoderなど）では、1 秒間に処理できるループ回数はおよそ <strong>10<sup>8</sup> 回（1 億回）</strong> 程度です。
        </p>

        {/* スライダー (Atom) */}
        <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <Slider
            label="各箱のカード枚数 N を動かしてみる:"
            displayValue={`N = ${sliderN}`}
            id="sliderN"
            min={10}
            max={1000}
            step={10}
            value={sliderN}
            onChange={e => setSliderN(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>N=10</span>
            <span>N=200</span>
            <span>N=500</span>
            <span>N=1000 (最大値)</span>
          </div>
        </div>

        {/* 比較カード (Molecules) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComplexityCard
            title="愚直な全探索 (4重ループ)"
            order="O(N⁴)"
            description="A × B × C × D のすべての組み合わせをそのまま調べる"
            opsLabel={`${naiveOps.toLocaleString()} 回`}
            opsSubLabel={naiveOps >= 1e12 ? `（約 ${(naiveOps / 1e12).toFixed(1)} 兆回！）` : naiveOps >= 1e8 ? `（約 ${(naiveOps / 1e8).toFixed(1)} 億回！）` : `（約 ${naiveOps.toLocaleString()} 回）`}
            timeLabel={
              naiveSec >= 3600
                ? `約 ${(naiveSec / 3600).toFixed(1)} 時間 (約 ${Math.round(naiveSec).toLocaleString()} 秒)`
                : naiveSec >= 60
                ? `約 ${(naiveSec / 60).toFixed(1)} 分 (約 ${Math.round(naiveSec).toLocaleString()} 秒)`
                : `約 ${naiveSec.toFixed(3)} 秒`
            }
            statusBadge={{ icon: '❌', text: 'TLE（大幅に制限時間をオーバー）', isPass: false }}
            variant="danger"
          />

          <ComplexityCard
            title="半分全列挙 ＋ 二分探索"
            order="O(N² log N)"
            description="(A+B) と (C+D) に分割し、後半をソートして二分探索"
            opsLabel={`約 ${meetOps.toLocaleString()} 回`}
            opsSubLabel={meetOps >= 1e6 ? `（約 ${(meetOps / 1e6).toFixed(1)} 百万回）` : `（約 ${meetOps.toLocaleString()} 回）`}
            timeLabel={meetSec < 0.001 ? '< 0.001 秒' : `約 ${meetSec.toFixed(3)} 秒`}
            statusBadge={{ icon: '⭕', text: 'AC（制限時間 5.0秒 に対し余裕で合格！）', isPass: true }}
            variant="success"
          />
        </div>

        {/* アルゴリズムの核心 */}
        <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「半分全列挙 (Meet in the Middle)」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            対象の要素数が 4 つ（A, B, C, D）あってそのままでは指数・高次多項式で爆発するとき、<strong>「前半 2 つ」と「後半 2 つ」に分割</strong>します。<br />
            前半の和 p = A_i + B_j を全列挙したとき、A_i + B_j + C_k + D_l = K が成り立つための条件は、<br />
            <span className="inline-block my-2 px-3 py-1 rounded bg-slate-800 font-mono text-pink-300 font-bold text-sm">
              C_k + D_l = K - p
            </span><br />
            となります。後半の全通り C_k + D_l を配列 Q にあらかじめ集めてソートしておけば、<strong>値 (K - p) が存在するかどうかを O(log N) で高速判定</strong>できます。
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A14 - Four Boxes)"
        description="C++ の std::binary_search または Python の bisect を使用した鉄則解法です。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & 判定"
      algoTabLabel="② 二分探索ビジュアライザー"
      complexityTabLabel="③ 1兆回 vs 2000万回（計算量）"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
