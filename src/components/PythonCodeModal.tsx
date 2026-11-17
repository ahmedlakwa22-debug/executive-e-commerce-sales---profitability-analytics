import React, { useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import analysisEngineCode from '../../python_analytics/analysis_engine.py?raw';
import streamlitAppCode from '../../python_analytics/streamlit_app.py?raw';
import dashAppCode from '../../python_analytics/dash_app.py?raw';
import requirementsTxt from '../../python_analytics/requirements.txt?raw';
import readmeMd from '../../python_analytics/README.md?raw';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILES = [
  {
    id: 'analysis_engine.py',
    label: 'analysis_engine.py',
    subtitle: 'Pandas & Statsmodels Engine',
    content: analysisEngineCode,
  },
  {
    id: 'streamlit_app.py',
    label: 'streamlit_app.py',
    subtitle: 'Streamlit Dashboard (3 Pages)',
    content: streamlitAppCode,
  },
  {
    id: 'dash_app.py',
    label: 'dash_app.py',
    subtitle: 'Plotly Dash Dashboard (3 Pages)',
    content: dashAppCode,
  },
  {
    id: 'requirements.txt',
    label: 'requirements.txt',
    subtitle: 'Python Dependencies',
    content: requirementsTxt,
  },
  {
    id: 'README.md',
    label: 'README.md',
    subtitle: 'Execution Guide',
    content: readmeMd,
  },
];

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeId, setActiveId] = useState(FILES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeFile = FILES.find((f) => f.id === activeId) ?? FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.label;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Python Project Files"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Python Analysis Project Files (Pandas · Statsmodels · Streamlit · Dash)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Saved in the python_analytics/ workspace directory and ready for local execution
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File Tabs + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILES.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setActiveId(file.id)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeId === file.id
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span dir="ltr" className="font-mono-tabular">
                  {file.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-teal-700" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Source Code Viewer */}
        <div className="flex-1 overflow-auto bg-slate-950 p-5 text-slate-100" dir="ltr">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono-tabular">python_analytics/{activeFile.label}</span>
            <span>{activeFile.subtitle}</span>
          </div>
          <pre className="font-mono-tabular text-xs leading-relaxed text-slate-200">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};