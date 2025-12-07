/**
 * @file CheckIcon.tsx
 * @description 完成勾选图标
 */

interface CheckIconProps {
  color: string;
  size?: number;
}

export const CheckIcon = ({ color, size = 14 }: CheckIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <path d="M8 12.5L10.5 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
