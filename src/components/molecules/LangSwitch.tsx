import React from 'react';

export interface LangSwitchProps {
  currentLang: 'cpp' | 'python';
  onChangeLang: (lang: 'cpp' | 'python') => void;
}

export const LangSwitch: React.FC<LangSwitchProps> = ({ currentLang, onChangeLang }) => {
  return (
    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
      <button
        onClick={() => onChangeLang('cpp')}
        className={`px-3 py-1.5 rounded-lg transition ${
          currentLang === 'cpp'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        C++
      </button>
      <button
        onClick={() => onChangeLang('python')}
        className={`px-3 py-1.5 rounded-lg transition ${
          currentLang === 'python'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Python
      </button>
    </div>
  );
};
