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

interface A18Step {
  cardIdx: number; // 0, 1, ..., N
  targetSum: number; // 0, 1, ..., S
  dpGrid: boolean[][]; // [i][j]
  fromAbove: boolean;
  fromLeft: boolean;
  isTrue: boolean;
  comment: string;
}

const CPP_CODE = `#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N, S;
    if (!(cin >> N >> S)) return 0;

    vector<int> A(N + 1);
    for (int i = 1; i <= N; i++) cin >> A[i];

    // dp[i][j]: 最初の i 枚のカードから選んで合計 j にできるか
    vector<vector<bool>> dp(N + 1, vector<bool>(S + 1, false));

    // 初期条件 (0枚で合計0は作れる)
    dp[0][0] = true;

    // 遷移
    for (int i = 1; i <= N; i++) {
        for (int j = 0; j <= S; j++) {
            // 1. カード i を選ばない場合 (真上のセルを引き継ぐ)
            if (dp[i - 1][j]) {
                dp[i][j] = true;
            }
            // 2. カード i を選ぶ場合 (j >= A[i] かつ dp[i-1][j - A[i]] が true)
            if (j >= A[i] && dp[i - 1][j - A[i]]) {
                dp[i][j] = true;
            }
        }
    }

    // 答え: N 枚使って合計 S が作れるか
    if (dp[N][S]) {
        cout << "Yes\\n";
    } else {
        cout << "No\\n";
    }

    return 0;
}`;

const PYTHON_CODE = `import sys

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return

    N = int(data[0])
    S = int(data[1])
    A = [int(x) for x in data[2 : 2 + N]]

    # dp[i][j]: 最初の i 枚から選んで合計 j を作れるか
    dp = [[False] * (S + 1) for _ in range(N + 1)]
    dp[0][0] = True

    for i in range(1, N + 1):
        val = A[i - 1]
        for j in range(S + 1):
            # 選ばない場合
            if dp[i - 1][j]:
                dp[i][j] = True
            # 選ぶ場合
            if j >= val and dp[i - 1][j - val]:
                dp[i][j] = True

    print("Yes" if dp[N][S] else "No")

if __name__ == "__main__":
    main()`;

