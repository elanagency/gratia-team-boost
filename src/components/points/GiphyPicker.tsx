import { useState, useEffect, useCallback, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface GifSelection {
  id: string;
  url: string;
  previewUrl: string;
}

interface GiphyGif {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  title: string;
}

interface GiphyPickerProps {
  onSelect: (gif: GifSelection) => void;
  disabled?: boolean;
}

export function GiphyPicker({ onSelect, disabled }: GiphyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchGifs = useCallback(async (searchQuery?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('giphy-search', {
        body: {
          action: searchQuery ? 'search' : 'trending',
          query: searchQuery,
          limit: 20,
        },
      });

      if (error) throw error;
      setGifs(data?.gifs || []);
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch trending on open
  useEffect(() => {
    if (open) {
      fetchGifs();
      setQuery("");
    }
  }, [open, fetchGifs]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        fetchGifs(query.trim());
      }, 300);
    } else {
      fetchGifs();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, fetchGifs]);

  const handleSelect = (gif: GiphyGif) => {
    onSelect({
      id: gif.id,
      url: gif.url,
      previewUrl: gif.previewUrl,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1"
        >
          <Film className="h-3 w-3" />
          GIF
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 z-[200]" 
        style={{ pointerEvents: 'auto' }}
        align="start"
        sideOffset={8}
      >
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 h-9"
              placeholder="Search GIFs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* GIF Grid */}
        <div className="h-64 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No GIFs found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className="relative rounded-md overflow-hidden hover:ring-2 hover:ring-[#F572FF] transition-all cursor-pointer"
                  title={gif.title}
                >
                  <img
                    src={gif.previewUrl}
                    alt={gif.title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GIPHY Attribution */}
        <div className="p-2 border-t text-center">
          <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
