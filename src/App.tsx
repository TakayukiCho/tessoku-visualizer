import React, { useState, useEffect } from 'react';
import { PROBLEMS } from './problems/registry';
import { Navbar } from './components/Navbar';
import { A14View } from './problems/a14/A14View';
import { A15View } from './problems/a15/A15View';

export const App: React.FC = () => {
  // 初期問題の決定（URLハッシュがあればそれを優先）
  const getInitialProblemId = () => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    const found = PROBLEMS.find(p => p.id === hash);
    return found ? found.id : 'A14';
  };

  const [currentProblemId, setCurrentProblemId] = useState<string>(getInitialProblemId);
  const [headerBadge, setHeaderBadge] = useState<React.ReactNode>(null);

  // ハッシュ変更検知
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      const found = PROBLEMS.find(p => p.id === hash);
      if (found) setCurrentProblemId(found.id);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectProblem = (id: string) => {
    setCurrentProblemId(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentProblem = PROBLEMS.find(p => p.id === currentProblemId) || PROBLEMS[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* ナビゲーションバー */}
      <Navbar
        currentProblem={currentProblem}
        allProblems={PROBLEMS}
        onSelectProblem={handleSelectProblem}
        headerBadge={headerBadge}
      />

      {/* メイン問題コンテンツ */}
      <div className="flex-1">
        {currentProblem.id === 'A14' && <A14View onSetHeaderBadge={setHeaderBadge} />}
        {currentProblem.id === 'A15' && <A15View onSetHeaderBadge={setHeaderBadge} />}
      </div>

      {/* フッター */}
      <footer className="mt-auto border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        AtCoder 鉄則本 学習用インタラクティブ・ビジュアライザー（Vite + React + Tailwind + Bun）
      </footer>
    </div>
  );
};

export default App;
