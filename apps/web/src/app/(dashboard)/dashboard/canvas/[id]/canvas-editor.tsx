'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  Download,
  FileImage,
  FileQuestion,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  Redo2,
  Save,
  Share2,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CanvasEdge, CanvasNode, CanvasNodeType } from '@/lib/canvas-template'
import { saveCanvas, togglePublish } from '../actions'
import { NODE_TYPES } from './node-types'

interface Props {
  canvasId: number
  initialTitle: string
  initialNodes: Node[]
  initialEdges: Edge[]
  initialIsPublic: boolean
  initialShareToken: string | null
}

const ADDABLE_NODES: Array<{
  type: CanvasNodeType
  label: string
  icon: React.ReactNode
  defaultData: Record<string, unknown>
}> = [
  { type: 'idea', label: 'Idea', icon: <Lightbulb className="h-3.5 w-3.5" />, defaultData: { text: '' } },
  { type: 'task', label: 'Task', icon: <CheckSquare className="h-3.5 w-3.5" />, defaultData: { text: '', done: false } },
  { type: 'question', label: 'Question', icon: <FileQuestion className="h-3.5 w-3.5" />, defaultData: { text: '' } },
  { type: 'contact', label: 'Contact', icon: <ContactIcon className="h-3.5 w-3.5" />, defaultData: { name: '', role: '', contact: '' } },
  { type: 'doc', label: 'Doc', icon: <BookOpen className="h-3.5 w-3.5" />, defaultData: { title: '', source: '' } },
  { type: 'milestone', label: 'Milestone', icon: <Calendar className="h-3.5 w-3.5" />, defaultData: { text: '', target: null } },
  { type: 'sector', label: 'Sector (add MOR code)', icon: <Layers className="h-3.5 w-3.5" />, defaultData: { morCode: '', title: '', slug: null } },
]

/** History entry — full snapshot of everything the user can change.
 *  Kept small enough that a 50-deep stack is cheap. */
interface Snapshot {
  nodes: Node[]
  edges: Edge[]
  title: string
}

const HISTORY_LIMIT = 50
/** Debounce for coalescing rapid changes (drag, typing) into one history
 *  entry. Small enough to feel responsive on Undo, large enough that
 *  dragging a node doesn't push 60 entries a second. */
const HISTORY_DEBOUNCE_MS = 400

