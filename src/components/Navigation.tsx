import { useState } from 'react';
import { Home, TrendingUp, Plus, User, LogOut, LogIn, Brain, BookOpen } from 'lucide-react';
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
  
  const tabs = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'analyst', label: 'AI Analyst', icon: Brain },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 animate-slide-up">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex justify-around items-center flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isCreate = tab.id === 'create';
              const requiresAuth = ['create', 'profile', 'journal'].includes(tab.id);
              
              const handleTabClick = () => {
                if (requiresAuth && !user) {
                  toast({
                    title: "Login Required",
                    description: "Please log in to access this feature.",
                  });
                  navigate('/auth');
                  return;
                }
                onTabChange(tab.id);
              };
              
              return (
                <button
                  key={tab.id}
                  onClick={handleTabClick}
                  className={cn(
                    "flex flex-col items-center py-2 px-3 rounded-lg transition-smooth transform active:scale-95",
                    isCreate 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mb-1 transition-smooth",
                    isCreate && "w-6 h-6"
                  )} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Auth Button - Login/Logout */}
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-2 p-2 text-muted-foreground hover:text-foreground transition-smooth"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              className="ml-2 p-2 text-muted-foreground hover:text-foreground transition-smooth"
            >
              <LogIn className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};