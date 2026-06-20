// Struktur pertanyaan — tree hirarkis dengan grup virtual & drag-reorder (PRD §8.3, §14.7).
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { SortableList } from '@/components/SortableList';
import { useSurveyStore } from '@/store/useSurveyStore';
import { buildTree, getQuestions, reorderQuestions, type QuestionTreeNode } from '@/data/questions';
import { getIdentityFields } from '@/data/identity';
import { treeBadge } from '@/lib/questionMeta';
import type { Question } from '@/types';

interface QuestionTreeProps {
  surveyId: string;
  activeQuestionId?: string;
  identityActive: boolean;
  onSelectQuestion: (id: string) => void;
  onSelectIdentity: () => void;
  onAdd: () => void;
}

export function QuestionTree({
  surveyId,
  activeQuestionId,
  identityActive,
  onSelectQuestion,
  onSelectIdentity,
  onAdd,
}: QuestionTreeProps) {
  const questions = useSurveyStore((s) => s.questions);
  const identityFields = useSurveyStore((s) => s.identityFields);

  const tree = buildTree(questions, surveyId);
  const count = getQuestions(questions, surveyId).filter((q) => !q.isGroup).length;
  const identity = getIdentityFields(identityFields, surveyId);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const reorderSiblings = (parentId: string | null, ids: string[]) =>
    reorderQuestions(ids.map((id, i) => ({ id, urutan: i + 1, parentId })));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-body-lg font-medium">Struktur pertanyaan</h2>
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-body-sm text-primary">
            {count} pertanyaan
          </span>
        </div>
        <button className="btn-secondary h-8 px-3 text-body-sm" onClick={onAdd}>
          <Icon name="add" size={16} />
          Tambah
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Grup virtual: Identitas */}
        <VirtualGroup
          icon="badge"
          label="Identitas"
          count={identity.length}
          active={identityActive}
          collapsed={collapsed.has('__identity')}
          onToggle={() => toggle('__identity')}
          onClick={onSelectIdentity}
        >
          {identity.map((f) => (
            <button
              key={f.id}
              onClick={onSelectIdentity}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-body-sm text-text-secondary hover:bg-primary-tint"
            >
              <Icon name="person" size={16} />
              <span className="truncate">{f.nama}</span>
            </button>
          ))}
        </VirtualGroup>

        {/* Grup virtual: Pertanyaan utama */}
        <VirtualGroup
          icon="quiz"
          label="Pertanyaan utama"
          count={tree.length}
          active={false}
          collapsed={collapsed.has('__main')}
          onToggle={() => toggle('__main')}
        >
          {tree.length === 0 ? (
            <p className="px-2 py-1 text-body-sm text-text-secondary">Belum ada pertanyaan.</p>
          ) : (
            <TreeLevel
              nodes={tree}
              parentId={null}
              activeQuestionId={activeQuestionId}
              collapsed={collapsed}
              onToggle={toggle}
              onSelect={onSelectQuestion}
              onReorder={reorderSiblings}
            />
          )}
        </VirtualGroup>
      </div>
    </div>
  );
}

function VirtualGroup({
  icon,
  label,
  count,
  active,
  collapsed,
  onToggle,
  onClick,
  children,
}: {
  icon: string;
  label: string;
  count: number;
  active: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mb-2">
      <div
        className={`flex items-center gap-1 rounded px-2 py-2 ${
          active ? 'bg-primary-tint' : ''
        }`}
      >
        <button
          aria-label={collapsed ? 'Buka' : 'Tutup'}
          onClick={onToggle}
          className="flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-primary-tint"
        >
          <Icon name={collapsed ? 'chevron_right' : 'expand_more'} size={18} />
        </button>
        <button
          onClick={onClick}
          className="flex flex-1 items-center gap-2 text-left text-body-md font-medium"
        >
          <Icon name={icon} size={18} className="text-text-secondary" />
          {label}
          <span className="rounded-full bg-background px-2 py-0.5 text-body-sm text-text-secondary">
            {count}
          </span>
        </button>
      </div>
      {!collapsed && <div className="ml-3 mt-1 border-l border-border pl-2">{children}</div>}
    </div>
  );
}

function TreeLevel({
  nodes,
  parentId,
  activeQuestionId,
  collapsed,
  onToggle,
  onSelect,
  onReorder,
}: {
  nodes: QuestionTreeNode[];
  parentId: string | null;
  activeQuestionId?: string;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onReorder: (parentId: string | null, ids: string[]) => void;
}) {
  const items: Question[] = nodes.map((n) => n.question);
  return (
    <SortableList
      items={items}
      onReorder={(ids) => onReorder(parentId, ids)}
      renderItem={(q, handle) => {
        const node = nodes.find((n) => n.question.id === q.id)!;
        const isOpen = !collapsed.has(q.id);
        const active = activeQuestionId === q.id;
        return (
          <div className="mb-1">
            <div
              className={`flex items-center gap-1 rounded ${
                active ? 'border-l-2 border-primary bg-primary-tint' : ''
              }`}
            >
              {handle}
              {q.isGroup ? (
                <button
                  aria-label={isOpen ? 'Tutup' : 'Buka'}
                  onClick={() => onToggle(q.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-text-secondary hover:bg-primary-tint"
                >
                  <Icon name={isOpen ? 'expand_more' : 'chevron_right'} size={16} />
                </button>
              ) : (
                <span className="w-6" />
              )}
              <button
                onClick={() => onSelect(q.id)}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
              >
                <span className="shrink-0 rounded bg-background px-1.5 py-0.5 font-mono text-body-sm text-text-secondary">
                  {q.kode}
                </span>
                <span className="truncate text-body-md">{q.teks}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {q.logic && q.logic.conditions.length > 0 && (
                    <span className="rounded-full bg-[#FFF7ED] px-1.5 py-0.5 text-body-sm text-[#C2410C]">
                      kondisional
                    </span>
                  )}
                  <span className="rounded-full bg-primary-tint px-2 py-0.5 text-body-sm text-primary">
                    {treeBadge(q)}
                  </span>
                </span>
              </button>
            </div>
            {q.isGroup && isOpen && node.children.length > 0 && (
              <div className="ml-4 mt-1 border-l border-border pl-2">
                <TreeLevel
                  nodes={node.children}
                  parentId={q.id}
                  activeQuestionId={activeQuestionId}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onReorder={onReorder}
                />
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
