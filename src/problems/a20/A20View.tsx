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

interface A20Step {
  i: number;
  j: number;
  dpGrid: number[][];
  charS: string;
  charT: string;
  isMatch: boolean;
  comment: string;
}

const CPP_CODE = `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string S, T;
    if (!(cin >> S >> T)) return 0;

    int N = S.size();
    int M = T.size();

    // dp[i][j]: S の最初の i 文字と T の最初の j 文字における LCS の長さ
    vector<vector<int>> dp(N + 1, vector<int>(M + 1, 0));

    for (int i = 1; i <= N; i++) {
        for (int j = 1; j <= M; j++) {
            // 文字が一致する場合: 直前の両方を取り除いた状態 (斜め左上) + 1
            if (S[i - 1] == T[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                // 不一致の場合: S を 1 文字捨てるか、T を 1 文字捨てるかの大きい方
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // 答え: 全体での最長共通部分列の長さ
    cout << dp[N][M] << "\\n";

    return 0;
}`;

const PYTHON_CODE = `import sys

def main():
    input = sys.stdin.read
    data = input().split()
    if not data:
        return

    S = data[0]
    T = data[1]

    N = len(S)
    M = len(T)

    # dp[i][j]: S[:i] と T[:j] の最長共通部分列の長さ
    dp = [[0] * (M + 1) for _ in range(N + 1)]

    for i in range(1, N + 1):
        char_s = S[i - 1]
        for j in range(1, M + 1):
            char_t = T[j - 1]
            if char_s == char_t:
                # 文字が一致: 斜め左上 + 1
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                # 不一致: 上と左の最大値
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    print(dp[N][M])

if __name__ == "__main__":
    main()`;

