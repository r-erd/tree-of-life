# Compliance & Legal

## License

This project is licensed under the **GNU General Public License v2.0** (GPL-2.0).
See the [`LICENSE`](LICENSE) file for the full license text.

## Dependency Audit

All direct and transitive dependencies used in the production build are compatible
with GPL-2.0:

| Package | License | Notes |
|---------|---------|-------|
| `svelte` | MIT | Runtime framework |
| `@sveltejs/vite-plugin-svelte` | MIT | Build-time plugin |
| `vite` | MIT | Build tool |
| `js-yaml` | MIT | Build-time YAML parsing |
| `vitest` | MIT | Test framework (dev-only) |
| `clsx` | MIT | Runtime utility |
| `esbuild` | MIT | Bundler (via Vite) |
| `rollup` | MIT | Bundler (via Vite) |
| `magic-string` | MIT | Source manipulation |
| `postcss` | MIT | CSS processing |
| `nanoid` | MIT | ID generation |
| `lightningcss` | MPL-2.0 | CSS processing |
| `picocolors` | ISC | Terminal colors (dev-only) |
| `source-map-js` | BSD-3-Clause | Source maps |
| `tslib` | 0BSD | TypeScript helpers |

Build-time dependencies carrying the Apache-2.0 license (`aria-query`,
`axobject-query`, `detect-libc`, `expect-type`) are used only during compilation
and do not appear in the distributed application bundle.

## Privacy

Tree of Life is designed with **privacy-by-default** principles:

- **No server:** The application is a fully static client-side build. There is no backend.
- **No cookies:** We do not use cookies or any similar tracking mechanisms.
- **No analytics:** No third-party analytics, telemetry, or tracking scripts are included.
- **No external data transmission:** Your passion tree data never leaves your device.
- **Local storage only:** Progress, theme preferences, and UI state are stored in your browser's `localStorage`.
- **You own your data:** You can export your tree at any time (base62-encoded share code) or clear it completely via the reset function.
- **No account required:** There is no registration, login, or personal information collected.

### Data Stored in localStorage

| Key | Purpose | Retention |
|-----|---------|-----------|
| `tol_state` | Skilled node IDs, tree version | Until manually reset or cleared |
| `tol_theme` | Light/dark theme preference | Until manually changed or cleared |
| `tol_hint_dismissed` | Whether the getting-started hint was dismissed | Until manually cleared |

To delete all data, use your browser's developer tools or site data clearing features.

## Attribution

- Icons embedded in the application are simple geometric SVG paths.
- The application uses the [Inter](https://rsms.me/inter/) font family (via system font stack or CDN if configured).

## Contributing

By contributing to this project, you agree that your contributions will be
licensed under the same GPL-2.0 license.
