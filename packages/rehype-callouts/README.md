# @blackdreamer15/rehype-callouts

Transform GitHub-style alert blockquotes into CSS-free callout markup in a rehype pipeline.

This package handles the HAST transform only. It does not provide styles, icons, themes, or framework-specific integration.

## Install

```sh
npm install @blackdreamer15/rehype-callouts
```

Use it in a unified pipeline after Markdown has been converted to HAST:

```js
import rehypeCallouts from "@blackdreamer15/rehype-callouts";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const file = await unified()
	.use(remarkParse)
	.use(remarkRehype)
	.use(rehypeCallouts)
	.use(rehypeStringify)
	.process("> [!NOTE]\n> Useful context.");

console.log(String(file));
```

Output (insignificant serializer whitespace normalized for display):

```html
<div class="callout callout-note" data-callout="note"><div class="callout-title"><span>Note</span></div><div class="callout-body"><p>Useful context.</p></div></div>
```

The `remark-parse`, `remark-rehype`, and `rehype-stringify` packages in this example are pipeline dependencies; this package does not parse Markdown or serialize HTML itself.

## Supported markers

The first text node in the first paragraph of a blockquote must start with one of these markers. Matching is case-insensitive.

| Markdown marker | Visible label | `data-callout` value |
| --- | --- | --- |
| `[!NOTE]` | Note | `note` |
| `[!TIP]` | Tip | `tip` |
| `[!WARNING]` | Warning | `warning` |
| `[!IMPORTANT]` | Important | `important` |
| `[!CAUTION]` | Caution | `caution` |

Text following the marker remains in the body. The body may contain multiple paragraphs and other HAST content. A marker-only first paragraph is removed. Unknown markers and ordinary blockquotes are preserved unchanged.

Nested blockquotes inside a blockquote are preserved and are not independently transformed. Markers after other text, after inline elements, or split across text nodes are not recognized.

## Output and styling

Each recognized blockquote becomes a `div` with the classes `callout` and `callout-<type>`, plus a matching `data-callout` attribute. It contains a visible title label and a `callout-body` wrapper. The transform uses standard HAST elements and text, and does not add ARIA roles or raw HTML.

No CSS is included. Style the emitted classes in your application. The visible label communicates the callout type without relying on color.

## API

The package exports one default rehype plugin and accepts no options:

```ts
function rehypeCallouts(): (tree: Root) => void;
```

## Compatibility

- Node.js 22 and newer. The package is ESM-only; the release candidate has been tested on Node.js 22, 24, and 26.
- Use in a unified processor after the Markdown-to-HAST step, such as `remark-rehype`.
- No runtime JavaScript dependencies. TypeScript declarations reference `@types/hast`, which is installed as a package dependency.

## Limitations

- Only the five markers listed above are supported; there are no custom types, titles, aliases, icons, themes, or options.
- Marker recognition is limited to the beginning of the first text node in the first paragraph.
- Nested blockquotes remain quoted content, even if they contain a recognized marker.
- This plugin transforms an existing HAST tree. Markdown parsing, HTML serialization, and CSS remain the consumer's responsibility.

## License

MIT
