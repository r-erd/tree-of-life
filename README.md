# Tree of Life

<p align="center">
  <img src="treeoflife.svg" alt="Tree of Life logo" width="220" />
</p>

A visual passion tree tracker built with Svelte 5. Keep track of your real-life passions across various domains, unlock nodes as you progress, and share your tree with others.

## Features

- **Visual Canvas:** Interactive, pannable, and zoomable SVG tree view.
- **Progressive Disclosure:** See your current frontier of passions without being overwhelmed. The tree automatically expands to reveal any unlocked passions.
- **Illuminated & Tapering Paths:** The structural categories and connection lines light up to trace a path directly from the root to your unlocked passions. Path thickness dynamically tapers based on the proportion of unlocked passions in that branch.
- **Dynamic Formatting:** Node text automatically wraps to ensure long passion names fit perfectly inside the SVG layout.
- **Theming:** Full support for both Light and Dark modes with an Apple-style toggle that respects system preferences.
- **YAML Driven:** Passion definitions are split across individual category files in `src/data/categories/*.yaml` for easy maintenance, loaded at build time.
- **Import / Export:** Generate and share base62 encoded strings of your current passion tree progress.
- **Local Storage:** Progress and theme preferences are automatically saved locally.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Managing Passions

Passions are organized into category files under `src/data/categories/` (e.g. `body.yaml`, `mind.yaml`).
Edit the relevant category file to add, modify, or remove passions.

Note: Changing a passion's `id` will break existing share codes, but renaming the `name` is safe.
When adding or removing nodes, increment the tree version in `src/lib/store.js`.
