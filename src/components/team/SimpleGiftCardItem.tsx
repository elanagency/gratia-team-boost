import React from "react";
import { GiftCard } from "@/hooks/useRewardsShop";
import { RegionBadge } from "./RegionBadge";

interface SimpleGiftCardItemProps {
  reward: GiftCard;
  onClick: () => void;
}

export const SimpleGiftCardItem = ({ reward, onClick }: SimpleGiftCardItemProps) => {
  return (
    <div 
      className="cursor-pointer transition-all duration-300 hover:scale-[1.02] rounded-lg overflow-hidden"
      style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E8E6F0', borderRadius: 12 }}
      onClick={onClick}
    >
      {/* Image area */}
      <div 
        style={{
          height: 154,
          background: '#FFF',
          padding: '15px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {reward.image_url ? (
          <img 
            src={reward.image_url} 
            alt={reward.name} 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
        
        {reward.region_code && (
          <div className="absolute top-2 right-2">
            <RegionBadge regionCode={reward.region_code} size="sm" />
          </div>
        )}
      </div>
      
      {/* Info section */}
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: 11.25 }}>
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#0F0533', fontSize: 14, lineHeight: '1.3', margin: 0 }}>
          {reward.name}
        </h3>
        
        <button
          style={{
            width: '100%',
            borderRadius: 9.375,
            background: 'linear-gradient(135deg, #7F2BFE, #FC5BFF)',
            padding: '8.5px 0 6px 0',
            color: '#FFF',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Redeem
        </button>
      </div>
    </div>
  );
};
