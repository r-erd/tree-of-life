# Tree of Life

<p align="center">
  <img src="treeoflife.svg" alt="Tree of Life logo" width="220" />
</p>

A visual tree built with Svelte 5. Explore what makes you come alive across different domains of life, mark the paths you've walked, and share your tree with others.

## Features

- **Visual Canvas:** Interactive, pannable, and zoomable SVG tree view.
- **Progressive Disclosure:** See your current frontier without being overwhelmed. The tree automatically expands to reveal any unlocked passions.
- **Illuminated & Tapering Paths:** Structural categories and connection lines light up to trace a path from the root to your unlocked nodes. Path thickness dynamically tapers based on the proportion of unlocked nodes in each branch.
- **Dynamic Formatting:** Node text automatically wraps to ensure long names fit perfectly inside the SVG layout.
- **Theming:** Full support for both Light and Dark modes with an Apple-style toggle that respects system preferences.
- **YAML Driven:** Definitions are split across individual category files in `src/data/categories/*.yaml` for easy maintenance, loaded at build time.
- **Import / Export:** Generate and share base62 encoded strings of your current tree progress.
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

## Content Structure

The tree is organized in three levels:

| Level | What it represents | Example |
|-------|-------------------|---------|
| **Category** | A broad domain of life | `BODY`, `MIND`, `CREATIVE` |
| **Skill / Group** | A specific pursuit or interest within that domain | `RUNNING`, `DRAWING`, `CHESS` |
| **Milestone** | A concrete, measurable step along that path | `50 HOURS`, `5K RACE`, `EXHIBITION` |

Categories and skills form the **structural branches** of the tree. Milestones are the **leaves** you unlock.

### The `requires` Chain

Milestones can declare `requires: <previous_milestone_id>` to form a prerequisite chain. This creates the vertical progression path within each skill branch. Not every milestone needs a prerequisite — parallel paths within the same skill are allowed.

### Content Guidelines

When adding new categories or nodes, follow these principles:

- **Categories** should be broad, universal domains of human experience. They are the top-level organizing principle. Aim for 15–25 categories total.
- **Skills** should be specific enough that a person could say "I do this" or "I want to do this." They are the passions, crafts, and pursuits themselves.
- **Milestones** should be **concrete and verifiable** — a number of hours, a specific event, a tangible output. Avoid vague milestones like "getting good at it." Prefer time-based (`50 HOURS`, `1,000 HOURS`), event-based (`FIRST EXHIBITION`, `MARATHON`), or output-based (`10 SONGS`, `NOVEL FINISHED`) milestones.
- **Keep milestone names short** (ideally ≤ 18 characters) so they fit inside the node layout. Use abbreviations where natural (`1K HOURS` instead of `1,000 HOURS`).
- **IDs must be globally unique** across the entire tree. Use the pattern `<category>_<skill>_<milestone>` to avoid collisions. Changing an ID breaks all existing share codes.
- **Names can be renamed freely** — they are display-only and do not affect share codes.
- **Each category needs an accent color** in `src/app.css` (`--accent-<category_id>`) for both dark and light themes.

When adding or removing nodes, increment `TREE_VERSION` in `src/lib/store.js` to invalidate old share codes.

## License & Compliance

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0).
See [`LICENSE`](LICENSE) for the full text.

For dependency audit, privacy policy, and attribution details, see [`COMPLIANCE.md`](COMPLIANCE.md).

### Privacy at a Glance

- **No server, no tracking, no cookies.**
- All data stays in your browser's `localStorage`.
- No account or personal information is required.
- You can export or delete your data at any time.
