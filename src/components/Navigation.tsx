import { useState } from 'react';
import { Home, TrendingUp, Plus, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCreate = tab.id === 'create';
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200",
                  isCreate 
                    ? "bg-primary text-primary-foreground shadow-lg transform active:scale-95" 
                    : isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mb-1",
                  isCreate && "w-6 h-6"
                )} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};