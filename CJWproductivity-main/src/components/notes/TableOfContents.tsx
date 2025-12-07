import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, List, X, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocItem } from '@/hooks/useTableOfContents';

interface TableOfContentsProps {
  items: TocItem[];
  activeId: string;
  onItemClick: (item: TocItem) => void;
  onScrollToTop: () => void;
  onClose?: () => void;
  isDark: boolean;
  className?: string;
}

/**
 * 目录面板组件
 * - 分级显示 H1/H2/H3
 * - 当前位置高亮
 * - 可折叠子标题
 */
export const TableOfContents = memo(function TableOfContents({
  items,
  activeId,
  onItemClick,
  onScrollToTop,
  onClose,
  isDark,
  className,
}: TableOfContentsProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // 切换折叠状态
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 处理点击事件
  const handleItemClick = (item: TocItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onItemClick(item);
  };

  // 检查某个 H1 下是否有子标题
  const hasChildren = (index: number) => {
    const item = items[index];
    if (item.level !== 1) return false;
    
    for (let i = index + 1; i < items.length; i++) {
      if (items[i].level === 1) break;
      if (items[i].level > 1) return true;
    }
    return false;
  };

  // 检查某个子标题是否应该隐藏（父级折叠）
  const isHidden = (index: number) => {
    const item = items[index];
    if (item.level === 1) return false;
    
    for (let i = index - 1; i >= 0; i--) {
      if (items[i].level === 1) {
        return collapsed.has(items[i].id);
      }
    }
    return false;
  };

  if (items.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-6 text-center h-full",
        isDark ? "text-white/40" : "text-gray-400",
        className
      )}>
        <List className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">暂无目录</p>
        <p className="text-xs mt-1.5 opacity-60 leading-relaxed">
          添加 H1/H2/H3 标题<br/>后自动生成
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full select-none",
      isDark ? "text-white/90" : "text-gray-800",
      className
    )}>
      {/* 头部 */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b flex-shrink-0",
        isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50/50"
      )}>
        <div className="flex items-center gap-2">
          <List className={cn("w-4 h-4", isDark ? "text-[var(--neon-cyan)]" : "text-blue-500")} />
          <span className="font-semibold text-sm">目录</span>
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full font-medium",
            isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600"
          )}>
            {items.length}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDark 
                ? "text-white/50 hover:text-white hover:bg-white/10" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 目录列表 */}
      <div className="flex-1 overflow-auto py-3 toc-scrollbar px-3">
        <nav className="space-y-1">
          {items.map((item, index) => {
            if (isHidden(index)) return null;

            const isActive = item.id === activeId;
            const canCollapse = hasChildren(index);
            const isCollapsed = collapsed.has(item.id);

            return (
              <div
                key={`${item.id}-${index}`}
                onClick={(e) => handleItemClick(item, e)}
                className={cn(
                  "group flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer transition-all duration-200 relative",
                  // 缩进与层级样式
                  item.level === 1 && "mt-1", // H1 增加一点上间距
                  item.level === 2 && "ml-3 border-l border-transparent hover:border-white/10",
                  item.level === 3 && "ml-6 border-l border-transparent hover:border-white/10",
                  
                  // 激活态样式
                  isActive && (isDark 
                    ? "bg-white/10 text-[var(--neon-cyan)] shadow-[0_0_15px_-3px_rgba(0,255,255,0.2)] border border-[var(--neon-cyan)]/30 font-medium" 
                    : "bg-blue-50 text-blue-700 shadow-sm border border-blue-200 font-medium"
                  ),
                  
                  // 悬浮态（非激活）
                  !isActive && (isDark
                    ? "text-white/80 hover:text-white hover:bg-white/10 border border-transparent"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm border border-transparent"
                  )
                )}
              >
                {/* 激活指示点（仅在激活时显示） */}
                {isActive && (
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full",
                    isDark ? "bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]" : "bg-blue-600"
                  )} />
                )}

                {/* 折叠按钮或图标 */}
                {canCollapse ? (
                  <button
                    onClick={(e) => toggleCollapse(item.id, e)}
                    className={cn(
                      "p-0.5 rounded transition-colors flex-shrink-0 z-10",
                      isActive
                        ? (isDark ? "hover:bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "hover:bg-blue-200 text-blue-700")
                        : (isDark ? "text-white/60 hover:text-white hover:bg-white/15" : "text-gray-500 hover:text-gray-800 hover:bg-gray-200")
                    )}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  // H1 显示小圆点，其他级别显示占位
                  item.level === 1 ? (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0 mx-1",
                      isActive 
                        ? (isDark ? "bg-[var(--neon-cyan)]" : "bg-blue-600")
                        : (isDark ? "bg-white/40 group-hover:bg-white/80" : "bg-gray-400 group-hover:bg-gray-600")
                    )} />
                  ) : (
                    <span className="w-3.5 flex-shrink-0" />
                  )
                )}

                {/* 标题文本 */}
                <span
                  className={cn(
                    "flex-1 text-sm truncate transition-all duration-200",
                    item.level === 1 && "font-semibold text-[0.925rem]",
                    item.level === 2 && "font-medium",
                    item.level === 3 && "font-medium text-[0.85rem]",
                    // 未激活时，低级别标题透明度微调，不再过度降低
                    !isActive && item.level > 1 && (isDark ? "opacity-90" : "text-gray-500 group-hover:text-gray-800")
                  )}
                  title={item.text}
                >
                  {item.text}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部操作 */}
      <div className={cn(
        "px-3 py-3 border-t flex-shrink-0",
        isDark ? "border-white/10" : "border-gray-200"
      )}>
        <button
          onClick={(e) => {
            e.preventDefault();
            onScrollToTop();
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-150",
            isDark 
              ? "bg-white/5 hover:bg-[var(--neon-cyan)]/20 text-white/70 hover:text-[var(--neon-cyan)] border border-white/10 hover:border-[var(--neon-cyan)]/30" 
              : "bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200"
          )}
        >
          <ArrowUp className="w-4 h-4" />
          返回顶部
        </button>
      </div>
    </div>
  );
});

export default TableOfContents;
