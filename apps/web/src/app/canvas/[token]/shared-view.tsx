'use client'

import { useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { NODE_TYPES } from '@/app/(dashboard)/dashboard/canvas/[id]/node-types'

/**
 * Read-only React Flow surface for the public share view. Same node type
 * registry as the editor so shared canvases render identically — the
 * node components handle their own display; edits made through them
 * won't persist because there's no save action wired up here.
 */
export function CanvasSharedView({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const nodeTypes = useMemo(() => NODE_TYPES, [])
  return (
    // Defensive h-full/w-full wrapper so React Flow always has a
    // sized parent even if a future caller forgets to wrap us.
    <div className="h-full w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          panOnScroll
          zoomOnPinch
        >
          <Background gap={20} size={1} />
          <MiniMap zoomable pannable className="!bg-surface !border-border" />
          <Controls
            showInteractive={false}
            className="!bg-surface !border-border [&_button]:!bg-surface [&_button]:!border-border [&_button]:!text-ink"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}
