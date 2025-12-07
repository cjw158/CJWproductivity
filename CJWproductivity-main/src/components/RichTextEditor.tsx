import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { Image, HeadingWithId } from "@/lib/tiptap-extensions";
import { MathInline, MathBlock, MathPasteHandler } from "@/lib/tiptap-math";
import { NoteLink } from "@/lib/tiptap-notelink";
import "katex/dist/katex.min.css";
import { forwardRef, useImperativeHandle, useCallback, useEffect, useRef, useState } from "react";
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
  FileText,
  ListTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDualPageContentStyles, getMeasureContainerStyles } from "@/lib/editor-styles";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDark: boolean;
  editable?: boolean;
  maxWidth?: number | string;
  disableTransition?: boolean;
  // 笔记链接功能
  onOpenNoteLinkPicker?: () => void;  // 打开笔记链接选择器
  onNoteLinkClick?: (noteId: number) => void;  // 点击笔记链接时的回调
  // 双页模式
  isDualPage?: boolean;
}

export interface RichTextEditorRef {
  getMarkdown: () => string;
  getHTML: () => string;
  focus: () => void;
  getWordCount: () => number;
  insertNoteLink: (noteId: number, noteTitle: string) => void;
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
  function RichTextEditor({ 
    content, 
    onChange, 
    isDark, 
    editable = true, 
    maxWidth = "48rem", 
    disableTransition = false,
    onOpenNoteLinkPicker,
    onNoteLinkClick,
    isDualPage = false,
  }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isSyncingRef = useRef(false); // 标记是否正在同步内容（非用户编辑）
    const initialContentRef = useRef(content); // 记录初始内容
    const editorContainerRef = useRef<HTMLDivElement>(null); // 编辑器容器引用
    const currentScrollRef = useRef(0); // 记录当前滚动位置（用于模式切换）

    const editor = useEditor({
      immediatelyRender: false, // 避免 React Strict Mode 下的重复扩展警告
      extensions: [
        StarterKit.configure({
          heading: false, // 禁用默认 heading，使用自定义的 HeadingWithId
        }),
        HeadingWithId.configure({
          levels: [1, 2, 3],
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
        // 笔记链接
        NoteLink,
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
               "selection:bg-cyan-500/30", // 选中文字高亮
               
               // 代码块样式优化
               isDark 
                 ? "prose-pre:bg-[#1e1e2e] prose-pre:text-gray-100 prose-pre:border prose-pre:border-white/10" 
                 : "prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:border prose-pre:border-gray-200"
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
            // 代码块默认样式（非浏览模式）
            isDark ? "prose-pre:bg-[#1e1e2e]" : "prose-pre:bg-gray-50 prose-pre:text-gray-800",
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

    // 监听模式切换，恢复滚动位置
    useEffect(() => {
      if (!isDualPage && editorContainerRef.current) {
        // 这里的 setTimeout 是为了确保 DOM 已经渲染完成
        setTimeout(() => {
          if (editorContainerRef.current) {
            editorContainerRef.current.scrollTop = currentScrollRef.current;
          }
        }, 0);
      }
    }, [isDualPage]);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editor?.getText() || "",
      getHTML: () => editor?.getHTML() || "",
      focus: () => editor?.commands.focus(),
      getWordCount: () => {
        const text = editor?.getText() || "";
        // 简单的字数统计：中文算一个字，英文单词算一个词
        return text.replace(/\s+/g, "").length;
      },
      insertNoteLink: (noteId: number, noteTitle: string) => {
        editor?.chain().focus().insertNoteLink({ noteId, noteTitle }).run();
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

    // 生成目录功能（智能版）
    const generateTableOfContents = useCallback(() => {
      if (!editor) return;
      
      const content = editor.getHTML();
      
      // 1. 检测是否已有目录（自动更新，无需确认）
      const hasToc = /<p[^>]*>\s*<strong>\s*目录\s*<\/strong>\s*<\/p>/i.test(content);
      
      // 使用 DOM 解析来处理
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // 2. 提取所有标题并添加 ID
      const headings: { level: number; text: string; id: string }[] = [];
      const headingElements = doc.querySelectorAll('h1, h2, h3');
      let counter = 0;
      
      headingElements.forEach((el) => {
        const text = (el.textContent || '').trim();
        
        // 跳过目录标题本身
        if (text === '目录' || !text) return;
        
        const level = parseInt(el.tagName[1]);
        counter++;
        
        // 生成稳定的 ID
        const id = el.id || `heading-${counter}`;
        
        // 给标题设置 ID
        if (!el.id) {
          el.id = id;
        }
        
        headings.push({ level, text, id });
      });
      
      if (headings.length === 0) {
        alert('未找到标题，请先添加 H1/H2/H3 标题');
        return;
      }
      
      // 3. 移除旧目录
      if (hasToc) {
        const tocTitle = doc.querySelector('p strong');
        if (tocTitle && tocTitle.textContent?.trim() === '目录') {
          const tocP = tocTitle.parentElement;
          let nextEl = tocP?.nextElementSibling;
          
          // 删除目录标题
          tocP?.remove();
          
          // 删除目录列表和分割线
          while (nextEl) {
            const toRemove = nextEl;
            nextEl = nextEl.nextElementSibling;
            if (toRemove.tagName === 'HR') {
              toRemove.remove();
              break;
            }
            toRemove.remove();
          }
        }
      }
      
      // 4. 生成分级样式目录 HTML
      let tocHtml = '<p><strong>目录</strong></p>';
      tocHtml += '<ul class="toc-list">';
      headings.forEach(h => {
        const style = h.level === 1 
          ? 'font-weight: 600;' 
          : h.level === 2 
            ? 'font-weight: 500;' 
            : 'font-weight: 400; opacity: 0.9;';
        const indent = (h.level - 1) * 1.25;
        tocHtml += `<li style="margin-left: ${indent}em; ${style}"><a href="#${h.id}">${h.text}</a></li>`;
      });
      tocHtml += '</ul><hr/>';
      
      // 5. 获取更新后的内容
      let updatedContent = doc.body.innerHTML;
      
      // 6. 智能插入位置：在第一个 H1 后插入
      const firstH1Match = updatedContent.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
      if (firstH1Match) {
        const insertPos = updatedContent.indexOf(firstH1Match[0]) + firstH1Match[0].length;
        updatedContent = updatedContent.slice(0, insertPos) + '\n' + tocHtml + updatedContent.slice(insertPos);
      } else {
        updatedContent = tocHtml + updatedContent;
      }
      
      editor.commands.setContent(updatedContent);
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
            <ToolbarButton
              onClick={generateTableOfContents}
              title="生成目录"
              isDark={isDark}
            >
              <ListTree className="w-4 h-4" />
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
            
            {/* 笔记链接 */}
            {onOpenNoteLinkPicker && (
              <ToolbarButton
                onClick={onOpenNoteLinkPicker}
                title="插入笔记链接"
                isDark={isDark}
              >
                <FileText className="w-4 h-4" />
              </ToolbarButton>
            )}
          </div>
        </div>

        {/* 编辑器内容区 - 普通模式 */}
        {!isDualPage && (
          <div 
            ref={editorContainerRef}
            className={cn(
              "flex-1 overflow-auto transition-all duration-300",
              "notes-scrollbar",
              !editable && "flex justify-center items-start px-6 py-4"
            )}
            onScroll={(e) => {
              // 记录单页模式下的滚动位置
              currentScrollRef.current = e.currentTarget.scrollTop;
            }}
            onClickCapture={(e) => {
              const target = e.target as HTMLElement;
              
              // 1. 处理笔记链接（span.note-link）
              const noteLink = target.closest('.note-link');
              if (noteLink && !editable && onNoteLinkClick) {
                e.preventDefault();
                e.stopPropagation();
                const noteId = noteLink.getAttribute('data-note-id');
                if (noteId) {
                  onNoteLinkClick(parseInt(noteId, 10));
                }
                return;
              }
              
              // 2. 处理普通链接
              const link = target.closest('a');
              if (!link) return;
              
              const href = link.getAttribute('href');
              if (!href) return;
              
              // 阻止默认行为
              e.preventDefault();
              e.stopPropagation();
              
              // 提取锚点 ID
              let anchorId = '';
              if (href.startsWith('#')) {
                anchorId = href.slice(1);
              } else if (href.includes('#')) {
                anchorId = href.split('#')[1];
              }
              
              // 浏览模式下执行跳转
              if (!editable && anchorId && editorContainerRef.current) {
                let targetElement = editorContainerRef.current.querySelector(`[id="${anchorId}"]`) ||
                                    editorContainerRef.current.querySelector(`[id="${decodeURIComponent(anchorId)}"]`);
                
                if (!targetElement) {
                  const headings = editorContainerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
                  for (const heading of headings) {
                    const text = heading.textContent?.trim() || '';
                    if (encodeURIComponent(text).replace(/%20/g, '-') === anchorId ||
                        text === decodeURIComponent(anchorId)) {
                      targetElement = heading;
                      break;
                    }
                  }
                }
                
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  targetElement.classList.add('anchor-highlight');
                  setTimeout(() => targetElement?.classList.remove('anchor-highlight'), 2000);
                }
              }
            }}
          >
            <div 
              className={cn(
                !disableTransition && "transition-all duration-300",
                editable && "w-full",
                !editable && "w-full py-8 px-8 notes-reading-panel"
              )}
              style={{ maxWidth: !editable ? maxWidth : "100%" }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        )}

        {/* 双页模式 */}
        {isDualPage && editor && (
          <DualPageReader
            html={editor.getHTML()}
            isDark={isDark}
            editable={editable}
            onNoteLinkClick={onNoteLinkClick}
            initialScrollOffset={currentScrollRef.current}
            onScrollChange={(offset) => {
              currentScrollRef.current = offset;
            }}
          />
        )}
      </div>
    );
  }
);

// ========== 双页阅读器组件 ==========
interface DualPageReaderProps {
  html: string;
  isDark: boolean;
  editable: boolean; // 编辑模式 vs 浏览模式
  onNoteLinkClick?: (noteId: number) => void;
  initialScrollOffset?: number;
  onScrollChange?: (offset: number) => void;
}

function DualPageReader({ html, isDark, editable, onNoteLinkClick, initialScrollOffset = 0, onScrollChange }: DualPageReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const [pageHeight, setPageHeight] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);

  // 通知父组件滚动位置变更
  useEffect(() => {
    onScrollChange?.(scrollOffset);
  }, [scrollOffset, onScrollChange]);

  // 测量内容高度
  useEffect(() => {
    const measure = () => {
      if (!measureRef.current || !containerRef.current) return;
      
      const containerHeight = containerRef.current.clientHeight;
      const currentContentHeight = measureRef.current.scrollHeight;
      
      setPageHeight(containerHeight);
      setContentHeight(currentContentHeight);
      // 最大滚动量 = 内容高度 - 一页高度（确保右页有内容显示）
      setMaxScroll(Math.max(0, currentContentHeight - containerHeight));
    };

    measure();
    const timer = setTimeout(measure, 100);
    
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(timer);
    };
  }, [html]);

  // 处理滚动条拖拽
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (!maxScroll || !pageHeight) return;

      // 计算滑块移动的距离
      const deltaY = e.clientY - dragStartY.current;
      
      // 计算对应的滚动距离
      // thumbTop / (pageHeight - thumbHeight) = scrollOffset / maxScroll
      // deltaY / (pageHeight - thumbHeight) = deltaScroll / maxScroll
      // => deltaScroll = deltaY * maxScroll / (pageHeight - thumbHeight)
      
      // 重新计算 thumbHeight
      const thumbHeight = Math.max(40, (pageHeight / contentHeight) * pageHeight);
      const trackHeight = pageHeight - thumbHeight;
      
      if (trackHeight <= 0) return;

      const deltaScroll = (deltaY / trackHeight) * maxScroll;
      const newScroll = Math.max(0, Math.min(dragStartScroll.current + deltaScroll, maxScroll));
      
      setScrollOffset(newScroll);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, maxScroll, pageHeight, contentHeight]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScroll.current = scrollOffset;
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!maxScroll || !pageHeight) return;
    // 简单的点击跳转：点击位置比例 -> 滚动比例
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / pageHeight));
    setScrollOffset(ratio * maxScroll);
  };

