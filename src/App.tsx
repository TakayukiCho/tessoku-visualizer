import React, { useState, useEffect } from 'react';
import { PROBLEMS, getProblemById } from './problems/registry';
import { Navbar } from './components/Navbar';
import { ProblemSelectModal } from './components/ProblemSelectModal';

export const App: React.FC = () => {
  // 初期問題の決定（URLハッシュがあればそれを優先）
  const getInitialProblemId = () => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    const found = PROBLEMS.find(p => p.id.toUpperCase() === hash);
    return found ? found.id : 'A14';
  };

  const [currentProblemId, setCurrentProblemId] = useState<string>(getInitialProblemId);
  const [headerBadge, setHeaderBadge] = useState<React.ReactNode>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // ハッシュ変更検知
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      const found = PROBLEMS.find(p => p.id.toUpperCase() === hash);
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

  const currentProblem = getProblemById(currentProblemId);
  // 動的コンポーネント取得（App.tsx 内の if 分岐は不要！）
  const ProblemComponent = currentProblem.component;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* ナビゲーションバー */}
      <Navbar
        currentProblem={currentProblem}
        allProblems={PROBLEMS}
        onSelectProblem={handleSelectProblem}
        onOpenModal={() => setIsModalOpen(true)}
        headerBadge={headerBadge}
      />

      {/* メイン問題コンテンツ（自動ディスパッチ） */}
      <div className="flex-1">
        <ProblemComponent onSetHeaderBadge={setHeaderBadge} />
      </div>

      {/* 問題選択モーダル */}
      <ProblemSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProblemId={currentProblemId}
        problems={PROBLEMS}
        onSelectProblem={handleSelectProblem}
      />

      {/* フッター */}
      <footer className="mt-auto border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        AtCoder 鉄則本 学習用インタラクティブ・ビジュアライザー
      </footer>
    </div>
  );
};

export default App;
