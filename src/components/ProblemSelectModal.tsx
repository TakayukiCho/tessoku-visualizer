import React, { useState, useEffect, useMemo } from 'react';
import { ProblemMeta } from '../types';
import { X, Search, Check, ChevronRight } from 'lucide-react';

interface ProblemSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblemId: string;
  problems: ProblemMeta[];
  onSelectProblem: (id: string) => void;
}

export const ProblemSelectModal: React.FC<ProblemSelectModalProps> = ({
  isOpen,
  onClose,
  currentProblemId,
  problems,
  onSelectProblem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // ESC キーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 検索フィルター
  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems;
    const q = searchQuery.toLowerCase();
    return problems.filter(
      p =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.chapter.toLowerCase().includes(q)
    );
  }, [problems, searchQuery]);

  // 章（Chapter）ごとにグループ化
  const groupedProblems = useMemo(() => {
    const groups: Record<string, ProblemMeta[]> = {};
    filteredProblems.forEach(p => {
      if (!groups[p.chapter]) groups[p.chapter] = [];
      groups[p.chapter].push(p);
    });
    return groups;
  }, [filteredProblems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* モーダルヘッダー */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📚</span>
              <span>問題を選択</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              鉄則本の各アルゴリズム・ビジュアライザー（計 {problems.length} 問）
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 検索バー */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="問題番号、タイトル、アルゴリズム名（例: 二分探索, A15）..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* 問題リスト（章ごとに表示） */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {Object.keys(groupedProblems).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              一致する問題が見つかりませんでした。
            </div>
          ) : (
            Object.entries(groupedProblems).map(([chapter, items]) => (
              <div key={chapter} className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  {chapter}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {items.map(p => {
                    const isSelected = p.id === currentProblemId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProblem(p.id);
                          onClose();
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-12 h-10 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                            }`}
                          >
                            {p.id}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {p.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  p.difficulty === 'Easy'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : p.difficulty === 'Medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {p.difficulty}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {p.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">表示中</span>
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* モーダルフッター */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          Escキー または枠外クリックで閉じます
        </div>

      </div>
    </div>
  );
};
