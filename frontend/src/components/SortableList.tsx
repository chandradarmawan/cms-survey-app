// Daftar reusable dengan drag-reorder (PRD §9 — @dnd-kit). Dipakai opsi, identitas, tree.
import type { ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from './Icon';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  /** menerima urutan id baru setelah drop */
  onReorder: (orderedIds: string[]) => void;
  /** render baris; `handle` adalah tombol drag yang harus ditempatkan di baris */
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow key={item.id} id={item.id} item={item} renderItem={renderItem} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow<T extends { id: string }>({
  id,
  item,
  renderItem,
}: {
  id: string;
  item: T;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const handle = (
    <button
      type="button"
      aria-label="Geser untuk mengurutkan"
      className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded text-text-secondary hover:bg-primary-tint active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <Icon name="drag_indicator" size={18} />
    </button>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, handle)}
    </div>
  );
}
