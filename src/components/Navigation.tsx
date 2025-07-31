import { useState } from 'react';
import { Home, TrendingUp, Plus, Bell, User, LogOut, Search, Activity, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { signOut } = useAuth();
  
  const tabs = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 animate-slide-up">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex justify-around items-center flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isCreate = tab.id === 'create';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
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
          
          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-2 p-2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};