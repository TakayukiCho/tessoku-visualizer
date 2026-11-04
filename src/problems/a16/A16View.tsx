import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TabType, ProblemViewProps } from '../../types';
import {
  ProblemLayout,
  PlayerControls,
  CodeViewer,
  ExecutionMonitor,
  ComplexityCard,
  Button,
  Slider,
  Badge,
} from '../../components';

interface A16Step {
  roomIdx: number; // 1-indexed: 1, 2, ..., N
  dpState: number[];
  fromRoom1: number | null; // dp[i-1] + A[i]
  fromRoom2: number | null; // dp[i-2] + B[i]
  chosenFrom: number | null; // 直前1部屋前(1) か 2部屋前(2)
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

    // A[i]: 部屋 i から部屋 i+1 へ移動する時間 (i = 1 ... N-1)
    vector<int> A(N + 1);
    for (int i = 2; i <= N; i++) cin >> A[i];

    // B[i]: 部屋 i-2 から部屋 i へ移動する時間 (i = 3 ... N)
    vector<int> B(N + 1);
    for (int i = 3; i <= N; i++) cin >> B[i];

    // dp[i]: 部屋 1 から部屋 i に到達する最短時間
    vector<int> dp(N + 1, 0);

    // 初期条件 (ベースケース)
    dp[1] = 0;        // スタート地点は時間 0
    dp[2] = A[2];     // 部屋 2 へは部屋 1 からの 1 通りのみ

    // 遷移: 部屋 3 以降は「1歩手前から来る」か「2歩手前から来る」の小さい方
    for (int i = 3; i <= N; i++) {
        dp[i] = min(dp[i - 1] + A[i], dp[i - 2] + B[i]);
    }

    // 答え: 部屋 N への最小時間
    cout << dp[N] << "\\n";

    return 0;
}`;

const PYTHON_CODE = `import sys

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return

    N = int(data[0])
    idx = 1

    # A[i]: 部屋 i-1 から部屋 i への時間 (i=2...N)
    # 添字を 1-indexed に合わせるためダミーの 0 を先頭に付与
    A = [0, 0] + [int(x) for x in data[idx : idx + (N - 1)]]
    idx += N - 1

    # B[i]: 部屋 i-2 から部屋 i への時間 (i=3...N)
    B = [0, 0, 0] + [int(x) for x in data[idx : idx + (N - 2)]]

    # dp[i]: 部屋 1 から部屋 i に到達する最小時間
    dp = [0] * (N + 1)
    dp[1] = 0
    dp[2] = A[2]

    # 遷移
    for i in range(3, N + 1):
        dp[i] = min(dp[i - 1] + A[i], dp[i - 2] + B[i])

    print(dp[N])

