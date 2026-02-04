import React from "react";
import { Badge } from "@/components/ui/badge";
import { getRegionFlag, getRegionName } from "@/lib/regionConstants";
import { cn } from "@/lib/utils";

interface RegionBadgeProps {
  regionCode: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RegionBadge = ({ 
  regionCode, 
  showName = false, 
  size = 'sm',
  className 
}: RegionBadgeProps) => {
  const flag = getRegionFlag(regionCode);
  const name = getRegionName(regionCode);
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-normal bg-background/80 backdrop-blur-sm border",
        sizeClasses[size],
        className
      )}
    >
      <span className="mr-1">{flag}</span>
      {showName ? name : regionCode}
    </Badge>
  );
};
