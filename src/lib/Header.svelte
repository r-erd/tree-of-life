<script>
  import { viewMode, skilled } from '../lib/store.js'

  let { onShare, onImport } = $props()

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
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="." class="wordmark" aria-label="Tree of Life">
      TREE<span class="wordmark-sep">OF</span>LIFE
    </a>

    <div class="spacer"></div>

    <div class="nav-actions">
      {#if $viewMode !== null}
        <span class="view-badge">VIEWING IMPORT</span>
        <button class="btn-ghost btn-ghost-dim" onclick={() => viewMode.set(null)}>MY TREE</button>
      {/if}
      <label class="apple-toggle" title="Toggle Theme" aria-label="Toggle Light Mode">
        <input type="checkbox" class="sr-only" checked={theme === 'light'} onchange={toggleTheme}>
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
      </label>
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
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-primary);
    text-decoration: none;
    flex-shrink: 0;
    line-height: 1;
  }
  .wordmark-sep { color: var(--text-dim); margin: 0 2px; }

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
