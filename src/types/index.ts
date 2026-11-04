export interface ProblemMeta {
  id: string; // e.g., 'A14', 'A15'
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  atcoderUrl: string;
}

export type TabType = 'play' | 'algo' | 'complexity' | 'code';

export interface CodeBlockProps {
  cpp: string;
  python: string;
}
