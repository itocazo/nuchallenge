'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, Edit3, Maximize2, Minimize2 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your submission here...\n\nMarkdown is supported.',
  minRows = 20,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className={cn(
      'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all',
      isFullscreen && 'fixed inset-4 z-50 shadow-2xl'
    )}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setMode('write')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'write' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Write
          </button>
          <button
            onClick={() => setMode('preview')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              mode === 'preview' ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-gray-400">
            {wordCount} words · {charCount} chars
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === 'write' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="flex-1 resize-none p-4 font-mono text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none"
          spellCheck
        />
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {value ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
              {value}
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Auto-save indicator */}
      <div className="flex items-center justify-between border-t border-gray-50 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Draft auto-saved
        </span>
        <span className="text-[11px] text-gray-300">Markdown supported</span>
      </div>
    </div>
  );
}
