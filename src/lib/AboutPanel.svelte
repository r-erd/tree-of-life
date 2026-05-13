<script>
  /**
   * AboutPanel.svelte
   *
   * Modal displaying the about page.
   */
  let { onClose } = $props()

  function onKeydown(e) {
    if (e.key === 'Escape') onClose()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<div class="backdrop" onclick={onClose} aria-hidden="true"></div>

<!-- Panel -->
<div class="panel" role="dialog" aria-modal="true" aria-label="About Tree of Life">
  <div class="panel-header">
    <h2 class="panel-title">ABOUT</h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  <div class="panel-body">
    <p class="panel-lead">
      Tree of Life is an interactive map of everything that makes you come alive.
    </p>

    <div class="about-section">
      <h3 class="about-heading">How it works</h3>
      <p class="about-text">
        Explore the branches. Click any node that speaks to you. Your tree grows and lights up as you go — not as a score, but as a reflection of who you are and who you're becoming.
      </p>
    </div>

    <div class="about-section">
      <h3 class="about-heading">Philosophy</h3>
      <p class="about-text">
        This is not a skill tree. Not a todo list. Not a competition. There are no progress bars, no percentages, no gamification. Just a quiet space to notice what matters to you.
      </p>
    </div>

    <div class="about-section">
      <h3 class="about-heading">Privacy</h3>
      <p class="about-text">
        Everything stays in your browser. No server, no tracking, no cookies, no analytics. Your data is yours alone.
      </p>
    </div>

    <div class="about-section">
      <h3 class="about-heading">Open Source</h3>
      <p class="about-text">
        Built with Svelte 5 and licensed under GPL 3.0. Source code and contribution guidelines are on <a href="https://github.com/r-erd/tree-of-life" target="_blank" rel="noopener noreferrer">GitHub</a>.
      </p>
    </div>
  </div>

  <div class="panel-actions">
    <button class="btn-ghost" onclick={onClose}>CLOSE</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--modal-overlay);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(4px);
  }

  .panel {
    position: fixed;
    z-index: 201;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    background: var(--canvas-soft);
    border: 1px solid var(--border-bright);
    border-radius: var(--r-sm);
    padding: var(--sp-xl);
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    animation: slide-in 0.2s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }

  @keyframes slide-in {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .panel-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-mute);
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color 0.15s;
  }
  .close-btn:hover { color: var(--text-primary); }

  .panel-body {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    padding-right: 4px;
  }

  .panel-lead {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.5;
    margin: 0;
  }

  .about-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .about-heading {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-primary);
    margin: 0;
  }

  .about-text {
    font-size: 13px;
    color: var(--text-mute);
    line-height: 1.6;
    margin: 0;
  }

  .about-text a {
    color: var(--text-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .about-text a:hover {
    color: var(--text-mute);
  }

  .panel-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--sp-sm);
    flex-shrink: 0;
    margin-top: var(--sp-xs);
  }
</style>
