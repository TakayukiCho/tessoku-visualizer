import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TabType, ProblemViewProps } from '../../types';
import {
  ProblemLayout,
  PlayerControls,
  CodeViewer,
  ExecutionMonitor,
  ComplexityCard,
  Button,
  Badge,
} from '../../components';

interface A17Step {
  phase: 'forward' | 'backward' | 'complete';
  currentRoom: number;
  dpState: number[];
  restoredPath: number[];
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

    vector<int> A(N + 1), B(N + 1);
    for (int i = 2; i <= N; i++) cin >> A[i];
    for (int i = 3; i <= N; i++) cin >> B[i];

    // 1. まず DP で各部屋への最短時間を求める
    vector<int> dp(N + 1, 0);
    dp[1] = 0;
    dp[2] = A[2];
    for (int i = 3; i <= N; i++) {
        dp[i] = min(dp[i - 1] + A[i], dp[i - 2] + B[i]);
    }

    // 2. ゴール (部屋 N) からスタート (部屋 1) へ逆向きに復元
    vector<int> path;
    int place = N;

    while (place > 0) {
        path.push_back(place);
        if (place == 1) break;

        // 部屋 place に「部屋 place-1 から来た」のか判定
        if (dp[place] == dp[place - 1] + A[place]) {
            place = place - 1;
        } else {
            // そうでなければ部屋 place-2 からジャンプしてきた
            place = place - 2;
        }
    }

    // 3. ゴールから記録したので、逆順にして出力
    reverse(path.begin(), path.end());

    cout << path.size() << "\\n";
    for (int i = 0; i < (int)path.size(); i++) {
        cout << path[i] << (i + 1 == (int)path.size() ? "" : " ");
    }
    cout << "\\n";

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
    A = [0, 0] + [int(x) for x in data[idx : idx + (N - 1)]]
    idx += N - 1
    B = [0, 0, 0] + [int(x) for x in data[idx : idx + (N - 2)]]

    # 1. DP テーブルの計算
    dp = [0] * (N + 1)
    dp[1] = 0
    dp[2] = A[2]
    for i in range(3, N + 1):
        dp[i] = min(dp[i - 1] + A[i], dp[i - 2] + B[i])

    # 2. 経路復元 (ゴールからバックトラック)
    path = []
    place = N
    while place > 0:
        path.append(place)
        if place == 1:
            break
        # 直前の部屋判定
        if dp[place] == dp[place - 1] + A[place]:
            place -= 1
        else:
            place -= 2

    # 3. 逆順にしてスタートから並べる
    path.reverse()

