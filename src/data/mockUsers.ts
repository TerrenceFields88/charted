import { User, Post, CommunityPost } from '@/types/social';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'goldtrader_pro',
    displayName: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    followersCount: 15420,
    followingCount: 892,
    tradingLevel: 'Pro',
    portfolioReturn: 34.7,
    winRate: 73
  },
  {
    id: '2',
    username: 'sarah_forex',
    displayName: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face',
    isVerified: false,
    followersCount: 8930,
    followingCount: 1204,
    tradingLevel: 'Advanced',
    portfolioReturn: 18.3,
    winRate: 68
  },
  {
    id: '3',
    username: 'crypto_whale',
    displayName: 'Mike Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    followersCount: 23450,
    followingCount: 567,
    tradingLevel: 'Pro',
    portfolioReturn: 45.2,
    winRate: 71
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    user: mockUsers[0],
    content: "Gold breaking through $2040 resistance! 📈 Volume spike suggests strong momentum. My technical analysis shows potential target at $2085. What's your take? #GoldTrading #TechnicalAnalysis",
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    likes: 234,
    comments: 42,
    shares: 18,
    isLiked: false,
    type: 'chart',
    tags: ['gold', 'breakout', 'bullish'],
    symbol: 'GC',
    sentiment: 'bullish'
  },
  {
    id: '2',
    user: mockUsers[1],
    content: "EUR/USD looking bearish on the 4H chart. RSI oversold but trend is strong. Waiting for a bounce to short around 1.0850 resistance level. Risk management is key! 🔄",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    likes: 156,
    comments: 28,
    shares: 12,
    isLiked: true,
    type: 'analysis',
    tags: ['forex', 'eurusd', 'bearish'],
    symbol: 'EURUSD',
    sentiment: 'bearish'
  },
  {
    id: '3',
    user: mockUsers[2],
    content: "Just closed my Bitcoin position at $43,200 📊 Took profit at resistance as planned. Sometimes the best trade is taking profits when you have them. Market is telling us to be cautious here.",
    video: 'https://example.com/video1.mp4', // Would be actual video URL
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    likes: 892,
    comments: 157,
    shares: 94,
    isLiked: false,
    type: 'video',
    tags: ['bitcoin', 'profit', 'trade'],
    symbol: 'BTC',
    sentiment: 'neutral'
  }
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: '1',
    title: 'Best technical indicators for scalping futures?',
    content: "I've been scalping gold futures for 6 months now. Currently using EMA crossovers and volume profile. What indicators do you guys find most effective for quick entries/exits?",
    user: mockUsers[1],
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    upvotes: 47,
    downvotes: 3,
    comments: 23,
    category: 'question',
    tags: ['scalping', 'indicators', 'futures'],
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '2',
    title: 'Oil market analysis - OPEC+ meeting impact',
    content: "With OPEC+ announcing production cuts, crude oil looks bullish medium term. However, recession fears could cap upside. Here's my detailed analysis with key levels to watch...",
    user: mockUsers[0],
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    upvotes: 128,
    downvotes: 8,
    comments: 45,
    category: 'analysis',
    tags: ['oil', 'opec', 'analysis'],
    isUpvoted: true,
    isDownvoted: false
  }
];