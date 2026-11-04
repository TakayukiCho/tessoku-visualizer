import React from 'react';

export interface CodeBlockProps {
  code: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, className = '' }) => {
  return (
    <pre className={`bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 ${className}`}>
      <code>{code}</code>
    </pre>
  );
};
