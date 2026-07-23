# Music Prompt Document Template

## Status and projection identity

This is a documentation-only contract for a future deterministic local interface. It is not implemented in Part 1, performs no provider/API call, and is never hand-authored by Sound Designer.

- templateId: `music-prompt-document`
- templateVersion: `1.0.0`
- compilerId: `audio-prompt-compiler`
- compilerVersion: `1.0.0`
- compilerContractVersion: `audio-prompt-projection/1`

An output attempt records all five exact identifiers in its deterministic producer metadata. Changing any identifier, literal template byte, normalization rule, or projection rule creates a different immutable attempt; an implementation must never silently retain an old version identity.

## Sole input and exact field projection

The current canonical bytes of one validated `AudioBriefArtifact@1` are the **only semantic source** for the document. The future owner-produced `audioBriefHash` is the canonical hash of those exact bytes and is the only additional derived identity. No Brief prose, Treatment, MotionSpec/MotionCue, RenderPlan cue, review, filename, provider preference, chat text, environment value, or implementation default may supplement or override the following projection:

| Output value | Exact source |
|---|---|
| `projectId`, `revisionId`, `renderPlanHash`, `previewApprovalHash`, `renderManifestHash`, `silentMasterHash`, `fps`, `durationInFrames` | Same-named `AudioBriefArtifact@1` field |
| `style`, `instrumentation`, `tempoKey`, `hook`, `dynamics`, `exclude`, `sfxNotes` | Same-named member of `AudioBriefArtifact.audio` |
| `durationSeconds` | `formatSeconds(durationInFrames, fps)` |
| `cueStructure` | Every `audio.cues` member serialized once in artifact order |
| `payoffFrame`, `payoffSeconds`, `payoffTiming` | The unique cue whose `role` is `payoff`; seconds use `formatSeconds(cue.frame, fps)` |
| `stinger` | `audio.stingerFrame` plus `formatSeconds(audio.stingerFrame, fps)` |
| `audioBriefHash` | Owner-produced canonical hash of the exact validated AudioBrief bytes |

The compiler first revalidates all AudioBrief bindings, strictly increasing cue frames, the frame-0 first cue, in-range cues/stinger, and exactly one payoff. Invalid or stale input refuses projection.

## Canonical text normalization

For every projected free-text field (`style`, `instrumentation`, `tempoKey`, `hook`, each cue `label` and `sound`, `dynamics`, `exclude`, and `sfxNotes`), apply `sanitizeText(value)` exactly once:

1. Require a Unicode string containing only Unicode scalar values; refuse an unpaired surrogate, NUL, or non-whitespace control character.
2. Convert every CRLF pair and remaining CR to LF.
3. Normalize the result to Unicode NFC.
4. Replace every ASCII backtick (U+0060) with one ASCII apostrophe (U+0027).
5. Collapse every non-empty run of Unicode whitespace, including LF and tab, to a single ASCII space (U+0020), then trim leading and trailing ASCII spaces.
6. Refuse an empty result. Do not otherwise escape, paraphrase, translate, abbreviate, or reorder text.

These rules prevent any field from injecting a new Markdown line or code fence. Static template punctuation is never passed through `sanitizeText`.

## Deterministic frame-to-seconds formatting

`formatSeconds(frame, fps)` accepts the validated non-negative integer frame and positive integer fps. It computes milliseconds using exact integer arithmetic and round half up to three decimal places:

```text
milliseconds = floor((2 * frame * 1000 + fps) / (2 * fps))
wholeSeconds = floor(milliseconds / 1000)
fraction = milliseconds modulo 1000, left-padded to exactly three digits
result = decimal(wholeSeconds) + "." + fraction
```

The result always has exactly three decimal digits, uses `.` as the decimal separator, has no grouping separator, and never uses floating-point formatting or locale rules. Thus every displayed time is `formatSeconds(frame, fps) + "s"`; `durationSeconds` is derived from `durationInFrames` and `fps`, never authored independently.

## Ordered cue, payoff, and stinger serialization

Serialize every member of `audio.cues` once and in artifact order. `role` is its validated closed literal; `label` and `sound` are sanitized. Each cue record is exactly:

```text
- ROLE @ frame FRAME (SECONDSs): LABEL — SOUND
```

Here the italicized metavariables stand for their projected values; the emitted grammar, without metavariable styling, is exactly `- {{role}} @ frame {{frame}} ({{seconds}}s): {{label}} — {{sound}}`. Decimal frame integers have no leading plus sign or grouping. Join successive cue records with exactly one LF and no blank line.

Derive the unique payoff line value from that same payoff cue as exactly:

```text
frame {{frame}} ({{seconds}}s): {{label}} — {{sound}}
```

Derive the stinger value as exactly:

```text
frame {{frame}} ({{seconds}}s)
```

Neither derived value creates a second alignment anchor, and neither may use any MotionCue or inferred musical event.

## Exact generator-facing paste block

After substitution, the generator-facing `promptBlock` has these literal lines and order:

