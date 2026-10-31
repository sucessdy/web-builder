import {
  Bold,
  Check,
  ChevronDown,
  Code,
  Download,
  Eye,
  Grid2X2,
  Image,
  Layers,
  Link,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Plus,
  Redo2,
  Search,
  Settings,
  Smartphone,
  Sparkles,
  Type,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";

const icons = {
  grid: Grid2X2,
  layers: Layers,
  type: Type,
  text: Type,
  image: Image,
  plus: Plus,
  search: Search,
  undo: Undo2,
  redo: Redo2,
  desktop: Monitor,
  mobile: Smartphone,
  eye: Eye,
  download: Download,
  chevron: ChevronDown,
  more: MoreHorizontal,
  settings: Settings,
  cursor: MousePointer2,
  bold: Bold,
  link: Link,
  close: X,
  check: Check,
  sparkles: Sparkles,
  code: Code,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const LucideComponent = icons[name];
  return (
    <LucideComponent
      size={size}
      strokeWidth={1.7}
      className={className}
      aria-hidden="true"
    />
  );
}
