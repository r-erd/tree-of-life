# Compliance & Legal

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0).
See the [`LICENSE`](LICENSE) file for the full license text.

## Dependency Audit

All direct and transitive dependencies used in the production build are compatible
with GPL-3.0:

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
and do not appear in the distributed application bundle.  Apache-2.0 is
explicitly compatible with GPL-3.0, whereas it was incompatible with GPL-2.0.

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
- The [Inter](https://rsms.me/inter/) font family is self-hosted from `public/fonts/` — no external font CDN requests are made.
- Inter is licensed under the **SIL Open Font License 1.1** (`public/fonts/LICENSE-Inter.txt`).
  OFL §2 explicitly permits bundling fonts with any software. The font remains
  under OFL while the application remains under GPL-3.0; there is no license
  conflict.

## No Impressum Required

Under German law (Telemediengesetz § 5), an **Impressum** is required for
*geschäftsmäßige Online-Dienste* (commercial online services offered in the
course of business).

Tree of Life is **not a commercial service**:

- It is a free, open-source personal tool distributed under GPL-3.0.
- There is no payment, no advertising, no revenue model, and no business activity.
- It is not operated in the course of a trade, business, or profession.
- There is no journalistic or editorial content.

Because the application is **non-commercial and non-business**, the Impressum
requirement under § 5 TMG does not apply.

## Contributing

By contributing to this project, you agree that your contributions will be
licensed under the same GPL-3.0 license.
