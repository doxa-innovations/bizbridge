'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  FileQuestion,
  Layers,
  Lightbulb,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CanvasNodeType } from '@/lib/canvas-template'

/** Shared visual chrome for every node type — the outline, both handles,
 *  the header row with an icon + label, plus a hover-only delete button. */
function NodeChrome({
  icon,
  label,
  children,
  className,
  id,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  className?: string
  id: string
}) {
  const { setNodes, setEdges } = useReactFlow()
  return (
    <div
      className={cn(
        'group relative min-w-[220px] max-w-[280px] rounded-lg border border-border bg-surface shadow-sm transition-all',
        className,
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-brand" />
      <Handle type="source" position={Position.Right} className="!bg-brand" />
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-ink-muted [&_svg]:h-3 [&_svg]:w-3">
          {icon}
          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{label}</span>
        </div>
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
      <div className="px-3 py-2">{children}</div>
    </div>
  )
}

/** Sector node — pinned to a MOR sector, links out to the sector detail. */
export const SectorNode = memo(function SectorNode({ id, data }: NodeProps) {
  const morCode = (data.morCode as string) ?? ''
  const title = (data.title as string) ?? 'Untitled sector'
  const slug = (data.slug as string) ?? null
  return (
    <NodeChrome id={id} icon={<Layers />} label="Sector" className="border-brand/50">
      <p className="mb-1 font-mono text-[10px] text-brand">MOR {morCode}</p>
      {slug ? (
        <Link
          href={`/dashboard/sectors/${slug}`}
          className="text-sm font-semibold leading-tight text-ink hover:text-brand"
        >
          {title}
        </Link>
      ) : (
        <p className="text-sm font-semibold leading-tight text-ink">{title}</p>
      )}
    </NodeChrome>
  )
})

/** Free-form idea — one editable textarea. */
export const IdeaNode = memo(function IdeaNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  return (
    <NodeChrome id={id} icon={<Lightbulb />} label="Idea">
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
          )
        }}
        placeholder="What if…"
        rows={3}
        className="w-full resize-none rounded border border-transparent bg-transparent p-1 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Task — text + checkbox. */
export const TaskNode = memo(function TaskNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  const done = Boolean(data.done)
  return (
    <NodeChrome id={id} icon={<CheckSquare />} label="Task">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => {
            const v = e.target.checked
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, done: v } } : n)),
            )
          }}
          className="mt-1 accent-brand"
        />
        <input
          value={text}
          onChange={(e) => {
            const v = e.target.value
            setNodes((nodes) =>
              nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
            )
          }}
          placeholder="What needs doing?"
          className={cn(
            'w-full rounded border border-transparent bg-transparent p-1 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none',
            done && 'text-ink-faint line-through',
          )}
        />
      </div>
    </NodeChrome>
  )
})

/** Question — open question needing research. */
export const QuestionNode = memo(function QuestionNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const text = (data.text as string) ?? ''
  return (
    <NodeChrome id={id} icon={<FileQuestion />} label="Question" className="border-accent/40">
      <textarea
        value={text}
        onChange={(e) => {
          const v = e.target.value
          setNodes((nodes) =>
            nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text: v } } : n)),
          )
        }}
        placeholder="What do we still need to know?"
        rows={3}
        className="w-full resize-none rounded border border-transparent bg-transparent p-1 text-sm text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Contact — person / expert / partner. */
export const ContactNode = memo(function ContactNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const name = (data.name as string) ?? ''
  const role = (data.role as string) ?? ''
  const contact = (data.contact as string) ?? ''

  const update = (patch: Record<string, string>) =>
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    )

  return (
    <NodeChrome id={id} icon={<ContactIcon />} label="Contact">
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
export const DocNode = memo(function DocNode({ id, data }: NodeProps) {
  const { setNodes } = useReactFlow()
  const title = (data.title as string) ?? ''
  const source = (data.source as string) ?? ''

  const update = (patch: Record<string, string>) =>
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    )

  return (
    <NodeChrome id={id} icon={<BookOpen />} label="Doc">
      <input
        value={title}
        onChange={(e) => update({ title: e.target.value })}
        placeholder="Doc name (e.g. MOR fee schedule 2026)"
        className="w-full rounded border border-transparent bg-transparent p-1 text-sm font-semibold text-ink placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
      <input
        value={source}
        onChange={(e) => update({ source: e.target.value })}
        placeholder="Where to get it"
        className="w-full rounded border border-transparent bg-transparent p-1 text-xs text-ink-muted placeholder:text-ink-faint focus:border-brand/40 focus:outline-none"
      />
    </NodeChrome>
  )
})

/** Milestone — dated goal. */
export const MilestoneNode = memo(function MilestoneNode({ id, data }: NodeProps) {
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
      icon={<Calendar />}
      label="Milestone"
      className="border-brand/70 bg-brand/5"
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
}