export const A20View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');

  // デフォルト: 鉄則本 例1 (S="TOKYO", T="KYOTO")
  const [stringS, setStringS] = useState<string>('TOKYO');
  const [stringT, setStringT] = useState<string>('KYOTO');

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(800);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タブ3: スライダーN
  const [sliderLen, setSliderLen] = useState<number>(1000);

  // 全体DPテーブル計算
  const dpTable = useMemo(() => {
    const N = stringS.length;
    const M = stringT.length;
    const dp = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= M; j++) {
        if (stringS[i - 1] === stringT[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp;
  }, [stringS, stringT]);

  const lcsLength = dpTable[stringS.length][stringT.length];

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">LCS 長さ</span>
          <span>最大 {lcsLength} 文字</span>
        </Badge>
      );
    }
  }, [lcsLength, onSetHeaderBadge]);

  // ステップ事前生成 (行単位 i = 0...N)
  const steps: A20Step[] = useMemo(() => {
    const list: A20Step[] = [];
    const N = stringS.length;
    const M = stringT.length;
    const grid = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

    // Step 0: 初期状態
    list.push({
      i: 0,
      j: 0,
      dpGrid: grid.map(r => [...r]),
      charS: '',
      charT: '',
      isMatch: false,
      comment: `【初期状態 (ベースケース)】<br>どちらかが空文字列（長さ 0）の場合、共通部分列の長さは当然 <strong>0 文字</strong> です。<br>外周の 0 行目と 0 列目はすべて 0 で初期化されています。`,
    });

    for (let i = 1; i <= N; i++) {
      const charS = stringS[i - 1];
      for (let j = 1; j <= M; j++) {
        const charT = stringT[j - 1];
        if (charS === charT) {
          grid[i][j] = grid[i - 1][j - 1] + 1;
        } else {
          grid[i][j] = Math.max(grid[i - 1][j], grid[i][j - 1]);
        }
      }

      list.push({
        i,
        j: M,
        dpGrid: grid.map(r => [...r]),
        charS,
        charT: stringT[M - 1],
        isMatch: false,
        comment: `【S の ${i} 文字目 '${charS}' の行を計算完了】<br>
        T の各文字と照合しました。<br>
        文字が一致した箇所は <span class="font-mono text-pink-300 font-bold">斜め左上 + 1</span>、不一致の箇所は <span class="font-mono text-blue-300 font-bold">max(上, 左)</span> から値が引き継がれます。`,
      });
    }

    return list;
  }, [stringS, stringT]);

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

  const loadPreset = (preset: number) => {
    if (preset === 1) {
      setStringS('TOKYO');
      setStringT('KYOTO');
    } else {
      setStringS('ABCDE');
      setStringT('ACBAD');
    }
    handleReset();
  };

  const currentStep = steps[currentStepIdx] || steps[0];

  // タブ3の計算量
  const naiveTotal = Math.pow(2, Math.min(sliderLen, 40));
  const dpNM = sliderLen * sliderLen;

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール：最長共通部分列 (LCS)
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            2 つの文字列 <strong className="text-indigo-600 font-mono">{stringS}</strong> と <strong className="text-pink-600 font-mono">{stringT}</strong> の両方に、<strong>順番を保ったまま現れる最長の部分文字列</strong> の長さを求めます。<br />
            連続していなくても OK！（例: TOKYO と KYOTO ➜ O, Y, O で長さ 3）
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => loadPreset(1)} variant="outline" size="sm">
            例1: TOKYO / KYOTO
          </Button>
          <Button onClick={() => loadPreset(2)} variant="outline" size="sm">
            例2: ABCDE / ACBAD
          </Button>
        </div>
      </div>

      {/* 文字列対比ビジュアル */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 text-center">
        <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">文字列アライメント対比</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-xl mx-auto w-full">
          {/* 文字列 S */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col items-center">
            <span className="text-xs font-bold text-indigo-700 mb-2">文字列 S</span>
            <div className="flex gap-2">
              {stringS.split('').map((ch, idx) => (
                <div key={idx} className="w-10 h-12 rounded-lg bg-white border-2 border-indigo-400 text-indigo-900 font-black font-mono text-xl flex items-center justify-center shadow-sm">
                  {ch}
                </div>
              ))}
            </div>
          </div>

          {/* 文字列 T */}
          <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/50 flex flex-col items-center">
            <span className="text-xs font-bold text-pink-700 mb-2">文字列 T</span>
            <div className="flex gap-2">
              {stringT.split('').map((ch, idx) => (
                <div key={idx} className="w-10 h-12 rounded-lg bg-white border-2 border-pink-400 text-pink-900 font-black font-mono text-xl flex items-center justify-center shadow-sm">
                  {ch}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 判定結果 */}
        <div className="p-4 bg-slate-900 text-white rounded-xl max-w-md mx-auto w-full flex items-center justify-between">
          <span className="text-xs text-slate-400 font-semibold">最長共通部分列 (LCS) の長さ:</span>
          <span className="text-3xl font-black font-mono text-emerald-300">
            {lcsLength} 文字
          </span>
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
          currentStep.i === stringS.length
            ? `完了: LCS 長さ = ${lcsLength}`
            : `S の ${currentStep.i} 文字目まで計算中`
        }
        statusVariant={currentStep.i === stringS.length ? 'success' : 'running'}
        items={[
          {
            label: '現在照合中の文字 S',
            value: (
              <span className="text-indigo-300">
                {currentStep.i > 0 ? `S[${currentStep.i - 1}] = '${currentStep.charS}'` : '0文字 (初期)'}
              </span>
            ),
          },
          {
            label: '照合ルール ① 一致時',
            value: <span className="text-pink-300 font-mono">dp[i-1][j-1] + 1 ↘</span>,
            subValue: '両方の文字をペアにして採用',
          },
          {
            label: '照合ルール ② 不一致時',
            value: <span className="text-blue-300 font-mono">max(上, 左)</span>,
            subValue: '片方の文字をスキップ',
          },
          {
            label: '求まった LCS 最大長',
            value: (
              <span className="text-emerald-400 font-bold">
                {currentStep.dpGrid[currentStep.i][stringT.length]} 文字
              </span>
            ),
          },
        ]}
        commentaryHtml={currentStep.comment}
      />

      {/* 2次元グリッドテーブル */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              LCS 2次元 DP グリッドテーブル [S の文字 i × T の文字 j]
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              セル dp[i][j] は「S の最初の i 文字と T の最初の j 文字における LCS の最大長」です。
            </p>
          </div>
          <Badge variant="indigo" size="sm">O(|S| × |T|)</Badge>
        </div>

        <table className="w-full text-center text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="p-2.5 border border-slate-200 font-sans font-bold">S ＼ T</th>
              <th className="p-2.5 border border-slate-200 text-slate-400">φ (0)</th>
              {stringT.split('').map((ch, j) => (
                <th key={j} className="p-2.5 border border-slate-200 text-pink-700 font-bold">
                  T[{j}]='{ch}'
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: stringS.length + 1 }).map((_, i) => {
              const isCurrentRow = currentStep.i === i;
              const rowLabel = i === 0 ? 'φ (0)' : `S[${i - 1}]='${stringS[i - 1]}'`;

              return (
                <tr key={i} className={isCurrentRow ? 'bg-indigo-50/60' : ''}>
                  <td className={`p-2.5 border border-slate-200 font-bold whitespace-nowrap ${i > 0 ? 'text-indigo-700 bg-slate-50' : 'text-slate-400 bg-slate-50'}`}>
                    {rowLabel}
                  </td>
                  {Array.from({ length: stringT.length + 1 }).map((_, j) => {
                    const val = currentStep.dpGrid[i][j];
                    const isMatch = i > 0 && j > 0 && stringS[i - 1] === stringT[j - 1];
                    const isGoalCell = (i === stringS.length && j === stringT.length);

                    let cellCls = 'p-2.5 border border-slate-200 transition-all font-bold ';
                    if (isGoalCell) {
                      cellCls += 'bg-emerald-500 text-white font-black text-sm ring-4 ring-emerald-300';
                    } else if (isMatch && currentStep.i >= i) {
                      cellCls += 'bg-pink-100 text-pink-900 border-pink-300';
                    } else if (val > 0) {
                      cellCls += 'bg-blue-50/80 text-blue-900';
                    } else {
                      cellCls += 'text-slate-300';
                    }

                    return (
                      <td key={j} className={cellCls}>
                        {val}
                        {isMatch && currentStep.i >= i && (
                          <span className="text-[9px] text-pink-500 block leading-none mt-0.5">↘+1</span>
                        )}
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
            <span>🧬</span> LCS アルゴリズムの真骨頂：Git の diff や DNA 照合の土台
          </div>
          <p>
            最長共通部分列（LCS）は、プログラミングの世界で最も実用されているアルゴリズムの 1 つです。<br />
            私たちが普段使う <strong>Git のコミット差分（diff）</strong> やファイルの比較、バイオインフォマティクスでの <strong>DNA 配列アライメント（相同性検索）</strong> は、すべてこの LCS 動的計画法の原理で動いています！<br />
            「末尾の文字が一致するなら、問題を両方 1 文字ずつ縮小した `dp[i-1][j-1]` の答えに +1 する」というシンプルな分割統治の思想が、巨大な文字列処理を支えています。
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
          <span>💥</span> 2^N（部分列の総数） vs |S|×|T|（DP）
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          この問題の制約は <strong className="text-indigo-600">|S|, |T| ≤ 2,000</strong> です。<br />
          文字列の部分列の組み合わせは 2^|S| 通りあり、長さ 40 の文字列ですら 2⁴⁰ ≈ 10¹²（1兆通り）を超えて全探索は不可能です。
        </p>

        {/* スライダー */}
        <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <Slider
            label="文字列の長さ |S|, |T| を変更してみる:"
            displayValue={`|S| = |T| = ${sliderLen}`}
            id="sliderA20Len"
            min={100}
            max={2000}
            step={100}
            value={sliderLen}
            onChange={e => setSliderLen(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>100文字</span>
            <span>500文字</span>
            <span>1,000文字</span>
            <span>2,000文字 (最大値)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ComplexityCard
            title="部分列の全探索"
            order="O(2^|S|)"
            description="S のすべての部分列を生成して T に含まれるか調べる"
            opsLabel={naiveTotal >= 1e12 ? `1 兆回以上` : `${naiveTotal.toLocaleString()} 回`}
            opsSubLabel="（文字数 40 以上で即座に TLE）"
            timeLabel="測定不能 (TLE)"
            statusBadge={{ icon: '❌', text: 'TLE（全く歯が立たない）', isPass: false }}
            variant="danger"
          />

          <ComplexityCard
            title="動的計画法 (LCS DP)"
            order="O(|S| × |T|)"
            description="2次元テーブルを左上から順に埋める"
            opsLabel={`約 ${(dpNM / 1e6).toFixed(1)} 百万回`}
            opsSubLabel="（2000×2000 = 400万回 の単純ループ）"
            timeLabel="約 0.02 秒"
            statusBadge={{ icon: '⭕', text: 'AC（制限時間 2.0秒 に対し余裕で合格）', isPass: true }}
            variant="success"
          />
        </div>

        {/* 鉄則コラム */}
        <div className="mt-6 bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「2つの文字列を比較するときは 2 次元 DP」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            文字列を 2 つ扱うアルゴリズム問題（最長共通部分列 LCS、編集距離 Levenshtein Distance、ワイルドカード照合など）は、<br />
            ほぼ 100% <strong>『縦軸に文字列 S、横軸に文字列 T を取った 2 次元 DP グリッド』</strong> で解くことができます。<br />
            文字が一致するかどうかで「斜め遷移」か「上下左右遷移」かを分岐させるのが、文字列 DP の世界共通パターンです！
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A20 - LCS)"
        description="2次元 vector による LCS (最長共通部分列) の標準的な C++ / Python 解法です。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & アライメント"
      algoTabLabel="② LCS グリッド詳細"
      complexityTabLabel="③ 2^N vs |S|×|T|（計算量）"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
