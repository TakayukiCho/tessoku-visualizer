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

interface Item {
  id: number;
  weight: number;
  value: number;
}

interface A19Step {
  itemIdx: number; // 0, 1, ..., N
  dpGrid: number[][]; // [i][j]
  currentCompare: {
    j: number;
    valWithout: number;
    valWith: number | null;
    chosen: number;
  } | null;
  comment: string;
}

const CPP_CODE = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N, W;
    if (!(cin >> N >> W)) return 0;

    vector<long long> w(N + 1), v(N + 1);
    for (int i = 1; i <= N; i++) {
        cin >> w[i] >> v[i];
    }

    // dp[i][j]: 最初の i 個の品物を使って重さ j 以下での最大価値
    vector<vector<long long>> dp(N + 1, vector<long long>(W + 1, 0));

    for (int i = 1; i <= N; i++) {
        for (int j = 0; j <= W; j++) {
            // 1. 品物 i を入れない場合 (真上の値を引き継ぐ)
            dp[i][j] = dp[i - 1][j];

            // 2. 品物 i を入れる場合 (j >= w[i] のとき)
            if (j >= w[i]) {
                dp[i][j] = max(dp[i][j], dp[i - 1][j - w[i]] + v[i]);
            }
        }
    }

    // 答え: N 個の品物、重さ W 以下での最大価値
    cout << dp[N][W] << "\\n";

    return 0;
}`;

const PYTHON_CODE = `import sys

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return

    N = int(data[0])
    W = int(data[1])

    idx = 2
    weights = [0]
    values = [0]
    for _ in range(N):
        weights.append(int(data[idx]))
        values.append(int(data[idx + 1]))
        idx += 2

    # dp[i][j]: 最初の i 個の品物で重さ j 以下の最大価値
    dp = [[0] * (W + 1) for _ in range(N + 1)]

    for i in range(1, N + 1):
        w_i = weights[i]
        v_i = values[i]
        for j in range(W + 1):
            # 品物 i を選ばない
            dp[i][j] = dp[i - 1][j]
            # 品物 i を選ぶ
            if j >= w_i:
                dp[i][j] = max(dp[i][j], dp[i - 1][j - w_i] + v_i)

    print(dp[N][W])

