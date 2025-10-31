import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Save,
  X,
  Check,
  Copy,
  ExternalLink,
  Settings,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  Grid3X3,
  List,
  CheckSquare,
  Square,
} from "lucide-react";

interface IconProps {
  className?: string;
  size?: number;
}

export const ActionIcons = {
  Add: ({ className = "w-4 h-4", size }: IconProps) => (
    <Plus className={className} size={size} />
  ),

  Edit: ({ className = "w-4 h-4", size }: IconProps) => (
    <Edit2 className={className} size={size} />
  ),

  Delete: ({ className = "w-4 h-4", size }: IconProps) => (
    <Trash2 className={className} size={size} />
  ),

  Retry: ({ className = "w-4 h-4", size }: IconProps) => (
    <RefreshCw className={className} size={size} />
  ),

  Export: ({ className = "w-4 h-4", size }: IconProps) => (
    <Download className={className} size={size} />
  ),

  Import: ({ className = "w-4 h-4", size }: IconProps) => (
    <Upload className={className} size={size} />
  ),

  Save: ({ className = "w-4 h-4", size }: IconProps) => (
    <Save className={className} size={size} />
  ),

  Close: ({ className = "w-4 h-4", size }: IconProps) => (
    <X className={className} size={size} />
  ),

  Confirm: ({ className = "w-4 h-4", size }: IconProps) => (
    <Check className={className} size={size} />
  ),

  Copy: ({ className = "w-4 h-4", size }: IconProps) => (
    <Copy className={className} size={size} />
  ),

  ExternalLink: ({ className = "w-4 h-4", size }: IconProps) => (
    <ExternalLink className={className} size={size} />
  ),

  Settings: ({ className = "w-4 h-4", size }: IconProps) => (
    <Settings className={className} size={size} />
  ),

  More: ({ className = "w-4 h-4", size }: IconProps) => (
    <MoreVertical className={className} size={size} />
  ),

  Filter: ({ className = "w-4 h-4", size }: IconProps) => (
    <Filter className={className} size={size} />
  ),

  SortAsc: ({ className = "w-4 h-4", size }: IconProps) => (
    <SortAsc className={className} size={size} />
  ),

  SortDesc: ({ className = "w-4 h-4", size }: IconProps) => (
    <SortDesc className={className} size={size} />
  ),

  Show: ({ className = "w-4 h-4", size }: IconProps) => (
    <Eye className={className} size={size} />
  ),

  Hide: ({ className = "w-4 h-4", size }: IconProps) => (
    <EyeOff className={className} size={size} />
  ),

  Search: ({ className = "w-4 h-4", size }: IconProps) => (
    <Search className={className} size={size} />
  ),

  Refresh: ({ className = "w-4 h-4", size }: IconProps) => (
    <RotateCcw className={className} size={size} />
  ),

  Grid: ({ className = "w-4 h-4", size }: IconProps) => (
    <Grid3X3 className={className} size={size} />
  ),

  List: ({ className = "w-4 h-4", size }: IconProps) => (
    <List className={className} size={size} />
  ),

  CheckSquare: ({ className = "w-4 h-4", size }: IconProps) => (
    <CheckSquare className={className} size={size} />
  ),

  Square: ({ className = "w-4 h-4", size }: IconProps) => (
    <Square className={className} size={size} />
  ),
};
