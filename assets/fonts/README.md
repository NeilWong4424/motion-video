# Packaged local fonts

These WOFF2 files are copied byte-for-byte from local npm packages and are the
only fonts the renderer loads. Render-time font downloads and system-font
fallback are forbidden.

| Tracked file | Source package | Source file | SHA-256 |
|---|---|---|---|
| `public/fonts/NotoSansSC.woff2` | `@fontsource-variable/noto-sans-sc@5.3.0` | `files/noto-sans-sc-latin-wght-normal.woff2` | `c1d919c8701a86ed7f33a8044f7c4e5675db2fce8b754091e97b2c0792f9782c` |
| `public/fonts/NotoSansTC.woff2` | `@fontsource-variable/noto-sans-tc@5.3.0` | `files/noto-sans-tc-latin-wght-normal.woff2` | `50cb5fb0a522cfaf23c98b97bbe4048c7b0dd9c4c7bcb3321046640bea6d7054` |

License: SIL Open Font License 1.1 — see `assets/licenses/OFL-Noto-Sans.txt`.

## V1 subset note

Fontsource ships Noto Sans SC/TC as unicode-range subset files. V1 packages the
**Latin** variable subset, which covers the M1 Golden Film's Latin copy. Full
CJK subset coverage (the numbered `*-wght-normal.woff2` files) is a documented
follow-up; missing glyphs are reported as `FONT_GLYPH_MISSING`, never silently
substituted.
