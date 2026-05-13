<script>
  import { viewMode, skilled, nodeIndex, searchFocus } from '../lib/store.js'

  let { onShare, onImport, onAbout } = $props()

  let theme = $state('dark')

  $effect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem('tol_theme')
    if (stored) {
      theme = stored
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light'
    }
    document.documentElement.setAttribute('data-theme', theme)
  })

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('tol_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  let query = $state('')
  let searchInput = $state(null)

  const suggestions = $derived.by(() => {
    if (query.trim() === '') return []
    const q = query.toLowerCase()
    const results = []
    for (const [, node] of $nodeIndex.entries()) {
      if (node.name.toLowerCase().includes(q)) {
        results.push(node)
      }
    }
    results.sort((a, b) => a.name.length - b.name.length)
    return results.slice(0, 8)
  })

  let selectedIndex = $state(-1)
  $effect(() => {
    selectedIndex = suggestions.length > 0 ? 0 : -1
  })

  function handleSearchKeydown(e) {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = (selectedIndex + 1) % suggestions.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectSuggestion(suggestions[selectedIndex])
    } else if (e.key === 'Escape') {
      query = ''
      searchInput?.blur()
    }
  }

  function selectSuggestion(node) {
    if (!node) return
    searchFocus.set(node.id)
    query = ''
    searchInput?.blur()
  }
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="." class="wordmark" aria-label="Tree of Life">
      <img src="./favicon.svg" alt="" class="logo-img" aria-hidden="true" />
      TREE<span class="wordmark-sep">OF</span>LIFE
    </a>

    <div class="search-container">
      <input 
        bind:this={searchInput}
        type="text" 
        class="search-input" 
        placeholder="Search passions..." 
        bind:value={query}
        onkeydown={handleSearchKeydown}
      />
      {#if suggestions.length > 0}
        <div class="suggestions-dropdown">
          {#each suggestions as s, i (s.id)}
            <button
              type="button"
              class="suggestion-item"
              class:selected={i === selectedIndex}
              onclick={() => selectSuggestion(s)}
            >
              <span class="suggestion-name">{s.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="spacer"></div>

    <div class="nav-actions">
      {#if $viewMode !== null}
        <span class="view-badge">VIEWING IMPORT</span>
        <button class="btn-ghost btn-ghost-dim" onclick={() => viewMode.set(null)}>MY TREE</button>
      {/if}
      <label class="apple-toggle" title="Toggle Theme" aria-label="Toggle Light Mode">
        <span class="theme-icon" aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
        <input type="checkbox" class="sr-only" checked={theme === 'light'} onchange={toggleTheme}>
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
      </label>
      <button class="btn-ghost btn-ghost-dim btn-sm" onclick={onAbout}>ABOUT</button>
      <button class="btn-ghost btn-ghost-dim btn-sm" onclick={onImport}>IMPORT</button>
      <button class="btn-ghost btn-sm" onclick={onShare}>EXPORT</button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    height: var(--nav-h);
    background: var(--nav-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 var(--sp-xl);
    max-width: 1600px;
    margin: 0 auto;
    gap: var(--sp-lg);
  }

  .wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    text-decoration: none;
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-primary);
    line-height: 1;
  }
  .wordmark-sep { color: var(--text-dim); margin: 0 2px; }
  .logo-img {
    height: 28px;
    width: auto;
    display: block;
    flex-shrink: 0;
  }

  /* ── Search Bar ── */
  .search-container {
    position: relative;
    flex: 1;
    max-width: 320px;
    margin-left: var(--sp-lg);
  }
  .search-input {
    width: 100%;
    background: var(--canvas-inset);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: var(--r-pill);
    font-family: var(--font-ui);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--text-primary); }
  .search-input::placeholder { color: var(--text-dim); }

  .suggestions-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    overflow: hidden;
    z-index: 200;
  }
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 12px;
    font-family: var(--font-ui);
    color: var(--text-primary);
    background: transparent;
    border: none;
    text-align: left;
    border-radius: 0;
  }
  .suggestion-item:hover, .suggestion-item.selected {
    background: var(--canvas-inset);
  }
  .suggestion-name { font-weight: 500; }

  .spacer { flex: 1; }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    flex-shrink: 0;
  }

  .view-badge {
    font-family: var(--font-display);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--badge-view);
    border: 1px solid var(--badge-view-border);
    padding: 3px 8px;
    border-radius: var(--r-pill);
  }

  /* Apple-style Toggle */
  .apple-toggle {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    margin-right: var(--sp-sm);
  }
  .theme-icon {
    font-size: 14px;
    margin-right: 8px;
    user-select: none;
    line-height: 1;
  }
  .toggle-track {
    position: relative;
    width: 40px;
    height: 22px;
    background: var(--border-bright);
    border-radius: 11px;
    transition: background 0.2s;
  }
  input:checked + .toggle-track {
    background: var(--text-primary);
  }
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--canvas);
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  input:checked + .toggle-track .toggle-thumb {
    transform: translateX(18px);
  }
</style>
