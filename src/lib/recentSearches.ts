// Recent searches utility functions
const RECENT_SEARCHES_KEY = 'recent_user_searches';
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearch {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  searched_at: string;
}

export const getRecentSearches = (): RecentSearch[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

export const addRecentSearch = (user: RecentSearch): void => {
  try {
    const recentSearches = getRecentSearches();
    
    // Remove if already exists (to move to top)
    const filtered = recentSearches.filter(item => item.user_id !== user.user_id);
    
    // Add to beginning
    const updated = [
      { ...user, searched_at: new Date().toISOString() },
      ...filtered
    ].slice(0, MAX_RECENT_SEARCHES); // Keep only the most recent
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};

export const removeRecentSearch = (userId: string): void => {
  try {
    const recentSearches = getRecentSearches();
    const filtered = recentSearches.filter(item => item.user_id !== userId);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing recent search:', error);
  }
};