/**
 * @file core/EventBus.ts
 * @description 模块间通信的事件总线
 */

type EventHandler = (data?: any) => void;

/**
 * 事件总线
 * 用于模块间解耦通信
 */
class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * 订阅事件
   * @param event 事件名
   * @param handler 处理函数
   * @returns 取消订阅函数
   */
  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * 取消订阅事件
   * @param event 事件名
   * @param handler 处理函数
   */
  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * 发布事件
   * @param event 事件名
   * @param data 事件数据
   */
  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`EventBus error in ${event}:`, error);
      }
    });
  }

  /**
   * 订阅一次性事件
   * @param event 事件名
   * @param handler 处理函数
   * @returns 取消订阅函数
   */
  once(event: string, handler: EventHandler): () => void {
    const wrapper = (data?: any) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取指定事件的监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// 单例模式
let instance: EventBus | null = null;

/**
 * 获取事件总线单例
 */
export function getEventBus(): EventBus {
  if (!instance) {
    instance = new EventBus();
  }
  return instance;
}

export { EventBus };
