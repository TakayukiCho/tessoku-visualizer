import React from 'react';
import { TabType } from '../types';

interface TabNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  playTabLabel?: string;
  algoTabLabel?: string;
  complexityTabLabel?: string;
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onChangeTab,
  playTabLabel = '① ルール体験 & 判定',
  algoTabLabel = '② ビジュアライザー',
  complexityTabLabel = '③ 計算量 & なぜ必要？',
}) => {
  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'play', icon: '🎮', label: playTabLabel },
    { id: 'algo', icon: '⚡', label: algoTabLabel },
    { id: 'complexity', icon: '📊', label: complexityTabLabel },
    { id: 'code', icon: '💻', label: '④ 解法コード (C++ / Python)' },
  ];

  return (
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
  );
};
