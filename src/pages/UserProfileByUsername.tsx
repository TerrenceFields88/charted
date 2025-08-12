import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfileView } from '@/components/UserProfileView';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const UserProfileByUsername = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      document.title = `Profile • @${username}`;
    }
  }, [username]);

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      setLoading(true);
      // Fetch profile by username to get user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .maybeSingle();

      if (!error && data?.user_id) {
        setUserId(data.user_id);
      } else {
        setUserId(null);
      }
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">Loading…</h1>
          </div>
          <div className="text-center py-8 text-muted-foreground">Resolving @
            {username}
            ’s profile…
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">User Not Found</h1>
          </div>
          <p className="text-muted-foreground">We couldn’t find a profile for @
            {username}
            .</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <UserProfileView userId={userId} onBack={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default UserProfileByUsername;
