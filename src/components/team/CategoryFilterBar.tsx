import React from "react";
import { cn } from "@/lib/utils";
import { GIFT_CARD_CATEGORIES } from "@/lib/giftCardCategories";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryFilterBarProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilterBar = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryFilterBarProps) => {
  const handleClick = (categoryName: string) => {
    onSelectCategory(selectedCategory === categoryName ? null : categoryName);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-2 pb-2">
        {/* All button */}
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors shrink-0",
            selectedCategory === null
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All
        </button>

        {GIFT_CARD_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = categoryCounts?.[cat.name];
          const isActive = selectedCategory === cat.name;

          // Hide categories with 0 brands unless active
          if (count === 0 && !isActive) return null;

          return (
            <button
              key={cat.name}
              onClick={() => handleClick(cat.name)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors shrink-0",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.name}
              {count !== undefined && (
                <span className="text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
