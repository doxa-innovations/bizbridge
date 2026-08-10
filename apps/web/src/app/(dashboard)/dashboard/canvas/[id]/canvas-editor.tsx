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
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Contact as ContactIcon,
  Download,
  FileQuestion,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Share2,
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

/** Add-node menu presets — icon + label + default `data` payload for each
 *  supported node type. Kept in one array so the dropdown and the seed
 *  helper stay in lockstep. */
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
  const dirtyRef = useRef(false)

  // Any change → mark dirty. Autosave kicks in on a debounce below.
  useEffect(() => {
    setDirty(true)
    dirtyRef.current = true
  }, [nodes, edges, title])

  const persist = useCallback(async () => {
    if (!dirtyRef.current) return
    setSaving(true)
    try {
      // React Flow's Node/Edge types are looser than our CanvasNode/CanvasEdge
      // (Node.type is optional, Edge.label is ReactNode). We only ever set
      // typed nodes and text labels, so the cast is safe at runtime.
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

  // Autosave: 1.5s after the last change.
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
      // Drop new nodes near the current viewport center-ish; React Flow's
      // `screenToFlowPosition` would need the container ref — for MVP a
      // simple offset that avoids stacking is enough.
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

        <Button size="sm" variant="ghost" onClick={exportJson}>
          <Download className="h-3.5 w-3.5" /> Export JSON
        </Button>

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

/** Public wrapper — React Flow needs its provider higher than the surface
 *  when custom nodes call `useReactFlow()`. */
export function CanvasEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  )
}
