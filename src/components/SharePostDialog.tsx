import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/use-toast';
import { Search, Send } from 'lucide-react';

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const SharePostDialog = ({ open, onOpenChange, postId }: SharePostDialogProps) => {
  const { sharePostToUser, getUsersForSharing } = useDirectMessages();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedUsers(new Set());
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          user.username.toLowerCase().includes(query) ||
          (user.display_name && user.display_name.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsersForSharing();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleShare = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user to share with',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSharing(true);
      
      // Share with all selected users
      const sharePromises = Array.from(selectedUsers).map(userId =>
        sharePostToUser(postId, userId)
      );
      
      await Promise.all(sharePromises);
      
      toast({
        title: 'Success',
        description: `Post shared with ${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-64">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'No users found' : 'No users available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleUserToggle(user.user_id)}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.user_id)}
                      onCheckedChange={() => handleUserToggle(user.user_id)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {(user.display_name || user.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleShare}
              disabled={selectedUsers.size === 0 || sharing}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {sharing 
                ? 'Sharing...' 
                : `Share${selectedUsers.size > 0 ? ` (${selectedUsers.size})` : ''}`
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sharing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};