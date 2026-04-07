'use client';

/**
 * Lightweight code editor for code-sandbox challenges.
 *
 * It's still a textarea under the hood — no Monaco, no CodeMirror, no
 * syntax-highlighting runtime. What it DOES give you over a plain textarea:
 *   - Tab inserts 2 spaces (doesn't break out of the field)
 *   - Shift+Tab dedents the current line
 *   - Cmd/Ctrl+Enter submits (when onSubmit is provided)
 *   - Line-number gutter that stays in sync with content + scroll
 *   - Fullscreen toggle for longer submissions
 *
 * We deliberately keep scope tight: this is a "second-class" editor, not a
 * replacement for a real IDE. If we ever want real syntax highlighting,
 * swap the inner textarea for CodeMirror 6 without touching callers.
 */

import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Code2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  minRows?: number;
  onSubmit?: () => void;
}

const INDENT = '  '; // 2 spaces

export default function CodeEditor({
  value,
  onChange,
  placeholder = '// your code here',
  language = 'javascript',
  minRows = 22,
  onSubmit,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep the gutter scroll in lockstep with the textarea so line numbers
  // don't drift when the user scrolls a long submission.
  useEffect(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    if (!ta || !gutter) return;
    const onScroll = () => {
      gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', onScroll);
    return () => ta.removeEventListener('scroll', onScroll);
  }, []);

  const lineCount = Math.max(1, value.split('\n').length);
  const charCount = value.length;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const { selectionStart, selectionEnd } = ta;

    // Cmd/Ctrl+Enter → submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
      return;
    }

    // Tab → insert 2 spaces (or indent selection)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // If there's a multi-line selection, indent each line
      if (selectionStart !== selectionEnd && value.slice(selectionStart, selectionEnd).includes('\n')) {
        const before = value.slice(0, selectionStart);
        const selected = value.slice(selectionStart, selectionEnd);
        const after = value.slice(selectionEnd);
        const indented = selected
          .split('\n')
          .map((line) => INDENT + line)
          .join('\n');
        const next = before + indented + after;
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = selectionStart;
          ta.selectionEnd = selectionEnd + INDENT.length * indented.split('\n').length;
        });
        return;
      }
      // Single caret: insert indent at cursor
      const next = value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + INDENT.length;
      });
      return;
    }

    // Shift+Tab → dedent current line(s)
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const lineStart = before.lastIndexOf('\n') + 1;
      const selected = value.slice(lineStart, selectionEnd);
      const dedented = selected
        .split('\n')
        .map((line) => (line.startsWith(INDENT) ? line.slice(INDENT.length) : line.replace(/^ /, '')))
        .join('\n');
      const next = value.slice(0, lineStart) + dedented + value.slice(selectionEnd);
      const removed = selected.length - dedented.length;
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = Math.max(lineStart, selectionStart - (removed > 0 ? INDENT.length : 0));
        ta.selectionEnd = selectionEnd - removed;
      });
      return;
    }

    // Enter → preserve current line's leading indent on the new line
    if (e.key === 'Enter' && !e.shiftKey) {
      const before = value.slice(0, selectionStart);
      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = value.slice(lineStart, selectionStart);
      const leadingWs = currentLine.match(/^[ \t]*/)?.[0] ?? '';
      if (leadingWs.length > 0) {
        e.preventDefault();
        const insertion = '\n' + leadingWs;
        const next = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length;
        });
      }
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all',
        isFullscreen && 'fixed inset-4 z-50 shadow-2xl'
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">{language}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-gray-400">
            {lineCount} lines · {charCount} chars
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor body: gutter + textarea */}
      <div className="relative flex flex-1 overflow-hidden">
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none overflow-hidden border-r border-gray-100 bg-gray-50/70 py-4 pr-2 pl-3 text-right font-mono text-xs leading-6 text-gray-300 tabular-nums"
          style={{ minWidth: '2.75rem' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={minRows}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 resize-none bg-transparent py-4 pr-4 pl-3 font-mono text-sm leading-6 text-gray-800 placeholder:text-gray-300 focus:outline-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/30 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Draft auto-saved
        </span>
        <span className="text-[11px] text-gray-300">
          Tab to indent · {onSubmit ? '⌘/Ctrl+Enter to submit · ' : ''}Sandboxed execution
        </span>
      </div>
    </div>
  );
}
