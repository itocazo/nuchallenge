'use client';

/**
 * Shows the visible (non-hidden) test cases from a code-sandbox challenge's
 * rubric, TDD-style. Hidden tests are summarized as a count so learners know
 * there are extra cases they can't see.
 *
 * The component is deliberately grader-aware but type-loose: the rubric is
 * `Record<string, unknown>` at the edge and we narrow here rather than
 * pulling the grader-specific types into the UI layer.
 */

import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, EyeOff } from 'lucide-react';

interface TestCase {
  description: string;
  input?: unknown[];
  expected: unknown;
  hidden?: boolean;
  harness?: string;
}

interface VisibleTestCasesProps {
  grader: { type: string; config: Record<string, unknown> } | undefined;
}

function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') {
    // Show short strings inline, long/multiline strings as blocks
    if (v.length < 60 && !v.includes('\n')) return JSON.stringify(v);
    return JSON.stringify(v);
  }
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function formatInput(input: unknown[] | undefined): string {
  if (!input || input.length === 0) return '()';
  return '(' + input.map(formatValue).join(', ') + ')';
}

export default function VisibleTestCases({ grader }: VisibleTestCasesProps) {
  const [expanded, setExpanded] = useState(true);

  if (!grader || grader.type !== 'code-sandbox') return null;

  const config = grader.config as {
    entrypoint?: string;
    testCases?: TestCase[];
  };
  const allTests = config.testCases ?? [];
  const visible = allTests.filter((t) => !t.hidden);
  const hiddenCount = allTests.length - visible.length;
  const entrypoint = config.entrypoint ?? 'submission';

  if (allTests.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <FlaskConical className="h-4 w-4 text-emerald-500" />
          Visible Tests
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {visible.length}
          </span>
          {hiddenCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              <EyeOff className="h-3 w-3" />
              {hiddenCount} hidden
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 p-4">
          {hiddenCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">
              <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                <strong>Heads up:</strong> {visible.length} of {allTests.length} tests are
                visible below. The remaining {hiddenCount} are hidden and will run when
                you submit. Passing only the visible ones is not enough — write your
                solution to handle edge cases too.
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Your <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px] text-gray-700">{entrypoint}</code>{' '}
            will be called with these inputs. Deep equality against the expected output.
          </p>
          {visible.map((test, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-100 bg-gray-50/40 p-3 font-mono text-[11px] leading-relaxed"
            >
              <div className="mb-1.5 font-sans text-xs font-medium text-gray-700">
                {test.description}
              </div>
              {test.harness ? (
                <pre className="overflow-x-auto whitespace-pre-wrap text-gray-600">
                  <span className="text-gray-400"># multi-step scenario</span>
                  {'\n'}
                  <span className="text-emerald-700">expect</span> → {formatValue(test.expected)}
                </pre>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap text-gray-600">
                  <span className="text-purple-600">{entrypoint}</span>
                  {formatInput(test.input)}
                  {'\n'}
                  <span className="text-emerald-700">→</span> {formatValue(test.expected)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
