import React from 'react';
import { cn } from '@/lib/utils';

interface SafeZoneOverlayProps {
  visible?: boolean;
  alwaysOn?: boolean;
  top?: number;
  bottom?: number;
  sides?: number;
  className?: string;
}

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({
  visible,
  alwaysOn = false,
  top = 64,
  bottom = 96,
  sides = 16,
  className,
}) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 transition-opacity duration-300',
        alwaysOn ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        visible === true ? 'opacity-100' : visible === false ? 'opacity-0' : '',
        className
      )}
    >
      {/* Outer frame */}
      <div className="absolute inset-0 rounded-lg border border-foreground/20" />

      {/* Inner safe area */}
      <div
        className="absolute rounded-md border border-primary/30"
        style={{ top, bottom, left: sides, right: sides }}
      />

      {/* Shaded margins outside safe area */}
      <div className="absolute left-0 right-0 top-0 bg-background/40" style={{ height: top }} />
      <div className="absolute left-0 right-0 bottom-0 bg-background/40" style={{ height: bottom }} />
      <div className="absolute top-0 bottom-0 left-0 bg-background/40" style={{ width: sides }} />
      <div className="absolute top-0 bottom-0 right-0 bg-background/40" style={{ width: sides }} />
    </div>
  );
};
