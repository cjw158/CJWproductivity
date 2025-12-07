/**
 * @file CircleIcon.tsx
 * @description 空心圆图标
 */

interface CircleIconProps {
  color: string;
  size?: number;
}

export const CircleIcon = ({ color, size = 14 }: CircleIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
  </svg>
);
