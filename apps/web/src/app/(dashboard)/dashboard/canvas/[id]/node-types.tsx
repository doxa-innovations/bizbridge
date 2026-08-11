'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  FileQuestion,
  Layers,
  Lightbulb,
  Repeat2,
  StickyNote,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CanvasNodeType } from '@/lib/canvas-template'
import { SectorDeepPicker } from '@/components/sectors/sector-deep-picker'

/**
 * Shared visual chrome for every node type — outline, both handles,
 * header row (icon + label + hover-only delete + optional actions), plus
 * a NodeResizer that appears on selection so users can drag any node to
 * a size that fits its content. All node bodies are given h-full so
 * their inputs/textareas grow with the container.
 *
 * `minWidth` / `minHeight` differ per node type: Task is smaller (one
 * short input), Idea/Note/Question are bigger (multi-line text likely).
 */
function NodeChrome({
  icon,
  label,
  children,
  className,
  id,
  actions,
  selected,
  minWidth = 220,
  minHeight = 88,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  className?: string
  id: string
  actions?: React.ReactNode
  selected?: boolean
  minWidth?: number
  minHeight?: number
}) {
  const { setNodes, setEdges } = useReactFlow()
  return (
    <>
      {/* React Flow's NodeResizer renders 8 grab points by default — 4
       *  corners + 4 edges. Bumped up from 8px to 10px + coloured ring
       *  so users can actually see and grab them. Drag any corner for
       *  proportional resize, any edge for single-axis. */}
      <NodeResizer
        isVisible={Boolean(selected)}
        minWidth={minWidth}
        minHeight={minHeight}
        lineClassName="!border-2 !border-brand/70"
        handleClassName="!h-2.5 !w-2.5 !rounded-full !border-2 !border-surface !bg-brand !shadow-md"
      />
      <div
        className={cn(
          // Fills the resizable wrapper. Flex column so the header stays
          // fixed-height and the body absorbs the remaining space.
          'group relative flex h-full w-full flex-col rounded-lg border border-border bg-surface shadow-sm transition-all',
          'hover:border-brand/40',
          className,
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-surface !bg-brand"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !border-surface !bg-brand"
        />
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-ink-muted [&_svg]:h-3 [&_svg]:w-3">
            {icon}
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {actions}
            <button
              type="button"
              onClick={() => {
                setNodes((nodes) => nodes.filter((n) => n.id !== id))
                setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id))
              }}
              className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
              aria-label="Delete node"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        {/* min-h-0 lets the flex child shrink below its content size so a
            resize down actually clips the body instead of overflowing. */}
        <div className="flex min-h-0 flex-1 flex-col px-3 py-2">{children}</div>
      </div>
    </>
  )
}

/** Sector node — pinned to a MOR sector, links out to the sector detail. */
export const SectorNode = memo(function SectorNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const [swapOpen, setSwapOpen] = useState(false)

  const morCode = (data.morCode as string) ?? ''
  const title = (data.title as string) ?? 'Untitled sector'
  const slug = (data.slug as string) ?? null

  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<Layers />}
      label="Sector"
      className="border-brand/50"
      minWidth={220}
      minHeight={100}
      actions={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSwapOpen(true)
          }}
          className="opacity-0 transition-opacity hover:text-brand group-hover:opacity-100"
          aria-label="Swap sector"
          title="Swap sector"
        >
          <Repeat2 className="h-3 w-3" />
        </button>
      }
    >
      <p className="mb-1 font-mono text-[10px] text-brand">MOR {morCode}</p>
      {slug ? (
        <Link
          href={`/dashboard/sectors/${slug}`}
          className="text-sm font-semibold leading-snug text-ink hover:text-brand"
        >
          {title}
        </Link>
      ) : (
        <p className="text-sm font-semibold leading-snug text-ink">{title}</p>
      )}
      {swapOpen ? (
        <SectorDeepPicker
          onClose={() => setSwapOpen(false)}
          onSelect={(hit) => {
            setNodes((nodes) =>
              nodes.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        morCode: hit.mor_code,
                        title: hit.name_en,
                        slug: hit.slug,
                      },
                    }
                  : n,
              ),
            )
            setSwapOpen(false)
          }}
        />
      ) : null}
    </NodeChrome>
  )
})

/** Sticky note — free-form annotation. Yellow-tinted, resizable large. */
export const NoteNode = memo(function NoteNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<StickyNote />}
      label="Note"
      className="border-warn/40 bg-[color-mix(in_oklch,var(--warn)_10%,var(--surface))]"
      minWidth={220}
      minHeight={120}
    >
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
          )
        }}
        placeholder="Note or annotation…"
        className="h-full w-full flex-1 resize-none rounded border border-transparent bg-transparent p-1 text-sm leading-snug text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Free-form idea — one editable textarea, resizable large. */
