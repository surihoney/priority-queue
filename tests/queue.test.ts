import { describe, it, expect, beforeEach } from 'vitest';
import {
    insertItem,
    reinsertItem,
    insertIdentifiedItem,
    reinsertIdentifiedItem,
    PriorityRank,
    type IdentifiedQueueItem,
} from '../src/index';

interface TestItem {
    id: number;
    tier: 'VIP' | 'NORMAL';
}

const tierRank = (tier: TestItem['tier']) => (tier === 'VIP' ? 0 : 1);

const queueOptions = {
    getPriorityRank: (item: TestItem) => tierRank(item.tier),
};

let nextId = 1;

function makeItem(tier: TestItem['tier']): TestItem {
    return { id: nextId++, tier };
}

const ids = (items: TestItem[]) => items.map((item) => item.id);
const tiers = (items: TestItem[]) => items.map((item) => item.tier);

describe('insertItem', () => {
    beforeEach(() => {
        nextId = 1;
    });

    it('appends a NORMAL order to an empty queue', () => {
        const normal = makeItem('NORMAL');
        expect(insertItem([], normal, queueOptions)).toEqual([normal]);
    });

    it('appends a NORMAL order after existing NORMAL orders', () => {
        const a = makeItem('NORMAL');
        const b = makeItem('NORMAL');
        const c = makeItem('NORMAL');
        const queue = insertItem(insertItem([a], b, queueOptions), c, queueOptions);
        expect(ids(queue)).toEqual([a.id, b.id, c.id]);
    });

    it('appends a NORMAL order after any existing VIP orders', () => {
        const vip = makeItem('VIP');
        const normal = makeItem('NORMAL');
        const queue = insertItem([vip], normal, queueOptions);
        expect(tiers(queue)).toEqual(['VIP', 'NORMAL']);
    });

    it('places a VIP order ahead of every NORMAL order', () => {
        const n1 = makeItem('NORMAL');
        const n2 = makeItem('NORMAL');
        const vip = makeItem('VIP');
        const queue = insertItem([n1, n2], vip, queueOptions);
        expect(ids(queue)).toEqual([vip.id, n1.id, n2.id]);
    });

    it('places a VIP order behind existing VIP orders but ahead of NORMAL orders', () => {
        const v1 = makeItem('VIP');
        const n1 = makeItem('NORMAL');
        const v2 = makeItem('VIP');
        const queue = insertItem([v1, n1], v2, queueOptions);
        expect(ids(queue)).toEqual([v1.id, v2.id, n1.id]);
        expect(tiers(queue)).toEqual(['VIP', 'VIP', 'NORMAL']);
    });

    it('appends a VIP order to the end of an all-VIP queue', () => {
        const v1 = makeItem('VIP');
        const v2 = makeItem('VIP');
        const v3 = makeItem('VIP');
        const queue = insertItem(
            insertItem([v1], v2, queueOptions),
            v3,
            queueOptions,
        );
        expect(ids(queue)).toEqual([v1.id, v2.id, v3.id]);
    });

    it('maintains FIFO order among VIPs across repeated inserts', () => {
        let queue: TestItem[] = [];
        const inserted: TestItem[] = [];
        for (let i = 0; i < 5; i++) {
            const item = makeItem('VIP');
            queue = insertItem(queue, item, queueOptions);
            inserted.push(item);
        }
        expect(ids(queue)).toEqual(ids(inserted));
    });
});

describe('reinsertItem', () => {
    beforeEach(() => {
        nextId = 1;
    });

    it('places a returned VIP ahead of later VIPs (by id)', () => {
        const v1 = { id: 1, tier: 'VIP' as const };
        const v3 = { id: 3, tier: 'VIP' as const };
        const result = reinsertItem([v3], v1, queueOptions);
        expect(ids(result)).toEqual([1, 3]);
    });

    it('places a returned VIP behind earlier VIPs and ahead of NORMALs', () => {
        const v1 = { id: 1, tier: 'VIP' as const };
        const v2 = { id: 2, tier: 'VIP' as const };
        const n4 = { id: 4, tier: 'NORMAL' as const };
        const result = reinsertItem([v1, n4], v2, queueOptions);
        expect(ids(result)).toEqual([1, 2, 4]);
    });

    it('places a returned NORMAL behind all VIPs and ahead of newer NORMALs', () => {
        const v5 = { id: 5, tier: 'VIP' as const };
        const n2 = { id: 2, tier: 'NORMAL' as const };
        const n3 = { id: 3, tier: 'NORMAL' as const };
        const result = reinsertItem([v5, n3], n2, queueOptions);
        expect(ids(result)).toEqual([5, 2, 3]);
    });

    it('appends when nothing in the queue outranks it', () => {
        const v1 = { id: 1, tier: 'VIP' as const };
        const v2 = { id: 2, tier: 'VIP' as const };
        const result = reinsertItem([v1], v2, queueOptions);
        expect(ids(result)).toEqual([1, 2]);
    });

    it('handles an empty queue', () => {
        const v1 = { id: 1, tier: 'VIP' as const };
        expect(reinsertItem([], v1, queueOptions)).toEqual([v1]);
    });
});

describe('two-tier convenience helpers', () => {
    it('supports the FeedMe-style identified item shape', () => {
        const queue: IdentifiedQueueItem[] = [];
        const vip: IdentifiedQueueItem = { id: 1, priority: PriorityRank.high };
        const normal: IdentifiedQueueItem = {
            id: 2,
            priority: PriorityRank.normal,
        };

        const afterInsert = insertIdentifiedItem(
            insertIdentifiedItem(queue, vip),
            normal,
        );
        expect(afterInsert.map((item) => item.id)).toEqual([1, 2]);

        const afterReinsert = reinsertIdentifiedItem(
            [{ id: 3, priority: PriorityRank.normal }],
            { id: 2, priority: PriorityRank.normal },
        );
        expect(afterReinsert.map((item) => item.id)).toEqual([2, 3]);
    });
});
