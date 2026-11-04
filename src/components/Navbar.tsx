import React from 'react';
import { ProblemMeta } from '../types';
import { Menu, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface NavbarProps {
  currentProblem: ProblemMeta;
  allProblems: ProblemMeta[];
  onSelectProblem: (id: string) => void;
  onOpenModal: () => void;
  headerBadge?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProblem,
  allProblems,
  onSelectProblem,
  onOpenModal,
  headerBadge,
}) => {
  const currentIndex = allProblems.findIndex(p => p.id === currentProblem.id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  return (
    <>
      {/* 最上部ナビバー */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide text-slate-300">📚 鉄則本アルゴリズム学習ビジュアライザー</span>
          </div>

          <div className="flex items-center gap-2">
            {/* モーダルを開く問題一覧ボタン */}
            <button
              onClick={onOpenModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>全問題一覧 ({allProblems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* メインヘッダー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {/* ハンバーガー＆前後の切り替え */}
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenModal}
                title="問題メニューを開く"
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition flex items-center gap-1 text-xs font-bold mr-1"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">問題一覧</span>
              </button>

              {prevProblem && (
                <button
                  onClick={() => onSelectProblem(prevProblem.id)}
                  title={`前へ: ${prevProblem.id}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <span className="bg-indigo-600 text-white text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm">
                鉄則本 {currentProblem.id}
              </span>

              {nextProblem && (
                <button
                  onClick={() => onSelectProblem(nextProblem.id)}
                  title={`次へ: ${nextProblem.id}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{currentProblem.title}</span>
              <span className="text-xs md:text-sm font-normal text-slate-500">
                （{currentProblem.subtitle}）
              </span>
            </h1>

            <a
              href={currentProblem.atcoderUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-0.5 border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 rounded-full transition"
            >
              <span>AtCoder</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {headerBadge && <div>{headerBadge}</div>}
        </div>
      </header>
    </>
  );
};
