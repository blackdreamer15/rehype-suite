# rehype-suite

This repository currently contains one package: [`@jessybaki/rehype-callouts`](https://www.npmjs.com/package/@jessybaki/rehype-callouts), a rehype plugin that transforms GitHub-style alert blockquotes into callout markup.

The package was built as a learning project and is integrated into my personal portfolio. It focuses on the HAST transformation; Markdown parsing, HTML serialization, and styling remain the consumer's responsibility. It is not presented as a replacement for other callout plugins.

See the [package README](packages/rehype-callouts/README.md) for installation, usage, supported markers, output markup, and limitations.

## Development

This repository uses pnpm workspaces. From the repository root:

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
```

The workspace currently has one package. Additional packages are not planned unless a concrete need emerges.

## License

MIT. See [LICENSE](LICENSE).
