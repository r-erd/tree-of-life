/**
 * store.js — Central Svelte 5 state store
 *
 * Manages:
 *  - The parsed tree (from YAML)
 *  - The set of skilled node IDs (persisted to localStorage)
 *  - Active category filter
 *  - Import/view mode (when viewing someone else's code)
 */

import { writable, derived, get } from 'svelte/store'
import { encode, decode } from './encoder.js'

const LS_KEY = 'tol_state'
export const TREE_VERSION = 6 // must match category YAML version

// ── Tree definition (loaded once from YAML) ──
export const categories = writable([])

// ── Node index: Map<id, node> for fast lookup ──
export const nodeIndex = writable(new Map())

// ── User's skilled nodes ──
function createSkilledStore() {
  const saved = localStorage.getItem(LS_KEY)
  let initial = new Set()
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.version === TREE_VERSION && Array.isArray(parsed.skilled)) {
        initial = new Set(parsed.skilled)
      }
    } catch (_) { /* ignore corrupt data */ }
  }

  const { subscribe, update, set } = writable(initial)

  function persist(skilled) {
    localStorage.setItem(LS_KEY, JSON.stringify({
      version: TREE_VERSION,
      skilled: [...skilled]
    }))
  }

  return {
    subscribe,
    toggle(id) {
      update(s => {
        const next = new Set(s)
        if (next.has(id)) {
          next.delete(id)
          // Also un-skill any nodes that require this one (cascade)
          const idx = get(nodeIndex)
          cascadeRemove(next, id, idx)
        } else {
          const idx = get(nodeIndex)
          next.add(id)
          // Auto-skill prerequisites
          cascadeAdd(next, id, idx)
        }
        persist(next)
        return next
      })
    },
    importSkilled(newSkilled) {
      set(newSkilled)
      persist(newSkilled)
    },
    reset() {
      const empty = new Set()
      set(empty)
      persist(empty)
    }
  }
}

/** Remove all nodes that transitively require `removedId` */
function cascadeRemove(skilled, removedId, idx) {
  for (const [id, node] of idx) {
    if (node.requires === removedId && skilled.has(id)) {
      skilled.delete(id)
      cascadeRemove(skilled, id, idx)
    }
  }
}

/** Add all nodes that are transitively required by `addedId` */
function cascadeAdd(skilled, addedId, idx) {
  const node = idx.get(addedId)
  if (node && node.requires) {
    const reqId = node.requires
    if (!skilled.has(reqId)) {
      skilled.add(reqId)
      cascadeAdd(skilled, reqId, idx)
    }
  }
}

export const skilled = createSkilledStore()

// ── Active category filter ──
export const activeCategory = writable('all')
// ── Search Focus ──
export const searchFocus = writable(null)
// ── Import/view mode: when user enters someone else's code ──
export const viewMode = writable(null) // null = own tree, Set = viewing imported tree

// ── Derived: which set of skilled nodes to display ──
export const displaySkilled = derived(
  [skilled, viewMode],
  ([$skilled, $viewMode]) => $viewMode !== null ? $viewMode : $skilled
)

// ── Stats ──
export const stats = derived(
  [nodeIndex, displaySkilled],
  ([$nodeIndex, $displaySkilled]) => {
    let total = 0
    for (const [, node] of $nodeIndex) {
      if (!node.isRoot && !node.isCategory && !node.isGroup) total++
    }
    const unlocked = $displaySkilled.size
    return { total, unlocked, pct: total > 0 ? Math.round((unlocked / total) * 100) : 0 }
  }
)

// ── Share code generation ──
export function generateCode() {
  const cats = get(categories)
  const s = get(skilled)
  return encode(s, cats, TREE_VERSION)
}

// ── Import a share code ──
export function importCode(code) {
  const cats = get(categories)
  const result = decode(code, cats)
  if (result.error) return { error: result.error }
  if (result.version !== TREE_VERSION) {
    return { error: `Code was made with tree version ${result.version}, current is ${TREE_VERSION}.` }
  }
  return { skilled: result.skilled }
}

/**
 * Build the node index from the loaded categories.
 * Call this once after categories are loaded.
 */
export function buildNodeIndex(cats) {
  const idx = new Map()
  function walk(nodes) {
    if (!nodes) return
    for (const node of nodes) {
      idx.set(node.id, node)
      if (node.children) walk(node.children)
    }
  }
  for (const cat of cats) {
    idx.set(cat.id, cat)
    if (cat.skills) walk(cat.skills)
  }
  nodeIndex.set(idx)
}
