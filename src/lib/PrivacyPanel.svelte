<script>
  /**
   * PrivacyPanel.svelte
   *
   * Modal displaying the privacy notice.
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
<div class="panel" role="dialog" aria-modal="true" aria-label="Privacy Notice">
  <div class="panel-header">
    <h2 class="panel-title">PRIVACY NOTICE</h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  <div class="panel-body">
    <p class="panel-lead">
      Tree of Life is built with privacy-by-default principles. Your data never leaves your device.
    </p>

    <div class="privacy-section">
      <h3 class="privacy-heading">No External Transmission</h3>
      <p class="privacy-text">
        This is a fully static client-side application. There is no backend server, no analytics, no tracking scripts, and no cookies.
      </p>
    </div>

    <div class="privacy-section">
      <h3 class="privacy-heading">Local Storage Only</h3>
      <p class="privacy-text">
        Your progress and preferences are stored only in your browser's <code>localStorage</code>:
      </p>
      <ul class="privacy-list">
        <li><code>tol_state</code> — your unlocked passions and tree version</li>
        <li><code>tol_theme</code> — light or dark mode preference</li>
        <li><code>tol_hint_dismissed</code> — whether the getting-started hint was dismissed</li>
      </ul>
    </div>

    <div class="privacy-section">
      <h3 class="privacy-heading">You Own Your Data</h3>
      <p class="privacy-text">
        You can export your tree anytime as a share code, or clear everything with the reset function. No account or personal information is ever required.
      </p>
    </div>

    <div class="privacy-section">
      <h3 class="privacy-heading">Hosting</h3>
      <p class="privacy-text">
        The site is hosted on GitHub Pages. GitHub processes technical connection data (IP address, browser type, request time) in server logs to deliver the page. This is necessary for hosting and cannot be disabled. See <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub's Privacy Statement</a> for details.
      </p>
    </div>

    <div class="privacy-section">
      <h3 class="privacy-heading">Deleting Your Data</h3>
      <p class="privacy-text">
        To remove all stored data, use your browser's site data clearing features or click the reset button in the application.
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

  .privacy-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .privacy-heading {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-primary);
    margin: 0;
  }

  .privacy-text {
    font-size: 13px;
    color: var(--text-mute);
    line-height: 1.6;
    margin: 0;
  }

  .privacy-text code {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    background: var(--canvas-inset);
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--text-primary);
  }

  .privacy-list {
    margin: 4px 0 0 0;
    padding-left: 20px;
    font-size: 13px;
    color: var(--text-mute);
    line-height: 1.8;
  }
  .privacy-list li::marker { color: var(--text-dim); }

  .panel-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--sp-sm);
    flex-shrink: 0;
    margin-top: var(--sp-xs);
  }
</style>
