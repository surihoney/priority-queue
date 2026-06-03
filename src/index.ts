export interface PriorityQueueOptions<T> {
    /**
     * Lower numbers mean higher priority (e.g. 0 = VIP, 1 = normal).
     */
    getPriorityRank: (item: T) => number;
    /**
     * Used for stable FIFO ordering within the same priority band.
     * Defaults to numeric subtraction when items expose a numeric `id`.
     */
    compareId?: (a: T, b: T) => number;
}

export function defaultCompareId<T extends { id: number }>(a: T, b: T): number {
    return a.id - b.id;
}

export function resolveCompareId<T>(
    options: PriorityQueueOptions<T>,
): (a: T, b: T) => number {
    if (options.compareId) {
        return options.compareId;
    }

    return (a, b) => {
        const aId = (a as { id?: number }).id;
        const bId = (b as { id?: number }).id;

        if (typeof aId !== 'number' || typeof bId !== 'number') {
            throw new Error(
                'compareId is required when queue items do not have a numeric id property',
            );
        }

        return aId - bId;
    };
}

/**
 * Insert an item into a priority queue.
 *
 * Items with a better (lower) priority rank are placed ahead of worse ranks.
 * Within the same rank, new inserts are appended after existing items.
 */
export function insertItem<T>(
    queue: T[],
    item: T,
    options: PriorityQueueOptions<T>,
): T[] {
    const rank = options.getPriorityRank(item);
    const index = queue.findIndex(
        (existing) => options.getPriorityRank(existing) > rank,
    );

    if (index === -1) {
        return [...queue, item];
    }

    return [...queue.slice(0, index), item, ...queue.slice(index)];
}

/**
 * Re-insert an item that was removed and should return to its original slot.
 *
 * Placement is determined by priority rank first, then FIFO order by id within
 * the same rank. This avoids pushing interrupted work to the front unfairly.
 */
export function reinsertItem<T>(
    queue: T[],
    item: T,
    options: PriorityQueueOptions<T>,
): T[] {
    const compareId = resolveCompareId(options);
    const targetRank = options.getPriorityRank(item);

    let idx = queue.findIndex((existing) => {
        const rank = options.getPriorityRank(existing);
        if (rank > targetRank) return true;
        if (rank === targetRank && compareId(existing, item) > 0) return true;
        return false;
    });

    if (idx === -1) idx = queue.length;

    return [...queue.slice(0, idx), item, ...queue.slice(idx)];
}

export const PriorityRank = {
    high: 0,
    normal: 1,
} as const;

export type TwoTierPriority = typeof PriorityRank[keyof typeof PriorityRank];

export interface IdentifiedQueueItem {
    id: number;
    priority: TwoTierPriority;
}

export const twoTierQueueOptions: PriorityQueueOptions<IdentifiedQueueItem> = {
    getPriorityRank: (item) => item.priority,
};

export function insertIdentifiedItem(
    queue: IdentifiedQueueItem[],
    item: IdentifiedQueueItem,
): IdentifiedQueueItem[] {
    return insertItem(queue, item, twoTierQueueOptions);
}

export function reinsertIdentifiedItem(
    queue: IdentifiedQueueItem[],
    item: IdentifiedQueueItem,
): IdentifiedQueueItem[] {
    return reinsertItem(queue, item, twoTierQueueOptions);
}
