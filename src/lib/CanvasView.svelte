<script>
  /**
   * CanvasView.svelte — Zoomable/pannable SVG skill tree canvas.
   * Progressive disclosure: shows one level past the skilled frontier by default.
   * Users can expand/collapse individual branches.
   */
  import { categories, activeCategory, displaySkilled, skilled, viewMode } from '../lib/store.js'
  import {
    buildVisualTree, computeLayout, flatten,
    filterSkilled, pruneTree, NODE_W, NODE_H, LEVEL_H, hasSkilledDescendant, countSkilledDescendants
  } from '../lib/layout.js'

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

    // Apply manual collapses: for nodes that are auto-expanded (skilled/default-depth)
    // but the user wants to collapse, remove their children
    root = applyCollapsed(root, collapsedNodes)

    computeLayout(root)
    const { nodes, edges } = flatten(root)
    return { nodes, edges, root }
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
      fitToScreen()
    }
  })
  // Re-center when category changes
  $effect(() => {
    $activeCategory
    centered = false
  })

  // ── Node state ──
  function nodeState(node) {
    if (node.isRoot || node.isCategory || node.isGroup) {
      if (hasSkilledDescendant(node, $displaySkilled)) return 'meta-active'
      return 'meta'
    }
    if ($displaySkilled.has(node.id)) return 'skilled'
    if (node.requires && !$displaySkilled.has(node.requires)) return 'locked'
    return 'unskilled'
  }

  function toggleNode(node) {
    if (isViewMode || node.isRoot || node.isCategory || node.isGroup) return
    if (nodeState(node) === 'locked') return
    skilled.toggle(node.id)
  }

  // ── Expand / collapse ──
  function expandNode(e, node) {
    e.stopPropagation()
    const next = new Set(expandedNodes)
    next.add(node.id)
    expandedNodes = next
    // If it was manually collapsed, un-collapse it
    if (collapsedNodes.has(node.id)) {
      const c = new Set(collapsedNodes)
      c.delete(node.id)
      collapsedNodes = c
    }
  }

  function collapseNode(e, node) {
    e.stopPropagation()
    const c = new Set(collapsedNodes)
    c.add(node.id)
    collapsedNodes = c
    // Remove from expanded too
    if (expandedNodes.has(node.id)) {
      const ex = new Set(expandedNodes)
      ex.delete(node.id)
      expandedNodes = ex
    }
  }

  // A node can be collapsed by the user if it has visible children right now
  function canCollapse(node) {
    return (node.children && node.children.length > 0) &&
      !node.isRoot
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

  // ── Pan (touch) ──
  let lastTouch = null
  function onTouchStart(e) {
    if (e.touches.length === 1)
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty }
  }
  function onTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 1 && lastTouch) {
      tx = lastTouch.tx + (e.touches[0].clientX - lastTouch.x)
      ty = lastTouch.ty + (e.touches[0].clientY - lastTouch.y)
    }
  }
  function onTouchEnd() { lastTouch = null }

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
</script>

<!-- Toolbar -->
<div class="toolbar">
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    class:active={focusMode}
    onclick={() => { focusMode = !focusMode }}
    title="Show only active branches"
  >
    {focusMode ? '✦ PASSIONS ONLY' : '◇ ALL PASSIONS'}
  </button>
  <button
    class="btn-ghost btn-ghost-dim toolbar-btn"
    onclick={fitToScreen}
    title="Fit tree to screen"
  >
    ⊡ FIT
  </button>
</div>

