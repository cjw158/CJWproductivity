import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import katex from "katex";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs: { latex: string }) => ({ "data-latex": attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="math-inline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, {
      "data-type": "math-inline",
      class: "math-inline",
      contenteditable: "false",
    })];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement("span");
      span.className = "math-inline";
      span.contentEditable = "false";
      const latex = node.attrs.latex;
      if (latex) {
        try {
          katex.render(latex, span, { throwOnError: false, displayMode: false });
        } catch (e) {
          span.textContent = "$" + latex + "$";
          span.className += " math-error";
        }
      }
      return { dom: span };
    };
  },
});

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-latex") || "",
        renderHTML: (attrs: { latex: string }) => ({ "data-latex": attrs.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "math-block",
      class: "math-block",
      contenteditable: "false",
    })];
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement("div");
      div.className = "math-block";
      div.contentEditable = "false";
      const latex = node.attrs.latex;
      if (latex) {
        try {
          katex.render(latex, div, { throwOnError: false, displayMode: true });
        } catch (e) {
          div.textContent = "$$" + latex + "$$";
          div.className += " math-error";
        }
      }
      return { dom: div };
    };
  },
});

export const SmartPaste = Extension.create({
  name: "smartPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("smartPaste"),
        props: {
          handlePaste(_view, event) {
            const text = event.clipboardData?.getData("text/plain");
            if (!text) return false;
            if (!shouldProcess(text)) return false;
            event.preventDefault();
            const html = convertMarkdownWithMath(text);
            editor.commands.insertContent(html, {
              parseOptions: { preserveWhitespace: "full" },
            });
            return true;
          },
          transformPastedHTML(html) {
            return html
              .replace(/\\\[([\s\S]*?)\\\]/g, (_, t) => blockMathHtml(t.trim()))
              .replace(/\\\(([\s\S]*?)\\\)/g, (_, t) => inlineMathHtml(t.trim()));
          },
        },
      }),
    ];
  },
});

export const MathPasteHandler = SmartPaste;

function shouldProcess(text: string): boolean {
  return /\$[^$]+\$|\$\$[\s\S]+?\$\$|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\*\*[^*]+\*\*|^>/m.test(text);
}

function convertMarkdownWithMath(text: string): string {
  const blockMath: string[] = [];
  const inlineMath: string[] = [];

  let safe = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    blockMath.push(tex.trim());
    return "\n<p>BLOCK_MATH_" + (blockMath.length - 1) + "</p>\n";
  });

  safe = safe.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    inlineMath.push(tex.trim());
    return "INLINE_MATH_" + (inlineMath.length - 1);
  });

  safe = cleanAILineBreaks(safe);
  let html = marked.parse(safe) as string;

  html = html.replace(/<p>BLOCK_MATH_(\d+)<\/p>/g, (_, i) => blockMathHtml(blockMath[parseInt(i)]));
  html = html.replace(/INLINE_MATH_(\d+)/g, (_, i) => inlineMathHtml(inlineMath[parseInt(i)]));

  return html;
}

function cleanAILineBreaks(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let buffer = "";

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (buffer) { result.push(buffer); buffer = ""; }
      result.push("");
      continue;
    }
    const isBlockStart = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>|---$|<p>BLOCK_MATH)/.test(t);
    const shouldMerge = /^(INLINE_MATH_|[,.;:!?])/.test(t);
    if (isBlockStart) {
      if (buffer) result.push(buffer);
      buffer = t;
    } else if (buffer && (shouldMerge || t.length < 40)) {
      buffer += (/^[,.;:!?]/.test(t) ? "" : " ") + t;
    } else {
      if (buffer) result.push(buffer);
      buffer = t;
    }
  }
  if (buffer) result.push(buffer);
  return result.join("\n");
}

function inlineMathHtml(latex: string): string {
  return '<span data-type="math-inline" data-latex="' + escapeHtml(latex) + '"></span>';
}

function blockMathHtml(latex: string): string {
  return '<div data-type="math-block" data-latex="' + escapeHtml(latex) + '"></div>';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
