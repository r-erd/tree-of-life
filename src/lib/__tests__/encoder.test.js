import { describe, it, expect } from 'vitest'
import { encode, decode, getCanonicalOrder } from '../encoder.js'

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

describe('getCanonicalOrder', () => {
  it('returns DFS-ordered node IDs', () => {
    const order = getCanonicalOrder(fixtureCats)
    expect(order).toEqual([
      'running', 'run_50h', 'run_250h',
      'climbing', 'climb_50h',
      'meditation', 'med_50h'
    ])
  })

  it('is memoized (same result for same input)', () => {
    const a = getCanonicalOrder(fixtureCats)
    const b = getCanonicalOrder(fixtureCats)
    expect(a).toBe(b) // same reference
  })
})

describe('encode / decode', () => {
  it('round-trips an empty set', () => {
    const code = encode(new Set(), fixtureCats, 5)
    const result = decode(code, fixtureCats)
    expect(result.error).toBeUndefined()
    expect(result.version).toBe(5)
    expect(result.skilled.size).toBe(0)
  })

  it('round-trips a non-empty set', () => {
    const skilled = new Set(['run_50h', 'climb_50h'])
    const code = encode(skilled, fixtureCats, 5)
    const result = decode(code, fixtureCats)
    expect(result.error).toBeUndefined()
    expect(result.skilled).toEqual(skilled)
  })

  it('round-trips all nodes skilled', () => {
    const all = new Set(getCanonicalOrder(fixtureCats))
    const code = encode(all, fixtureCats, 5)
    const result = decode(code, fixtureCats)
    expect(result.skilled).toEqual(all)
  })

  it('rejects invalid format', () => {
    const result = decode('not-a-code', fixtureCats)
    expect(result.error).toContain('Invalid code format')
  })

  it('rejects bad characters', () => {
    const result = decode('V5.!!!', fixtureCats)
    expect(result.error).toContain('Invalid character')
  })
})