export const IdeaNode = memo(function IdeaNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<Lightbulb />}
      label="Idea"
      minWidth={220}
      minHeight={120}
    >
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
          )
        }}
        placeholder="What if…"
        className="h-full w-full flex-1 resize-none rounded border border-transparent bg-transparent p-1 text-sm leading-snug text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Task — text + checkbox. Compact default, expands vertically for
 *  longer descriptions. */
export const TaskNode = memo(function TaskNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  const done = Boolean(data.done)
  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<CheckSquare />}
      label="Task"
      minWidth={220}
      minHeight={80}
    >
      <div className="flex h-full items-start gap-2">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => {
            const v = e.target.checked
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, done: v } } : n)),
            )
          }}
          className="mt-1.5 accent-brand"
        />
        <textarea
          value={text}
          onChange={(e) => {
            const v = e.target.value
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
            )
          }}
          placeholder="What needs doing?"
          className={cn(
            'h-full w-full flex-1 resize-none rounded border border-transparent bg-transparent p-1 text-sm leading-snug text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none',
            done && 'text-ink-faint line-through',
          )}
        />
      </div>
    </NodeChrome>
  )
})

/** Question — open question needing research. */
export const QuestionNode = memo(function QuestionNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<FileQuestion />}
      label="Question"
      className="border-accent/40"
      minWidth={220}
      minHeight={120}
    >
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
          )
        }}
        placeholder="What do we still need to know?"
        className="h-full w-full flex-1 resize-none rounded border border-transparent bg-transparent p-1 text-sm leading-snug text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Contact — person / expert / partner. */
export const ContactNode = memo(function ContactNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const name = (data.name as string) ?? ''
  const role = (data.role as string) ?? ''
  const contact = (data.contact as string) ?? ''

  const update = (patch: Record<string, string>) =>
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    )

  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<ContactIcon />}
      label="Contact"
      minWidth={240}
      minHeight={120}
    >
      <input
        value={name}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Name"
        className="w-full rounded border border-transparent bg-transparent p-1 text-sm font-semibold text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
      <input
        value={role}
        onChange={(e) => update({ role: e.target.value })}
        placeholder="Role or company"
        className="w-full rounded border border-transparent bg-transparent p-1 text-xs text-ink-muted placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
      <input
        value={contact}
        onChange={(e) => update({ contact: e.target.value })}
        placeholder="Phone / email / TG handle"
        className="w-full rounded border border-transparent bg-transparent p-1 font-mono text-[11px] text-ink-muted placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Doc — something to procure (fee schedule, form, template). */
export const DocNode = memo(function DocNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const title = (data.title as string) ?? ''
  const source = (data.source as string) ?? ''

  const update = (patch: Record<string, string>) =>
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    )

  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<BookOpen />}
      label="Doc"
      minWidth={240}
      minHeight={100}
    >
      <input
        value={title}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Doc name (e.g. MOR fee schedule 2026)"
        className="w-full rounded border border-transparent bg-transparent p-1 text-sm font-semibold text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
      <textarea
        value={source}
        onChange={(e) => update({ source: e.target.value })}
        placeholder="Where to get it"
        className="h-full w-full flex-1 resize-none rounded border border-transparent bg-transparent p-1 text-xs leading-snug text-ink-muted placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Milestone — dated goal. */
export const MilestoneNode = memo(function MilestoneNode({ id, data, selected }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  const target = (data.target as string | null) ?? ''

  const update = (patch: Record<string, string | null>) =>
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    )

  return (
    <NodeChrome
      id={id}
      selected={selected}
      icon={<Calendar />}
      label="Milestone"
      className="border-brand/70 bg-brand/5"
      minWidth={220}
      minHeight={100}
    >
      <input
        value={text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Goal"
        className="w-full rounded border border-transparent bg-transparent p-1 text-sm font-semibold text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
      <input
        type="date"
        value={target}
        onChange={(e) => update({ target: e.target.value || null })}
        className="mt-1 w-full rounded border border-transparent bg-transparent p-1 text-xs text-ink-muted focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Registry consumed by React Flow's `nodeTypes` prop. Keys MUST match
 *  `CanvasNodeType` in canvas-template.ts. */
export const NODE_TYPES: Record<CanvasNodeType, React.ComponentType<NodeProps>> = {
  sector: SectorNode,
  idea: IdeaNode,
  task: TaskNode,
  question: QuestionNode,
  contact: ContactNode,
  doc: DocNode,
  milestone: MilestoneNode,
  note: NoteNode,
}