```text
Create an instrumental cue only, exactly {{durationSeconds}} seconds long.

Style: {{style}}
Instrumentation: {{instrumentation}}
Tempo and key guidance: {{tempoKey}}
Hook or signature idea: {{hook}}
Cue structure, timed to the locked picture:
{{cueStructure}}
Dynamic contour: {{dynamics}}
Single visual payoff alignment: {{payoffTiming}}
Stinger guidance: {{stinger}}

Avoid: {{exclude}}
Do not include vocals, spoken words, dialogue, automatic or synthetic voice, or sound effects. Keep the cue continuous and support the locked visual timing without changing its duration.
```

All document and block line endings are LF (U+000A), never CRLF. Static blank lines are exactly those shown. There is exactly one LF between successive cue records, no trailing space on any line, and exactly one final LF after the last paste-block line. Placeholder substitution performs no indentation and introduces no extra LF.

Count the completed `promptBlock` after all substitution and normalization, excluding the surrounding Markdown fences, as **4,000 Unicode scalar values** (not UTF-16 code units, grapheme clusters, or bytes). This is the exact meaning of the user-facing phrase “at most 4,000 characters.” A count of 4,000 is valid. If the count is greater than 4,000, refuse with `AUDIO_PROMPT_TOO_LONG`; the compiler must not truncate, drop a cue, abbreviate, paraphrase, or otherwise rewrite any source value to fit. On refusal it writes neither `MUSIC_PROMPT.md` nor `prompt-attempt.json`.

## Exact complete file skeleton

The following is the complete `MUSIC_PROMPT.md` byte skeleton from the **first byte** (`#`) through the **final LF** after the last `sfxNotes` line. Four backticks delimit this documentation example only; they are not file bytes. The inner triple fences are literal file bytes. Replace only double-brace fields using the projection above. `{{cueStructure}}` expands to one or more complete cue lines with a single LF between them and no additional indentation.

````text
# Music Prompt

- Template: `music-prompt-document@1.0.0`
- Compiler: `audio-prompt-compiler@1.0.0`
- Compiler contract: `audio-prompt-projection/1`

## PASTE THIS INTO THE MUSIC GENERATOR

```text
Create an instrumental cue only, exactly {{durationSeconds}} seconds long.

Style: {{style}}
Instrumentation: {{instrumentation}}
Tempo and key guidance: {{tempoKey}}
Hook or signature idea: {{hook}}
Cue structure, timed to the locked picture:
{{cueStructure}}
Dynamic contour: {{dynamics}}
Single visual payoff alignment: {{payoffTiming}}
Stinger guidance: {{stinger}}

Avoid: {{exclude}}
Do not include vocals, spoken words, dialogue, automatic or synthetic voice, or sound effects. Keep the cue continuous and support the locked visual timing without changing its duration.
```

## Motion cue reference — do not paste

- Projection: template `music-prompt-document@1.0.0`, compiler `audio-prompt-compiler@1.0.0`, compiler contract `audio-prompt-projection/1`
- Cut binding: project `{{projectId}}`, revision `{{revisionId}}`, RenderPlan `{{renderPlanHash}}`
- Parent bindings: AudioBrief `{{audioBriefHash}}`, Preview Approval `{{previewApprovalHash}}`, Render Manifest `{{renderManifestHash}}`, silent master `{{silentMasterHash}}`
- Timing: `{{fps}}` fps, `{{durationInFrames}}` frames, duration `{{durationSeconds}}` seconds
- Payoff: frame `{{payoffFrame}}` (`{{payoffSeconds}}s`)
- Manual SFX production notes: `{{sfxNotes}}`
````

All line endings are LF. There is no BOM, leading blank line, trailing space, timestamp, provider, host, path, environment value, commentary, or extra field. The shown empty lines are exact. There is exactly one LF after the final substituted `{{sfxNotes}}`; there are no bytes after it.

Every projected free-text byte in the completed file occurs only inside the literal fenced `text` generator block or, for `sfxNotes`, inside the final literal inline-code span. `sanitizeText` removes every possible backtick and collapses every line break before substitution, so no field can terminate either enclosure or introduce an active Markdown heading, HTML element, link destination, image, executable URI, or second fence. The compiler verifies the exact skeleton and substitution-site registry before writing; a changed fence count, an unknown/additional placeholder, projected free text outside those inert enclosures, or any template drift refuses the attempt. It never evaluates rendered Markdown, HTML, a URI, or field text as an instruction.

The human-checking section is derived exclusively from `AudioBriefArtifact@1`; there is deliberately no unbound MotionSpec cue placeholder. `AudioBriefArtifact@1.audio.cues` is the sole ordered cue source.

The sibling attempt envelope uses the exact named parent object—never an ambiguous array:

```ts
parentHashes: {
  audioBriefHash: string;
  previewApprovalHash: string;
  renderManifestHash: string;
  silentMasterHash: string;
};
```

`prompt-attempt.json` stores its sole attempt identity as `contentHash` and exact Markdown-byte identity as `promptContentHash`. It does not store a second `promptAttemptHash`: externally, that name is the path/selection alias equal to `contentHash`. No hash is back-patched into Markdown, so attempt identity remains non-self-referential.
