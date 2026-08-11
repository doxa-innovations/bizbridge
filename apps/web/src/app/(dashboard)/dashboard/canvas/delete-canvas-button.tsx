'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteCanvas } from './actions'

/**
 * Delete a canvas with a confirmation dialog. Previous version used a
 * bare form action, so a single misclick nuked the plan silently. This
 * wraps the same server action in a Radix Dialog so the user has to
 * actively confirm.
 */
export function DeleteCanvasButton({ id, title }: { id: number; title: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    const fd = new FormData()
    fd.set('id', String(id))
    startTransition(async () => {
      await deleteCanvas(fd)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this plan?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">&ldquo;{title}&rdquo;</span> and everything
          inside it (nodes, edges, share link) will be permanently removed. This can&apos;t
          be undone.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Delete plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
