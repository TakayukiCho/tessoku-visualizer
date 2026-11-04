import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CodeBlock } from '../atoms/CodeBlock';
import { Button } from '../atoms/Button';
import { LangSwitch } from '../molecules/LangSwitch';

export interface CodeViewerProps {
  title: string;
  description: string;
  cppCode: string;
  pythonCode: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  title,
  description,
  cppCode,
  pythonCode,
}) => {
  const [lang, setLang] = useState<'cpp' | 'python'>('cpp');
  const [copied, setCopied] = useState(false);

  const activeCode = lang === 'cpp' ? cppCode : pythonCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 言語切り替え */}
          <LangSwitch currentLang={lang} onChangeLang={setLang} />

          {/* コピーボタン */}
          <Button
            onClick={handleCopy}
            variant="secondary"
            size="md"
            icon={
              copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-600" />
              )
            }
          >
            <span className={copied ? 'text-emerald-600 font-bold' : ''}>
              {copied ? 'コピー完了!' : 'コピー'}
            </span>
          </Button>
        </div>
      </div>

      {/* コード表示 */}
      <CodeBlock code={activeCode} />
    </div>
  );
};
