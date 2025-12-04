/**
 * @file SuccessAnimation.tsx
 * @description 保存成功动画组件
 */

import { memo, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessAnimationProps {
  onComplete: () => void;
}

export const SuccessAnimation = memo(function SuccessAnimation({
  onComplete,
}: SuccessAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-[28px] z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
      >
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
});
