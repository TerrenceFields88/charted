import { Home, TrendingUp, PlusCircle, Brain, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'feed', label: 'Home', icon: Home },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'create', label: 'Post', icon: PlusCircle, isFab: true },
  { id: 'analyst', label: 'AI', icon: Brain },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTabClick = (tabId: string) => {
    const requiresAuth = ['create', 'profile', 'journal'].includes(tabId);
    if (requiresAuth && !user) {
      toast({ title: 'Login Required', description: 'Please log in to access this feature.' });
      navigate('/auth');
      return;
    }
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50">
      <div className="max-w-md mx-auto px-3 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.isFab) {
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex flex-col items-center -mt-5 transition-transform active:scale-95"
                >
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isActive
                      ? "bg-primary shadow-primary/40 scale-105"
                      : "bg-primary shadow-primary/25"
                  )}>
                    <PlusCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex flex-col items-center py-1.5 px-3 rounded-xl transition-all active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
