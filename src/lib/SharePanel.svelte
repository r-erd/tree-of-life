<script>
  /**
   * SharePanel.svelte
   *
   * Modal for EXPORT and IMPORT of share codes.
   * mode: 'export' | 'import'
   */
  import { generateCode, importCode, viewMode, skilled } from '../lib/store.js'

  let { mode = 'export', onClose } = $props()

  // Export state
  const code = $derived(mode === 'export' ? generateCode() : '')
  let copied = $state(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      copied = true
      setTimeout(() => copied = false, 2000)
    } catch {
      // fallback: select the text
      codeEl?.select()
    }
  }

  // Import state
  let importInput = $state('')
  let importError = $state('')
  let codeEl = $state(null)

  function handleImport() {
    importError = ''
    const result = importCode(importInput.trim())
    if (result.error) {
      importError = result.error
      return
    }
    // Load into view mode (editable)
    skilled.importSkilled(result.skilled)
    viewMode.set(null)
    onClose()
  }

  // Close on Escape
  function onKeydown(e) {
    if (e.key === 'Escape') onClose()
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<div class="backdrop" onclick={onClose} aria-hidden="true"></div>

<!-- Panel -->
<div class="panel" role="dialog" aria-modal="true" aria-label={mode === 'export' ? 'Export share code' : 'Import share code'}>
  <div class="panel-header">
    <h2 class="panel-title">
      {mode === 'export' ? 'EXPORT YOUR TREE' : 'IMPORT A TREE'}
    </h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">✕</button>
  </div>

  {#if mode === 'export'}
    <p class="panel-desc">
      Share this code with anyone. They can import it to view your passion tree.
    </p>

    <div class="code-block">
      <code bind:this={codeEl} class="code-text" id="share-code">{code}</code>
      <button
        class="btn-ghost copy-btn"
        class:copied
        onclick={copyCode}
        aria-label="Copy code"
      >
        {copied ? 'COPIED ✓' : 'COPY'}
      </button>
    </div>

    <p class="label-caps code-hint">
      Code encodes {code.split('.')[1]?.length ?? 0} chars · version {code.split('.')[0]}
    </p>

  {:else}
    <p class="panel-desc">
      Paste a share code to load that tree. It will replace your current tree.
    </p>

    <textarea
      class="import-input"
      bind:value={importInput}
      placeholder="V1.xK9mRt3qW7pLn2..."
      rows="3"
      spellcheck="false"
      aria-label="Share code input"
    ></textarea>

    {#if importError}
      <p class="error-msg">{importError}</p>
    {/if}

    <div class="panel-actions">
      <button class="btn-ghost btn-ghost-dim" onclick={onClose}>CANCEL</button>
      <button
        class="btn-ghost"
        onclick={handleImport}
        disabled={!importInput.trim()}
      >
        LOAD TREE
      </button>
    </div>
  {/if}
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
    background: var(--canvas-soft);
    border: 1px solid var(--border-bright);
    border-radius: var(--r-sm);
    padding: var(--sp-xl);
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    animation: slide-in 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  @keyframes slide-in {
    from { opacity: 0; transform: translate(-50%, -48%); }
    to   { opacity: 1; transform: translate(-50%, -50%); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .panel-desc {
    font-size: 13px;
    color: var(--text-mute);
    line-height: 1.5;
  }

  /* Export code display */
  .code-block {
    display: flex;
    align-items: center;
    gap: var(--sp-sm);
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-xs);
    padding: var(--sp-md);
  }

  .code-text {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: var(--text-primary);
    letter-spacing: 0.05em;
    word-break: break-all;
    background: none;
    border: none;
    outline: none;
    user-select: all;
  }

  .copy-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    font-size: 10px;
  }
  .copy-btn.copied {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .code-hint {
    font-size: 10px;
    color: var(--text-dim);
  }

  /* Import textarea */
  .import-input {
    width: 100%;
    background: var(--panel-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-xs);
    color: var(--text-primary);
    font-family: 'Courier New', monospace;
    font-size: 14px;
    padding: var(--sp-md);
    resize: vertical;
    transition: border-color 0.15s;
  }
  .import-input:focus {
    outline: none;
    border-color: var(--text-primary);
  }
  .import-input::placeholder { color: var(--text-dim); }

  .error-msg {
    color: var(--color-error);
    font-size: 13px;
    letter-spacing: 0.04em;
  }

  .panel-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--sp-sm);
    margin-top: var(--sp-xs);
  }
</style>
