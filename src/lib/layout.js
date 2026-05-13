/**
 * layout.js — Build a visual tree from YAML categories and compute x/y positions.
 *
 * Two passes:
 *  1. buildVisualTree()  — restructures flat siblings-with-requires into proper parent-child chains
 *  2. computeLayout()    — assigns x/y coords using a centered tidy-tree algorithm
 */

export const NODE_W = 160
export const NODE_H = 44
export const LEVEL_H = 150
export const SIBLING_GAP = 24

// ── 1. Build visual tree ──────────────────────────────────────────────────────

export function buildVisualTree(categories, activeCategory = 'all') {
  const cats = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory)

  if (cats.length === 1) {
    return makeCatNode(cats[0])
  }

  return {
    id: '__root__',
    name: 'ME',
    isRoot: true,
    children: cats.map(makeCatNode),
  }
}

function makeCatNode(cat) {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '',
    description: cat.description || '',
    isCategory: true,
    _categoryId: cat.id,
    children: (cat.skills || []).map(s => makeSkillNode(s, cat.id, true)),
  }
}

function makeSkillNode(skill, categoryId, isGroup = false) {
  return {
    id: skill.id,
    name: skill.name,
    icon: skill.icon || '',
    description: skill.description || '',
    requires: skill.requires || null,
    isGroup: isGroup,
    _categoryId: categoryId,
    children: restructureChildren(skill.children || [], categoryId),
  }
}

/**
 * Given a flat list of sibling YAML nodes, some of which chain via `requires`,
 * restructure into proper parent→child relationships.
 */
function restructureChildren(yamlChildren, categoryId) {
  if (!yamlChildren || yamlChildren.length === 0) return []

  const siblingIds = new Set(yamlChildren.map(c => c.id))

  // Which nodes are chained (their requires points to a sibling)?
  const chained = new Set()
  const requiresChain = new Map() // parentId → [childNodes]

  for (const c of yamlChildren) {
    if (c.requires && siblingIds.has(c.requires)) {
      chained.add(c.id)
      if (!requiresChain.has(c.requires)) requiresChain.set(c.requires, [])
      requiresChain.get(c.requires).push(c)
    }
  }

  const directChildren = yamlChildren.filter(c => !chained.has(c.id))

  function buildNode(yaml) {
    const ownChildren = restructureChildren(yaml.children || [], categoryId)
    const chainedChildren = (requiresChain.get(yaml.id) || []).map(buildNode)
    return {
      id: yaml.id,
      name: yaml.name,
      icon: yaml.icon || '',
      description: yaml.description || '',
      requires: yaml.requires || null,
      isGroup: false,
      _categoryId: categoryId,
      children: [...ownChildren, ...chainedChildren],
    }
  }

  return directChildren.map(buildNode)
}

// ── 2. Layout ─────────────────────────────────────────────────────────────────

/**
 * Assign x/y to every node in the tree (mutates in place).
 * Root is placed at (0, 0); children fan out below.
 * Returns the total width of the subtree.
 */
export function computeLayout(node, depth = 0) {
  node.y = depth * LEVEL_H

  if (!node.children || node.children.length === 0) {
    node.x = 0
    node.subtreeW = NODE_W
    return node.subtreeW
  }

  let totalW = 0
  for (let i = 0; i < node.children.length; i++) {
    computeLayout(node.children[i], depth + 1)
    if (i > 0) totalW += SIBLING_GAP
    totalW += node.children[i].subtreeW
  }

  // Position children relative to parent
  let cursor = -totalW / 2
  for (const child of node.children) {
    shiftSubtree(child, cursor + child.subtreeW / 2)
    cursor += child.subtreeW + SIBLING_GAP
  }

  node.x = 0
  node.subtreeW = Math.max(NODE_W, totalW)
  return node.subtreeW
}

function shiftSubtree(node, dx) {
  node.x = (node.x || 0) + dx
  if (node.children) node.children.forEach(c => shiftSubtree(c, dx))
}

// ── 3. Flatten for rendering ──────────────────────────────────────────────────

/** Returns { nodes: [], edges: [] } for SVG rendering. */
export function flatten(root) {
  const nodes = []
  const edges = []

  function walk(node, parent) {
    nodes.push(node)
    if (parent) {
      edges.push({ from: parent, to: node })
    }
    for (const child of (node.children || [])) walk(child, node)
  }

  walk(root, null)
  return { nodes, edges }
}

// ── 4. Filter: only skilled branches ─────────────────────────────────────────

/** Returns a new tree keeping only nodes that are skilled or have skilled descendants. */
export function filterSkilled(node, skilledSet) {
  if (skilledSet.has(node.id)) return { ...node, children: [] }

  const filteredChildren = (node.children || [])
    .map(c => filterSkilled(c, skilledSet))
    .filter(Boolean)

  if (filteredChildren.length === 0 && !node.isRoot) return null

  return { ...node, children: filteredChildren }
}

// ── 5. Progressive disclosure ─────────────────────────────────────────────────

/**
 * Default depth always shown (root=0, category=1).
 * Nodes deeper than this are only shown if their parent is skilled or expanded.
 * Setting this to 1 makes categories collapsed by default.
 */
const DEFAULT_VISIBLE_DEPTH = 1

/**
 * Prune the visual tree for progressive disclosure.
 * Children are included if: depth < DEFAULT_VISIBLE_DEPTH, 
 * parent is in expandedSet, or parent has a skilled descendant.
 * Collapsed nodes get { _hasHidden: true, _hiddenCount: N }.
 */
export function hasSkilledDescendant(node, skilledSet) {
  if (skilledSet.has(node.id)) return true
  if (!node.children) return false
  return node.children.some(c => hasSkilledDescendant(c, skilledSet))
}

export function countSkilledDescendants(node, skilledSet) {
  let count = 0
  if (skilledSet.has(node.id)) count += 1
  if (node.children) {
    for (const c of node.children) {
      count += countSkilledDescendants(c, skilledSet)
    }
  }
  return count
}

export function pruneTree(node, skilledSet, expandedSet, depth = 0) {
  if (!node.children || node.children.length === 0) {
    return { ...node, _hasHidden: false, _hiddenCount: 0 }
  }

  const shouldExpand =
    depth < DEFAULT_VISIBLE_DEPTH ||
    expandedSet.has(node.id) ||
    hasSkilledDescendant(node, skilledSet)

  if (shouldExpand) {
    const prunedChildren = node.children.map(c =>
      pruneTree(c, skilledSet, expandedSet, depth + 1)
    )
    return { ...node, children: prunedChildren, _hasHidden: false, _hiddenCount: 0 }
  }

  const hidden = countDescendants(node)
  return { ...node, children: [], _hasHidden: true, _hiddenCount: hidden }
}

export function countDescendants(node) {
  if (!node.children || node.children.length === 0) return 0
  return node.children.reduce((acc, c) => acc + 1 + countDescendants(c), 0)
}
