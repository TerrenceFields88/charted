export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  tradingLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  portfolioReturn: number; // percentage
  winRate: number; // percentage
}

export interface Post {
  id: string;
  user: User;
  content: string;
  image?: string;
  video?: string;
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  type: 'text' | 'image' | 'video' | 'chart' | 'analysis';
  tags: string[];
  symbol?: string; // Associated trading symbol
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  user: User;
  timestamp: Date;
  upvotes: number;
  downvotes: number;
  comments: number;
  category: 'discussion' | 'analysis' | 'news' | 'question' | 'strategy';
  tags: string[];
  isUpvoted: boolean;
  isDownvoted: boolean;
}