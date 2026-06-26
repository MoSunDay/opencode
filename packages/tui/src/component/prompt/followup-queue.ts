import { createSignal } from "solid-js"
import type { PromptInfo } from "../../prompt/history"

// A queued follow-up prompt. Only the editable snapshot of the input is stored;
// transient editor extmarks are dropped (they are tied to the input DOM node).
export type FollowupItem = Pick<PromptInfo, "input" | "parts">

export type FollowupQueue = {
  items: () => FollowupItem[]
  size: () => number
  peek: () => FollowupItem | undefined
  enqueue: (item: FollowupItem) => void
  dequeue: () => FollowupItem | undefined
  clear: () => void
}

// Codex-style follow-up queue: prompts typed while a generation is running are
// held here and dispatched one-by-one as each generation finishes. Pure data +
// signals; the dispatch wiring lives in the Prompt component.
export function createFollowupQueue(): FollowupQueue {
  const [items, setItems] = createSignal<FollowupItem[]>([])

  return {
    items: () => items(),
    size: () => items().length,
    peek: () => items()[0],
    enqueue: (item) => setItems((prev) => [...prev, item]),
    dequeue: () => {
      const next = items()[0]
      if (next) setItems((prev) => prev.slice(1))
      return next
    },
    clear: () => setItems([]),
  }
}
