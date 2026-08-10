'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Background,
  Controls,
  MiniMap,
  PanOnScrollMode,
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
  ArrowLeft,
  Download,
  FileImage,
  Layers3,
  Loader2,
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
import type { CanvasEdge, CanvasNode } from '@/lib/canvas-template'
import { saveCanvas, togglePublish } from '../actions'
import { NODE_TYPES } from './node-types'
import { NodePalette, type PaletteEntry } from './node-picker'

interface Props {
  canvasId: number
  initialTitle: string
  initialNodes: Node[]
  initialEdges: Edge[]
  initialIsPublic: boolean
  initialShareToken: string | null
}

interface Snapshot {
  nodes: Node[]
  edges: Edge[]
  title: string
}

const HISTORY_LIMIT = 50
const HISTORY_DEBOUNCE_MS = 400
const AUTOSAVE_DEBOUNCE_MS = 1500

/**
 * Compute a stable fingerprint of the user-facing canvas state. Ignores
 * React Flow's internal bookkeeping — `measured` dimensions from its
 * ResizeObserver, `dragging` / `selected` flags, `positionAbsolute` —
 * so those don't count as "the user changed something" and don't
 * trigger autosave or history-stack pushes.
 */
function fingerprint(nodes: Node[], edges: Edge[], title: string): string {
  return JSON.stringify({
    title,
    n: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? null,
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
      w: n.width ?? null,
      h: n.height ?? null,
      data: n.data ?? {},
    })),
    e: edges.map((e) => ({
      id: e.id,
      s: e.source,
      t: e.target,
      l: typeof e.label === 'string' ? e.label : null,
    })),
  })
}

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

  // Autosave / history bookkeeping: skip the first tick after mount so we
  // don't push an empty snapshot or fire an autosave against unchanged
  // state (which was throwing a Server Components error toast when the
  // route was freshly opened).
  const dirtyRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => {
    // Fires once after mount; subsequent renders skip via the ref guard.
    mountedRef.current = true
  }, [])

  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])
  const applyingHistoryRef = useRef(false)
  const lastSnapshotRef = useRef<Snapshot>({
    nodes: initialNodes,
    edges: initialEdges,
    title: initialTitle,
  })

  useEffect(() => {
    if (!mountedRef.current) return
    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false
      return
    }
    const handle = setTimeout(() => {
      const currentFp = fingerprint(nodes, edges, title)
      const lastFp = fingerprint(
        lastSnapshotRef.current.nodes,
        lastSnapshotRef.current.edges,
        lastSnapshotRef.current.title,
      )
      if (currentFp === lastFp) return
      // Real user-facing change — push history and mark dirty. RF-internal
      // churn (measured dimensions, dragging flag, selection state) is
      // filtered out by `fingerprint` so it doesn't spam autosave / history.
      setDirty(true)
      dirtyRef.current = true
      setPast((prev) => {
        const next = [...prev, lastSnapshotRef.current]
        return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next
      })
      setFuture([])
      lastSnapshotRef.current = { nodes, edges, title }
    }, HISTORY_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [nodes, edges, title])

  /** Persist with retry + exponential backoff. saveCanvas now returns a
   *  discriminated union instead of throwing, so we branch on `ok`
   *  rather than try/catch. On persistent failure we toast once and
   *  leave dirtyRef true so the next real edit re-triggers a save. */
  const persist = useCallback(async () => {
    if (!dirtyRef.current) return
    setSaving(true)

    const attempt = async (n: number): Promise<void> => {
      const res = await saveCanvas({
        id: canvasId,
        title,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: (node.type ?? 'idea') as CanvasNode['type'],
          position: node.position,
          data: (node.data ?? {}) as Record<string, unknown>,
          width: node.width ?? null,
          height: node.height ?? null,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        })),
      })
      if (res.ok) {
        dirtyRef.current = false
        setDirty(false)
        return
      }
      if (n >= 3) {
        toast.error(`Save failed — will retry on your next edit. (${res.error})`)
        return
      }
      // 2s → 4s → 8s
      const backoffMs = 2000 * 2 ** n
      await new Promise((r) => setTimeout(r, backoffMs))
      return attempt(n + 1)
    }

    try {
      await attempt(0)
    } finally {
      setSaving(false)
    }
  }, [canvasId, title, nodes, edges])

  useEffect(() => {
    if (!dirty) return
    const handle = setTimeout(persist, AUTOSAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [dirty, persist])

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...connection, id: `e-${Date.now()}`, animated: true },
          eds,
        ),
      ),
    [setEdges],
  )

  const { getViewport, screenToFlowPosition, fitView, setViewport } = useReactFlow()

  const dropPositionForNewNode = useCallback(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    const h = typeof window !== 'undefined' ? window.innerHeight : 800
    const jitter = () => Math.round((Math.random() - 0.5) * 60)
    return screenToFlowPosition({ x: w / 2 + jitter(), y: h / 2 + jitter() })
  }, [screenToFlowPosition])

  const addFromPalette = useCallback(
    (entry: PaletteEntry) => {
      const newNode: Node = {
        id: `${entry.type}-${Date.now()}`,
        type: entry.type,
        position: dropPositionForNewNode(),
        data: entry.defaultData,
        selected: true,
      }
      setNodes((n) => [...n.map((x) => ({ ...x, selected: false })), newNode])
    },
    [dropPositionForNewNode, setNodes],
  )

  const addSectorNode = useCallback(
    (sector: { morCode: string; title: string; slug: string }) => {
      const newNode: Node = {
        id: `sector-${sector.morCode}-${Date.now()}`,
        type: 'sector',
        position: dropPositionForNewNode(),
        data: sector,
        selected: true,
      }
      setNodes((n) => [...n.map((x) => ({ ...x, selected: false })), newNode])
    },
    [dropPositionForNewNode, setNodes],
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
      lastSnapshotRef.current = previous
      setDirty(true)
      dirtyRef.current = true
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
      lastSnapshotRef.current = nextState
      setDirty(true)
      dirtyRef.current = true
      return prev.slice(1)
    })
  }, [nodes, edges, title, setNodes, setEdges])

  const deleteSelection = useCallback(() => {
    setNodes((currentNodes) => {
      const selectedIds = new Set(currentNodes.filter((n) => n.selected).map((n) => n.id))
      if (selectedIds.size === 0) return currentNodes
      setEdges((currentEdges) =>
        currentEdges.filter(
          (e) => !selectedIds.has(e.source) && !selectedIds.has(e.target) && !e.selected,
        ),
      )
      return currentNodes.filter((n) => !selectedIds.has(n.id))
    })
    setEdges((currentEdges) => currentEdges.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }
    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, deleteSelection])

  const exportJson = useCallback(() => {
    const payload = { title, exportedAt: new Date().toISOString(), nodes, edges }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'canvas'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded canvas JSON.')
  }, [title, nodes, edges])

  const exportPng = useCallback(async () => {
    setExportingPng(true)
    try {
      const paneEl = document.querySelector<HTMLElement>('.react-flow')
      if (!paneEl) throw new Error('React Flow pane not found')

      const savedViewport = getViewport()
      fitView({ padding: 0.2, duration: 0 })
      await new Promise((r) => requestAnimationFrame(() => r(null)))

      const bgColour =
        getComputedStyle(document.body).getPropertyValue('background-color') || '#0b0b0b'

      const dataUrl = await toPng(paneEl, {
        backgroundColor: bgColour.trim() || '#0b0b0b',
        pixelRatio: 2,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          return !(
            node.classList.contains('react-flow__minimap') ||
            node.classList.contains('react-flow__controls')
          )
        },
      })

      setViewport(savedViewport, { duration: 0 })

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
  }, [title, getViewport, fitView, setViewport])

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
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <Link href="/dashboard/canvas">
            <ArrowLeft className="h-3.5 w-3.5" /> Exit
          </Link>
        </Button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title"
          className="min-w-[200px] flex-1 rounded border border-border bg-surface px-2 py-1 text-sm text-ink focus:border-brand focus:outline-none"
        />

        <div className="flex items-center rounded-md border border-border bg-surface">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={past.length === 0}
            aria-label="Undo"
            title="Undo (Ctrl/⌘+Z)"
            className="rounded-r-none"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button
            size="sm"
            variant="ghost"
            onClick={redo}
            disabled={future.length === 0}
            aria-label="Redo"
            title="Redo (Ctrl/⌘+Shift+Z)"
            className="rounded-l-none"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>

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

      {/* Palette (left) + Flow surface (right) */}
      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={addFromPalette} onAddSector={addSectorNode} />

        <div className="relative min-h-0 flex-1">
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
            snapToGrid
            snapGrid={[20, 20]}
            deleteKeyCode={null}
            connectionRadius={40}
            // Pan/zoom defaults tuned for laptop trackpad users:
            //   - trackpad two-finger scroll pans (both axes)
            //   - trackpad pinch zooms
            //   - left-click drag on empty area pans (Figma-style)
            //   - Cmd/Ctrl + drag draws a selection box
            //   - Shift + click adds a node to the current selection
            //   - wheel scroll is pan, not zoom (Ctrl+wheel zooms via
            //     zoomActivationKeyCode)
            panOnScroll
            panOnScrollMode={PanOnScrollMode.Free}
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick={false}
            panOnDrag
            selectionOnDrag={false}
            selectionKeyCode={['Meta', 'Control']}
            multiSelectionKeyCode={['Shift']}
            zoomActivationKeyCode={['Meta', 'Control']}
          >
            <Background gap={20} size={1} />
            <MiniMap zoomable pannable className="!bg-surface !border-border" />
            <Controls className="!bg-surface !border-border [&_button]:!bg-surface [&_button]:!border-border [&_button]:!text-ink" />
          </ReactFlow>

          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto max-w-sm rounded-xl border border-dashed border-border bg-surface/80 p-6 text-center shadow-lg backdrop-blur">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand/15 text-brand">
                  <Layers3 className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">Start with a block</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Pick a Sector, Idea, or Task from the palette on the left. Once you have two
                  blocks, drag from the small dot on the right of one to the dot on the left of
                  the other to connect them.
                </p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  drag empty area to pan · two-finger scroll · ⌘+scroll zoom · ⌫ delete
                </p>
                <p className="mt-2 text-[10px] text-ink-faint">
                  Once you have a node, select it and drag the corner handle to resize.
                </p>
              </div>
            </div>
          ) : null}
        </div>
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