if __name__ == "__main__":
    main()`;

export const A19View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');

  // デフォルト: 鉄則本 例1 (N=4, W=7)
  const [maxWeight] = useState<number>(7);
  const [items] = useState<Item[]>([
    { id: 1, weight: 3, value: 13 },
    { id: 2, weight: 4, value: 17 },
    { id: 3, weight: 5, value: 24 },
    { id: 4, weight: 3, value: 15 },
  ]);

  // タブ1: ユーザー選択品物
  const [userSelected, setUserSelected] = useState<number[]>([]);

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3: スライダーN
  const [sliderN, setSliderN] = useState<number>(100);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">耐荷重</span>
          <span>W = {maxWeight} kg</span>
        </Badge>
      );
    }
  }, [maxWeight, onSetHeaderBadge]);

  // 全体DPテーブル計算
  const dpTable = useMemo(() => {
    const N = items.length;
    const dp = Array.from({ length: N + 1 }, () => new Array(maxWeight + 1).fill(0));

    for (let i = 1; i <= N; i++) {
      const { weight, value } = items[i - 1];
      for (let j = 0; j <= maxWeight; j++) {
        dp[i][j] = dp[i - 1][j];
        if (j >= weight) {
          dp[i][j] = Math.max(dp[i][j], dp[i - 1][j - weight] + value);
        }
      }
    }
    return dp;
  }, [items, maxWeight]);

  // ステップ事前生成 (品物1個ごとに 1 step)
  const steps: A19Step[] = useMemo(() => {
    const list: A19Step[] = [];
    const N = items.length;
    const grid = Array.from({ length: N + 1 }, () => new Array(maxWeight + 1).fill(0));

    // Step 0: 初期状態
    list.push({
      itemIdx: 0,
      dpGrid: grid.map(r => [...r]),
      currentCompare: null,
      comment: `【初期状態 (ベースケース)】<br>まだ品物を 1 つもリュックに入れていない（0個）とき、どの耐荷重であっても価値は <strong>dp[0][j] = 0 円</strong> です。`,
    });

    for (let i = 1; i <= N; i++) {
      const { weight, value } = items[i - 1];
      for (let j = 0; j <= maxWeight; j++) {
        grid[i][j] = grid[i - 1][j];
        if (j >= weight) {
          grid[i][j] = Math.max(grid[i][j], grid[i - 1][j - weight] + value);
        }
      }

      list.push({
        itemIdx: i,
        dpGrid: grid.map(r => [...r]),
        currentCompare: {
          j: maxWeight,
          valWithout: grid[i - 1][maxWeight],
          valWith: maxWeight >= weight ? grid[i - 1][maxWeight - weight] + value : null,
          chosen: grid[i][maxWeight],
        },
        comment: `【品物 #${i} (重さ ${weight}kg, 価値 ${value}円) の考慮完了】<br>
        耐荷重 W = ${maxWeight}kg の場合で比較すると：<br>
        ① 品物 #${i} を入れない場合：上の行 <span class="font-mono text-blue-300">dp[${i - 1}][${maxWeight}] = ${grid[i - 1][maxWeight]}円</span><br>
        ② 品物 #${i} を入れる場合：<span class="font-mono text-amber-300">dp[${i - 1}][${maxWeight - weight}] (${grid[i - 1][maxWeight - weight]}円) + ${value}円 = ${grid[i - 1][maxWeight - weight] + value}円</span><br>
        👉 より価値が高い方を選択するため、<strong class="text-emerald-300">dp[${i}][${maxWeight}] = ${grid[i][maxWeight]}円</strong> に更新されました！`,
      });
    }

    return list;
  }, [items, maxWeight]);

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

  const currentStep = steps[currentStepIdx] || steps[0];

  // タブ1: 手動リュック詰め
  const toggleItem = (id: number) => {
    if (userSelected.includes(id)) {
      setUserSelected(userSelected.filter(x => x !== id));
    } else {
      setUserSelected([...userSelected, id]);
    }
  };

  const userWeight = userSelected.reduce((acc, id) => {
    const item = items.find(it => it.id === id);
    return acc + (item ? item.weight : 0);
  }, 0);

  const userValue = userSelected.reduce((acc, id) => {
    const item = items.find(it => it.id === id);
    return acc + (item ? item.value : 0);
  }, 0);

  const maxPossibleValue = dpTable[items.length][maxWeight];

  // タブ3の計算量
  const naive2N = Math.pow(2, sliderN);
  const dpNW = sliderN * 100000;

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール：0-1 ナップサック問題
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            リュックの耐荷重は <strong>W = {maxWeight} kg</strong> です。<br />
            重さオーバーにならないように品物を選んで、<strong>価値の合計を最大化</strong> してください！品物をクリックしてリュックに詰め込んでみましょう。
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setUserSelected([])} variant="outline" size="sm">
            🔄 リュックを空にする
          </Button>
        </div>
      </div>

      {/* リュックサック対話UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 品物リスト */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
            📦 用意された品物一覧 (クリックでリュックに出し入れ)
          </div>

          <div className="space-y-2.5">
            {items.map(item => {
              const isSelected = userSelected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all text-left ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center font-mono ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      #{item.id}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        品物 {item.id}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        重さ: <strong>{item.weight} kg</strong> | 価値: <strong className="text-indigo-600">{item.value} 円</strong>
                      </div>
                    </div>
                  </div>

                  <Badge variant={isSelected ? 'indigo' : 'slate'} size="sm">
                    {isSelected ? 'リュック内 ✓' : '詰める +'}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* あなたのリュック状態 */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
              🎒 あなたのリュックの状況
            </div>

            {/* 重さプログレスバー */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600">現在の総重量:</span>
                <span className={`font-mono text-sm ${userWeight > maxWeight ? 'text-red-600 font-black' : 'text-slate-800'}`}>
                  {userWeight} / {maxWeight} kg
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    userWeight > maxWeight ? 'bg-red-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (userWeight / maxWeight) * 100)}%` }}
                />
              </div>
              {userWeight > maxWeight && (
                <div className="text-[11px] text-red-500 font-bold mt-1">
                  ⚠️ 重量オーバー！ この状態では持ち運べません！
                </div>
              )}
            </div>

            {/* 獲得価値 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">現在の合計価値:</span>
              <span className="text-3xl font-black font-mono text-emerald-600">
                {userValue} 円
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              理論上の最大価値: <strong className="text-slate-800">{maxPossibleValue} 円</strong>
            </span>
            {userWeight <= maxWeight && userValue === maxPossibleValue ? (
              <Badge variant="emerald" size="lg" className="animate-pulse-fast">
                🎉 最適解達成！
              </Badge>
            ) : userWeight <= maxWeight ? (
              <Badge variant="slate" size="sm">
                あと {maxPossibleValue - userValue} 円 伸ばせます
              </Badge>
            ) : (
              <Badge variant="red" size="sm">重さオーバー</Badge>
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
          currentStep.itemIdx === items.length
            ? `計算完了: 最大価値 ${dpTable[items.length][maxWeight]}円`
            : `品物 #${currentStep.itemIdx} 考慮中`
        }
        statusVariant={currentStep.itemIdx === items.length ? 'success' : 'running'}
        items={[
          {
            label: '現在考慮中の品物',
            value: (
              <span className="text-indigo-300">
                {currentStep.itemIdx > 0 ? `品物 #${currentStep.itemIdx}` : '0個 (初期)'}
              </span>
            ),
            subValue: currentStep.itemIdx > 0 ? `${items[currentStep.itemIdx - 1].weight}kg / ${items[currentStep.itemIdx - 1].value}円` : undefined,
          },
          {
            label: '① 入れない場合の価値',
            value: (
              <span className="text-blue-300">
                {currentStep.currentCompare ? `${currentStep.currentCompare.valWithout} 円` : '--'}
              </span>
            ),
            subValue: 'dp[i-1][j] を引き継ぎ',
          },
          {
            label: '② 入れる場合の価値',
            value: (
              <span className="text-amber-300">
                {currentStep.currentCompare && currentStep.currentCompare.valWith !== null
                  ? `${currentStep.currentCompare.valWith} 円`
                  : '重さ超過で不可'}
              </span>
            ),
            subValue: 'dp[i-1][j-w] + v',
          },
          {
            label: `求まった最大価値 (W=${maxWeight})`,
            value: (
              <span className="text-emerald-400 font-bold">
                {currentStep.dpGrid[currentStep.itemIdx][maxWeight]} 円
              </span>
            ),
            subValue: 'max(①, ②)',
          },
        ]}
        commentaryHtml={currentStep.comment}
      />

      {/* 2次元DPグリッドテーブル */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              ナップサック 2次元 DP 配列テーブル [品物数 i × 耐荷重 j]
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              セル dp[i][j] は「最初の i 個の品物から重さ j 以下で選んだときの最大価値（円）」です。
            </p>
          </div>
          <Badge variant="indigo" size="sm">O(N × W)</Badge>
        </div>

        <table className="w-full text-center text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="p-2 border border-slate-200 font-sans font-bold">考慮した品物</th>
              {Array.from({ length: maxWeight + 1 }).map((_, j) => (
                <th key={j} className={`p-2 border border-slate-200 ${j === maxWeight ? 'bg-indigo-100 text-indigo-900 font-black' : ''}`}>
                  w={j}kg
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: items.length + 1 }).map((_, i) => {
              const isCurrentRow = currentStep.itemIdx === i;
              const itemLabel = i === 0 ? '0個 (初期)' : `品物#${i} (${items[i - 1].weight}kg, ${items[i - 1].value}円)`;

              return (
                <tr key={i} className={isCurrentRow ? 'bg-indigo-50/50' : ''}>
                  <td className="p-2 border border-slate-200 font-sans font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    {itemLabel}
                  </td>
                  {Array.from({ length: maxWeight + 1 }).map((_, j) => {
                    const val = currentStep.dpGrid[i][j];
                    const isGoalCell = (i === items.length && j === maxWeight);

                    let cellCls = 'p-2 border border-slate-200 font-bold transition-all ';
                    if (isGoalCell) {
                      cellCls += 'bg-emerald-500 text-white font-black text-sm ring-4 ring-emerald-300';
                    } else if (val > 0) {
                      cellCls += 'bg-emerald-50 text-emerald-800';
                    } else {
                      cellCls += 'text-slate-300';
                    }

                    return (
                      <td key={j} className={cellCls}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 思考プロセスの解説コラム */}
        <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs leading-relaxed space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5 text-sm">
            <span>🎒</span> ナップサック問題の急所：なぜ同じ品物を重複して使わずに済むのか？
          </div>
          <p>
            テーブルを更新するとき、`dp[i][j]` は <strong>「1つ前の行 `dp[i-1]` の値だけ」</strong> を参照して計算しています。<br />
            もし同じ行 `dp[i][j - w]` を参照してしまうと「同じ品物 $i$ を 2 回以上リュックに入れてしまう（個数無制限ナップサック）」バグが発生します。<br />
            <strong>『前の行（品物 $i-1$ までで達成した結果）に、品物 $i$ を 1 つ足すか足さないか』</strong> を厳格に守ることで、正確な 0-1 ナップサックが解けるのです。
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
          <span>💥</span> 2¹⁰⁰（全探索） vs 1000万回（DP）
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          この問題の制約は <strong className="text-indigo-600">N ≤ 100</strong>、<strong className="text-indigo-600">W ≤ 100,000</strong> です。<br />
          品物が 100 個あるとき、選び方の組み合わせは $2^{100} \approx 1.26 \times 10^{30}$ 通りという天文学的な数になります。
        </p>

        {/* スライダー */}
        <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <Slider
            label="品物の個数 N を動かしてみる:"
            displayValue={`N = ${sliderN}`}
            id="sliderA19N"
            min={10}
            max={100}
            step={10}
            value={sliderN}
            onChange={e => setSliderN(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>N=10</span>
            <span>N=30 (全探索の限界)</span>
            <span>N=60</span>
            <span>N=100 (最大値)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComplexityCard
            title="愚直な全探索 (2^N)"
            order="O(2^N)"
            description="100個の品物の全組み合わせを調べる"
            opsLabel={naive2N >= 1e20 ? `約 1.26 × 10³⁰ 回` : `${naive2N.toLocaleString()} 回`}
            opsSubLabel="（人類の文明が終わっても計算終了しない）"
            timeLabel="永久に終わらない (TLE)"
            statusBadge={{ icon: '❌', text: 'TLE（N=35以上で絶対に間に合わない）', isPass: false }}
            variant="danger"
          />

          <ComplexityCard
            title="動的計画法 (DP)"
            order="O(N × W)"
            description="N × W のテーブルを1回走査して埋める"
            opsLabel={`約 ${dpNW.toLocaleString()} 回`}
            opsSubLabel="（1000万回程度の単純ループ）"
            timeLabel="約 0.05 秒"
            statusBadge={{ icon: '⭕', text: 'AC（制限時間 2.0秒 に対し余裕で合格）', isPass: true }}
            variant="success"
          />
        </div>

        {/* 鉄則コラム */}
        <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「擬多項式時間アルゴリズム」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            ナップサック問題の計算量 $O(N \times W)$ は、$W$（耐荷重）が $10^5$ 程度なら一瞬で解けますが、もし $W = 10^{18}$ などの超巨大な値になるとテーブルが作れなくなります。<br />
            このような計算量を<strong>「擬多項式時間」</strong>と呼びます。競技プログラミングでは「制約を見て、$W$ が $10^5$ 以下ならこの DP テーブルで殴る」と判断するのがプロの定石です！
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A19 - Knapsack 1)"
        description="2次元 vector による 0-1 ナップサック DP の標準的な解答です。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & リュック詰め"
      algoTabLabel="② ナップサックDP詳細"
      complexityTabLabel="③ 2^N vs N×W（計算量）"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
