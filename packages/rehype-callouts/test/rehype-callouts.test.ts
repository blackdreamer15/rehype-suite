import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import rehypeCallouts from "../src/index.js";

async function render(markdown: string): Promise<string> {
	const file = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeCallouts)
		.use(rehypeStringify)
		.process(markdown);

	return String(file).replace(/>\s+</g, "><").trim();
}

describe("rehypeCallouts", () => {
	it.each([
		["NOTE", "note", "Note"],
		["TIP", "tip", "Tip"],
		["WARNING", "warning", "Warning"],
		["IMPORTANT", "important", "Important"],
		["CAUTION", "caution", "Caution"],
	])("converts the %s alert", async (marker, type, label) => {
		const html = await render(`> [!${marker}]\n> Body text.`);

		expect(html).toBe(
			`<div class="callout callout-${type}" data-callout="${type}"><div class="callout-title"><span>${label}</span></div><div class="callout-body"><p>Body text.</p></div></div>`,
		);
	});

	it("matches marker types without regard to case and keeps same-line body text", async () => {
		await expect(render("> [!tip] Save time.")).resolves.toBe(
			'<div class="callout callout-tip" data-callout="tip"><div class="callout-title"><span>Tip</span></div><div class="callout-body"><p>Save time.</p></div></div>',
		);
	});

	it("keeps body text attached directly to the marker", async () => {
		await expect(render("> [!NOTE]Body text.")).resolves.toBe(
			'<div class="callout callout-note" data-callout="note"><div class="callout-title"><span>Note</span></div><div class="callout-body"><p>Body text.</p></div></div>',
		);
	});

	it("keeps multiple paragraphs in order and removes the marker-only paragraph", async () => {
		const html = await render(
			"> [!WARNING]\n>\n> First paragraph.\n>\n> Second paragraph.",
		);

		expect(html).toBe(
			'<div class="callout callout-warning" data-callout="warning"><div class="callout-title"><span>Warning</span></div><div class="callout-body"><p>First paragraph.</p><p>Second paragraph.</p></div></div>',
		);
	});

	it("preserves ordinary blockquotes and unknown alert types", async () => {
		for (const markdown of [
			"> An ordinary quotation.",
			"> [!SUCCESS]\n> Keep this quote unchanged.",
		]) {
			const html = await render(markdown);
			expect(html).toContain("<blockquote>");
			expect(html).not.toContain('class="callout');
		}
	});

	it.each([
		["> [! NOTE]", "[! NOTE]"],
		["> [NOTE]", "[NOTE]"],
		["> Text [!NOTE]", "Text [!NOTE]"],
		["> *Emphasis* [!NOTE]", "[!NOTE]"],
		["> [!NO**TE**]", "[!NO<strong>TE</strong>]"],
	])(
		"preserves malformed or misplaced marker input: %s",
		async (markdown, unchangedContent) => {
			const html = await render(markdown);
			expect(html).toContain("<blockquote>");
			expect(html).toContain(unchangedContent);
			expect(html).not.toContain('class="callout');
		},
	);

	it("emits an empty body wrapper for an empty callout", async () => {
		await expect(render("> [!CAUTION]")).resolves.toBe(
			'<div class="callout callout-caution" data-callout="caution"><div class="callout-title"><span>Caution</span></div><div class="callout-body"></div></div>',
		);
	});

	it("preserves links and images when removing the marker", async () => {
		const linkHtml = await render("> [!NOTE] [Docs](https://example.com)");
		const imageHtml = await render("> [!NOTE] ![diagram](diagram.png)");

		expect(linkHtml).toContain('<a href="https://example.com">Docs</a>');
		expect(imageHtml).toContain('<img src="diagram.png" alt="diagram">');
		expect(imageHtml).toContain("<p><img");
	});

	it("preserves soft and hard line breaks in the body", async () => {
		const softBreak = await render("> [!NOTE]\n> First line\n> Second line");
		const hardBreak = await render("> [!NOTE]\n> First line  \n> Second line");

		expect(softBreak).toContain("First line\nSecond line");
		expect(hardBreak).toContain("<br>");
		expect(hardBreak).toContain("Second line");
	});

	it("preserves lists and fenced code blocks", async () => {
		const html = await render(
			"> [!IMPORTANT]\n> - one\n> - two\n>\n> ```js\n> const answer = 42\n> ```",
		);

		expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
		expect(html).toMatch(
			/<code class="language-js">const answer = 42\n?<\/code>/,
		);
	});

	it("converts callouts inside lists", async () => {
		const html = await render("- item\n\n  > [!TIP]\n  > Nested list callout.");

		expect(html).toContain(
			'<div class="callout callout-tip" data-callout="tip">',
		);
		expect(html).toContain("Nested list callout.");
	});

	it("keeps nested callout markers as blockquotes", async () => {
		const recognizedOuter = await render(
			"> [!NOTE]\n> Outer content.\n>\n> > [!TIP]\n> > Nested content.",
		);
		const ordinaryOuter = await render(
			"> Outer content.\n>\n> > [!TIP]\n> > Nested content.",
		);

		expect(recognizedOuter.match(/class="callout /g)).toHaveLength(1);
		expect(recognizedOuter).toContain("<blockquote>");
		expect(recognizedOuter).toContain("[!TIP]");
		expect(ordinaryOuter).not.toContain('class="callout');
		expect(ordinaryOuter).toContain("[!TIP]");
	});

	it("uses visible labels without adding ARIA roles or raw SVG", async () => {
		const html = await render("> [!WARNING]\n> Be careful.");

		expect(html).toContain(">Warning</span>");
		expect(html).not.toMatch(/\brole=/);
		expect(html).not.toContain("<svg");
	});
});