<!-- SVG canvas -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<svg
  class="canvas"
  class:dragging={isDragging}
  bind:this={svgEl}
  role="img"
  aria-label="Passion tree canvas"
  onwheel={onWheel}
  onmousedown={onMouseDown}
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  onmouseleave={onMouseUp}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
>
  <g transform="translate({tx},{ty}) scale({scale})">

    <!-- Edges -->
    {#each layoutData.edges as edge (edge.from.id + '-' + edge.to.id)}
      {@const isNodeActive = (n) =>
        n.isRoot ||
        $displaySkilled.has(n.id) ||
        ((n.isCategory || n.isGroup) && hasSkilledDescendant(n, $displaySkilled))
      }
      {@const bothSkilled = isNodeActive(edge.from) && isNodeActive(edge.to)}
      {@const weight = bothSkilled ? countSkilledDescendants(edge.to, $displaySkilled) : 0}
      {@const ratio = bothSkilled && $displaySkilled.size > 0 ? weight / $displaySkilled.size : 0}
      {@const thickness = bothSkilled ? 1.5 + (ratio * 6.5) : 1.5}
      <path
        d={edgePath(edge.from, edge.to)}
        class="edge"
        class:edge-active={bothSkilled}
        style="stroke-width: {thickness}px"
        fill="none"
      />
    {/each}

    <!-- Nodes -->
    {#each layoutData.nodes as node (node.id)}
      {@const state = nodeState(node)}
      {@const isClickable = !node.isRoot && !node.isCategory && !node.isGroup && state !== 'locked'}
      {@const hasVisibleChildren = node.children && node.children.length > 0}
      {@const textLines = wrapText(node.name, node.isRoot || node.isCategory || node.isGroup ? 24 : 18)}

      <g
        class="node-g"
        class:clickable={isClickable}
        transform="translate({node.x},{node.y})"
        onclick={() => toggleNode(node)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleNode(node)}
        role={node.isRoot || node.isCategory || node.isGroup ? 'presentation' : 'button'}
        aria-pressed={isClickable ? state === 'skilled' : undefined}
        tabindex={isClickable ? 0 : undefined}
      >
        <!-- Glow -->
        {#if state === 'skilled' || state === 'meta-active'}
          <rect x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8}
            rx="12" ry="12" class="node-glow" />
        {/if}

        <!-- Body -->
        <rect x={0} y={0} width={NODE_W} height={NODE_H} rx="8" ry="8"
          class="node-rect"
          class:node-skilled={state === 'skilled' || state === 'meta-active'}
          class:node-unskilled={state === 'unskilled'}
          class:node-locked={state === 'locked'}
          class:node-meta={state === 'meta'}
        />

        <!-- Status indicator -->
        {#if state === 'skilled'}
          <circle cx={16} cy={NODE_H / 2} r={6} class="check-bg" />
          <text x={16} y={NODE_H / 2 + 4} text-anchor="middle" class="check-mark">✓</text>
        {:else if !node.isRoot && !node.isCategory && !node.isGroup}
          <circle cx={16} cy={NODE_H / 2} r={5} class="dot-empty"
            class:dot-locked={state === 'locked'} />
        {/if}

        <!-- Collapse button (top-right corner, only for expanded nodes with children) -->
        {#if canCollapse(node) && !node.isRoot}
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
          x={node.isRoot || node.isCategory || node.isGroup ? NODE_W / 2 : 30}
          y={NODE_H / 2}
          text-anchor={node.isRoot || node.isCategory || node.isGroup ? 'middle' : 'start'}
          class="node-label"
          class:node-label-dim={state === 'locked'}
        >
          {#each textLines as line, i}
            <tspan
              x={node.isRoot || node.isCategory || node.isGroup ? NODE_W / 2 : 30}
              dy={i === 0 ? `-${(textLines.length - 1) * 6}px` : '12px'}
            >{line}</tspan>
          {/each}
        </text>
      </g>

      <!-- Expand button (rendered outside node-g to avoid click conflict) -->
      {#if node._hasHidden}
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
  :global(.edge-active) { stroke: var(--line-active); }

  /* ── Node rects ── */
  :global(.node-rect) { transition: fill 0.15s, stroke 0.15s; }
  :global(.node-meta)     { fill: var(--node-meta-bg); stroke: var(--node-meta-stroke); stroke-width: 1; }
  :global(.node-unskilled){ fill: var(--node-unskilled-bg); stroke: var(--node-unskilled-stroke); stroke-width: 1; }
  :global(.node-skilled)  { fill: var(--node-skilled-bg); stroke: var(--node-skilled-stroke); stroke-width: 1.5; }
  :global(.node-locked)   { fill: var(--node-locked-bg); stroke: var(--node-locked-stroke); stroke-width: 1; opacity: 0.55; }
  :global(.node-glow) {
    fill: var(--node-glow-fill);
    stroke: var(--node-glow-stroke);
    stroke-width: 1;
    filter: blur(4px);
  }

  /* Hover */
  :global(.node-g.clickable) { cursor: pointer; }
  :global(.node-g.clickable:hover .node-unskilled) { fill: var(--node-unskilled-hover-bg); stroke: var(--node-unskilled-hover-stroke); }
  :global(.node-g.clickable:hover .node-skilled)   { fill: var(--node-skilled-hover-bg); }

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
</style>
