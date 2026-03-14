import { Home, TrendingUp, PlusCircle, Brain, BookOpen, User, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const leftTabs = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
  ];

  const rightTabs = [
    { id: 'analyst', label: 'AI', icon: Brain },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been successfully signed out." });
    } catch {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  const handleTabClick = (tabId: string) => {
    const requiresAuth = ['create', 'profile', 'journal'].includes(tabId);
    if (requiresAuth && !user) {
      toast({ title: "Login Required", description: "Please log in to access this feature." });
      navigate('/auth');
      return;
    }
    onTabChange(tabId);
  };

  const renderTab = (tab: { id: string; label: string; icon: any }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => handleTabClick(tab.id)}
        className={cn(
          "flex flex-col items-center py-1.5 px-2 rounded-lg transition-all duration-200 min-w-[48px]",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5 mb-0.5", isActive && "scale-110")} />
        <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="max-w-md mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1.5">
          {leftTabs.map(renderTab)}

          {/* Center Create Button */}
          <button
            onClick={() => handleTabClick('create')}
            className={cn(
              "flex flex-col items-center -mt-4 transition-all duration-200",
              activeTab === 'create' ? "scale-110" : ""
            )}
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <PlusCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Post</span>
          </button>

          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
};
