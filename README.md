# Tree of Life

A visual skill tree tracker built with Svelte 5. Keep track of your real-life skills across various domains, unlock nodes as you progress, and share your tree with others.

## Features

- **Visual Canvas:** Interactive, pannable, and zoomable SVG tree view.
- **Progressive Disclosure:** See your current frontier of skills without being overwhelmed.
- **Theming:** Full support for both Light and Dark modes with an Apple-style toggle that respects system preferences.
- **YAML Driven:** Skill definitions are managed in a simple `src/data/skills.yaml` file, organized cleanly into categories.
- **Import / Export:** Generate and share base62 encoded strings of your current skill tree progress.
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

## Managing Skills

Edit `src/data/skills.yaml` to add, modify, or remove skills.
Note: Changing a skill's `id` will break existing share codes, but renaming the `name` is safe.
