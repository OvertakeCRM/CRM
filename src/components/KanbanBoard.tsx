"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Package } from "lucide-react";
import { STAGES, STAGE_META } from "@/lib/stages";
import { changeStage } from "@/lib/actions/prospects";
import type { ProspectWithRep, Stage } from "@/lib/database.types";

function Card({ prospect }: { prospect: ProspectWithRep }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: prospect.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${isDragging ? "opacity-40" : ""}`}
    >
      <Link href={`/prospects/${prospect.id}`} className="block" onClick={(e) => isDragging && e.preventDefault()}>
        <p className="truncate text-sm font-semibold text-slate-900">{prospect.warehouse_name}</p>
        <p className="truncate text-xs text-slate-500">{prospect.assigned_rep?.full_name}</p>
        {prospect.containers_per_week != null && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Package size={12} /> {prospect.containers_per_week}/wk
          </p>
        )}
      </Link>
    </div>
  );
}

function Column({
  stage,
  prospects,
  columnRef,
}: {
  stage: Stage;
  prospects: ProspectWithRep[];
  columnRef: (el: HTMLDivElement | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const meta = STAGE_META[stage];

  return (
    <div
      ref={columnRef}
      className="w-72 shrink-0 scroll-ml-4"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`size-2 rounded-full ${meta.dot}`} />
        <h3 className="text-sm font-semibold text-slate-700">{meta.label}</h3>
        <span className="text-xs text-slate-400">{prospects.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2 rounded-xl border-2 border-dashed p-2 transition ${
          isOver ? "border-blue-400 bg-blue-50" : "border-transparent bg-slate-100/60"
        }`}
      >
        {prospects.map((p) => (
          <Card key={p.id} prospect={p} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initialProspects }: { initialProspects: ProspectWithRep[] }) {
  const [prospects, setProspects] = useState(initialProspects);
  const [activeId, setActiveId] = useState<string | null>(null);
  const columnRefs = useRef(new Map<Stage, HTMLDivElement>());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const columns = useMemo(() => {
    const grouped = new Map<Stage, ProspectWithRep[]>(STAGES.map((s) => [s, []]));
    for (const p of prospects) grouped.get(p.stage)?.push(p);
    return grouped;
  }, [prospects]);

  const activeProspect = prospects.find((p) => p.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as Stage;
    const prospect = prospects.find((p) => p.id === active.id);
    if (!prospect || prospect.stage === newStage) return;

    setProspects((prev) => prev.map((p) => (p.id === prospect.id ? { ...p, stage: newStage } : p)));
    changeStage(prospect.id, newStage).catch(() => {
      setProspects((prev) => prev.map((p) => (p.id === prospect.id ? { ...p, stage: prospect.stage } : p)));
    });
  }

  function jumpToStage(stage: Stage) {
    columnRefs.current.get(stage)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5 px-4 md:px-0">
        {STAGES.map((stage) => {
          const meta = STAGE_META[stage];
          return (
            <button
              key={stage}
              type="button"
              onClick={() => jumpToStage(stage)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}
            >
              <span className={`size-1.5 rounded-full ${meta.dot}`} />
              {meta.short}
              <span className="font-semibold">{columns.get(stage)?.length ?? 0}</span>
            </button>
          );
        })}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 md:px-0">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              prospects={columns.get(stage) ?? []}
              columnRef={(el) => {
                if (el) columnRefs.current.set(stage, el);
                else columnRefs.current.delete(stage);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeProspect && (
            <div className="w-64 rounded-lg border border-blue-300 bg-white p-3 shadow-lg">
              <p className="truncate text-sm font-semibold text-slate-900">{activeProspect.warehouse_name}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
