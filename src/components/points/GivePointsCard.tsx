import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, AtSign, Plus, X, Smile, ImageIcon, LayoutGrid, User } from "lucide-react";
import { GiphyPicker, type GifSelection } from "./GiphyPicker";
import { useAuth } from "@/context/AuthContext";
import { useAllCompanyMembers } from "@/hooks/useCompanyMembers";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RichTextEditor, type RichTextEditorRef, type Mention, type PointBalloon } from "@/components/ui/rich-text-editor";

export function GivePointsCard() {
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [points, setPoints] = useState<PointBalloon[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showPointDropdown, setShowPointDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [pointQuery, setPointQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, shouldFlip: false });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [selectedPointIndex, setSelectedPointIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGif, setSelectedGif] = useState<GifSelection | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { user, companyId, monthlyPoints, isAuthLoading } = useAuth();
  const { companyMembers } = useAllCompanyMembers();

  // Debug logging for points availability
  useEffect(() => {
    console.log("GivePointsCard - Auth state:", { 
      hasUser: !!user, 
      companyId, 
      monthlyPoints, 
      isAuthLoading 
    });
  }, [user, companyId, monthlyPoints, isAuthLoading]);

  const availableRecipients = companyMembers?.filter(member => 
    member.status === 'active'
  ) || [];

  const filteredMembers = availableRecipients.filter(member =>
    member.name.toLowerCase().includes(mentionQuery)
  );

  const commonPointValues = [10, 20, 25, 50, 100];
  const filteredPointValues = pointQuery 
    ? commonPointValues.filter(value => value.toString().includes(pointQuery))
    : commonPointValues;

  // Handle clicking outside dropdowns and keyboard navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMentionDropdown(false);
        setShowPointDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showMentionDropdown) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedMentionIndex(prev => 
            prev < Math.min(filteredMembers.length - 1, 4) ? prev + 1 : 0
          );
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedMentionIndex(prev => 
            prev > 0 ? prev - 1 : Math.min(filteredMembers.length - 1, 4)
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (filteredMembers[selectedMentionIndex]) {
            selectMention(filteredMembers[selectedMentionIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setShowMentionDropdown(false);
        }
      } else if (showPointDropdown) {
        const availablePointValues = filteredPointValues.filter(value => value <= monthlyPoints);
        const customPointValue = pointQuery && !isNaN(Number(pointQuery)) && Number(pointQuery) > 0 && Number(pointQuery) <= monthlyPoints ? Number(pointQuery) : null;
        const totalOptions = availablePointValues.length + (customPointValue ? 1 : 0);
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedPointIndex(prev => prev < totalOptions - 1 ? prev + 1 : 0);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedPointIndex(prev => prev > 0 ? prev - 1 : totalOptions - 1);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (selectedPointIndex < availablePointValues.length) {
            selectPoint(availablePointValues[selectedPointIndex]);
          } else if (customPointValue) {
            selectPoint(customPointValue);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setShowPointDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMentionDropdown, showPointDropdown, selectedMentionIndex, selectedPointIndex, filteredMembers, pointQuery, monthlyPoints]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleTextChange = (value: string, newMentions: Mention[], newPoints: PointBalloon[]) => {
    setText(value);
    setMentions(newMentions);
    setPoints(newPoints);
  };

  const handleMentionTrigger = (query: string, position: number, coordinates?: { viewportX: number, viewportY: number, editorX: number, editorY: number }) => {
    if (query === '' && position === -1) {
      setShowMentionDropdown(false);
      return;
    }
    
    if (coordinates && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate dropdown height
      const dropdownWidth = 256; // w-64 = 256px
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      // Calculate position relative to container
      let x = coordinates.viewportX - containerRect.left;
      let y = coordinates.viewportY - containerRect.top + 8; // 8px offset below cursor
      
      // Check if dropdown would go off screen and flip if needed
      let shouldFlip = false;
      if (coordinates.viewportY + dropdownHeight > viewport.height) {
        y = coordinates.viewportY - containerRect.top - dropdownHeight - 8; // Position above cursor
        shouldFlip = true;
      }
      
      // Ensure dropdown doesn't go off the right edge
      if (x + dropdownWidth > containerRect.width) {
        x = containerRect.width - dropdownWidth - 8;
      }
      
      // Ensure dropdown doesn't go off the left edge
      if (x < 8) {
        x = 8;
      }
      
      setDropdownPosition({ x, y, shouldFlip });
    }
    
    setMentionQuery(query);
    setShowMentionDropdown(true);
    setShowPointDropdown(false);
    setSelectedMentionIndex(0); // Reset to first option
  };

  const handlePointTrigger = (query: string, position: number, coordinates?: { viewportX: number, viewportY: number, editorX: number, editorY: number }) => {
    if (query === '' && position === -1) {
      setShowPointDropdown(false);
      return;
    }
    
    if (coordinates && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate dropdown height
      const dropdownWidth = 256; // w-64 = 256px
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      // Calculate position relative to container
      let x = coordinates.viewportX - containerRect.left;
      let y = coordinates.viewportY - containerRect.top + 8; // 8px offset below cursor
      
      // Check if dropdown would go off screen and flip if needed
      let shouldFlip = false;
      if (coordinates.viewportY + dropdownHeight > viewport.height) {
        y = coordinates.viewportY - containerRect.top - dropdownHeight - 8; // Position above cursor
        shouldFlip = true;
      }
      
      // Ensure dropdown doesn't go off the right edge
      if (x + dropdownWidth > containerRect.width) {
        x = containerRect.width - dropdownWidth - 8;
      }
      
      // Ensure dropdown doesn't go off the left edge
      if (x < 8) {
        x = 8;
      }
      
      setDropdownPosition({ x, y, shouldFlip });
    }
    
    setPointQuery(query);
    setShowPointDropdown(true);
    setShowMentionDropdown(false);
    setSelectedPointIndex(0); // Reset to first option
  };

  const selectMention = (member: any) => {
    const mention: Mention = {
      id: member.id,
      name: member.name,
      userId: member.user_id
    };
    
    editorRef.current?.insertMention(mention);
    setShowMentionDropdown(false);
    
    // Focus back to editor
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  const selectPoint = (value: number) => {
    const point: PointBalloon = {
      id: `point-${Date.now()}-${Math.random()}`,
      value
    };
    
    editorRef.current?.insertPoint(point);
    setShowPointDropdown(false);
    
    // Focus back to editor
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  const handleMentionButtonClick = () => {
    editorRef.current?.focus();
    setShowMentionDropdown(true);
    setShowPointDropdown(false);
    setMentionQuery("");
    setSelectedMentionIndex(0);
  };

  const handleAmountButtonClick = () => {
    editorRef.current?.focus();
    setShowPointDropdown(true);
    setShowMentionDropdown(false);
    setPointQuery("");
    setSelectedPointIndex(0);
  };


  const handleSubmit = async () => {
    if (!text.trim() || mentions.length === 0) {
      toast.error("Please write a message and mention at least one person");
      return;
    }

    if (points.length === 0) {
      toast.error("Please add points using + (e.g., +25)");
      return;
    }

    const totalPointsToGive = points.reduce((sum, point) => sum + point.value, 0);
    const totalPointsRequired = totalPointsToGive * mentions.length;

    if (totalPointsRequired > monthlyPoints) {
      toast.error("You don't have enough monthly points to give");
      return;
    }

    if (!user || !companyId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the HTML content from the rich text editor to preserve structure
      const editorElement = document.querySelector('[contenteditable="true"]');
      const structuredMessage = editorElement?.innerHTML || text;
      
      // Parse the structured message to get clean text for Slack
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = structuredMessage;
      
      // Remove mention and point balloon elements before extracting clean text
      const balloonElements = tempDiv.querySelectorAll('.mention-balloon, [data-mention="true"], .point-balloon, [data-points="true"]');
      balloonElements.forEach(el => el.remove());
      
      // Get clean text without HTML formatting
      const cleanMessageText = (tempDiv.textContent || tempDiv.innerText || '').trim();
      
      // Use the proper transfer_points_between_users function for each mentioned person
      for (const mention of mentions) {
        const { data, error } = await supabase.rpc('transfer_points_between_users', {
          sender_user_id: user.id,
          recipient_user_id: mention.userId,
          transfer_company_id: companyId,
          points_amount: totalPointsToGive,
          transfer_description: structuredMessage,
          transfer_gif_url: selectedGif?.url || null
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string };
        if (!result?.success) {
          throw new Error(result?.error || "Failed to transfer points");
        }

        // Send Slack notification for recognition (don't fail the transfer if notification fails)
        try {
          await supabase.functions.invoke('send-slack-notification', {
            body: {
              company_id: companyId,
              notification_type: 'recognition',
              sender_name: `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim(),
              recipient_name: mention.name,
              points: totalPointsToGive,
              message: cleanMessageText,
              gif_url: selectedGif?.url || undefined
            }
          });
        } catch (slackError) {
          console.error('Failed to send Slack notification:', slackError);
          // Continue even if Slack notification fails
        }

        // Send Teams notification for recognition (don't fail the transfer if notification fails)
        try {
          await supabase.functions.invoke('send-teams-notification', {
            body: {
              company_id: companyId,
              notification_type: 'recognition',
              sender_name: `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim(),
              recipient_name: mention.name,
              points: totalPointsToGive,
              message: cleanMessageText,
              gif_url: selectedGif?.url || undefined
            }
          });
        } catch (teamsError) {
          console.error('Failed to send Teams notification:', teamsError);
          // Continue even if Teams notification fails
        }
      }

      toast.success(`Successfully gave ${totalPointsToGive} points to ${mentions.length} ${mentions.length === 1 ? 'person' : 'people'}!`);
      
      // Reset form
      setText("");
      setMentions([]);
      setPoints([]);
      setSelectedGif(null);
      
      // Invalidate all relevant queries to refresh feeds and points
      await queryClient.invalidateQueries({ queryKey: ['userPoints'] });
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      await queryClient.invalidateQueries({ queryKey: ['recognitionFeed'] });
      await queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
      
      // Force refresh auth context to update points immediately
      window.location.reload();
      
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-border rounded-xl shadow-none flex flex-col" style={{ padding: '19.75px' }}>
      <CardContent className="p-0 space-y-4 flex-1 flex flex-col">
        {/* Points to give indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-normal" style={{ color: '#9996AA' }}>Points to give</span>
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
            {monthlyPoints}
          </span>
        </div>

        {/* Composer with avatar */}
        <div className="relative flex-1 flex flex-col" ref={containerRef}>
          <div className="flex gap-3">
            {/* User Avatar */}
            <Avatar className="h-[30px] w-[30px] flex-shrink-0 mt-1">
              <AvatarFallback className="text-xs bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col gap-3">
              <div className="border border-border rounded-lg bg-card flex flex-col">
                <RichTextEditor
                  ref={editorRef}
                  value={text}
                  onChange={handleTextChange}
                  onMentionTrigger={handleMentionTrigger}
                  onPointTrigger={handlePointTrigger}
                  placeholder="Recognize a teammate..."
                  disabled={isSubmitting}
                  mentions={mentions}
                  points={points}
                />

            {/* GIF Preview */}
            {selectedGif && (
              <div className="px-3 py-2 border-t">
                <div className="relative inline-block">
                  <img
                    src={selectedGif.previewUrl}
                    alt="Selected GIF"
                    className="max-w-[200px] max-h-[150px] rounded-md"
                  />
                  <button
                    onClick={() => setSelectedGif(null)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

              </div>

              {/* Pill filter buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleMentionButtonClick}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  Select teammate
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  Company value
                </button>
                <button
                  type="button"
                  onClick={handleAmountButtonClick}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  100 pts
                </button>
              </div>

              {/* Bottom bar: icons left, send right */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors">
                    <Smile className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors">
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors">
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !text.trim() || mentions.length === 0 || points.length === 0}
                  className="inline-flex items-center gap-1.5 text-white text-sm font-medium rounded-full transition-opacity disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #7F2BFE, #FC5BFF)',
                    padding: '6.6px 14.9px 4.1px 15px',
                  }}
                >
                  {isSubmitting ? "Posting..." : (
                    <>
                      Send
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mention Dropdown - positioned near cursor */}
          {showMentionDropdown && filteredMembers.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute z-[60] w-64 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              style={{
                left: `${dropdownPosition.x}px`,
                top: `${dropdownPosition.y}px`
              }}
              onMouseLeave={() => setSelectedMentionIndex(-1)}
            >
              {filteredMembers.slice(0, 5).map((member, index) => (
                <button
                  key={member.user_id}
                  onClick={() => selectMention(member)}
                  onMouseEnter={() => setSelectedMentionIndex(index)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    index === selectedMentionIndex 
                      ? 'bg-muted text-foreground' 
                      : ''
                  }`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{member.name}</div>
                    {member.department && (
                      <div className="text-xs text-muted-foreground">{member.department}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Point Dropdown - positioned near cursor */}
          {showPointDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute z-[60] w-64 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              style={{
                left: `${dropdownPosition.x}px`,
                top: `${dropdownPosition.y}px`
              }}
              onMouseLeave={() => setSelectedPointIndex(-1)}
            >
              <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                Quick point values (Available: {monthlyPoints})
              </div>
              {filteredPointValues.filter(value => value <= monthlyPoints).map((value, index) => (
                <button
                  key={value}
                  onClick={() => selectPoint(value)}
                  onMouseEnter={() => setSelectedPointIndex(index)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${
                    index === selectedPointIndex
                      ? 'bg-muted text-foreground'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                      +
                    </span>
                    <span className="text-sm font-medium">{value} points</span>
                  </div>
                </button>
              ))}
              {pointQuery && !isNaN(Number(pointQuery)) && Number(pointQuery) > 0 && Number(pointQuery) <= monthlyPoints && (
                <button
                  onClick={() => selectPoint(Number(pointQuery))}
                  onMouseEnter={() => setSelectedPointIndex(filteredPointValues.filter(value => value <= monthlyPoints).length)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 border-t transition-colors ${
                    selectedPointIndex === filteredPointValues.filter(value => value <= monthlyPoints).length
                      ? 'bg-muted text-foreground'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                      +
                    </span>
                    <span className="text-sm font-medium">{pointQuery} points (custom)</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  );
}