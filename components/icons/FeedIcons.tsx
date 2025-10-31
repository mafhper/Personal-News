import {
  Rss,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  AlertTriangle,
  Clock,
  Globe,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

interface IconProps {
  className?: string;
  size?: number;
}

export const FeedIcons = {
  RSS: ({ className = "w-4 h-4", size }: IconProps) => (
    <Rss className={className} size={size} />
  ),

  Valid: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <CheckCircle className={className} size={size} />
  ),

  Invalid: ({ className = "w-4 h-4 text-red-500", size }: IconProps) => (
    <XCircle className={className} size={size} />
  ),

  Loading: ({ className = "w-4 h-4 animate-spin", size }: IconProps) => (
    <Loader2 className={className} size={size} />
  ),

  Discovery: ({ className = "w-4 h-4", size }: IconProps) => (
    <Search className={className} size={size} />
  ),

  Warning: ({ className = "w-4 h-4 text-yellow-500", size }: IconProps) => (
    <AlertTriangle className={className} size={size} />
  ),

  Pending: ({ className = "w-4 h-4 text-gray-400", size }: IconProps) => (
    <Clock className={className} size={size} />
  ),

  Online: ({ className = "w-4 h-4 text-green-500", size }: IconProps) => (
    <Globe className={className} size={size} />
  ),

  Favorite: ({ className = "w-4 h-4", size }: IconProps) => (
    <Bookmark className={className} size={size} />
  ),

  FavoriteActive: ({
    className = "w-4 h-4 text-yellow-500",
    size,
  }: IconProps) => <BookmarkCheck className={className} size={size} />,
};
