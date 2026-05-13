import { describe, it, expect } from 'vitest'
import {
  buildVisualTree, computeLayout, flatten,
  filterSkilled, pruneTree,
  hasSkilledDescendant, countSkilledDescendants, countDescendants,
  NODE_W, NODE_H
} from '../layout.js'

const fixtureCats = [
  {
    id: 'body',
    name: 'BODY',
    skills: [
      {
        id: 'running',
        name: 'RUNNING',
        children: [
          { id: 'run_50h', name: '50 HOURS' },
          { id: 'run_250h', name: '250 HOURS', requires: 'run_50h' },
        ]
      },
      {
        id: 'climbing',
        name: 'CLIMBING',
        children: [
          { id: 'climb_50h', name: '50 HOURS' },
        ]
      }
    ]
  },
  {
    id: 'mind',
    name: 'MIND',
    skills: [
      {
        id: 'meditation',
        name: 'MEDITATION',
        children: [
          { id: 'med_50h', name: '50 HOURS' },
        ]
      }
    ]
  }
]

describe('buildVisualTree', () => {
  it('builds a root with all categories', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    expect(root.isRoot).toBe(true)
    expect(root.children.length).toBe(2)
    expect(root.children[0].id).toBe('body')
    expect(root.children[1].id).toBe('mind')
  })

  it('builds a single category without root wrapper', () => {
    const root = buildVisualTree(fixtureCats, 'body')
    expect(root.isRoot).toBeUndefined()
    expect(root.id).toBe('body')
  })

  it('restructures requires chains', () => {
    const root = buildVisualTree(fixtureCats, 'body')
    const running = root.children.find(c => c.id === 'running')
    expect(running.children.map(c => c.id)).toContain('run_50h')
    const run50 = running.children.find(c => c.id === 'run_50h')
    expect(run50.children.map(c => c.id)).toContain('run_250h')
  })
})

describe('computeLayout', () => {
  it('assigns y based on depth', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    computeLayout(root)
    expect(root.y).toBe(0)
    expect(root.children[0].y).toBe(150)
  })

  it('assigns x coordinates', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    computeLayout(root)
    expect(root.x).toBe(0)
    const { nodes } = flatten(root)
    for (const n of nodes) {
      expect(typeof n.x).toBe('number')
    }
  })
})

describe('flatten', () => {
  it('returns nodes and edges', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    computeLayout(root)
    const { nodes, edges } = flatten(root)
    expect(nodes.length).toBeGreaterThan(0)
    expect(edges.length).toBe(nodes.length - 1) // tree
  })
})

describe('filterSkilled', () => {
  it('keeps only skilled branches', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    const filtered = filterSkilled(root, new Set(['run_50h']))
    expect(filtered).not.toBeNull()
    const ids = []
    function walk(n) { ids.push(n.id); n.children?.forEach(walk) }
    walk(filtered)
    expect(ids).toContain('run_50h')
  })
})

describe('pruneTree', () => {
  it('shows root and categories by default', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    const pruned = pruneTree(root, new Set(), new Set(), 0)
    expect(pruned.children.length).toBe(2)
  })

  it('expands nodes with skilled descendants', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    const pruned = pruneTree(root, new Set(['run_50h']), new Set(), 0)
    const body = pruned.children.find(c => c.id === 'body')
    const running = body.children.find(c => c.id === 'running')
    expect(running.children.length).toBeGreaterThan(0)
  })
})

describe('hasSkilledDescendant', () => {
  it('returns true for skilled nodes', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    expect(hasSkilledDescendant(root, new Set(['run_50h']))).toBe(true)
  })

  it('returns false when empty', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    expect(hasSkilledDescendant(root, new Set())).toBe(false)
  })
})

describe('countDescendants', () => {
  it('counts all children recursively', () => {
    const root = buildVisualTree(fixtureCats, 'all')
    const body = root.children.find(c => c.id === 'body')
    // body -> running, climbing -> each has 1-2 children
    expect(countDescendants(body)).toBeGreaterThan(0)
  })
})

describe('constants', () => {
  it('exports positive dimensions', () => {
    expect(NODE_W).toBeGreaterThan(0)
    expect(NODE_H).toBeGreaterThan(0)
  })
})
