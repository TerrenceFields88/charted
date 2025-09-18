import { useState } from 'react';
import { Plus } from 'lucide-react';
import { StoryRing } from '@/components/StoryRing';
import { StoryViewer } from '@/components/StoryViewer';
import { CreateStoryDialog } from '@/components/CreateStoryDialog';
import { useStories, Story } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';

export const StoriesBar = () => {
  const { user } = useAuth();
  const { stories } = useStories();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  // Get user groups (each user who has stories)
  const userGroups = Object.entries(groupedStories).map(([userId, userStories]) => {
    const firstStory = userStories[0];
    return {
      userId,
      stories: userStories,
      profile: firstStory.profiles,
      hasStory: true
    };
  });

  // Flatten all stories for the viewer
  const allStories = stories.map(story => ({
    id: story.id,
    user_id: story.user_id,
    username: story.profiles.username,
    display_name: story.profiles.display_name,
    avatar_url: story.profiles.avatar_url,
    content: story.content,
    media_url: story.image_url,
    media_type: story.image_url?.includes('.mp4') || story.image_url?.includes('.mov') ? 'video' as const : 'image' as const,
    created_at: story.created_at,
    expires_at: story.expires_at,
  }));

  const handleStoryClick = (userIndex: number) => {
    // Find the starting index for this user's stories in the flattened array
    let startIndex = 0;
    for (let i = 0; i < userIndex; i++) {
      startIndex += userGroups[i].stories.length;
    }
    setSelectedStoryIndex(startIndex);
  };

  const handleAddStory = () => {
    if (!user) return;
    setShowCreateDialog(true);
  };

  if (userGroups.length === 0 && !user) {
    return null;
  }

  return (
    <>
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ScrollArea className="w-full">
          <div className="flex items-center space-x-4 p-4 min-w-max">
            {/* Add Story Button (Your Story) */}
            {user && (
              <div className="flex flex-col items-center space-y-1">
                <div
                  className="relative cursor-pointer transition-transform hover:scale-105"
                  onClick={handleAddStory}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-center max-w-[80px] truncate">
                  Your Story
                </p>
              </div>
            )}

            {/* Story Rings */}
            {userGroups.map((userGroup, index) => (
              <StoryRing
                key={userGroup.userId}
                avatarUrl={userGroup.profile.avatar_url}
                username={userGroup.profile.username}
                displayName={userGroup.profile.display_name}
                hasStory={true}
                onClick={() => handleStoryClick(index)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Story Viewer */}
      <StoryViewer
        open={selectedStoryIndex !== null}
        onOpenChange={(open) => !open && setSelectedStoryIndex(null)}
        stories={allStories}
        initialStoryIndex={selectedStoryIndex || 0}
      />

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
};