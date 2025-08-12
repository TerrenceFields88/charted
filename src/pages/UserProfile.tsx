import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfileView } from '@/components/UserProfileView';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = userId ? `Profile • ${userId}` : 'Profile';
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <UserProfileView userId={userId} onBack={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default UserProfile;
