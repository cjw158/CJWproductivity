import { Node, mergeAttributes } from '@tiptap/core';
import Heading from '@tiptap/extension-heading';

// 自定义 Heading 扩展，支持 id 属性
export const HeadingWithId = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { id: attributes.id };
        },
      },
    };
  },
});

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

export const Image = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: true,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      // 防盗链：添加 referrerpolicy 属性
      referrerpolicy: {
        default: 'no-referrer', // 默认禁用 referrer，解决 CSDN 等平台的防盗链问题
      },
      loading: {
        default: 'lazy', // 懒加载
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt'),
            title: el.getAttribute('title'),
            width: el.getAttribute('width'),
            height: el.getAttribute('height'),
            referrerpolicy: el.getAttribute('referrerpolicy') || 'no-referrer',
            loading: el.getAttribute('loading') || 'lazy',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
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
