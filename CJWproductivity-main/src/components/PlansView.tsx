/**
 * @file PlansView.tsx
 * @description 计划图片画廊视图
 * 
 * 功能：
 * 1. 瀑布流/网格布局展示手写计划图片
 * 2. 支持拖拽上传或点击上传
 * 3. 图片预览（Lightbox）
 * 4. 右键菜单编辑/删除
 * 5. 响应式布局
 */

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ImagePlus, Upload, X, Trash2, Edit3, 
  ZoomIn, ZoomOut, Calendar, FileImage,
  ChevronLeft, ChevronRight, RotateCw, Maximize, Minimize,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/useToast";
import { 
  usePlanImages, 
  useUploadPlanImage, 
  useDeletePlanImage,
  useUpdatePlanImageTitle,
  useUpdatePlanImageSortOrders,
  useImageSrc
} from "@/hooks/usePlanImages";
import type { PlanImage } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ============ 常量配置 ============

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// 获取图片的月份键
function getMonthKey(dateStr: string, locale: string = "zh-CN"): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { year: "numeric", month: "long" });
}

// ============ 主组件 ============

export const PlansView = memo(function PlansView() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  
  const { data: images = [], isLoading } = usePlanImages();
  const uploadMutation = useUploadPlanImage();
  const deleteMutation = useDeletePlanImage();
  const updateSortOrders = useUpdatePlanImageSortOrders();
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PlanImage | null>(null);
  const [localImages, setLocalImages] = useState<PlanImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 同步服务器数据到本地状态
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 拖拽结束处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localImages.findIndex(img => img.id === active.id);
      const newIndex = localImages.findIndex(img => img.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(localImages, oldIndex, newIndex);
        setLocalImages(newImages);
        
        // 更新排序顺序到数据库
        const orders = newImages.map((img, idx) => ({ id: img.id, sortOrder: idx + 1 }));
        updateSortOrders.mutate(orders);
      }
    }
  }, [localImages, updateSortOrders]);

  /**
   * 处理文件上传
   */
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // 验证文件类型
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: t("plans.unsupportedFormat"), variant: "destructive" });
        continue;
      }
      
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: t("plans.imageTooLarge"), variant: "destructive" });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);
        
        await uploadMutation.mutateAsync({
          input: {
            title: file.name.replace(/\.[^.]+$/, ""), // 去掉扩展名作为标题
            fileName: file.name,
          },
          imageData,
        });
        
        toast({ title: t("plans.uploadSuccess"), variant: "success" });
      } catch (error) {
        console.error("Upload failed:", error);
        toast({ title: t("plans.uploadFailed"), variant: "destructive" });
      }
    }
  }, [uploadMutation]);

  /**
   * 拖拽事件处理
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  }, [handleUpload]);

  /**
   * 删除图片
   */
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t("plans.deleted") });
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch {
      toast({ title: t("plans.deleteFailed"), variant: "destructive" });
    }
  }, [deleteMutation, selectedImage]);

  /**
   * Lightbox 导航
   */
  const handlePrevImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  }, [selectedImage, images]);

  const handleNextImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  }, [selectedImage, images]);

  // 键盘导航
  useEffect(() => {
    if (!selectedImage) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, handlePrevImage, handleNextImage]);

  // 粘贴上传 (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // 如果正在编辑输入框，不处理粘贴
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            // 生成带时间戳的文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const newFile = new File([file], `粘贴图片_${timestamp}.png`, { type: file.type });
            imageFiles.push(newFile);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        e.preventDefault();
        toast({ title: t("plans.uploadingPasted") });
        await handleUpload(imageFiles);
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleUpload]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
      </div>
    );
  }

  return (
    <div 
      className="h-full overflow-y-auto p-4 pt-2 plans-scrollbar"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
      />

      {/* 右上角添加按钮 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
            isDark 
              ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)]/30" 
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
          )}
        >
          <ImagePlus className="w-4 h-4" />
          添加计划
        </button>
      </div>

      {/* 拖拽提示遮罩 */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center",
              isDark ? "bg-black/80" : "bg-white/80"
            )}
          >
            <div className={cn(
              "text-center p-12 rounded-3xl border-4 border-dashed",
              isDark ? "border-[var(--neon-cyan)] text-[var(--neon-cyan)]" : "border-blue-500 text-blue-600"
            )}>
              <ImagePlus className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-bold">释放以上传图片</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图片列表区域 - 可拖拽排序 */}
      {localImages.length === 0 ? (
        <EmptyState isDark={isDark} onUpload={() => fileInputRef.current?.click()} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localImages.map(img => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="space-y-6 pb-10">
              {/* 按月份分组显示 */}
              {(() => {
                const groups: { month: string; images: PlanImage[] }[] = [];
                let currentMonth = "";
                
                localImages.forEach(img => {
                  const month = getMonthKey(img.createdAt);
                  if (month !== currentMonth) {
                    currentMonth = month;
                    groups.push({ month, images: [img] });
                  } else {
                    groups[groups.length - 1].images.push(img);
                  }
                });
                
                return groups.map((group, groupIndex) => (
                  <div key={group.month + groupIndex}>
                    {/* 月份标题 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        isDark ? "bg-[var(--neon-cyan)]" : "bg-blue-500"
                      )} />
                      <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                        {group.month}
                      </h2>
                      <span className={cn(
                        "text-sm px-2 py-0.5 rounded-full font-medium",
                        isDark ? "bg-white/10 text-white/50" : "bg-gray-200 text-gray-600"
                      )}>
                        {group.images.length} 张
                      </span>
                    </div>
                    
                    {/* 图片网格 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.images.map((image, index) => (
                        <SortableImageCard
                          key={image.id}
                          image={image}
                          isDark={isDark}
                          index={index}
                          onClick={() => setSelectedImage(image)}
                          onDelete={() => handleDelete(image.id)}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Lightbox 预览 */}
      <AnimatePresence>
        {selectedImage && (
          <Lightbox
            image={selectedImage}
            isDark={isDark}
            onClose={() => setSelectedImage(null)}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            onDelete={() => handleDelete(selectedImage.id)}
            hasMultiple={images.length > 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

// ============ 空状态组件 ============

const EmptyState = memo(function EmptyState({ 
  isDark, 
  onUpload 
}: { 
  isDark: boolean; 
  onUpload: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed",
      isDark ? "border-white/10 text-white/40" : "border-gray-200 text-gray-400"
    )}>
      <FileImage className="w-20 h-20 mb-6 opacity-50" />
      <h3 className="text-xl font-semibold mb-2">{t("plans.noImages")}</h3>
      <p className="text-sm mb-6">{t("plans.uploadFirst")}</p>
      <button
        onClick={onUpload}
        className={cn(
          "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
          isDark 
            ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30" 
            : "bg-blue-100 text-blue-600 hover:bg-blue-200"
        )}
      >
        <Upload className="w-5 h-5" />
        {t("plans.clickOrDrop")}
      </button>
      <p className={cn("text-xs mt-4", isDark ? "text-white/30" : "text-gray-400")}>
        {t("plans.supportedFormats")}
      </p>
    </div>
  );
});

// ============ 可拖拽图片卡片 ============

const SortableImageCard = memo(function SortableImageCard({
  image,
  isDark,
  index,
  onClick,
  onDelete,
}: {
  image: PlanImage;
  isDark: boolean;
  index: number;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ImageCard
        image={image}
        isDark={isDark}
        index={index}
        onClick={onClick}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
});

// ============ 图片卡片组件 ============

const ImageCard = memo(function ImageCard({
  image,
  isDark,
  index,
  onClick,
  onDelete,
  isDragging = false,
}: {
  image: PlanImage;
  isDark: boolean;
  index: number;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}) {
  const { data: imageSrc } = useImageSrc(image.imagePath);
  const { language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const locale = language === "zh-CN" ? "zh-CN" : language === "ja-JP" ? "ja-JP" : "en-US";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, { 
      month: "numeric", 
      day: "numeric",
      weekday: "short"
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        "group relative rounded-xl overflow-hidden",
        "transition-all duration-300",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        isDark 
          ? "bg-[#1a1a1f] hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)]" 
          : "bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        isDragging && "ring-2 ring-[var(--neon-cyan)] shadow-lg"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 图片 - 自适应完整展示 */}
      <div className="relative overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={image.title}
            className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "w-full aspect-square flex flex-col items-center justify-center gap-2",
            isDark ? "bg-white/5" : "bg-gray-100"
          )}>
            <FileImage className={cn("w-12 h-12", isDark ? "text-white/20" : "text-gray-300")} />
            <span className={cn("text-xs text-center px-2", isDark ? "text-white/30" : "text-gray-400")}>
              Image missing
            </span>
          </div>
        )}

        {/* 悬浮删除按钮 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white/80 hover:bg-red-500 hover:text-white transition-all backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/90">
                <ZoomIn className="w-4 h-4" />
                <span className="text-sm font-medium">查看</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部日期 */}
      <div className={cn(
        "px-3 py-2.5 flex items-center gap-2",
        isDark ? "text-white/50" : "text-gray-500"
      )}>
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">{formatDate(image.createdAt)}</span>
      </div>
    </motion.div>
  );
});

// ============ Lightbox 预览组件 (增强版) ============

const Lightbox = memo(function Lightbox({
  image,
  onClose,
  onPrev,
  onNext,
  onDelete,
  hasMultiple,
}: {
  image: PlanImage;
  isDark?: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  hasMultiple: boolean;
}) {
  const { data: imageSrc } = useImageSrc(image.imagePath);
  const updateTitle = useUpdatePlanImageTitle();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(image.title);
  
  // 增强功能状态
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);

  // 旋转控制
  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  // 全屏控制
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "r" || e.key === "R") handleRotate();
      if (e.key === "0") handleResetZoom();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "i" || e.key === "I") setShowInfo(prev => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleResetZoom, toggleFullscreen]);

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== image.title) {
      try {
        await updateTitle.mutateAsync({ id: image.id, title: editTitle.trim() });
        toast({ title: t("plans.titleUpdated") });
      } catch {
        toast({ title: t("plans.updateFailed"), variant: "destructive" });
      }
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* 顶部工具栏 */}
      <div 
        className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧：缩放比例 */}
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span className="px-2 py-1 bg-white/10 rounded">{Math.round(scale * 100)}%</span>
          {rotation !== 0 && <span className="px-2 py-1 bg-white/10 rounded">{rotation}°</span>}
        </div>
        
        {/* 中间：工具按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t("plans.zoomOut")}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t("plans.zoomIn")}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t("plans.rotate")}
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title={t("plans.fullscreen")}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className={cn(
              "p-2 rounded-lg text-white transition-colors",
              showInfo ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
            )}
            title={t("plans.info")}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
        
        {/* 右侧：关闭按钮 */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 导航按钮 */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* 图片容器 - 支持缩放和旋转 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative select-none"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onDoubleClick={handleResetZoom}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt={image.title}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            draggable={false}
          />
        )}
      </motion.div>

      {/* 信息面板 */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-20 w-64 p-4 rounded-xl bg-black/80 backdrop-blur-sm text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3 text-white/90">图片信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">标题</span>
                <span className="text-white/90 truncate ml-2 max-w-[120px]">{image.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">创建时间</span>
                <span className="text-white/90">{new Date(image.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">缩放</span>
                <span className="text-white/90">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">旋转</span>
                <span className="text-white/90">{rotation}°</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/40">
              <p>快捷键：+/- 缩放 · R 旋转</p>
              <p>F 全屏 · 双击重置 · 滚轮缩放</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部信息栏 */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-2xl mx-auto">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              className="w-full bg-white/10 text-white text-xl font-semibold px-4 py-2 rounded-lg outline-none"
              autoFocus
            />
          ) : (
            <h2 
              className="text-xl font-semibold text-white mb-2 cursor-pointer hover:text-white/80"
              onClick={() => { setEditTitle(image.title); setIsEditing(true); }}
            >
              {image.title}
              <Edit3 className="w-4 h-4 inline ml-2 opacity-50" />
            </h2>
          )}
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span>{new Date(image.createdAt).toLocaleString("zh-CN")}</span>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default PlansView;