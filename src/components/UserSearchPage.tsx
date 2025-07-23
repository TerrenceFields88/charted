import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, MessageCircle, Clock, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserProfileView } from '@/components/UserProfileView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeProfiles, useRealTimeFollows } from '@/hooks/useRealTimeUpdates';
import { toast } from '@/hooks/use-toast';
import { validateContent, sanitizeContent, sanitizeErrorMessage, VALIDATION_LIMITS } from '@/lib/validation';
import { getRecentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch, RecentSearch } from '@/lib/recentSearches';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

interface UserSearchPageProps {
  onUserSelect?: (userId: string) => void;
}

export const UserSearchPage = ({ onUserSelect }: UserSearchPageProps) => {
  const { user } = useAuth();
  const { getUpdatedProfile, hasUpdate } = useRealTimeProfiles();
  const { getFollowStatus, hasUpdate: hasFollowUpdate } = useRealTimeFollows(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Real-time updates for search results
  useEffect(() => {
    if (searchResults.length > 0) {
      setSearchResults(prevResults => 
        prevResults.map(profile => {
          // Check for real-time profile updates
          if (hasUpdate(profile.user_id)) {
            const updatedProfile = getUpdatedProfile(profile.user_id);
            if (updatedProfile) {
              return {
                ...profile,
                follower_count: updatedProfile.follower_count,
                following_count: updatedProfile.following_count,
                display_name: updatedProfile.display_name,
                bio: updatedProfile.bio,
                avatar_url: updatedProfile.avatar_url,
              };
            }
          }
          return profile;
        })
      );
    }
  }, [searchResults, hasUpdate, getUpdatedProfile]);

  // Update following status from real-time
  useEffect(() => {
    if (user) {
      setFollowingUsers(prevFollowing => {
        const newFollowing = new Set(prevFollowing);
        
        // Check for real-time follow updates
        searchResults.forEach(profile => {
          if (hasFollowUpdate(profile.user_id)) {
            const followStatus = getFollowStatus(profile.user_id);
            if (followStatus !== null) {
              if (followStatus) {
                newFollowing.add(profile.user_id);
              } else {
                newFollowing.delete(profile.user_id);
              }
            }
          }
        });
        
        return newFollowing;
      });
    }
  }, [user, searchResults, hasFollowUpdate, getFollowStatus]);

  // Load recent searches on component mount
  useEffect(() => {
    const recent = getRecentSearches();
    setRecentSearches(recent);
  }, []);

  // Fetch users the current user is following
  useEffect(() => {
    if (user) {
      fetchFollowingUsers();
    }
  }, [user]);

  const fetchFollowingUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;

      setFollowingUsers(new Set(data.map(follow => follow.following_id)));
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Validate search query
    if (value.trim() && value.trim().length > 100) {
      setSearchError('Search query too long');
      return;
    }
    
    setSearchError(null);
    
    // Debounce search
    if (value.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch(value.trim());
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  };

  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const sanitizedQuery = sanitizeContent(query);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`)
        .neq('user_id', user?.id || '') // Exclude current user
        .limit(20)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Search Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const isFollowing = followingUsers.has(targetUserId);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });

        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });

        if (error) throw error;

        setFollowingUsers(prev => new Set([...prev, targetUserId]));

        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const handleViewProfile = (profile: UserProfile) => {
    // Add to recent searches
    addRecentSearch({
      user_id: profile.user_id,
      username: profile.username,
      display_name: profile.display_name || undefined,
      avatar_url: profile.avatar_url || undefined,
      searched_at: new Date().toISOString()
    });
    
    // Update local state
    setRecentSearches(getRecentSearches());
    
    setSelectedUserId(profile.user_id);
  };

  const handleViewRecentProfile = (recent: RecentSearch) => {
    setSelectedUserId(recent.user_id);
  };

  const handleClearRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
    toast({
      title: "Cleared",
      description: "Recent searches have been cleared.",
    });
  };

  const handleRemoveRecentSearch = (userId: string) => {
    removeRecentSearch(userId);
    setRecentSearches(getRecentSearches());
  };

  // If a user is selected, show their profile
  if (selectedUserId) {
    return (
      <UserProfileView 
        userId={selectedUserId} 
        onBack={() => setSelectedUserId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Discover Users</h1>
        </div>
        <p className="text-muted-foreground">
          Find and connect with other traders and market enthusiasts
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by username or display name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={`pl-10 ${searchError ? 'border-destructive' : ''}`}
          maxLength={100}
        />
        {searchError && (
          <p className="text-sm text-destructive mt-1">{searchError}</p>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {/* Recent Searches - Show when no search query */}
        {!loading && searchQuery.length === 0 && recentSearches.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Searches
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRecentSearches}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSearches.map((recent) => (
                <div
                  key={recent.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                  onClick={() => handleViewRecentProfile(recent)}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={recent.avatar_url || undefined} />
                    <AvatarFallback>
                      {recent.display_name?.[0] || recent.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {recent.display_name || recent.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{recent.username}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveRecentSearch(recent.user_id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Searching users...</p>
          </div>
        )}

        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
          </div>
        )}

        {!loading && searchQuery.length > 0 && searchQuery.length < 2 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Type at least 2 characters to search</p>
          </div>
        )}

        {!loading && searchQuery.length === 0 && recentSearches.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Start typing to search for users</p>
            <p className="text-sm text-muted-foreground">
              Your recent searches will appear here
            </p>
          </div>
        )}

        {searchResults.map((profile) => {
          const isFollowing = followingUsers.has(profile.user_id);
          
          return (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.display_name?.[0] || profile.username[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {profile.display_name || profile.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{profile.username}
                        </p>
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      {/* Follow Button */}
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollow(profile.user_id)}
                        className="flex-shrink-0"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                    </div>

                    {/* Stats and Date */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{profile.follower_count} followers</span>
                        <span>{profile.following_count} following</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Joined {formatDate(profile.created_at)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProfile(profile)}
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};