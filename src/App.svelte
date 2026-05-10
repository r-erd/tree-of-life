<script>
  import "./app.css";
  import skillsData from "./data/passions.yaml";
  import {
    categories,
    buildNodeIndex,
    skilled,
    stats,
    TREE_VERSION,
  } from "./lib/store.js";
  import Header from "./lib/Header.svelte";
  import CanvasView from "./lib/CanvasView.svelte";
  import SharePanel from "./lib/SharePanel.svelte";

  // Skill data is a plain JS object (parsed from YAML at build time by Vite plugin)
  let loading = $state(false);
  let error = $state(null);
  let shareMode = $state(null); // null | 'export' | 'import'
  let showResetConfirm = $state(false);

  try {
    categories.set(skillsData.categories);
    buildNodeIndex(skillsData.categories);
  } catch (e) {
    error = e.message;
  }

  function openShare() {
    shareMode = "export";
  }
  function openImport() {
    shareMode = "import";
  }
  function closePanel() {
    shareMode = null;
  }

  function handleReset() {
    if (showResetConfirm) {
      skilled.reset();
      showResetConfirm = false;
    } else {
      showResetConfirm = true;
      setTimeout(() => (showResetConfirm = false), 3000);
    }
  }
</script>

{#if loading}
  <div class="loading-screen">
    <div class="loader" aria-label="Loading passion tree…"></div>
    <p class="label-caps" style="margin-top: 24px; color: var(--text-dim)">
      LOADING PASSION TREE
    </p>
  </div>
{:else if error}
  <div class="loading-screen">
    <p class="label-caps" style="color: var(--color-error)">
      ERROR LOADING PASSIONS
    </p>
    <p style="color: var(--text-mute); font-size: 13px; margin-top: 8px">
      {error}
    </p>
  </div>
{:else}
  <Header onShare={openShare} onImport={openImport} />
  <CanvasView />

  <div class="app-footer">
    v{TREE_VERSION} · {$stats.total} passions
  </div>
{/if}

<!-- Share / Import modal -->
{#if shareMode}
  <SharePanel mode={shareMode} onClose={closePanel} />
{/if}

<!-- Reset confirm overlay notice -->
{#if showResetConfirm}
  <div class="reset-toast" role="status" aria-live="polite">
    CLICK RESET AGAIN TO CONFIRM — THIS CLEARS ALL PROGRESS
  </div>
{/if}

<style>
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--canvas);
  }

  .loader {
    width: 32px;
    height: 32px;
    border: 2px solid var(--border);
    border-top-color: var(--text-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .reset-toast {
    position: fixed;
    bottom: 72px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    background: var(--color-danger);
    color: var(--color-danger-text);
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
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .app-footer {
    position: fixed;
    bottom: var(--sp-sm);
    right: var(--sp-md);
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    pointer-events: none;
    z-index: 100;
  }
</style>
