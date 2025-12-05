import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { Image } from "@/lib/tiptap-extensions";
import { MathInline, MathBlock, MathPasteHandler } from "@/lib/tiptap-math";
import "katex/dist/katex.min.css";
import { forwardRef, useImperativeHandle, useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  Highlighter,
  Undo,
  Redo,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDark: boolean;
  editable?: boolean;
  maxWidth?: number | string;
  disableTransition?: boolean;
}

export interface RichTextEditorRef {
  getMarkdown: () => string;
  getHTML: () => string;
  focus: () => void;
  getWordCount: () => number;
}

// 工具栏按钮组件
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
  isDark,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-all",
        isActive
          ? isDark
            ? "bg-white/20 text-white"
            : "bg-gray-200 text-gray-900"
          : isDark
            ? "text-white/60 hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// 分隔线
function Divider({ isDark }: { isDark: boolean }) {
  return (
    <div className={cn("w-px h-6 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />
  );
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor({ content, onChange, isDark, editable = true, maxWidth = "48rem", disableTransition = false }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSyncingRef = useRef(false); // 标记是否正在同步内容（非用户编辑）
    const initialContentRef = useRef(content); // 记录初始内容

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        Highlight.configure({
          multicolor: false,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-[var(--color-memo)] underline",
          },
        }),
        Placeholder.configure({
          placeholder: "开始写点什么...",
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        // 数学公式支持
        MathInline,
        MathBlock,
        MathPasteHandler,
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        // 如果正在同步内容，不触发 onChange（避免浏览时误触发更新）
        if (isSyncingRef.current) return;
        
        const newContent = editor.getHTML();
        // 只有内容真正变化时才触发（排除格式化差异）
        if (newContent !== initialContentRef.current) {
          onChange(newContent);
          initialContentRef.current = newContent; // 更新基准
        }
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none min-h-[300px] transition-all duration-300",
            // 基础 padding
            "px-6 py-4",
            isDark ? "prose-invert" : "",
            
            // 浏览模式优化排版 - 杂志级阅读体验
            !editable && [
               "leading-[1.9]", // 更宽松的行高
               "prose-p:text-base prose-p:my-4", // 稍大的字体和间距
               "prose-headings:my-8", // 标题间距更大
               "prose-li:my-2", // 列表间距
               isDark ? "text-gray-200" : "text-gray-700", // 提高对比度
               "font-['LXGW_WenKai_Screen','LXGW_WenKai',serif]", // 应用霞鹜文楷字体
               "tracking-wide", // 增加字间距，更有呼吸感
               "selection:bg-cyan-500/30" // 选中文字高亮
            ],
            
            // 标题
            "prose-headings:font-semibold",
            "prose-h1:text-2xl prose-h1:mb-4",
            "prose-h2:text-xl prose-h2:mb-3",
            "prose-h3:text-lg prose-h3:mb-2",
            // 段落
            "prose-p:leading-relaxed",
            !editable ? "prose-p:my-3" : "prose-p:my-2",
            // 列表
            "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
            // 代码
            "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
            isDark
              ? "prose-code:bg-white/10 prose-code:text-emerald-400"
              : "prose-code:bg-gray-100 prose-code:text-emerald-600",
            // 引用
            "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic",
            isDark
              ? "prose-blockquote:border-white/20 prose-blockquote:text-white/60"
              : "prose-blockquote:border-gray-300 prose-blockquote:text-gray-600",
            // 链接
            "prose-a:text-[var(--color-memo)] prose-a:no-underline hover:prose-a:underline",
            // 图片
            "prose-img:rounded-xl prose-img:shadow-md prose-img:my-4 prose-img:max-h-[500px] prose-img:object-contain"
          ),
        },
      },
    });

    // 同步外部 content 到编辑器
    useEffect(() => {
      if (editor && content) {
        // 只在内容实际不同时更新，避免光标跳动
        const currentContent = editor.getHTML();
        if (currentContent !== content && content !== "<p></p>") {
          isSyncingRef.current = true; // 标记为同步中
          editor.commands.setContent(content);
          initialContentRef.current = content; // 更新基准内容
          // 延迟重置标记，确保 onUpdate 不会触发
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 0);
        }
      }
    }, [editor, content]);

    // 编辑器初始化完成后设置内容
    useEffect(() => {
      if (editor && content && editor.isEmpty) {
        isSyncingRef.current = true;
        editor.commands.setContent(content);
        initialContentRef.current = content;
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    }, [editor]);

    // 同步 editable 状态
    useEffect(() => {
      if (editor) {
        editor.setEditable(editable);
      }
    }, [editor, editable]);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editor?.getText() || "",
      getHTML: () => editor?.getHTML() || "",
      focus: () => editor?.commands.focus(),
      getWordCount: () => {
        const text = editor?.getText() || "";
        // 简单的字数统计：中文算一个字，英文单词算一个词
        return text.replace(/\s+/g, "").length;
      },
    }));

    const setLink = useCallback(() => {
      if (!editor) return;
      
      const previousUrl = editor.getAttributes("link").href;
      const url = window.prompt("输入链接地址", previousUrl);

      if (url === null) return;

      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }

      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, [editor]);

    if (!editor) return null;

    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-300",
        !editable && (isDark ? "bg-[#1a1a1f]/50" : "bg-gray-50/50") // 浏览模式添加淡背景
      )}>
        {/* 工具栏 - 仅在编辑模式显示 */}
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          editable ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div
            className={cn(
              "flex flex-wrap items-center gap-0.5 px-4 py-2 border-b sticky top-0 z-10",
              isDark ? "bg-[#1a1a24] border-white/10" : "bg-white border-gray-100"
            )}
          >
            {/* ... 工具栏按钮 ... */}
            {/* 撤销/重做 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="撤销 (Ctrl+Z)"
              isDark={isDark}
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="重做 (Ctrl+Y)"
              isDark={isDark}
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>

            <Divider isDark={isDark} />

            {/* 标题 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive("heading", { level: 1 })}
              title="标题1"
              isDark={isDark}
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="标题2"
              isDark={isDark}
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="标题3"
              isDark={isDark}
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <Divider isDark={isDark} />

            {/* 文本格式 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="加粗 (Ctrl+B)"
              isDark={isDark}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="斜体 (Ctrl+I)"
              isDark={isDark}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="下划线 (Ctrl+U)"
              isDark={isDark}
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="删除线"
              isDark={isDark}
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              title="高亮"
              isDark={isDark}
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              title="行内代码"
              isDark={isDark}
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <Divider isDark={isDark} />

            {/* 列表 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="无序列表"
              isDark={isDark}
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="有序列表"
              isDark={isDark}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              title="任务列表"
              isDark={isDark}
            >
              <CheckSquare className="w-4 h-4" />
            </ToolbarButton>

            <Divider isDark={isDark} />

            {/* 其他 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="引用"
              isDark={isDark}
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="分隔线"
              isDark={isDark}
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={setLink}
              isActive={editor.isActive("link")}
              title="链接"
              isDark={isDark}
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            
            {/* 图片上传 */}
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="插入图片"
              isDark={isDark}
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden" 
            />
          </div>
        </div>

        {/* 编辑器内容区 */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          "notes-scrollbar", // 自定义滚动条
          // 浏览模式下居中显示
          !editable && "flex justify-center items-start px-6 py-4"
        )}>
          <div 
            className={cn(
              !disableTransition && "transition-all duration-300",
              // 编辑模式：全宽
              editable && "w-full",
              // 浏览模式：限制宽度 + 玻璃面板效果 + 居中
              !editable && "w-full py-8 px-8 notes-reading-panel"
            )}
            style={{ maxWidth: !editable ? maxWidth : "100%" }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