  // 键盘滚动
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = pageHeight * 0.15; // 每次滚动15%页面高度
      const bigStep = pageHeight * 0.8; // 大步滚动80%
      
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setScrollOffset(s => Math.min(s + step, maxScroll));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setScrollOffset(s => Math.max(0, s - step));
      } else if (e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setScrollOffset(s => Math.min(s + bigStep, maxScroll));
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setScrollOffset(s => Math.max(0, s - bigStep));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setScrollOffset(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setScrollOffset(maxScroll);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageHeight, maxScroll]);

  // 滚轮连续滚动
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.5; // 降低灵敏度
    setScrollOffset(s => Math.max(0, Math.min(s + delta, maxScroll)));
  }, [maxScroll]);

  // 处理链接点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 1. 处理笔记链接
    const noteLink = target.closest('.note-link');
    if (noteLink && onNoteLinkClick) {
      const noteId = noteLink.getAttribute('data-note-id');
      if (noteId) {
        e.preventDefault();
        e.stopPropagation();
        onNoteLinkClick(parseInt(noteId, 10));
        return;
      }
    }
    
    // 2. 处理所有链接 - 阻止默认跳转
    const link = target.closest('a');
    if (link && !noteLink) {
      const href = link.getAttribute('href');
      if (!href) return;
      
      // 始终阻止链接默认行为
      e.preventDefault();
      e.stopPropagation();
      
      // 提取锚点 ID（支持 #anchor 和 https://...#anchor 格式）
      let anchorId = '';
      if (href.startsWith('#')) {
        anchorId = href.slice(1);
      } else if (href.includes('#')) {
        anchorId = href.split('#')[1];
      }
      
      // 如果有锚点，执行跳转
      if (anchorId && measureRef.current) {
        // 多种方式查找目标元素
        let targetElement = measureRef.current.querySelector(`[id="${anchorId}"]`) ||
                            measureRef.current.querySelector(`[id="${decodeURIComponent(anchorId)}"]`);
        
        // 尝试通过标题文本匹配
        if (!targetElement) {
          const headings = measureRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
          for (const heading of headings) {
            const text = heading.textContent?.trim() || '';
            if (encodeURIComponent(text).replace(/%20/g, '-') === anchorId ||
                text === decodeURIComponent(anchorId)) {
              targetElement = heading;
              break;
            }
          }
        }
        
        if (targetElement) {
          const containerTop = measureRef.current.getBoundingClientRect().top;
          const elementTop = targetElement.getBoundingClientRect().top;
          const targetOffset = elementTop - containerTop;
          const newScroll = Math.max(0, Math.min(targetOffset - 20, maxScroll));
          setScrollOffset(newScroll);
          targetElement.classList.add('anchor-highlight');
          setTimeout(() => targetElement.classList.remove('anchor-highlight'), 2000);
        }
      }
    }
  }, [onNoteLinkClick, maxScroll]);

  // 左页偏移 = 当前滚动位置，右页偏移 = 当前滚动位置 + 一页高度
  const leftOffset = scrollOffset;
  const rightOffset = scrollOffset + pageHeight;

  // 滚动条计算
  const showScrollbar = maxScroll > 0;
  const thumbHeight = contentHeight > 0 ? Math.max(40, (pageHeight / contentHeight) * pageHeight) : 0;
  const trackAvailable = Math.max(0, pageHeight - thumbHeight);
  const thumbTop = maxScroll > 0 ? (scrollOffset / maxScroll) * trackAvailable : 0;

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col overflow-hidden px-3 py-3 relative group/reader"
      onWheel={handleWheel}
    >
      {/* 虚拟滚动条 */}
      {showScrollbar && (
        <div 
          className={cn(
            "absolute right-1 top-3 bottom-3 w-2.5 z-50 transition-opacity duration-300",
            // 只有在拖拽时或鼠标悬停在容器右侧区域时才显示
            isDragging ? "opacity-100" : "opacity-0 group-hover/reader:opacity-100"
          )}
        >
          {/* 轨道 (点击可跳转) */}
          <div 
            className="absolute inset-0 rounded-full"
            onClick={handleTrackClick}
          />
          {/* 滑块 */}
          <div
            style={{ 
              height: thumbHeight,
              transform: `translateY(${thumbTop}px)`,
              cursor: 'grab'
            }}
            onMouseDown={handleThumbMouseDown}
            className={cn(
              "w-1.5 mx-auto rounded-full transition-colors duration-200",
              isDragging && "cursor-grabbing w-2", // 拖拽时稍微变宽
              // 主题适配 (参考 notes-scrollbar)
              isDark 
                ? "bg-gradient-to-b from-[rgba(34,211,238,0.4)] to-[rgba(168,85,247,0.4)] hover:from-[rgba(34,211,238,0.6)] hover:to-[rgba(168,85,247,0.6)]" 
                : "bg-gradient-to-b from-[#cbd5e1] to-[#94a3b8] hover:from-[#94a3b8] hover:to-[#64748b]"
            )}
          />
          {/* 进度百分比指示 */}
          <div className={cn(
            "absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            {maxScroll > 0 ? Math.round((scrollOffset / maxScroll) * 100) : 0}%
          </div>
        </div>
      )}

      {/* 隐藏的测量容器 */}
      <div 
        ref={measureRef}
        className={getMeasureContainerStyles(isDark, editable)}
        style={{ width: 'calc(50% - 1px)', padding: '1.5rem 2rem' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* 书本容器 */}
      <div className={cn(
        "flex-1 flex min-h-0 rounded-xl overflow-hidden relative",
        "notes-reading-panel transition-colors duration-300",
        isDark ? "theme-dark" : "theme-light"
      )}>
        {/* 左页 */}
        <div 
          className="flex-1 overflow-hidden relative"
          onClick={handleClick}
        >
          <div 
            className={getDualPageContentStyles(isDark, editable, "left")}
            style={{ transform: `translateY(-${leftOffset}px)` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* 中缝分割线 */}
        <div className={cn(
          "w-[1px] flex-shrink-0 relative z-10",
          isDark ? "bg-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]" : "bg-black/10 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        )}>
          <div className={cn(
            "absolute inset-y-0 -left-4 w-4 pointer-events-none",
            isDark ? "bg-gradient-to-r from-transparent to-black/20" : "bg-gradient-to-r from-transparent to-black/[0.03]"
          )} />
          <div className={cn(
            "absolute inset-y-0 -right-4 w-4 pointer-events-none",
            isDark ? "bg-gradient-to-l from-transparent to-black/20" : "bg-gradient-to-l from-transparent to-black/[0.03]"
          )} />
        </div>

        {/* 右页 */}
        <div 
          className="flex-1 overflow-hidden relative"
          onClick={handleClick}
        >
          <div 
            className={getDualPageContentStyles(isDark, editable, "right")}
            style={{ transform: `translateY(-${rightOffset}px)` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
