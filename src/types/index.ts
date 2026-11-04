import React from 'react';

export interface ProblemViewProps {
  onSetHeaderBadge?: (badge: React.ReactNode) => void;
}

export interface ProblemMeta {
  id: string; // e.g., 'A14', 'A15'
  title: string;
  subtitle: string;
  chapter: string; // e.g., '第3章: 二分探索'
  category: string; // e.g., '二分探索'
  difficulty: 'Easy' | 'Medium' | 'Hard';
  atcoderUrl: string;
  component: React.ComponentType<ProblemViewProps>;
}

export type TabType = 'play' | 'algo' | 'complexity' | 'code';
