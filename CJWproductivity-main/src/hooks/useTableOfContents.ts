import { useState, useEffect, useCallback, useRef } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
}

interface UseTableOfContentsOptions {
  containerRef: React.RefObject<HTMLElement>;
  content: string;
  enabled?: boolean;
}

/**
 * 目录解析和滚动同步 Hook
 */
export function useTableOfContents({ containerRef, content, enabled = true }: UseTableOfContentsOptions) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 从 HTML 内容解析目录
  const parseContent = useCallback((html: string): TocItem[] => {
    const headingRegex = /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi;
    const result: TocItem[] = [];
    let match;
    let counter = 0;

    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1]);
      const attrs = match[2];
      const innerHTML = match[3];
      
      // 清理文本：移除 HTML 标签和特殊字符
      let text = innerHTML
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
      
      // 跳过空标题和"目录"标题
      if (!text || text === '目录') continue;
      
      // 提取已有 ID
      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      const existingId = idMatch ? idMatch[1] : null;
      
      // 生成稳定的 ID
      counter++;
      const id = existingId || `toc-heading-${counter}`;
      
      result.push({ id, text, level });
    }

    return result;
  }, []);

  // 解析内容生成目录
  useEffect(() => {
    if (!enabled || !content) {
      setItems([]);
      return;
    }
    
    const parsed = parseContent(content);
    setItems(parsed);
  }, [content, enabled, parseContent]);

  // 设置 IntersectionObserver 监听滚动位置
  useEffect(() => {
    if (!enabled || !containerRef.current || items.length === 0) return;

    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const headings: HTMLElement[] = [];
    items.forEach(item => {
      const el = containerRef.current?.querySelector(`[id="${item.id}"]`) as HTMLElement;
      if (el) {
        headings.push(el);
        item.element = el;
      }
    });

    if (headings.length === 0) return;

    // 创建 observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 找到最靠近顶部的可见标题
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // 按 boundingClientRect.top 排序，取最靠近顶部的
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topEntry = visibleEntries[0];
          const id = topEntry.target.getAttribute('id');
          if (id) setActiveId(id);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '-10% 0px -80% 0px', // 顶部 10% 区域触发
        threshold: 0,
      }
    );

    headings.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items, enabled, containerRef]);

  // 跳转到指定标题
  const scrollToItem = useCallback((item: TocItem) => {
    let el: Element | null = null;
    const normalizedText = item.text.replace(/\s+/g, ' ').trim();
    
    // 1. 在 .ProseMirror 编辑器容器内查找（Tiptap 渲染的内容）
    const proseMirror = document.querySelector('.ProseMirror');
    if (proseMirror) {
      const headings = proseMirror.querySelectorAll('h1, h2, h3');
      for (const heading of headings) {
        const headingText = (heading.textContent || '').replace(/\s+/g, ' ').trim();
        if (headingText === normalizedText) {
          el = heading;
          break;
        }
      }
      // 部分匹配
      if (!el) {
        for (const heading of headings) {
          const headingText = (heading.textContent || '').replace(/\s+/g, ' ').trim();
          if (headingText.includes(normalizedText) || normalizedText.includes(headingText)) {
            el = heading;
            break;
          }
        }
      }
    }
    
    // 2. 全局查找（备用）
    if (!el) {
      const headings = document.querySelectorAll('h1, h2, h3');
      for (const heading of headings) {
        const headingText = (heading.textContent || '').replace(/\s+/g, ' ').trim();
        if (headingText === normalizedText || headingText.includes(normalizedText)) {
          el = heading;
          break;
        }
      }
    }
    
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 高亮动画
      el.classList.add('anchor-highlight');
      setTimeout(() => el!.classList.remove('anchor-highlight'), 2000);
      setActiveId(item.id);
    }
  }, []);

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    // 查找实际的滚动容器
    const scrollContainer = containerRef.current?.querySelector('.overflow-auto, .overflow-y-auto') as HTMLElement
      || containerRef.current;
    
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [containerRef]);

  return {
    items,
    activeId,
    scrollToItem,
    scrollToTop,
    hasItems: items.length > 0,
  };
}
