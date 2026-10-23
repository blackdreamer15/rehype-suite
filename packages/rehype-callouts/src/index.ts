import type { Element, ElementContent, Root, RootContent, Text } from "hast";

const ALERT_TYPES = {
	NOTE: { type: "note", label: "Note" },
	TIP: { type: "tip", label: "Tip" },
	WARNING: { type: "warning", label: "Warning" },
	IMPORTANT: { type: "important", label: "Important" },
	CAUTION: { type: "caution", label: "Caution" },
} as const;

type AlertKey = keyof typeof ALERT_TYPES;

const ALERT_PATTERN = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

function isElement(node: RootContent | ElementContent): node is Element {
	return node.type === "element";
}

function isText(node: ElementContent): node is Text {
	return node.type === "text";
}

function isEmptyParagraph(paragraph: Element): boolean {
	return paragraph.children.every(
		(child) => isText(child) && child.value.trim().length === 0,
	);
}

function createCallout(blockquote: Element): Element | undefined {
	const firstParagraph = blockquote.children.find(
		(child): child is Element => isElement(child) && child.tagName === "p",
	);
	if (!firstParagraph) return;

	const firstChild = firstParagraph.children[0];
	if (!firstChild || !isText(firstChild)) return;

	const match = firstChild.value.match(ALERT_PATTERN);
	if (!match) return;

	const typeKey = match[1].toUpperCase() as AlertKey;
	const config = ALERT_TYPES[typeKey];
	firstChild.value = firstChild.value.slice(match[0].length);

	if (isEmptyParagraph(firstParagraph)) {
		blockquote.children = blockquote.children.filter(
			(child) => child !== firstParagraph,
		);
	}

	return {
		type: "element",
		tagName: "div",
		properties: {
			className: ["callout", `callout-${config.type}`],
			dataCallout: config.type,
		},
		children: [
			{
				type: "element",
				tagName: "div",
				properties: { className: ["callout-title"] },
				children: [
					{
						type: "element",
						tagName: "span",
						properties: {},
						children: [{ type: "text", value: config.label }],
					},
				],
			},
			{
				type: "element",
				tagName: "div",
				properties: { className: ["callout-body"] },
				children: blockquote.children,
			},
		],
	};
}

function transformChildren(
	parent: Root | Element,
	insideBlockquote = false,
): void {
	for (let index = 0; index < parent.children.length; index += 1) {
		const child = parent.children[index];
		if (!isElement(child)) continue;

		if (child.tagName === "blockquote") {
			if (insideBlockquote) continue;

			const callout = createCallout(child);
			if (callout) {
				parent.children.splice(index, 1, callout);
				continue;
			}

			transformChildren(child, true);
			continue;
		}

		transformChildren(child, insideBlockquote);
	}
}

export default function rehypeCallouts() {
	return (tree: Root) => {
		transformChildren(tree);
	};
}
