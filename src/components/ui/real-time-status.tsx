import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeStatusProps {
  isConnected?: boolean;
  className?: string;
}

export const RealTimeStatus = ({ isConnected = true, className }: RealTimeStatusProps) => {
  return (
    <div className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          Live Updates
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          Disconnected
        </>
      )}
    </div>
  );
};