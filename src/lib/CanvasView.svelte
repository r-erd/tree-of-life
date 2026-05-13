<script>
  /**
   * CanvasView.svelte — Zoomable/pannable SVG tree canvas.
   * Progressive disclosure: shows one level past the skilled frontier by default.
   * Users can expand/collapse individual branches.
   */
  import { categories, activeCategory, displaySkilled, skilled, viewMode, searchFocus } from '../lib/store.js'
  import { get } from 'svelte/store'
  import { tick } from 'svelte'
  import {
    buildVisualTree, computeLayout, flatten,
    filterSkilled, pruneTree, NODE_W, NODE_H, LEVEL_H, hasSkilledDescendant, countSkilledDescendants, countDescendants
  } from '../lib/layout.js'
  import { categoryIconInner as categoryIcons } from '../lib/icons.js'

  // ── State ──
  let scale      = $state(1)
  let tx         = $state(0)
  let ty         = $state(0)
  let focusMode  = $state(false)
  let svgEl      = $state(null)
  let isDragging = $state(false)
  let dragStart  = $state({ x: 0, y: 0, tx: 0, ty: 0 })

  // Manually expanded/collapsed node sets
  let expandedNodes  = $state(new Set())
  let collapsedNodes = $state(new Set())

  // Tooltip state
  let tooltipNode = $state(null)
  let tooltipX = $state(0)
  let tooltipY = $state(0)
  let tooltipVisible = $state(false)
  let tooltipTimer = $state(null)

  // Unlock toast state
  let unlockToast = $state(null)
  let unlockToastTimer = $state(null)

  // Pulse animation state
  let pulseMap = $state(new Map())

  // Root node accent cycling
  let rootAccentIndex = $state(0)
  const rootAccentColors = $derived.by(() => {
    const colors = []
    for (const cat of $categories) {
      if (layoutData.metaActiveMap.get(cat.id)) {
        colors.push(`var(--accent-${cat.id})`)
      }
    }
    return colors
  })
  $effect(() => {
    const colors = rootAccentColors
    if (colors.length <= 1) {
      rootAccentIndex = 0
      return
    }
    const interval = setInterval(() => {
      rootAccentIndex = (rootAccentIndex + 1) % colors.length
    }, 3000)
    return () => clearInterval(interval)
  })

  // Reset expansions when category or focus mode changes
  $effect(() => {
    $activeCategory   // subscribe
    focusMode
    expandedNodes  = new Set()
    collapsedNodes = new Set()
  })

  const isViewMode = $derived($viewMode !== null)

  // ── Build & layout tree ──
  const layoutData = $derived.by(() => {
    let root = buildVisualTree($categories, $activeCategory)
    if (focusMode) root = filterSkilled(root, $displaySkilled) ?? root

    // Progressive disclosure pruning (always applied, even in focus mode)
    root = pruneTree(root, $displaySkilled, expandedNodes, 0)

    // Compute meta-active status and descendant weights from pre-collapsed
    // tree so collapsed nodes still show correct glow and edge thickness
    const metaActiveMap = new Map()
    const descendantWeightMap = new Map()
    function markMetaActive(node) {
      const active = hasSkilledDescendant(node, $displaySkilled)
      if (node.isRoot || node.isCategory || node.isGroup) metaActiveMap.set(node.id, active)
      for (const child of (node.children || [])) markMetaActive(child)
    }
    function markWeight(node) {
      let count = $displaySkilled.has(node.id) ? 1 : 0
      for (const child of (node.children || [])) {
        count += markWeight(child)
      }
      descendantWeightMap.set(node.id, count)
      return count
    }
    markMetaActive(root)
    markWeight(root)

    // Apply manual collapses: for nodes that are auto-expanded (skilled/default-depth)
    // but the user wants to collapse, remove their children
    root = applyCollapsed(root, collapsedNodes)

    computeLayout(root)
    const { nodes, edges } = flatten(root)
    return { nodes, edges, root, metaActiveMap, descendantWeightMap }
  })

  /** Strip children from manually-collapsed nodes */
  function applyCollapsed(node, collapsed) {
    if (collapsed.has(node.id)) {
      const hidden = (node._hiddenCount || 0) + (node.children || []).reduce((a, c) => a + 1 + countAllChildren(c), 0)
      return { ...node, children: [], _hasHidden: true, _hiddenCount: hidden }
    }
    if (!node.children || node.children.length === 0) return node
    return { ...node, children: node.children.map(c => applyCollapsed(c, collapsed)) }
  }

  function countAllChildren(node) {
    const hidden = node._hiddenCount || 0
    const visible = (node.children || []).reduce((a, c) => a + 1 + countAllChildren(c), 0)
    return hidden + visible
  }

  // ── Center on first mount / category switch ──
  let centered = false
  $effect(() => {
    const { root } = layoutData
    if (!root || !svgEl) return
    if (!centered) {
      centered = true
      requestAnimationFrame(() => fitToScreen())
    }
  })
  // Re-center when category or focus mode changes
  $effect(() => {
    $activeCategory
    focusMode
    centered = false
  })

  // ── Ancestry map for search auto-expansion ──
  const parentMap = $derived.by(() => {
    const root = buildVisualTree($categories, 'all')
    const map = new Map()
    function walk(n) {
      if (n.children) {
        for (const c of n.children) {
          map.set(c.id, n.id)
          walk(c)
        }
      }
    }
    walk(root)
    return map
  })

  // ── Handle Search Focus ──
  $effect(() => {
    const targetId = $searchFocus
    if (!targetId) return

    // Defer store mutation to avoid synchronous effect cycle
    queueMicrotask(() => {
      searchFocus.set(null)

      const nextExpanded = new Set(expandedNodes)
      const nextCollapsed = new Set(collapsedNodes)
      let currentId = parentMap.get(targetId)
      while (currentId) {
        nextExpanded.add(currentId)
        nextCollapsed.delete(currentId)
        currentId = parentMap.get(currentId)
      }
      expandedNodes = nextExpanded
      collapsedNodes = nextCollapsed

      tick().then(() => {
        const targetNode = layoutData.nodes.find(n => n.id === targetId)
        if (targetNode && svgEl) {
          const rect = svgEl.getBoundingClientRect()
          const newScale = Math.max(scale, 1)
          scale = Math.min(MAX_SCALE, newScale)
          tx = rect.width / 2 - (targetNode.x + NODE_W / 2) * scale
          ty = rect.height / 2 - (targetNode.y + NODE_H / 2) * scale
        }
      })
    })
  })

  // ── Node state ──
  function nodeState(node) {
    if (node.isRoot || node.isCategory || node.isGroup) {
      if (layoutData.metaActiveMap.get(node.id)) return 'meta-active'
      return 'meta'
    }
    if ($displaySkilled.has(node.id)) return 'skilled'
    if (node.requires && !$displaySkilled.has(node.requires)) return 'locked'
    return 'unskilled'
  }

  function toggleNode(node) {
    if (isViewMode || node.isRoot) return

    const isMeta = node.isCategory || node.isGroup

    // Meta nodes (categories, groups): click to expand/collapse
    if (isMeta) {
      if (node._hasHidden) {
        expandNodeId(node.id)
      } else if (node.children && node.children.length > 0) {
        collapseNodeId(node.id)
      }
      return
    }

    // Skill nodes: toggle skilled
    const before = get(skilled)
    skilled.toggle(node.id)
    const after = get(skilled)
    const added = after.size - before.size
    if (added > 0) {
      triggerPulse(node.id)
    }
    if (added > 1) {
      showUnlockToast(added)
    }
  }

  function showUnlockToast(count) {
    if (unlockToastTimer) clearTimeout(unlockToastTimer)
    unlockToast = count
    unlockToastTimer = setTimeout(() => {
      unlockToast = null
    }, 2500)
  }

  function triggerPulse(nodeId) {
    const next = new Map(pulseMap)
    next.set(nodeId, Date.now())
    pulseMap = next
    setTimeout(() => {
      const after = new Map(pulseMap)
      after.delete(nodeId)
      pulseMap = after
    }, 600)
  }

  // ── Zoom buttons ──
  function zoomIn() {
    const newScale = Math.min(MAX_SCALE, scale * 1.3)
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      tx = cx - (cx - tx) * (newScale / scale)
      ty = cy - (cy - ty) * (newScale / scale)
    }
    scale = newScale
  }

  function zoomOut() {
    const newScale = Math.max(MIN_SCALE, scale / 1.3)
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2
      tx = cx - (cx - tx) * (newScale / scale)
      ty = cy - (cy - ty) * (newScale / scale)
    }
    scale = newScale
  }

  // ── Expand / collapse ──
  function expandNodeId(nodeId) {
    const next = new Set(expandedNodes)
    next.add(nodeId)
    expandedNodes = next
    if (collapsedNodes.has(nodeId)) {
      const c = new Set(collapsedNodes)
      c.delete(nodeId)
      collapsedNodes = c
    }
    centerOnNodeId(nodeId)
  }

  function collapseNodeId(nodeId) {
    const c = new Set(collapsedNodes)
    c.add(nodeId)
    collapsedNodes = c
    if (expandedNodes.has(nodeId)) {
      const ex = new Set(expandedNodes)
      ex.delete(nodeId)
      expandedNodes = ex
    }
    centerOnNodeId(nodeId)
  }

  function centerOnNodeId(nodeId) {
    tick().then(() => {
      const node = layoutData.nodes.find(n => n.id === nodeId)
      if (node && svgEl) {
        const rect = svgEl.getBoundingClientRect()
        tx = rect.width / 2 - (node.x + NODE_W / 2) * scale
        ty = rect.height / 2 - (node.y + NODE_H / 2) * scale
      }
    })
  }

  function expandNode(e, node) {
    e.stopPropagation()
    expandNodeId(node.id)
  }

  function collapseNode(e, node) {
    e.stopPropagation()
    collapseNodeId(node.id)
  }

  // Only meta nodes (categories, groups) can be manually collapsed
  function canCollapse(node) {
    return (node.children && node.children.length > 0) &&
      (node.isCategory || node.isGroup)
  }

  // ── Text Wrapping ──
  function wrapText(text, maxChars) {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''
    for (const word of words) {
      if ((currentLine + word).length > maxChars && currentLine.length > 0) {
        lines.push(currentLine.trim())
        currentLine = word + ' '
      } else {
        currentLine += word + ' '
      }
    }
    if (currentLine) lines.push(currentLine.trim())
    return lines
  }

  // ── Tooltip ──
  function showTooltip(node) {
    if (tooltipTimer) clearTimeout(tooltipTimer)
    tooltipNode = node
    updateTooltipPos(node)
    tooltipVisible = true
  }

  function hideTooltip() {
    tooltipTimer = setTimeout(() => {
      tooltipVisible = false
      tooltipNode = null
    }, 100)
  }

  function moveTooltip(node) {
    updateTooltipPos(node)
  }

  function updateTooltipPos(node) {
    if (!svgEl) return
    tooltipX = node.x * scale + tx + (NODE_W * scale) / 2
    tooltipY = node.y * scale + ty + NODE_H * scale + 10
  }

  function accentVar(node) {
    return node._categoryId ? `var(--accent-${node._categoryId})` : ''
  }

  // ── Zoom ──
  const MIN_SCALE = 0.1
  const MAX_SCALE = 3

  function onWheel(e) {
    e.preventDefault()
    const rect = svgEl.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 0.9
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
    tx = cursorX - (cursorX - tx) * (newScale / scale)
    ty = cursorY - (cursorY - ty) * (newScale / scale)
    scale = newScale
  }

  // ── Pan (mouse) ──
  function onMouseDown(e) {
    if (e.button !== 0) return
    isDragging = true
    dragStart = { x: e.clientX, y: e.clientY, tx, ty }
  }
  function onMouseMove(e) {
    if (!isDragging) return
    tx = dragStart.tx + (e.clientX - dragStart.x)
    ty = dragStart.ty + (e.clientY - dragStart.y)
  }
  function onMouseUp() { isDragging = false }

  // ── Background click (deselect) ──
  function onSvgClick(e) {
    if (isDragging) return
    if (e.target === svgEl || e.target.getAttribute('class')?.includes('canvas')) {
      hideTooltip()
    }
  }

  // ── Edge bezier ──
  function edgePath(from, to) {
    const x1 = from.x + NODE_W / 2
    const y1 = from.y + NODE_H
    const x2 = to.x   + NODE_W / 2
    const y2 = to.y
    const cy = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`
  }

  // ── Expand button path (small dashed edge from node bottom to button) ──
  const EXP_BTN_W = 72
  const EXP_BTN_H = 22
  const EXP_BTN_GAP = 20   // vertical gap below node

  function expandBtnX(node) { return node.x + NODE_W / 2 - EXP_BTN_W / 2 }
  function expandBtnY(node) { return node.y + NODE_H + EXP_BTN_GAP }

  // ── Fit to screen ──
  function fitToScreen() {
    if (!svgEl) return
    const { nodes } = layoutData
    if (!nodes.length) return
    const xs = nodes.map(n => n.x)
    const ys = nodes.map(n => n.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs) + NODE_W
    const minY = Math.min(...ys), maxY = Math.max(...ys) + NODE_H
    const treeW = maxX - minX || 1
    const treeH = maxY - minY || 1
    const rect = svgEl.getBoundingClientRect()
    const pad = 80
    const s = Math.min(
      (rect.width  - pad * 2) / treeW,
      (rect.height - pad * 2) / treeH,
      1.2
    )
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))
    tx = rect.width  / 2 - (minX + treeW / 2) * scale
    ty = pad - minY * scale
  }

  function collectMetaIds() {
    const ids = new Set()
    function walk(nodes) {
      for (const n of nodes || []) {
        if (n.isCategory || n.isGroup) ids.add(n.id)
        walk(n.children)
      }
    }
    for (const cat of $categories) {
      ids.add(cat.id)
      walk(cat.skills)
    }
    return ids
  }

  function collapseAll() {
    collapsedNodes = collectMetaIds()
    expandedNodes = new Set()
    requestAnimationFrame(() => fitToScreen())
  }

  function expandAll() {
    expandedNodes = collectMetaIds()
    collapsedNodes = new Set()
    requestAnimationFrame(() => fitToScreen())
  }
</script>

<!-- Toolbar -->
<div class="toolbar">
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    class:active={focusMode}
    onclick={() => { focusMode = !focusMode }}
    title="Show only active branches"
  >
    PASSIONS ONLY
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={zoomOut}
    title="Zoom out"
  >
    −
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={zoomIn}
    title="Zoom in"
  >
    +
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={fitToScreen}
    title="Fit tree to screen"
  >
    ⊡ FIT
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={collapseAll}
    title="Collapse all categories"
  >
    − ALL
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={expandAll}
    title="Expand all categories"
  >
    + ALL
  </button>
</div>

<!-- SVG canvas -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<svg
  class="canvas"
  class:dragging={isDragging}
  bind:this={svgEl}
  role="img"
  aria-label="Tree canvas"
  onwheel={onWheel}
  onmousedown={onMouseDown}
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  onmouseleave={onMouseUp}
  onclick={onSvgClick}
>
  <g transform="translate({tx},{ty}) scale({scale})">

    <!-- Edges -->
    {#each layoutData.edges as edge (edge.from.id + '-' + edge.to.id)}
      {@const isNodeActive = (n) =>
        n.isRoot ||
        $displaySkilled.has(n.id) ||
        ((n.isCategory || n.isGroup) && layoutData.metaActiveMap.get(n.id))
      }
      {@const bothSkilled = isNodeActive(edge.from) && isNodeActive(edge.to)}
      {@const weight = bothSkilled ? (layoutData.descendantWeightMap.get(edge.to.id) || 0) : 0}
      {@const ratio = bothSkilled && $displaySkilled.size > 0 ? weight / $displaySkilled.size : 0}
      {@const thickness = bothSkilled ? 1.5 + (ratio * 6.5) : 1.5}
      {@const edgeAccent = bothSkilled ? accentVar(edge.to) : ''}
      <path
        d={edgePath(edge.from, edge.to)}
        class="edge"
        class:edge-active={bothSkilled}
        style="stroke-width: {thickness}px; --edge-accent: {edgeAccent}"
        fill="none"
      />
    {/each}

    <!-- Nodes -->
    {#each layoutData.nodes as node (node.id)}
      {@const state = nodeState(node)}
      {@const isMeta = node.isRoot || node.isCategory || node.isGroup}
      {@const textLines = wrapText(node.name, isMeta ? 24 : 18)}
      {@const nodeAccent = node.isRoot && rootAccentColors.length > 0
        ? rootAccentColors[rootAccentIndex]
        : accentVar(node)}
      {@const showIcon = node.isCategory && categoryIcons[node.id]}
      {@const labelX = showIcon ? 30 : (isMeta ? NODE_W / 2 : 30)}
      {@const labelAnchor = showIcon ? 'start' : (isMeta ? 'middle' : 'start')}
      {@const textBlockCenter = NODE_H / 2 + 2}
      {@const lineHeight = 12}

      {@const isPulsing = pulseMap.has(node.id)}
      {@const isClickable = isMeta || state !== 'locked'}
      <g
        class="node-g"
        class:clickable={isClickable}
        transform="translate({node.x},{node.y})"
        style="--node-accent: {nodeAccent}"
      >
        <!-- Glow -->
        {#if state === 'skilled' || state === 'meta-active'}
          <rect x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8}
            rx="12" ry="12" class="node-glow" />
        {/if}

        <!-- Body -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <rect x={0} y={0} width={NODE_W} height={NODE_H} rx="8" ry="8"
          class="node-rect"
          class:node-skilled={state === 'skilled' || state === 'meta-active'}
          class:node-unskilled={state === 'unskilled'}
          class:node-locked={state === 'locked'}
          class:node-meta={state === 'meta'}
          class:node-root={node.isRoot}
          class:node-pulse={isPulsing}
          onclick={() => toggleNode(node)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleNode(node)}
          onmouseenter={() => showTooltip(node)}
          onmouseleave={() => hideTooltip()}
          onmousemove={() => moveTooltip(node)}
          role={isClickable ? 'button' : 'presentation'}
          aria-pressed={isClickable ? state === 'skilled' : undefined}
          tabindex={isClickable ? 0 : undefined}
        />

        <!-- Category icon -->
        {#if showIcon}
          <svg x={10} y={NODE_H / 2 - 7} width={14} height={14} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="cat-icon">
            {@html categoryIcons[node.id]}
          </svg>
        {/if}

        <!-- Status indicator -->
        {#if state === 'skilled'}
          <circle cx={16} cy={NODE_H / 2} r={6} class="check-bg" />
          <text x={16} y={NODE_H / 2 + 4} text-anchor="middle" class="check-mark">✓</text>
        {:else if !node.isRoot && !node.isCategory && !node.isGroup}
          <circle cx={16} cy={NODE_H / 2} r={5} class="dot-empty"
            class:dot-locked={state === 'locked'} />
        {/if}

        <!-- Collapse button (top-right corner, only for meta nodes) -->
        {#if canCollapse(node)}
          <g
            class="collapse-btn"
            onclick={(e) => collapseNode(e, node)}
            role="button"
            tabindex="0"
            aria-label="Collapse"
            onkeydown={(e) => e.key === 'Enter' && collapseNode(e, node)}
          >
            <rect x={NODE_W - 20} y={4} width={16} height={16} rx="4" class="collapse-bg" />
            <text x={NODE_W - 12} y={15} text-anchor="middle" class="collapse-icon">−</text>
          </g>
        {/if}

        <!-- Label -->
        <text
          x={labelX}
          text-anchor={labelAnchor}
          class="node-label"
          class:node-label-dim={state === 'locked'}
        >
          {#each textLines as line, i}
            {@const lineY = textBlockCenter + (i - (textLines.length - 1) / 2) * lineHeight}
            <tspan
              x={labelX}
              y={lineY}
            >{line}</tspan>
          {/each}
        </text>
      </g>

      <!-- Expand button (rendered outside node-g to avoid click conflict) -->
      {#if node._hasHidden && (node.isCategory || node.isGroup)}
        <!-- Dashed connector from node bottom to expand button -->
        <line
          x1={node.x + NODE_W / 2}
          y1={node.y + NODE_H}
          x2={node.x + NODE_W / 2}
          y2={expandBtnY(node)}
          class="expand-connector"
        />
        <g
          class="expand-btn-g"
          transform="translate({expandBtnX(node)},{expandBtnY(node)})"
          onclick={(e) => expandNode(e, node)}
          role="button"
          tabindex="0"
          aria-label="Expand {node._hiddenCount} hidden passions"
          onkeydown={(e) => e.key === 'Enter' && expandNode(e, node)}
        >
          <rect x={0} y={0} width={EXP_BTN_W} height={EXP_BTN_H} rx="11" class="expand-bg" />
          <text x={EXP_BTN_W / 2} y={EXP_BTN_H / 2 + 4} text-anchor="middle" class="expand-label">
            + {node._hiddenCount} MORE
          </text>
        </g>
      {/if}

    {/each}

  </g>
</svg>

<!-- Tooltip -->
{#if tooltipVisible && tooltipNode}
  <div class="tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
    <div class="tooltip-title">{tooltipNode.name}</div>
    {#if tooltipNode.description}
      <div class="tooltip-desc">{tooltipNode.description}</div>
    {/if}
    {#if nodeState(tooltipNode) === 'locked' && tooltipNode.requires}
      {@const reqNode = get(nodeIndex).get(tooltipNode.requires)}
      {#if reqNode}
        <div class="tooltip-locked">Requires {reqNode.name}</div>
      {/if}
    {/if}
  </div>
{/if}

{#if unlockToast}
  <div class="unlock-toast" role="status" aria-live="polite">
    ✦ Unlocked {unlockToast} passions
  </div>
{/if}

<style>
  /* ── Toolbar ── */
  .toolbar {
    position: fixed;
    top: calc(var(--nav-h) + 12px);
    right: var(--sp-xl);
    z-index: 10;
    display: flex;
    gap: var(--sp-sm);
  }
  .toolbar-btn { padding: 7px 14px; font-size: 10px; }
  .toolbar-btn.active { border-color: var(--text-primary); color: var(--text-primary); }

  /* ── Canvas ── */
  .canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: grab;
    background: var(--canvas);
    background-image: radial-gradient(circle, var(--canvas-grid) 1px, transparent 1px);
    background-size: 32px 32px;
    user-select: none;
    -webkit-user-select: none;
  }
  .canvas.dragging { cursor: grabbing; }

  /* ── Edges ── */
  :global(.edge) { stroke: var(--line-edge); stroke-width: 1.5; }
  :global(.edge-active) { stroke: var(--edge-accent, var(--line-active)); }

  /* ── Node rects ── */
  :global(.node-rect) { transition: fill 0.15s, stroke 0.15s; }
  :global(.node-meta)     { fill: var(--node-meta-bg); stroke: var(--node-meta-stroke); stroke-width: 1; }
  :global(.node-unskilled){ fill: var(--node-unskilled-bg); stroke: var(--node-unskilled-stroke); stroke-width: 1; }
  :global(.node-skilled)  { fill: var(--node-skilled-bg); stroke: var(--node-accent, var(--node-skilled-stroke)); stroke-width: 1.5; }
  :global(.node-locked)   { fill: var(--node-locked-bg); stroke: var(--node-locked-stroke); stroke-width: 1; opacity: 0.55; }
  :global(.node-glow) {
    fill: var(--node-glow-fill);
    stroke: var(--node-accent, var(--node-glow-stroke));
    stroke-width: 1;
    filter: blur(4px);
    transition: stroke 2.5s ease, filter 2.5s ease;
  }
  :global(.node-root.node-skilled) { stroke-width: 2; }
  :global(.node-root) .node-glow { filter: blur(6px); stroke-width: 1.5; }

  /* Category icon */
  :global(.cat-icon) { color: var(--node-accent, var(--text-mute)); pointer-events: none; }

  /* Hover */
  :global(.node-g.clickable) { cursor: pointer; }
  :global(.node-g.clickable:hover .node-unskilled) { fill: var(--node-unskilled-hover-bg); stroke: var(--node-unskilled-hover-stroke); }
  :global(.node-g.clickable:hover .node-skilled)   { fill: var(--node-skilled-hover-bg); }



  /* Unlock pulse */
  :global(.node-pulse) { animation: node-pulse 0.5s ease-out; }
  @keyframes node-pulse {
    0% { stroke-width: 1.5; filter: brightness(1); }
    30% { stroke-width: 3; filter: brightness(1.4); }
    100% { stroke-width: 1.5; filter: brightness(1); }
  }

  /* ── Labels ── */
  :global(.node-icon) { font-size: 14px; dominant-baseline: auto; }
  :global(.node-label) {
    fill: var(--label-normal);
    font-family: 'Inter', Arial, sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase;
    dominant-baseline: middle; pointer-events: none;
  }
  :global(.node-label-dim) { fill: var(--label-dim); }

  /* Check / dot */
  :global(.check-bg)  { fill: var(--check-bg); }
  :global(.check-mark){ fill: var(--check-mark); font-size: 9px; font-weight: 900; dominant-baseline: auto; pointer-events: none; }
  :global(.dot-empty) { fill: none; stroke: var(--dot-stroke); stroke-width: 1; }
  :global(.dot-locked){ stroke: var(--dot-locked-stroke); }

  /* ── Collapse button (−) ── */
  :global(.collapse-btn) { cursor: pointer; opacity: 0; transition: opacity 0.15s; }
  :global(.node-g:hover .collapse-btn) { opacity: 1; }
  :global(.collapse-bg) { fill: var(--collapse-bg); stroke: var(--collapse-stroke); stroke-width: 1; }
  :global(.collapse-icon) { fill: var(--collapse-icon); font-size: 13px; font-weight: 700; dominant-baseline: auto; pointer-events: none; }

  /* ── Expand button (+N MORE) ── */
  :global(.expand-connector) {
    stroke: var(--line-dashed);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  :global(.expand-btn-g) { cursor: pointer; }
  :global(.expand-bg) {
    fill: var(--expand-bg);
    stroke: var(--expand-stroke);
    stroke-width: 1;
    transition: fill 0.15s, stroke 0.15s;
  }
  :global(.expand-btn-g:hover .expand-bg) { fill: var(--expand-hover-bg); stroke: var(--expand-hover-stroke); }
  :global(.expand-label) {
    fill: var(--expand-label);
    font-family: 'Inter', Arial, sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    dominant-baseline: auto; pointer-events: none;
    transition: fill 0.15s;
  }
  :global(.expand-btn-g:hover .expand-label) { fill: var(--expand-label-hover); }

  /* ── Tooltip ── */
  .tooltip {
    position: fixed;
    z-index: 50;
    pointer-events: none;
    transform: translateX(-50%);
    background: var(--canvas-raised);
    border: 1px solid var(--border-bright);
    border-radius: var(--r-sm);
    padding: 10px 14px;
    max-width: 220px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    animation: tooltip-in 0.15s ease;
  }
  .tooltip-title {
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  .tooltip-desc {
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-mute);
  }
  .tooltip-locked {
    font-family: var(--font-body);
    font-size: 11px;
    line-height: 1.4;
    color: var(--text-dim);
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }
  @keyframes tooltip-in {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* ── Unlock toast ── */
  .unlock-toast {
    position: fixed;
    bottom: 72px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    background: var(--text-primary);
    color: var(--canvas);
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px 20px;
    border-radius: var(--r-pill);
    white-space: nowrap;
    animation: fade-in 0.2s ease;
  }
</style>