    print(len(path))
    print(" ".join(map(str, path)))

if __name__ == "__main__":
    main()`;

export const A17View: React.FC<ProblemViewProps> = ({ onSetHeaderBadge }) => {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const [roomCount] = useState<number>(5);
  const [costA, setCostA] = useState<number[]>([0, 0, 2, 4, 1, 3]);
  const [costB, setCostB] = useState<number[]>([0, 0, 0, 5, 3, 2]);

  // シミュレーション状態
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1200);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ヘッダーバッジ
  useEffect(() => {
    if (onSetHeaderBadge) {
      onSetHeaderBadge(
        <Badge variant="indigo" size="lg">
          <span className="text-xs uppercase font-semibold text-indigo-600">テーマ</span>
          <span>DP 経路復元</span>
        </Badge>
      );
    }
  }, [onSetHeaderBadge]);

  // DP テーブル計算
  const dpTable = useMemo(() => {
    const dp = new Array(roomCount + 1).fill(0);
    dp[1] = 0;
    if (roomCount >= 2) dp[2] = costA[2];
    for (let i = 3; i <= roomCount; i++) {
      dp[i] = Math.min(dp[i - 1] + costA[i], dp[i - 2] + costB[i]);
    }
    return dp;
  }, [roomCount, costA, costB]);

  // 正解経路
  const truePath = useMemo(() => {
    const p: number[] = [];
    let cur = roomCount;
    while (cur > 0) {
      p.push(cur);
      if (cur === 1) break;
      if (dpTable[cur] === dpTable[cur - 1] + costA[cur]) {
        cur -= 1;
      } else {
        cur -= 2;
      }
    }
    return p.reverse();
  }, [roomCount, dpTable, costA]);

  // ステップ事前生成 (Phase 1: 前進DP ➜ Phase 2: 後退復元)
  const steps: A17Step[] = useMemo(() => {
    const list: A17Step[] = [];
    const currentDP = new Array(roomCount + 1).fill(-1);

    // Phase 1: DPテーブル構築完了まで
    currentDP[1] = 0;
    if (roomCount >= 2) currentDP[2] = costA[2];
    for (let i = 3; i <= roomCount; i++) {
      currentDP[i] = Math.min(currentDP[i - 1] + costA[i], currentDP[i - 2] + costB[i]);
    }

    list.push({
      phase: 'forward',
      currentRoom: roomCount,
      dpState: [...currentDP],
      restoredPath: [],
      comment: `【Step 1: DPテーブルの計算完了】<br>まずは A16 と同様に、各部屋への最短時間をすべて計算しました（ゴール dp[${roomCount}] = ${currentDP[roomCount]}分）。<br>ここから<strong>「ゴール部屋 ${roomCount} からスタート部屋 1 へ逆向きに辿る（バックトラック）」</strong>を開始します！`,
    });

    // Phase 2: 逆向き復元
    const pathRev: number[] = [];
    let cur = roomCount;

    while (cur > 0) {
      pathRev.push(cur);

      if (cur === 1) {
        list.push({
          phase: 'complete',
          currentRoom: 1,
          dpState: [...currentDP],
          restoredPath: [...pathRev].reverse(),
          comment: `🎉 【復元完了！】<br>スタート地点の部屋 1 に到達しました！<br>ゴールから記録したパス [${pathRev.join(' ➜ ')}] を反転すると、求める最短ルートは <strong class="text-emerald-300 font-mono text-base">[${[...pathRev].reverse().join(' ➜ ')}]</strong>（合計 ${pathRev.length} 部屋、所要時間 ${currentDP[roomCount]}分）となります！`,
        });
        break;
      }

      const from1 = currentDP[cur - 1] + costA[cur];
      const cameFromMinus1 = currentDP[cur] === from1;
      const prevRoom = cameFromMinus1 ? cur - 1 : cur - 2;

      list.push({
        phase: 'backward',
        currentRoom: cur,
        dpState: [...currentDP],
        restoredPath: [...pathRev],
        comment: `【部屋 ${cur} はどこから来た？】<br>
        dp[${cur}] (${currentDP[cur]}分) に到達する直前の部屋を検証します：<br>
        ・部屋 ${cur - 1} から来た場合: dp[${cur - 1}] (${currentDP[cur - 1]}) + A[${cur}] (${costA[cur]}) = <strong>${from1} 分</strong><br>
        ${
          cameFromMinus1
            ? `➜ <strong class="text-blue-300">dp[${cur}] の値と一致！</strong> 部屋 ${cur - 1} から 1 歩進んできたことが確定しました。`
            : `➜ 一致しません (${currentDP[cur]} ≠ ${from1})。したがって、<strong>部屋 ${cur - 2} から 2 歩スキップしてきた</strong>ことが確定します！`
        }<br>
        足跡をたどり、次は<strong>部屋 ${prevRoom}</strong> に戻ります。`,
      });

      cur = prevRoom;
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

  const currentStep = steps[currentStepIdx] || steps[0];

  // ==================== タブ 1 コンテンツ ====================
  const playContent = (
    <section className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💡</span> 問題のルール：DP 経路復元
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            A16 では「最小時間（コスト）」だけを求めましたが、A17 では <strong>「具体的にどの部屋を通ったか（最短経路）」</strong> を復元します。<br />
            ゴールから逆に辿る（バックトラック）ことで、余分なメモリを使わずに一意に最短経路が判明します！
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => { setCostA([0, 0, 2, 4, 1, 3]); setCostB([0, 0, 0, 5, 3, 2]); handleReset(); }} variant="outline" size="sm">
            例1 (鉄則本)
          </Button>
        </div>
      </div>

      {/* 復元結果ビジュアルボード */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">復元された最短脱出ルート</div>
          <Badge variant="emerald" size="lg">
            合計時間: {dpTable[roomCount]} 分
          </Badge>
        </div>

        {/* ルートマップ */}
        <div className="grid grid-cols-5 gap-3 pt-4">
          {[1, 2, 3, 4, 5].map(roomNum => {
            const isPath = truePath.includes(roomNum);
            const pathOrder = truePath.indexOf(roomNum) + 1;

            return (
              <div
                key={roomNum}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  isPath
                    ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-200 scale-105 shadow-md'
                    : 'border-slate-200 bg-slate-50 opacity-40'
                }`}
              >
                {isPath && (
                  <span className="absolute -top-3.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    通る部屋 #{pathOrder}
                  </span>
                )}
                <div className="text-xs font-bold text-slate-500">部屋 {roomNum}</div>
                <div className="text-2xl font-black font-mono text-slate-800 my-1">
                  #{roomNum}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  dp = {dpTable[roomNum]}分
                </div>
              </div>
            );
          })}
        </div>

        {/* 答えのリスト */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">出力すべき部屋数 & 経路順:</div>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              部屋数: {truePath.length} 部屋 ➜ [ {truePath.join(' ')} ]
            </div>
          </div>
          <Badge variant="emerald" size="md">復元成功</Badge>
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
          currentStep.phase === 'complete'
            ? '経路復元完了！'
            : currentStep.phase === 'backward'
            ? `部屋 ${currentStep.currentRoom} をバックトラック中`
            : '復元準備完了'
        }
        statusVariant={currentStep.phase === 'complete' ? 'success' : 'running'}
        items={[
          {
            label: '現在検証中の部屋',
            value: <span className="text-indigo-300">部屋 {currentStep.currentRoom}</span>,
            subValue: `dp = ${currentStep.dpState[currentStep.currentRoom]}分`,
          },
          {
            label: '直前部屋の逆算式',
            value: (
              <span className="text-amber-300 text-sm font-mono">
                {currentStep.currentRoom > 1
                  ? `dp[${currentStep.currentRoom}] == dp[${currentStep.currentRoom - 1}] + A`
                  : '起点に到着'}
              </span>
            ),
          },
          {
            label: '復元中のパス (逆順)',
            value: (
              <span className="text-emerald-400 font-mono text-base">
                [ {currentStep.restoredPath.join(' ➜ ')} ]
              </span>
            ),
          },
        ]}
        commentaryHtml={currentStep.comment}
      />

      {/* 部屋カードと逆算矢印 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              バックトラック探索（ゴール ➜ スタート）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ゴールから「どの部屋から来たか？」を判定しながら巻き戻していきます。
            </p>
          </div>
          <Badge variant="emerald" size="sm">計算量 O(N)</Badge>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map(i => {
            const isCurrent = currentStep.currentRoom === i;
            const isRestored = currentStep.restoredPath.includes(i);

            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-200 scale-105 shadow-md'
                    : isRestored
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-400 opacity-50'
                }`}
              >
                <span className="text-[10px] font-sans font-bold opacity-70">部屋 {i}</span>
                <span className="text-2xl font-black font-mono my-1">
                  #{i}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  dp[{i}] = {dpTable[i]}分
                </span>
              </div>
            );
          })}
        </div>

        {/* 思考プロセスの解説コラム */}
        <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl text-xs leading-relaxed space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5 text-sm">
            <span>🕵️</span> なぜ DP テーブルだけで経路復元ができるのか？【足跡の逆算】
          </div>
          <p>
            「どの部屋から来たか」を記録する特別な配列（`prev` 配列）を別途用意しなくても、<br />
            <strong>「部屋 $i$ の最短時間 $dp[i]$ が、$dp[i-1] + A[i]$ と等しいか？」</strong> をチェックするだけで、<br />
            1 歩手前から来たのか、2 歩手前から来たのかを <strong>完全に特定</strong> できます！<br />
            ゴールからスタートまで $N$ 回の判定を行うだけなので、復元処理にかかる時間はわずか <strong>$O(N)$</strong>（1ミリ秒未満）です。
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
          <span>⚡</span> 経路復元の計算量と空間計算量
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          「最短経路を求める問題」は難しそうに見えますが、DP テーブルが完成していれば復元は驚くほど一瞬です。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
          <ComplexityCard
            title="DP テーブルの計算"
            order="O(N) 時間 / O(N) 空間"
            description="部屋 1 から N まで順番に最小値を計算する"
            opsLabel="約 100,000 回"
            timeLabel="約 0.002 秒"
            statusBadge={{ icon: '⭕', text: '前処理完了', isPass: true }}
            variant="success"
          />

          <ComplexityCard
            title="ゴールからの経路復元"
            order="O(N) 時間 / O(N) 空間"
            description="部屋 N から直前の部屋を逆算して巻き戻す"
            opsLabel="高々 100,000 回 (移動回数分)"
            timeLabel="約 0.001 秒 (一瞬)"
            statusBadge={{ icon: '⭕', text: 'AC（余裕の高速クリア）', isPass: true }}
            variant="success"
          />
        </div>

        {/* 鉄則コラム */}
        <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span>✨</span> 競技プログラミングの鉄則: 「答えそのものを復元するときは、後ろから辿る」
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            動的計画法で「最適解（最小値・最大値）」だけでなく「その最適解を達成した選び方」を要求されたときは、<br />
            <strong>『ゴールから逆順にバックトラックする』</strong>のが鉄則です。<br />
            前からたどると「どれが正解ルートだったか」分岐が多くて迷ってしまいますが、後ろからなら<strong>「現在の最短値と一致する遷移先」が必ず 1 つに絞り込める</strong>からです。
          </p>
        </div>
      </div>
    </section>
  );

  // ==================== タブ 4 コンテンツ ====================
  const codeContent = (
    <section className="flex flex-col gap-6">
      <CodeViewer
        title="模範解答コード (A17 - Dungeon 2)"
        description="DP テーブル構築 ➜ ゴールからの while ループによる逆算 ➜ reverse で出力する定石実装です。"
        cppCode={CPP_CODE}
        pythonCode={PYTHON_CODE}
      />
    </section>
  );

  return (
    <ProblemLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      playTabLabel="① ルール体験 & 最短ルート"
      algoTabLabel="② 逆算バックトラック詳細"
      complexityTabLabel="③ 計算量 & 復元の仕組み"
      playContent={playContent}
      algoContent={algoContent}
      complexityContent={complexityContent}
      codeContent={codeContent}
    />
  );
};
