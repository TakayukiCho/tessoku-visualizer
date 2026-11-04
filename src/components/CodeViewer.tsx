import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
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
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setLang('cpp')}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === 'cpp'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              C++
            </button>
            <button
              onClick={() => setLang('python')}
              className={`px-3 py-1.5 rounded-lg transition ${
                lang === 'python'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Python
            </button>
          </div>

          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            title="コードをコピー"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">コピー完了!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>コピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* コード表示 */}
      <div className="relative">
        <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
          <code>{activeCode}</code>
        </pre>
      </div>
    </div>
  );
};
