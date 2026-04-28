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
                  className="flex flex-col items-center -mt-6 transition-transform active:scale-90"
                  aria-label="Create post"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-molten blur-md opacity-70" />
                    <div className={cn(
                      "relative w-12 h-12 rounded-full flex items-center justify-center shadow-ember transition-all bg-gradient-ember",
                      isActive && "scale-110"
                    )}>
                      <PlusCircle className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-ember" />
                )}
                <Icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[10px] font-medium tracking-wide", isActive && "font-semibold")}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
