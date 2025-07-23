-- Create triggers to automatically update follower/following counts in real-time

-- Function to update follower count when someone follows/unfollows
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the followed user
    UPDATE profiles 
    SET follower_count = follower_count + 1 
    WHERE user_id = NEW.following_id;
    
    -- Increment following count for the follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for the unfollowed user
    UPDATE profiles 
    SET follower_count = GREATEST(follower_count - 1, 0) 
    WHERE user_id = OLD.following_id;
    
    -- Decrement following count for the unfollower
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE user_id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for follow/unfollow actions
DROP TRIGGER IF EXISTS trigger_update_follower_count ON follows;
CREATE TRIGGER trigger_update_follower_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_count();

-- Enable realtime for profiles table
ALTER TABLE profiles REPLICA IDENTITY FULL;