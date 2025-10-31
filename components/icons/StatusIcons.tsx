import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Zap,
  ZapOff,
  HelpCircle,
  Palette,
  Eye,
  CheckCircle,
} from "lucide-react";

interface IconProps {
  className?: string;
  size?: number;
}

export const StatusIcons = {
  Success: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <CheckCircle2 className={className} size={size} />
  ),

  Error: ({ className = "w-4 h-4 text-red-500", size }: IconProps) => (
    <XCircle className={className} size={size} />
  ),

  Warning: ({ className = "w-4 h-4 text-yellow-500", size }: IconProps) => (
    <AlertCircle className={className} size={size} />
  ),

  Info: ({ className = "w-4 h-4 text-blue-500", size }: IconProps) => (
    <Info className={className} size={size} />
  ),

  Loading: ({
    className = "w-4 h-4 animate-spin text-gray-500",
    size,
  }: IconProps) => <Loader2 className={className} size={size} />,

  Online: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <Wifi className={className} size={size} />
  ),

  Offline: ({ className = "w-4 h-4 text-red-500", size }: IconProps) => (
    <WifiOff className={className} size={size} />
  ),

  FullBattery: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <Battery className={className} size={size} />
  ),

  LowBattery: ({ className = "w-4 h-4 text-red-500", size }: IconProps) => (
    <BatteryLow className={className} size={size} />
  ),

  SignalStrong: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <SignalHigh className={className} size={size} />
  ),

  SignalMedium: ({
    className = "w-4 h-4 text-yellow-500",
    size,
  }: IconProps) => <SignalMedium className={className} size={size} />,

  SignalWeak: ({ className = "w-4 h-4 text-red-500", size }: IconProps) => (
    <SignalLow className={className} size={size} />
  ),

  SignalNone: ({ className = "w-4 h-4 text-gray-400", size }: IconProps) => (
    <Signal className={className} size={size} />
  ),

  Active: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <Zap className={className} size={size} />
  ),

  Inactive: ({ className = "w-4 h-4 text-gray-400", size }: IconProps) => (
    <ZapOff className={className} size={size} />
  ),

  Unknown: ({ className = "w-4 h-4 text-gray-400", size }: IconProps) => (
    <HelpCircle className={className} size={size} />
  ),

  Theme: ({ className = "w-4 h-4", size }: IconProps) => (
    <Palette className={className} size={size} />
  ),

  Preview: ({ className = "w-4 h-4", size }: IconProps) => (
    <Eye className={className} size={size} />
  ),

  Valid: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <CheckCircle className={className} size={size} />
  ),
};