export const A18View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  
  // デフォルト: 鉄則本 例1 (N=3, S=11, A=[2, 5, 9])
  const [cards, setCards] = useState<number[]>([2, 5, 9]);
  const [targetS, setTargetS] = useState<number>(11);

  // タブ1: ユーザー選択カード
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(600);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3: スライダーN
  const [sliderN, setSliderN] = useState<number>(60);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">目標合計</span>
          <span>S = {targetS}</span>
        </Badge>
      );
    }
  }, [targetS, onSetHeaderBadge]);

  // 全体DPテーブル計算
  const dpTable = useMemo(() => {
    const N = cards.length;
    const dp = Array.from({ length: N + 1 }, () => new Array(targetS + 1).fill(false));
    dp[0][0] = true;

    for (let i = 1; i <= N; i++) {
      const val = cards[i - 1];
      for (let j = 0; j <= targetS; j++) {
        if (dp[i - 1][j]) dp[i][j] = true;
        if (j >= val && dp[i - 1][j - val]) dp[i][j] = true;
      }
    }
    return dp;
  }, [cards, targetS]);

  // ステップ事前生成 (カード1枚ごとに 1 step とする: 行単位)
  const steps: A18Step[] = useMemo(() => {
    const list: A18Step[] = [];
    const N = cards.length;
    const grid = Array.from({ length: N + 1 }, () => new Array(targetS + 1).fill(false));

    // Step 0: 初期状態
    grid[0][0] = true;
    list.push({
      cardIdx: 0,
      targetSum: 0,
      dpGrid: grid.map(r => [...r]),
      fromAbove: false,
      fromLeft: false,
      isTrue: true,
      comment: `【初期状態 (ベースケース)】<br>まだカードを 1 枚も選んでいない（0枚）とき、合計が 0 になるのは確実なので <strong>dp[0][0] = true</strong> です。<br>それ以外の合計値（1 ～ ${targetS}）はすべて false です。`,
    });

    for (let i = 1; i <= N; i++) {
      const val = cards[i - 1];
      for (let j = 0; j <= targetS; j++) {
        const fromAbove = grid[i - 1][j];
        const fromLeft = j >= val ? grid[i - 1][j - val] : false;
        if (fromAbove || fromLeft) {
          grid[i][j] = true;
        }
      }

      list.push({
        cardIdx: i,
        targetSum: targetS,
        dpGrid: grid.map(r => [...r]),
        fromAbove: true,
        fromLeft: true,
        isTrue: grid[i][targetS],
        comment: `【カード #${i} (値: ${val}) の判定完了】<br>
        カード #${i} を「使わない」場合は上の行 dp[${i - 1}] から True をそのまま引き継ぎます。<br>
        「使う」場合は合計が +${val} 増えるため、dp[${i - 1}][j - ${val}] が True なら dp[${i}][j] も True になります。<br>
        これまでに作れる合計値のバリエーションが更新されました！`,
      });
    }

    return list;
  }, [cards, targetS]);

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

  // タブ1: 手動カード選択
  const toggleCardSelect = (idx: number) => {
    if (selectedCards.includes(idx)) {
      setSelectedCards(selectedCards.filter(x => x !== idx));
    } else {
      setSelectedCards([...selectedCards, idx]);
    }
  };

  const userSum = selectedCards.reduce((acc, idx) => acc + cards[idx], 0);

  const loadPreset = (preset: number) => {
    if (preset === 1) {
      setCards([2, 5, 9]);
      setTargetS(11);
    } else {
      setCards([3, 1, 4, 5]);
      setTargetS(11);
    }
    setSelectedCards([]);
    handleReset();
  };

  // タブ3の計算量
  const naiveOps2N = Math.pow(2, sliderN);
  const dpOpsNS = sliderN * 10000;

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール：部分和問題 (Subset Sum)
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            与えられたカードの中から <strong>何枚か選んで、合計をちょうど S = {targetS}</strong> にできるでしょうか？<br />
            カードをクリックして選択し、目標合計を作れるか試してみましょう！
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => loadPreset(1)} variant="outline" size="sm">
            例1: [2, 5, 9] (S=11 ⭕)
          </Button>
          <Button onClick={() => loadPreset(2)} variant="outline" size="sm">
            例2: [3, 1, 4, 5] (S=11 ❌)
          </Button>
        </div>
      </div>

      {/* リアルタイム選択カードボード */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-center">
        <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">カード選択シミュレーター</div>

        {/* カード一覧 */}
        <div className="flex flex-wrap items-center justify-center gap-3 py-2">
          {cards.map((val, idx) => {
            const isSelected = selectedCards.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggleCardSelect(idx)}
                className={`flex flex-col items-center justify-center w-24 h-28 rounded-2xl border-2 transition-all transform active:scale-95 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-300 scale-105 shadow-md'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase">カード #{idx + 1}</span>
                <span className="text-3xl font-black font-mono text-slate-800 my-1">{val}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {isSelected ? '選択中 ✓' : '選ぶ +'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 合計表示 */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto w-full">
          <span className="text-xs text-slate-500 font-semibold mb-1">現在の選択したカードの合計:</span>
          <div className="text-3xl font-black font-mono text-indigo-600">
            {userSum} <span className="text-base text-slate-400 font-normal">/ 目標 {targetS}</span>
          </div>

          <div className="mt-3">
            {userSum === targetS ? (
              <Badge variant="emerald" size="lg" className="animate-pulse-fast">
                🎉 大正解！ 合計がちょうど {targetS} になりました！
              </Badge>
            ) : userSum > targetS ? (
              <Badge variant="red" size="md">
                ❌ 合計が {userSum} で目標 ({targetS}) をオーバーしています
              </Badge>
            ) : (
              <Badge variant="slate" size="md">
                あと {targetS - userSum} 足りません
              </Badge>
            )}
          </div>
        </div>

        {/* 理論上の判定 */}
        <div className="pt-2 text-xs text-slate-400">
          理論上の答え（DP判定結果）: <strong className="text-slate-700">{dpTable[cards.length][targetS] ? 'Yes（作成可能）' : 'No（作成不可能）'}</strong>
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
          currentStep.cardIdx === cards.length
            ? dpTable[cards.length][targetS]
              ? '判定: Yes! (合計S可能)'
              : '判定: No! (合計S不可)'
            : `カード #${currentStep.cardIdx} 考慮中`
        }
        statusVariant={
          currentStep.cardIdx === cards.length
            ? dpTable[cards.length][targetS]
              ? 'success'
              : 'danger'
            : 'running'
        }
        items={[
          {
            label: '考慮中のカード',
            value: (
              <span className="text-indigo-300">
                {currentStep.cardIdx > 0 ? `カード #${currentStep.cardIdx} (${cards[currentStep.cardIdx - 1]})` : '0枚 (初期)'}
              </span>
            ),
          },
          {
            label: '遷移ルール 1: 使わない',
            value: <span className="text-blue-300">dp[i-1][j] を引き継ぐ</span>,
          },
          {
            label: '遷移ルール 2: 使う',
            value: <span className="text-amber-300">dp[i-1][j - A[i]] がTrueなら</span>,
          },
          {
            label: `目標 dp[N][${targetS}] の状態`,
            value: (
              <span className="text-emerald-400 font-bold">
                {currentStep.dpGrid[currentStep.cardIdx][targetS] ? 'True (可能!)' : 'False (不可)'}
              </span>
            ),
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
              2次元 DP 配列テーブル [カード数 i × 合計値 j]
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              各セルは「カード i 枚目までを使って合計 j を作れるか (True / False)」を表します。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> True</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border inline-block"></span> False</span>
          </div>
        </div>

        <table className="w-full text-center text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="p-2 border border-slate-200 font-sans font-bold">考慮したカード</th>
              {Array.from({ length: targetS + 1 }).map((_, j) => (
                <th key={j} className={`p-2 border border-slate-200 ${j === targetS ? 'bg-indigo-100 text-indigo-900 font-black' : ''}`}>
                  j={j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cards.length + 1 }).map((_, i) => {
              const isCurrentRow = currentStep.cardIdx === i;
              const cardLabel = i === 0 ? '0枚 (初期)' : `カード#${i} (${cards[i - 1]})`;

              return (
                <tr key={i} className={isCurrentRow ? 'bg-indigo-50/50' : ''}>
                  <td className="p-2 border border-slate-200 font-sans font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    {cardLabel}
                  </td>
                  {Array.from({ length: targetS + 1 }).map((_, j) => {
                    const isTrue = currentStep.dpGrid[i][j];
                    const isTargetCell = (i === cards.length && j === targetS);

                    let cellCls = 'p-2 border border-slate-200 transition-all ';
                    if (isTargetCell) {
                      cellCls += isTrue ? 'bg-emerald-500 text-white font-black ring-4 ring-emerald-300' : 'bg-red-50 text-red-600 font-bold';
                    } else if (isTrue) {
                      cellCls += 'bg-emerald-100 text-emerald-900 font-bold';
                    } else {
                      cellCls += 'text-slate-300';
                    }

                    return (
                      <td key={j} className={cellCls}>
                        {isTrue ? 'T' : '・'}
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
            <span>💡</span> 部分和問題の真髄：状態のまとめ上げ
          </div>
          <p>
            カードが 60 枚あるとき、選び方の組み合わせは $2^{60} \approx 10^{18}$（100京）通りもあります。<br />
            しかし、私たちが知りたいのは「どのカードを選んだか」ではなく、<strong>「合計がいくらになったか（$0 \sim S$）」</strong>のたった $S+1$ 通りの状態だけです！<br />
            100京通りの組み合わせを、わずか $(S+1)$ 個の真偽値にギュッと圧縮して次の行へ引き継ぐため、超高速に解くことができます。
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
          <span>💥</span> 2⁶⁰（100京通り） vs N×S（60万回）
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          この問題の制約は <strong className="text-indigo-600">N ≤ 60</strong>、<strong className="text-indigo-600">S ≤ 10,000</strong> です。<br />
          カードを「選ぶ」「選ばない」の2択を全探索すると、計算回数は $2^N$ となり、$N=60$ では人類のスーパーコンピュータを使っても何千年もかかります。
        </p>

        {/* スライダー */}
        <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <Slider
            label="カード枚数 N を動かしてみる:"
            displayValue={`N = ${sliderN}`}
            id="sliderA18N"
            min={10}
            max={60}
            step={5}
            value={sliderN}
            onChange={e => setSliderN(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>N=10</span>
            <span>N=30</span>
            <span>N=50</span>
            <span>N=60 (最大値)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComplexityCard
            title="愚直な全探索 (2択分岐)"
            order="O(2^N)"
            description="すべてのカードの選び方を総当りする"
            opsLabel={naiveOps2N >= 1e15 ? `約 100 京回 (2⁶⁰)` : `${naiveOps2N.toLocaleString()} 回`}
            opsSubLabel="（宇宙の年齢より長くかかる！）"
            timeLabel="測定不能 (TLE)"
            statusBadge={{ icon: '❌', text: 'TLE（N=30以上で即死）', isPass: false }}
            variant="danger"
          />

          <ComplexityCard
            title="動的計画法 (DP)"
            order="O(N × S)"
            description="合計値 j の可能性だけをテーブルにメモして更新"
            opsLabel={`約 ${dpOpsNS.toLocaleString()} 回`}
            opsSubLabel="（たったの数十万回のループ！）"
            timeLabel="約 0.005 秒"
            statusBadge={{ icon: '⭕', text: 'AC（制限時間 2.0秒 に対し余裕で合格）', isPass: true }}
            variant="success"
          />
        </div>

        {/* 鉄則コラム */}
        <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「0-1 ナップサック型の基本形」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            この「各要素を 1 個ずつ『使う』か『使わない』か選んでいく」DP は、競技プログラミングで最も頻出するパターンです。<br />
            次の問題 A19（ナップサック問題）でも、全く同じ考え方（真偽値が最大価値の数値に変わるだけ）で解くことができます！
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A18 - Subset Sum)"
        description="2次元 boolean 配列による典型的な部分和 DP の模範解答です。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & カード選択"
      algoTabLabel="② 2次元DPグリッド詳細"
      complexityTabLabel="③ 2^N vs N×S（計算量）"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
