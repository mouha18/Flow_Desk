import React from "react";
import { ViewStyle } from "react-native";
import { colors } from "../../constants/colors";

// Import individual Lucide icons (tree-shakeable)
import {
  Home,
  LayoutDashboard,
  FileText,
  ClipboardList,
  MessageCircle,
  Bell,
  User,
  Wallet,
  Settings,
  PenLine,
  Check,
  Plus,
  Handshake,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Clock,
  DollarSign,
  Briefcase,
  Building2,
  Filter,
  SortAsc,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Mail,
  Phone,
  Calendar,
  Star,
  Heart,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Receipt,
  CreditCard,
  type LucideProps,
} from "lucide-react-native";

const iconMap = {
  home: Home,
  dashboard: LayoutDashboard,
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  "message-circle": MessageCircle,
  bell: Bell,
  user: User,
  wallet: Wallet,
  settings: Settings,
  "pen-line": PenLine,
  check: Check,
  plus: Plus,
  handshake: Handshake,
  search: Search,
  "log-out": LogOut,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  x: X,
  send: Send,
  clock: Clock,
  "dollar-sign": DollarSign,
  briefcase: Briefcase,
  building: Building2,
  filter: Filter,
  "sort-asc": SortAsc,
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  info: Info,
  mail: Mail,
  phone: Phone,
  calendar: Calendar,
  star: Star,
  heart: Heart,
  eye: Eye,
  "eye-off": EyeOff,
  trash: Trash2,
  edit: Edit3,
  "more-horizontal": MoreHorizontal,
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  receipt: Receipt,
  "credit-card": CreditCard,
} as const;

export type IconName = keyof typeof iconMap;

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

export function Icon({
  name,
  size = "md",
  color = colors.gray700,
  strokeWidth = 2,
  style,
}: IconProps) {
  const LucideIcon = iconMap[name];
  const resolvedSize = typeof size === "number" ? size : sizeMap[size];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  return (
    <LucideIcon
      size={resolvedSize}
      color={color}
      strokeWidth={strokeWidth}
      style={style as any}
    />
  );
}
