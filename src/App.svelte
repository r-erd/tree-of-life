<script>
  import "./app.css";
  const CATEGORY_ORDER = [
    'body', 'mind', 'creative', 'craft', 'explorer', 'collector',
    'social', 'performing', 'games', 'nature', 'animals', 'home',
    'wheel_wave', 'flow', 'digital_craft', 'finance', 'precision', 'spiritual'
  ]
  const categoryModules = import.meta.glob('./data/categories/*.yaml', { eager: true })
  const rawCategories = Object.values(categoryModules).map(m => m.default)
  const skillsData = {
    version: TREE_VERSION,
    categories: rawCategories.sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id))
  }
  import {
    categories,
    buildNodeIndex,
    skilled,
    stats,
    viewMode,
    TREE_VERSION,
  } from "./lib/store.js";
  import Header from "./lib/Header.svelte";
  import CanvasView from "./lib/CanvasView.svelte";
  import SharePanel from "./lib/SharePanel.svelte";
  import PrivacyPanel from "./lib/PrivacyPanel.svelte";

  let shareMode = $state(null); // null | 'export' | 'import'
  let showPrivacy = $state(false);
  let showResetConfirm = $state(false);

  // Empty-state hint
  let hintDismissed = $state(false);
  $effect(() => {
    hintDismissed = localStorage.getItem('tol_hint_dismissed') === '1'
  })
  function dismissHint() {
    hintDismissed = true
    localStorage.setItem('tol_hint_dismissed', '1')
  }

  categories.set(skillsData.categories);
  buildNodeIndex(skillsData.categories);

  function openShare() {
    shareMode = "export";
  }
  function openImport() {
    shareMode = "import";
  }
  function closePanel() {
    shareMode = null;
  }
  function openPrivacy() {
    showPrivacy = true;
  }
  function closePrivacy() {
    showPrivacy = false;
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

  <Header onShare={openShare} onImport={openImport} />
  <CanvasView />

  <!-- Empty-state hint -->
  {#if $skilled.size === 0 && $viewMode === null && !hintDismissed}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="hint-overlay" onclick={dismissHint} tabindex="-1" role="button" aria-label="Dismiss getting started hint">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="hint-panel" onclick={(e) => e.stopPropagation()} role="presentation">
        <p class="hint-title">START YOUR TREE</p>
        <div class="hint-steps">
          <p><span class="hint-num">1</span> Search for a passion</p>
          <p><span class="hint-num">2</span> Click a node that speaks to you</p>
          <p><span class="hint-num">3</span> Watch your tree grow</p>
        </div>
        <button class="btn-ghost btn-sm" onclick={dismissHint}>GOT IT</button>
      </div>
    </div>
  {/if}

  <div class="app-footer">
    v{TREE_VERSION} · {$stats.total} nodes ·
    <button class="privacy-link" onclick={openPrivacy}>Privacy</button>
  </div>

  <!-- Share / Import modal -->
{#if shareMode}
  <SharePanel mode={shareMode} onClose={closePanel} />
{/if}

  <!-- Privacy notice modal -->
{#if showPrivacy}
  <PrivacyPanel onClose={closePrivacy} />
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

  .privacy-link {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    cursor: pointer;
    pointer-events: auto;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }
  .privacy-link:hover {
    color: var(--text-primary);
  }

  /* ── Empty-state hint ── */
  .hint-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in 0.3s ease;
    cursor: pointer;
  }
  .hint-panel {
    background: var(--canvas-raised);
    border: 1px solid var(--border-bright);
    border-radius: var(--r-sm);
    padding: 32px 40px;
    text-align: center;
    cursor: default;
    max-width: 320px;
  }
  .hint-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  .hint-steps {
    text-align: left;
    margin-bottom: 24px;
  }
  .hint-steps p {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--text-mute);
    line-height: 2;
    margin: 0;
  }
  .hint-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid var(--border-bright);
    font-family: var(--font-display);
    font-size: 10px;
    font-weight: 700;
    color: var(--text-dim);
    margin-right: 10px;
  }
</style>
