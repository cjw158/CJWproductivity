/**
 * @file tiptap-notelink.ts
 * @description TipTap 笔记链接扩展
 * 
 * 功能:
 * - 自定义 inline 节点，显示为带样式的笔记链接
 * - 存储笔记 ID 和显示标题
 * - 支持在浏览模式下点击跳转
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface NoteLinkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    noteLink: {
      /**
       * 插入笔记链接
       */
      insertNoteLink: (options: { noteId: number; noteTitle: string }) => ReturnType;
    };
  }
}

export const NoteLink = Node.create<NoteLinkOptions>({
  name: "noteLink",

  group: "inline",

  inline: true,

  atom: true,  // 作为一个整体，不可编辑内部

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: element => element.getAttribute("data-note-id"),
        renderHTML: attributes => {
          if (!attributes.noteId) return {};
          return { "data-note-id": attributes.noteId };
        },
      },
      noteTitle: {
        default: "",
        parseHTML: element => element.getAttribute("data-note-title") || element.textContent,
        renderHTML: attributes => {
          if (!attributes.noteTitle) return {};
          return { "data-note-title": attributes.noteTitle };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-note-id]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 
          class: "note-link",
          "data-note-id": node.attrs.noteId,
          "data-note-title": node.attrs.noteTitle,
        }
      ),
      [
        "span",
        { class: "note-link-icon" },
        "",  // 图标通过 CSS 添加
      ],
      node.attrs.noteTitle,
    ];
  },

  addCommands() {
    return {
      insertNoteLink:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 笔记链接的 CSS 样式（需要在全局或编辑器中注入）
 */
export const noteLinkStyles = `
.note-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  margin: 0 0.125rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
  vertical-align: baseline;
}

/* 暗色主题 */
.dark .note-link,
.prose-invert .note-link {
  background: rgba(0, 255, 255, 0.1);
  color: var(--neon-cyan, #00FFFF);
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.dark .note-link:hover,
.prose-invert .note-link:hover {
  background: rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.4);
}

/* 亮色主题 */
.note-link {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.note-link:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

/* 编辑模式下禁用点击效果 */
.ProseMirror[contenteditable="true"] .note-link {
  cursor: default;
  pointer-events: none;
}

/* 浏览模式下启用点击 */
.ProseMirror[contenteditable="false"] .note-link {
  cursor: pointer;
  pointer-events: auto;
}
`;