if __name__ == "__main__":
    main()`;

export const A16View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  
  // デフォルト: 鉄則本 例1 (N=5)
  // A: [0, 0, 2, 4, 1, 3] (部屋2へのコスト2, 部屋3へ4, 部屋4へ1, 部屋5へ3)
  // B: [0, 0, 0, 5, 3, 2] (部屋3への直通5, 部屋4へ3, 部屋5へ2)
  const [roomCount] = useState<number>(5);
  const [costA, setCostA] = useState<number[]>([0, 0, 2, 4, 1, 3]);
  const [costB, setCostB] = useState<number[]>([0, 0, 0, 5, 3, 2]);

  // タブ1: 手動体験パス [1, ...]
  const [userPath, setUserPath] = useState<number[]>([1]);

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3: スライダーN
  const [sliderN, setSliderN] = useState<number>(40);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">部屋数</span>
          <span>N = {roomCount}</span>
        </Badge>
      );
    }
  }, [roomCount, onSetHeaderBadge]);

  // DP 計算
  const dpTable = useMemo(() => {
    const dp = new Array(roomCount + 1).fill(0);
    dp[1] = 0;
    if (roomCount >= 2) dp[2] = costA[2];
    for (let i = 3; i <= roomCount; i++) {
      dp[i] = Math.min(dp[i - 1] + costA[i], dp[i - 2] + costB[i]);
    }
    return dp;
  }, [roomCount, costA, costB]);

  // ステップ生成
  const steps: A16Step[] = useMemo(() => {
    const list: A16Step[] = [];
    const currentDP = new Array(roomCount + 1).fill(-1);

    // Step 0: スタート地点（部屋1）
    currentDP[1] = 0;
    list.push({
      roomIdx: 1,
      dpState: [...currentDP],
      fromRoom1: null,
      fromRoom2: null,
      chosenFrom: null,
      comment: `【ベースケース】<br>スタート地点の部屋 1 にいます。所要時間は当然 <strong>dp[1] = 0 分</strong> です。ここからダンジョンの奥へ向けてDPテーブルを順番に埋めていきます。`,
    });

    // Step 1: 部屋2
    currentDP[2] = costA[2];
    list.push({
      roomIdx: 2,
      dpState: [...currentDP],
      fromRoom1: costA[2],
      fromRoom2: null,
      chosenFrom: 1,
      comment: `【部屋 2 への遷移】<br>部屋 2 に到達するルートは、部屋 1 から「1マス移動」するしかありません。<br><span class="font-mono font-bold text-indigo-300">dp[2] = dp[1] + A[2] = 0 + ${costA[2]} = ${costA[2]} 分</span> に確定します。`,
    });

    // Step 2以降: 部屋3 ... N
    for (let i = 3; i <= roomCount; i++) {
      const from1 = currentDP[i - 1] + costA[i];
      const from2 = currentDP[i - 2] + costB[i];
      const chosen = from1 <= from2 ? 1 : 2;
      const minCost = Math.min(from1, from2);
      currentDP[i] = minCost;

      list.push({
        roomIdx: i,
        dpState: [...currentDP],
        fromRoom1: from1,
        fromRoom2: from2,
        chosenFrom: chosen,
        comment: `【部屋 ${i} への遷移の比較】<br>
        部屋 ${i} へ至る道は 2 通り存在します：<br>
        ① 部屋 ${i - 1} から 1 歩進む場合：<span class="font-mono text-blue-300">dp[${i - 1}] (${currentDP[i - 1]}) + A[${i}] (${costA[i]}) = <strong>${from1} 分</strong></span><br>
        ② 部屋 ${i - 2} から 2 歩スキップする場合：<span class="font-mono text-amber-300">dp[${i - 2}] (${currentDP[i - 2]}) + B[${i}] (${costB[i]}) = <strong>${from2} 分</strong></span><br>
        👉 小さい方（最小値）を採用するため、<strong class="text-emerald-300">dp[${i}] = min(${from1}, ${from2}) = ${minCost} 分</strong>（部屋 ${chosen === 1 ? i - 1 : i - 2} からのルート）となります！`,
      });
    }

    return list;
  }, [roomCount, costA, costB]);

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

  // プリセット
  const loadPreset = (preset: number) => {
    if (preset === 1) {
      setCostA([0, 0, 2, 4, 1, 3]);
      setCostB([0, 0, 0, 5, 3, 2]);
    } else {
      setCostA([0, 0, 10, 10, 10, 10]);
      setCostB([0, 0, 0, 5, 5, 5]);
    }
    setUserPath([1]);
    handleReset();
  };

  const randomizeCosts = () => {
    const newA = [0, 0];
    const newB = [0, 0, 0];
    for (let i = 2; i <= roomCount; i++) newA.push(1 + Math.floor(Math.random() * 8));
    for (let i = 3; i <= roomCount; i++) newB.push(2 + Math.floor(Math.random() * 10));
    setCostA(newA);
    setCostB(newB);
    setUserPath([1]);
    handleReset();
  };

  // 手動体験用
  const currentPos = userPath[userPath.length - 1];
  const userTotalCost = useMemo(() => {
    let cost = 0;
    for (let i = 1; i < userPath.length; i++) {
      const from = userPath[i - 1];
      const to = userPath[i];
      if (to === from + 1) cost += costA[to];
      else if (to === from + 2) cost += costB[to];
    }
    return cost;
  }, [userPath, costA, costB]);

  const moveUser = (stepsCount: 1 | 2) => {
    const nextPos = currentPos + stepsCount;
    if (nextPos <= roomCount) {
      setUserPath([...userPath, nextPos]);
    }
  };

  const resetUserPath = () => setUserPath([1]);

  const currentStep = steps[currentStepIdx] || steps[0];

  // タブ3: 計算量比較 (Fibonacci的 2^N vs N)
  // 再帰での呼び出し回数: fib(N+1) ≈ 1.618^N
  const naiveCalls = Math.round(Math.pow(1.618, sliderN));
  const naiveSec = naiveCalls / 1e8;
  const dpOps = sliderN;

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      {/* 概要カード */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール：ダンジョン脱出
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            部屋 1 からスタートし、部屋 {roomCount}（ゴール）へ最小時間で到達せよ！<br />
            移動方法は <strong>「次の部屋へ 1 歩進む」</strong> または <strong>「1つ飛ばして 2 歩ジャンプする」</strong> の 2 つのみ。ボタンを押して最短ルートを探してみましょう！
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => loadPreset(1)} variant="outline" size="sm">
            例1 (鉄則本)
          </Button>
          <Button onClick={randomizeCosts} variant="primary" size="sm">
            🎲 コスト再生成
          </Button>
        </div>
      </div>

      {/* インタラクティブゲーム盤面 */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">ダンジョンマップ（手動移動シミュレーター）</div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">あなたの現在の所要時間:</span>
            <span className="text-xl font-black font-mono text-indigo-600">{userTotalCost} 分</span>
          </div>
        </div>

        {/* 部屋の並び */}
        <div className="grid grid-cols-5 gap-3 pt-4 pb-2">
          {[1, 2, 3, 4, 5].map(roomNum => {
            const isCurrent = currentPos === roomNum;
            const isVisited = userPath.includes(roomNum);
            const isGoal = roomNum === roomCount;

            return (
              <div
                key={roomNum}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-300 scale-105 shadow-md'
                    : isVisited
                    ? 'border-emerald-400 bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    現在地 🚶
                  </span>
                )}
                <div className="text-xs font-bold text-slate-500 font-sans">
                  {isGoal ? '🏁 ゴール' : `部屋 ${roomNum}`}
                </div>
                <div className="text-2xl font-black font-mono text-slate-800 my-1">
                  #{roomNum}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  最短記録: <strong className="text-emerald-600">{dpTable[roomNum]}分</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* コスト表示カード */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-blue-700 flex items-center gap-1 mb-1">
              <span>🚶 1歩移動コスト A:</span>
            </span>
            <div className="flex gap-2 font-mono">
              {[2, 3, 4, 5].map(i => (
                <span key={i} className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-semibold">
                  {i - 1}➜{i}: <strong>+{costA[i]}分</strong>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-bold text-amber-700 flex items-center gap-1 mb-1">
              <span>🦘 2歩ジャンプコスト B:</span>
            </span>
            <div className="flex gap-2 font-mono">
              {[3, 4, 5].map(i => (
                <span key={i} className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                  {i - 2}➜{i}: <strong>+{costB[i]}分</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => moveUser(1)}
              disabled={currentPos + 1 > roomCount}
              variant="primary"
              size="md"
            >
              🚶 1部屋進む (+{currentPos + 1 <= roomCount ? costA[currentPos + 1] : 0}分)
            </Button>
            <Button
              onClick={() => moveUser(2)}
              disabled={currentPos + 2 > roomCount}
              variant="warning"
              size="md"
            >
              🦘 2部屋スキップ (+{currentPos + 2 <= roomCount ? costB[currentPos + 2] : 0}分)
            </Button>
            <Button onClick={resetUserPath} variant="outline" size="md">
              🔄 部屋1からやり直す
            </Button>
          </div>

          <div>
            {currentPos === roomCount ? (
              userTotalCost === dpTable[roomCount] ? (
                <Badge variant="emerald" size="lg" className="animate-pulse-fast">
                  🎉 最短記録達成！ ({userTotalCost} 分)
                </Badge>
              ) : (
                <Badge variant="amber" size="md">
                  ゴール！ しかし最短 ({dpTable[roomCount]}分) より {userTotalCost - dpTable[roomCount]}分 遅いです
                </Badge>
              )
            ) : (
              <span className="text-xs text-slate-500 font-sans">
                移動履歴: <code className="font-mono font-bold text-indigo-600">{userPath.join(' ➜ ')}</code>
              </span>
            )}
          </div>
        </div>
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

      {/* 実行モニター */}
      <ExecutionMonitor
        statusText={
          currentStep.roomIdx === roomCount ? 'ゴール到達・完了！' : `部屋 ${currentStep.roomIdx} 計算中`
        }
        statusVariant={currentStep.roomIdx === roomCount ? 'success' : 'running'}
        items={[
          {
            label: '現在決定中の状態',
            value: <span className="text-indigo-300">dp[{currentStep.roomIdx}]</span>,
            subValue: `部屋 ${currentStep.roomIdx} の最小時間`,
          },
          {
            label: '① 1部屋前から進む場合',
            value: (
              <span className="text-blue-300">
                {currentStep.fromRoom1 !== null ? `${currentStep.fromRoom1} 分` : '不可 (起点)'}
              </span>
            ),
            subValue: currentStep.roomIdx >= 2 ? `dp[${currentStep.roomIdx - 1}] + A[${currentStep.roomIdx}]` : undefined,
          },
          {
            label: '② 2部屋前からスキップ',
            value: (
              <span className="text-amber-300">
                {currentStep.fromRoom2 !== null ? `${currentStep.fromRoom2} 分` : '不可 (部屋1・2)'}
              </span>
            ),
            subValue: currentStep.roomIdx >= 3 ? `dp[${currentStep.roomIdx - 2}] + B[${currentStep.roomIdx}]` : undefined,
          },
          {
            label: '決定した最短コスト dp',
            value: (
              <span className="text-emerald-400 font-black">
                {currentStep.dpState[currentStep.roomIdx]} 分
              </span>
            ),
            subValue: currentStep.chosenFrom ? `部屋 ${currentStep.roomIdx - currentStep.chosenFrom} から採用` : '初期値',
          },
        ]}
        commentaryHtml={currentStep.comment}
      />

      {/* DP テーブルのビジュアル表示 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              DP 配列テーブル（メモ化テーブル）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              過去の計算結果（部分問題の最適解）を配列に記録し、それらを再利用して次の部屋を解きます。
            </p>
          </div>
          <Badge variant="indigo" size="sm">O(N) で左から1回走査</Badge>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map(i => {
            const val = currentStep.dpState[i];
            const isSolved = val !== -1;
            const isCurrent = currentStep.roomIdx === i;

            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-200 scale-105 shadow-md'
                    : isSolved
                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-sans font-bold opacity-70">dp[{i}]</span>
                <span className="text-2xl font-black font-mono my-1">
                  {isSolved ? `${val}分` : '?'}
                </span>
                <span className="text-[9px] font-sans opacity-80">
                  {i === 1 ? 'スタート (0)' : i === 2 ? '1通りのみ' : `min(①, ②)`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 思考プロセスの解説コラム */}
        <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs leading-relaxed space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5 text-sm">
            <span>🧠</span> なぜ動的計画法（DP）で解けるのか？【最適部分構造】
          </div>
          <p>
            部屋 $i$ への最短時間を求めるとき、<strong>「部屋 $i$ に到達する直前は、部屋 $i-1$ か部屋 $i-2$ のどちらかしかあり得ない」</strong>という事実に基づきます。<br />
            そして、部屋 $i-1$ までの最短時間 $dp[i-1]$ と、部屋 $i-2$ までの最短時間 $dp[i-2]$ さえ分かっていれば、それより前の細かい移動経路（どうやって部屋 $i-1$ に来たか）を気にする必要は一切ありません！<br />
            このように<strong>「大きな問題を、直前の小さな問題の答えから解く」</strong>のが動的計画法の本質です。
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 3 コンテンツ ====================
  const complexityContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <span>💥</span> なぜ再帰（全探索）だと宇宙の寿命を超えるのか？
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          この問題の制約は <strong className="text-indigo-600">N ≤ 100,000</strong> です。<br />
          もし「部屋 $i$ への行き方を調べるために、部屋 $i-1$ と部屋 $i-2$ を関数で再帰呼び出し」すると、枝分かれがねずみ算式に増えて計算回数が $O(2^N)$ で指数爆発します。
        </p>

        {/* スライダー */}
        <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <Slider
            label="部屋数 N を動かして計算回数の爆発を体感する:"
            displayValue={`N = ${sliderN}`}
            id="sliderA16N"
            min={5}
            max={60}
            step={1}
            value={sliderN}
            onChange={e => setSliderN(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>N=5</span>
            <span>N=20</span>
            <span>N=40 (一般的な限界)</span>
            <span>N=60</span>
          </div>
        </div>

        {/* 比較カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComplexityCard
            title="メモ化なしの単純再帰"
            order="O(2^N)"
            description="同じ部屋の計算を何千万回も重複して解き直してしまう"
            opsLabel={naiveCalls >= 1e12 ? `約 ${(naiveCalls / 1e12).toFixed(1)} 兆回` : `${naiveCalls.toLocaleString()} 回`}
            opsSubLabel={sliderN >= 40 ? '（もはや人類のスパコンでも計算不能！）' : ''}
            timeLabel={
              naiveSec >= 3600
                ? `約 ${(naiveSec / 3600).toFixed(1)} 時間 (約 ${Math.round(naiveSec).toLocaleString()} 秒)`
                : naiveSec >= 60
                ? `約 ${(naiveSec / 60).toFixed(1)} 分`
                : `約 ${naiveSec.toFixed(3)} 秒`
            }
            statusBadge={{ icon: '❌', text: 'TLE（N=40以上で永久に終わらない）', isPass: false }}
            variant="danger"
          />

          <ComplexityCard
            title="動的計画法 (DP)"
            order="O(N)"
            description="一度求めた部屋の最短時間を配列にメモして即座に参照"
            opsLabel={`たったの ${dpOps.toLocaleString()} 回`}
            opsSubLabel="（部屋1からNまでを1周するだけ！）"
            timeLabel="< 0.001 秒"
            statusBadge={{ icon: '⭕', text: 'AC（N=100,000 でも 0.01秒 で瞬殺）', isPass: true }}
            variant="success"
          />
        </div>

        {/* アルゴリズムの核心 */}
        <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「同じ計算を二度しない（メモ化の魔法）」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            単純な再帰だと「部屋 3 に行く方法」を部屋 4 の計算でも、部屋 5 の計算でも、部屋 6 の計算でも何度も何度も計算し直してしまいます。<br />
            動的計画法は<strong>「一度計算した値は配列（テーブル）に保存しておき、以降は $O(1)$ で取り出す」</strong>ことによって、<br />
            指数時間 $O(2^N)$ の絶望的な計算を、一瞬で終わる線形時間 $O(N)$ に圧縮するアルゴリズムです。
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A16 - Dungeon 1)"
        description="部屋 1 と部屋 2 のベースケースを先に埋め、部屋 3 以降をループで解く 1 次元 DP の超典型コードです。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & 手動脱出"
      algoTabLabel="② DPテーブル構築ビジュアライザー"
      complexityTabLabel="③ 2^N 回 vs N 回（計算量）"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
