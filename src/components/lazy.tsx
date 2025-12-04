import { lazy, Suspense, type ComponentType } from "react";

// 懒加载组件工厂
function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(factory);
  return {
    Component: LazyComponent,
    preload: factory,
  };
}

// 懒加载的视图组件
export const LazyPlansView = lazyWithPreload(
  () => import("./PlansView").then((m) => ({ default: m.PlansView }))
);

// 加载占位符
export function ViewSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div 
          className="w-8 h-8 rounded-lg animate-pulse"
          style={{
            background: "rgba(0, 255, 255, 0.1)",
            border: "1px solid rgba(0, 255, 255, 0.2)",
          }}
        />
        <span className="text-white/30 text-sm">加载中...</span>
      </div>
    </div>
  );
}

// Suspense 包装器
export function SuspenseView({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ViewSkeleton />}>{children}</Suspense>;
}
