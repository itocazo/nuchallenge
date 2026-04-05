'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface RubricCriterion {
  name: string;
  weight: number;
  description: string;
}

interface Hint {
  level: number;
  text: string;
}

interface ChallengeFormData {
  title: string;
  description: string;
  instructions: string;
  tags: string[];
  difficulty: string;
  timeMinutes: number;
  pointsBase: number;
  submissionFormat: string;
  evaluationMethod: string;
  rubric: { criteria: RubricCriterion[] };
  antiCheatTier: string;
  prerequisites: string[];
  producesAsset: boolean;
  assetType: string | null;
  hints: Hint[];
  active: boolean;
}

interface ChallengeFormProps {
  initial?: Partial<ChallengeFormData>;
  onSubmit: (data: ChallengeFormData) => Promise<void>;
  submitLabel: string;
}

const DEFAULTS: ChallengeFormData = {
  title: '',
  description: '',
  instructions: '',
  tags: [],
  difficulty: 'beginner',
  timeMinutes: 30,
  pointsBase: 100,
  submissionFormat: 'text',
  evaluationMethod: 'ai-judge',
  rubric: { criteria: [{ name: 'Quality', weight: 100, description: 'Overall quality' }] },
  antiCheatTier: 'T0',
  prerequisites: [],
  producesAsset: false,
  assetType: null,
  hints: [],
  active: true,
};

export default function ChallengeForm({ initial, onSubmit, submitLabel }: ChallengeFormProps) {
  const [form, setForm] = useState<ChallengeFormData>({ ...DEFAULTS, ...initial });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof ChallengeFormData>(key: K, value: ChallengeFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  }

  function addCriterion() {
    set('rubric', {
      criteria: [...form.rubric.criteria, { name: '', weight: 0, description: '' }],
    });
  }

  function updateCriterion(idx: number, field: keyof RubricCriterion, value: string | number) {
    const criteria = [...form.rubric.criteria];
    criteria[idx] = { ...criteria[idx], [field]: value };
    set('rubric', { criteria });
  }

  function removeCriterion(idx: number) {
    set('rubric', { criteria: form.rubric.criteria.filter((_, i) => i !== idx) });
  }

  function addHint() {
    set('hints', [...form.hints, { level: form.hints.length + 1, text: '' }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Title</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} required className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required rows={3} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Instructions</label>
          <textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} required rows={5} className={inputCls} />
        </div>
      </div>

      {/* Settings */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Difficulty</label>
          <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className={inputCls}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Time (minutes)</label>
          <input type="number" value={form.timeMinutes} onChange={(e) => set('timeMinutes', Number(e.target.value))} min={1} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Base Points</label>
          <input type="number" value={form.pointsBase} onChange={(e) => set('pointsBase', Number(e.target.value))} min={1} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Submission Format</label>
          <input value={form.submissionFormat} onChange={(e) => set('submissionFormat', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Evaluation Method</label>
          <select value={form.evaluationMethod} onChange={(e) => set('evaluationMethod', e.target.value)} className={inputCls}>
            <option value="ai-judge">AI Judge</option>
            <option value="automated-test">Automated Test</option>
            <option value="human-review">Human Review</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Anti-Cheat Tier</label>
          <select value={form.antiCheatTier} onChange={(e) => set('antiCheatTier', e.target.value)} className={inputCls}>
            <option value="T0">T0</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelCls}>Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
              {tag}
              <button type="button" onClick={() => set('tags', form.tags.filter((t) => t !== tag))} className="text-purple-400 hover:text-purple-700">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag..."
            className={inputCls}
          />
          <button type="button" onClick={addTag} className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200">
            Add
          </button>
        </div>
      </div>

      {/* Rubric */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Rubric Criteria</label>
          <button type="button" onClick={addCriterion} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {form.rubric.criteria.map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex-1 space-y-2">
                <input placeholder="Criterion name" value={c.name} onChange={(e) => updateCriterion(i, 'name', e.target.value)} className={inputCls} />
                <div className="flex gap-2">
                  <input type="number" placeholder="Weight" value={c.weight} onChange={(e) => updateCriterion(i, 'weight', Number(e.target.value))} min={0} max={100} className={`${inputCls} w-24`} />
                  <input placeholder="Description" value={c.description} onChange={(e) => updateCriterion(i, 'description', e.target.value)} className={inputCls} />
                </div>
              </div>
              <button type="button" onClick={() => removeCriterion(i)} className="mt-1 text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Hints</label>
          <button type="button" onClick={addHint} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {form.hints.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-gray-400">Lv.{h.level}</span>
              <input
                value={h.text}
                onChange={(e) => {
                  const hints = [...form.hints];
                  hints[i] = { ...hints[i], text: e.target.value };
                  set('hints', hints);
                }}
                placeholder="Hint text..."
                className={inputCls}
              />
              <button type="button" onClick={() => set('hints', form.hints.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="rounded border-gray-300" />
        <span className="text-gray-700">Active (visible to users)</span>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
