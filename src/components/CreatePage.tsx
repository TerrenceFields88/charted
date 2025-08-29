import { CreatePostForm } from '@/components/CreatePostForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';

export const CreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Show login prompt for guests
  if (!user) {
    return (
      <div className="pb-20">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
          <h1 className="text-xl font-bold">Create Post</h1>
        </div>
        <div className="px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Share Your Trading Insights</h2>
                <p className="text-muted-foreground mb-4">
                  Join the community to create posts and share your trading analysis
                </p>
                <Button onClick={() => navigate('/auth')}>
                  <Users className="w-4 h-4 mr-2" />
                  Sign Up / Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <h1 className="text-xl font-bold">Create Post</h1>
      </div>

      <div className="px-4 py-6">
        <CreatePostForm />
      </div>
    </div>
  );
};