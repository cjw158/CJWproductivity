import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface MarkdownEditorRef {
  focus: () => void;
  clear: () => void;
  getContent: () => string;
  getHTML: () => string;
}

interface MarkdownEditorProps {
  placeholder?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  onSubmit?: () => void;
  minHeight?: string;
  className?: string;
}

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  function MarkdownEditor(
    { placeholder, initialContent, onChange, onSubmit, minHeight = "80px", className },
    ref
  ) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // 启用常用功能
          heading: { levels: [1, 2, 3] },
          bulletList: {},
          orderedList: {},
          codeBlock: {},
          blockquote: {},
          bold: {},
          italic: {},
          strike: {},
          code: {},
        }),
        Placeholder.configure({
          placeholder: placeholder || "写点什么...",
          emptyEditorClass: "is-editor-empty",
        }),
        Typography,
      ],
      content: initialContent || "",
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none",
            isDark ? "prose-invert" : "",
            "min-h-[80px]"
          ),
        },
        handleKeyDown: (_view, event) => {
          // Cmd/Ctrl + Enter 提交
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onSubmit?.();
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        onChange?.(editor.getText());
      },
    });

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
      getContent: () => editor?.getText() || "",
      getHTML: () => editor?.getHTML() || "",
    }));

    // 初始内容变化时更新
    useEffect(() => {
      if (editor && initialContent !== undefined) {
        const currentContent = editor.getText();
        if (currentContent !== initialContent) {
          editor.commands.setContent(initialContent);
        }
      }
    }, [editor, initialContent]);

    return (
      <div
        className={cn(
          "rounded-xl transition-all",
          isDark 
            ? "bg-white/5 border border-white/10" 
            : "bg-gray-50 border border-gray-200",
          className
        )}
        style={{ minHeight }}
      >
        <EditorContent 
          editor={editor} 
          className={cn(
            "px-4 py-3 text-base",
            isDark ? "text-white" : "text-gray-900"
          )}
        />
        
        {/* 快捷键工具栏 */}
        {editor && (
          <div 
            className={cn(
              "flex items-center gap-1 px-3 py-2 border-t",
              isDark ? "border-white/5" : "border-gray-100"
            )}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="粗体 (Ctrl+B)"
              isDark={isDark}
            >
              B
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="斜体 (Ctrl+I)"
              isDark={isDark}
            >
              <span className="italic">I</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="删除线"
              isDark={isDark}
            >
              <span className="line-through">S</span>
            </ToolbarButton>
            <div className={cn("w-px h-4 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="无序列表"
              isDark={isDark}
            >
              •
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="有序列表"
              isDark={isDark}
            >
              1.
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive("codeBlock")}
              title="代码块"
              isDark={isDark}
            >
              {"</>"}
            </ToolbarButton>
          </div>
        )}
      </div>
    );
  }
);

// 工具栏按钮组件
function ToolbarButton({
  children,
  onClick,
  active,
  title,
  isDark,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors",
        active
          ? isDark
            ? "bg-white/20 text-white"
            : "bg-blue-100 text-blue-700"
          : isDark
            ? "text-white/50 hover:text-white hover:bg-white/10"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      )}
    >
      {children}
    </button>
  );
}
