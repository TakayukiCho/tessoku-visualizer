import React from 'react';
import { TabType } from '../../types';

export interface TabConfig {
  id: TabType;
  icon: string;
  label: string;
}

export interface ProblemLayoutProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  playTabLabel?: string;
  algoTabLabel?: string;
  complexityTabLabel?: string;
  playContent: React.ReactNode;
  algoContent: React.ReactNode;
  complexityContent: React.ReactNode;
  codeContent: React.ReactNode;
}

export const ProblemLayout: React.FC<ProblemLayoutProps> = ({
  activeTab,
  onChangeTab,
  playTabLabel = '① ルール体験 & 判定',
  algoTabLabel = '② ビジュアライザー',
  complexityTabLabel = '③ 計算量 & なぜ必要？',
  playContent,
  algoContent,
  complexityContent,
  codeContent,
}) => {
  const tabs: TabConfig[] = [
    { id: 'play', icon: '🎮', label: playTabLabel },
    { id: 'algo', icon: '⚡', label: algoTabLabel },
    { id: 'complexity', icon: '📊', label: complexityTabLabel },
    { id: 'code', icon: '💻', label: '④ 解法コード (C++ / Python)' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* タブナビゲーションバー */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto space-x-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`py-2.5 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* メインコンテンツ領域 */}
      <main className="max-w-6xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        {activeTab === 'play' && playContent}
        {activeTab === 'algo' && algoContent}
        {activeTab === 'complexity' && complexityContent}
        {activeTab === 'code' && codeContent}
      </main>
    </div>
  );
};