function CanvasEditorInner({
  canvasId,
  initialTitle,
  initialNodes,
  initialEdges,
  initialIsPublic,
  initialShareToken,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [exportingPng, setExportingPng] = useState(false)
  const dirtyRef = useRef(false)

  // Undo/redo stacks. `applyingHistoryRef` prevents the state effect below
  // from re-pushing to history when we're the ones setting state via
  // undo/redo. `initialisedRef` skips the first tick so we don't record the
  // initial mount as a snapshot.
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const applyingHistoryRef = useRef(false)
  const initialisedRef = useRef(false)
  const lastPushedRef = useRef<string>('')

  useEffect(() => {
    if (!initialisedRef.current) {
      // Seed the "last pushed" fingerprint with the initial state so a no-op
      // change on mount doesn't trigger a snapshot.
      lastPushedRef.current = JSON.stringify({
        nodes: initialNodes,
        edges: initialEdges,
        title: initialTitle,
      })
      initialisedRef.current = true
      return
    }
    if (applyingHistoryRef.current) {
      // Coming out of an undo/redo — flip the flag back off, don't push.
      applyingHistoryRef.current = false
      return
    }
    // Coalesce rapid changes (drag frames, keystrokes) into one entry.
    const handle = setTimeout(() => {
      const fingerprint = JSON.stringify({ nodes, edges, title })
      if (fingerprint === lastPushedRef.current) return
      setPast((prev) => {
        const next = [
          ...prev,
          {
            nodes: JSON.parse(lastPushedRef.current).nodes,
            edges: JSON.parse(lastPushedRef.current).edges,
            title: JSON.parse(lastPushedRef.current).title,
          },
        ]
        return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next
      })
      // New forward-branch invalidates redo.
      setFuture([])
      lastPushedRef.current = fingerprint
    }, HISTORY_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [nodes, edges, title, initialNodes, initialEdges, initialTitle])

  // Any change → mark dirty. Autosave kicks in on a debounce below.
  useEffect(() => {
    setDirty(true)
    dirtyRef.current = true
  }, [nodes, edges, title])

  const persist = useCallback(async () => {
    if (!dirtyRef.current) return
    setSaving(true)
    try {
      await saveCanvas({
        id: canvasId,
        title,
        nodes: nodes as unknown as CanvasNode[],
        edges: edges as unknown as CanvasEdge[],
      })
      dirtyRef.current = false
      setDirty(false)
    } catch (err) {
      toast.error((err as Error).message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [canvasId, title, nodes, edges])

  useEffect(() => {
    if (!dirty) return
    const handle = setTimeout(persist, 1500)
    return () => clearTimeout(handle)
  }, [dirty, persist])

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, id: `e-${Date.now()}` }, eds)),
    [setEdges],
  )

  const addNode = useCallback(
    (preset: (typeof ADDABLE_NODES)[number]) => {
      const offset = (nodes.length % 6) * 40
      const newNode: Node = {
        id: `${preset.type}-${Date.now()}`,
        type: preset.type,
        position: { x: 200 + offset, y: 200 + offset },
        data: preset.defaultData,
      }
      setNodes((n) => [...n, newNode])
    },
    [nodes.length, setNodes],
  )

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev
      const previous = prev[prev.length - 1]!
      setFuture((f) => [{ nodes, edges, title }, ...f].slice(0, HISTORY_LIMIT))
      applyingHistoryRef.current = true
      setNodes(previous.nodes)
      setEdges(previous.edges)
      setTitle(previous.title)
      lastPushedRef.current = JSON.stringify(previous)
      return prev.slice(0, -1)
    })
  }, [nodes, edges, title, setNodes, setEdges])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev
      const nextState = prev[0]!
      setPast((p) => [...p, { nodes, edges, title }].slice(-HISTORY_LIMIT))
      applyingHistoryRef.current = true
      setNodes(nextState.nodes)
      setEdges(nextState.edges)
      setTitle(nextState.title)
      lastPushedRef.current = JSON.stringify(nextState)
      return prev.slice(1)
    })
  }, [nodes, edges, title, setNodes, setEdges])

  // Keyboard shortcuts: Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z (or Cmd/Ctrl+Y) redo.
  // Guarded so we don't hijack shortcuts inside inputs — users type in the
  // node text areas + title bar and expect the browser's native undo there.
  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (isEditableTarget(e.target)) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const exportJson = useCallback(() => {
    const payload = {
      title,
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'canvas'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded canvas JSON.')
  }, [title, nodes, edges])

  const { getNodesBounds, getViewport } = useReactFlow()

  const exportPng = useCallback(async () => {
    setExportingPng(true)
    try {
      // Grab the actual React Flow viewport DOM so the background + node
      // shells render into the image. `.react-flow__viewport` is the
      // transformed layer that holds nodes at their true positions.
      const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport')
      if (!viewportEl) throw new Error('React Flow viewport not found')

      // Size the exported image to the bounding box of all nodes (padded)
      // rather than the current on-screen viewport, so the export captures
      // the whole plan even if the user is zoomed into one corner.
      const bounds = getNodesBounds(nodes)
      const padding = 40
      const width = Math.max(400, Math.round(bounds.width + padding * 2))
      const height = Math.max(300, Math.round(bounds.height + padding * 2))
      const viewport = getViewport()

      // Temporarily override the transform to render at 1:1 at the bounds
      // origin. html-to-image reads the DOM as-is, so we mutate → snap →
      // restore.
      const previousTransform = viewportEl.style.transform
      viewportEl.style.transform = `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`

      const dataUrl = await toPng(viewportEl, {
        width,
        height,
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--surface') || '#ffffff',
        pixelRatio: 2,
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
      })
      viewportEl.style.transform = previousTransform
      // Nudge React Flow to re-apply its transform.
      window.dispatchEvent(new Event('resize'))
      void viewport

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'canvas'}.png`
      a.click()
      toast.success('Downloaded canvas PNG.')
    } catch (err) {
      toast.error((err as Error).message ?? 'PNG export failed')
    } finally {
      setExportingPng(false)
    }
  }, [title, nodes, getNodesBounds, getViewport])

  const onTogglePublish = useCallback(async () => {
    const next = !isPublic
    try {
      const res = await togglePublish({ id: canvasId, publish: next })
      setIsPublic(res.isPublic)
      setShareToken(res.shareToken)
      if (res.isPublic && res.shareToken) {
        const shareUrl = `${window.location.origin}/canvas/${res.shareToken}`
        try {
          await navigator.clipboard.writeText(shareUrl)
          toast.success('Share link copied to clipboard.')
        } catch {
          toast.success('Share link ready — publish is on.')
        }
      } else {
        toast.success('Share link disabled.')
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Publish toggle failed')
    }
  }, [canvasId, isPublic])

  const nodeTypes = useMemo(() => NODE_TYPES, [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title"
          className="min-w-[200px] flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-ink focus:border-brand focus:outline-none"
        />

        <Button
          size="sm"
          variant="ghost"
          onClick={undo}
          disabled={past.length === 0}
          aria-label="Undo"
          title="Undo (Ctrl/⌘+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={redo}
          disabled={future.length === 0}
          aria-label="Redo"
          title="Redo (Ctrl/⌘+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="h-3.5 w-3.5" /> Add node
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {ADDABLE_NODES.map((preset) => (
              <DropdownMenuItem key={preset.type} onSelect={() => addNode(preset)}>
                <span className="mr-2 text-ink-muted">{preset.icon}</span>
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={exportJson}>
              <Download className="mr-2 h-3.5 w-3.5" /> JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={exportPng} disabled={exportingPng}>
              {exportingPng ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileImage className="mr-2 h-3.5 w-3.5" />
              )}
              PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" variant={isPublic ? 'primary' : 'secondary'} onClick={onTogglePublish}>
          <Share2 className="h-3.5 w-3.5" /> {isPublic ? 'Unpublish' : 'Publish + copy link'}
        </Button>

        <Button size="sm" onClick={persist} disabled={!dirty || saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Saving' : dirty ? 'Save' : 'Saved'}
        </Button>

        {isPublic && shareToken ? (
          <Badge variant="brand" className="ml-1 gap-1">
            <Share2 className="h-3 w-3" />
            /canvas/{shareToken.slice(0, 6)}…
          </Badge>
        ) : null}
      </div>

      {/* Flow surface */}
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} />
          <MiniMap zoomable pannable className="!bg-surface !border-border" />
          <Controls className="!bg-surface !border-border [&_button]:!bg-surface [&_button]:!border-border [&_button]:!text-ink" />
        </ReactFlow>
      </div>
    </div>
  )
}

export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  )
}
