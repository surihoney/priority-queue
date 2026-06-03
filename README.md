# @surihoney/priority-queue

A small TypeScript library for ordering items in a **priority queue** — a waiting line where more important items go first, but everyone still gets a fair turn within their group.

## What is a priority queue?

Imagine a coffee shop line:

- **VIP customers** get served before regular customers.
- Among VIPs, whoever arrived first is served first.
- Among regular customers, same rule — first come, first served.

That is a **priority queue**: items are sorted by **importance first**, then by **arrival order**.

## Key terms

| Term | Meaning |
|------|---------|
| **Priority rank** | A number that says how important an item is. **Lower number = higher priority.** (e.g. `0` = VIP, `1` = normal) |
| **Priority band / tier** | A group of items that share the same priority rank (e.g. all VIPs, all normal) |
| **FIFO** | *First In, First Out* — within the same priority band, earlier items stay ahead of later ones |
| **Insert** | Add a **new** item. It goes to the **back** of its priority band. |
| **Reinsert** | Put an item **back** after it was removed (e.g. interrupted work). It returns to its **original spot** based on its id, so it does not unfairly jump ahead of newer items. |

## Why two functions?

This library gives you two operations on purpose:

- **`insertItem`** — for brand-new work. New VIPs join the end of the VIP line; new normal items join the end of the normal line.
- **`reinsertItem`** — for work that was paused and resumed. It goes back where it *would have been* if it had never left, using id order within the same priority band.

## Simplest example

```typescript
import {
  insertIdentifiedItem,
  PriorityRank,
  type IdentifiedQueueItem,
} from '@surihoney/priority-queue';

let queue: IdentifiedQueueItem[] = [];

// Two normal customers join the line
queue = insertIdentifiedItem(queue, { id: 1, priority: PriorityRank.normal });
queue = insertIdentifiedItem(queue, { id: 2, priority: PriorityRank.normal });
// queue: [1, 2]

// A VIP arrives — they go to the front
queue = insertIdentifiedItem(queue, { id: 3, priority: PriorityRank.high });
// queue: [3, 1, 2]  → VIP first, then normal customers in order
```

## Install

```bash
npm install @surihoney/priority-queue
```

## Custom items

You can queue any shape of object. You only need to tell the library how to read each item's priority:

```typescript
import { insertItem, reinsertItem } from '@surihoney/priority-queue';

interface Order {
  id: number;
  tier: 'VIP' | 'NORMAL';
}

const options = {
  getPriorityRank: (order: Order) => (order.tier === 'VIP' ? 0 : 1),
};

let queue: Order[] = [];

queue = insertItem(queue, { id: 1, tier: 'NORMAL' }, options);
queue = insertItem(queue, { id: 2, tier: 'VIP' }, options);
// [{ id: 2, tier: 'VIP' }, { id: 1, tier: 'NORMAL' }]

// Customer 1 stepped away and came back — they keep their place among normals
queue = reinsertItem(
  [{ id: 3, tier: 'NORMAL' }],
  { id: 1, tier: 'NORMAL' },
  options,
);
// [{ id: 1, tier: 'NORMAL' }, { id: 3, tier: 'NORMAL' }]
```

## Built-in two-tier helpers

If your items look like `{ id: number, priority: 0 | 1 }`, use the ready-made helpers:

```typescript
import {
  insertIdentifiedItem,
  reinsertIdentifiedItem,
  PriorityRank,
} from '@surihoney/priority-queue';

// PriorityRank.high === 0
// PriorityRank.normal === 1
```

## API summary

| Export | Description |
|--------|-------------|
| `insertItem(queue, item, options)` | Add a new item to the queue |
| `reinsertItem(queue, item, options)` | Put a returning item back in its fair position |
| `insertIdentifiedItem` / `reinsertIdentifiedItem` | Same as above, for `{ id, priority }` items |
| `PriorityRank` | `{ high: 0, normal: 1 }` |
| `PriorityQueueOptions` | Type for `{ getPriorityRank, compareId? }` |

All functions are **immutable** — they return a new array and do not change the one you pass in.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
