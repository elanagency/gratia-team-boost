import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, Smile, ImageIcon, LayoutGrid, User } from "lucide-react";
import { GiphyPicker, type GifSelection } from "./GiphyPicker";
import { useAuth } from "@/context/AuthContext";
import { useAllCompanyMembers } from "@/hooks/useCompanyMembers";
import { useCompanyValues, type CompanyValue } from "@/hooks/useCompanyValues";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { user, companyId, monthlyPoints, isAuthLoading, avatarUrl } = useAuth();
  const { companyMembers } = useAllCompanyMembers();
  const { values: companyValues } = useCompanyValues();
  const [selectedValue, setSelectedValue] = useState<CompanyValue | null>(null);
  const [valuePopoverOpen, setValuePopoverOpen] = useState(false);
  const [valueSearch, setValueSearch] = useState("");
  const [pointsInputValue, setPointsInputValue] = useState("100");
  const [pointsPopoverOpen, setPointsPopoverOpen] = useState(false);
  const [pointsSearch, setPointsSearch] = useState("");
  const [teammatePopoverOpen, setTeammatePopoverOpen] = useState(false);
  const [teammateSearch, setTeammateSearch] = useState("");
  const [selectedTeammate, setSelectedTeammate] = useState<{ id: string; name: string; user_id: string } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Listen for focus event from sidebar button
  useEffect(() => {
    const handleFocusComposer = () => {
      setTimeout(() => editorRef.current?.focus(), 150);
    };
    window.addEventListener("focus-recognition-composer", handleFocusComposer);
    return () => window.removeEventListener("focus-recognition-composer", handleFocusComposer);
  }, []);

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
    // Build recipient list: pill takes precedence, fallback to inline mentions
    const recipientList: { userId: string; name: string }[] = selectedTeammate
      ? [{ userId: selectedTeammate.user_id, name: selectedTeammate.name }]
      : mentions.map((m) => ({ userId: m.userId, name: m.name }));

    if (!text.trim()) {
      toast.error("Please write a message");
      return;
    }

    if (recipientList.length === 0) {
      toast.error("Please select a teammate");
      return;
    }

    // Points: pill input takes precedence, fallback to inline points balloons
    const pillPoints = Number(pointsInputValue);
    const inlinePoints = points.reduce((sum, point) => sum + point.value, 0);
    const totalPointsToGive = pillPoints > 0 ? pillPoints : inlinePoints;

    if (!totalPointsToGive || totalPointsToGive <= 0) {
      toast.error("Please enter a points amount");
      return;
    }

    const totalPointsRequired = totalPointsToGive * recipientList.length;

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
      let structuredMessage = editorElement?.innerHTML || text;

      // Append company value marker if selected (preserved in feed via description)
      if (selectedValue) {
        structuredMessage += ` <span class="value-tag" data-value-id="${selectedValue.id}">[Value: ${selectedValue.name}]</span>`;
      }

      // Parse the structured message to get clean text for Slack
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = structuredMessage;

      // Remove mention and point balloon elements before extracting clean text
      const balloonElements = tempDiv.querySelectorAll('.mention-balloon, [data-mention="true"], .point-balloon, [data-points="true"]');
      balloonElements.forEach(el => el.remove());

      // Get clean text without HTML formatting
      const cleanMessageText = (tempDiv.textContent || tempDiv.innerText || '').trim();

      // Use the proper transfer_points_between_users function for each recipient
      for (const recipient of recipientList) {
        const { data, error } = await supabase.rpc('transfer_points_between_users', {
          sender_user_id: user.id,
          recipient_user_id: recipient.userId,
          transfer_company_id: companyId,
          points_amount: totalPointsToGive,
          transfer_description: structuredMessage,
          transfer_gif_url: selectedGif?.url || null,
          transfer_image_url: selectedImageUrl || null,
        } as any);

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
              recipient_name: recipient.name,
              points: totalPointsToGive,
              message: cleanMessageText,
              gif_url: selectedGif?.url || undefined
            }
          });
        } catch (slackError) {
          console.error('Failed to send Slack notification:', slackError);
        }

        // Send Teams notification for recognition (don't fail the transfer if notification fails)
        try {
          await supabase.functions.invoke('send-teams-notification', {
            body: {
              company_id: companyId,
              notification_type: 'recognition',
              sender_name: `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim(),
              recipient_name: recipient.name,
              points: totalPointsToGive,
              message: cleanMessageText,
              gif_url: selectedGif?.url || undefined
            }
          });
        } catch (teamsError) {
          console.error('Failed to send Teams notification:', teamsError);
        }
      }

      toast.success(`Successfully gave ${totalPointsToGive} points to ${recipientList.length} ${recipientList.length === 1 ? 'person' : 'people'}!`);

      // Reset form
      setText("");
      setMentions([]);
      setPoints([]);
      setSelectedGif(null);
      setSelectedImageUrl(null);
      setSelectedValue(null);
      setSelectedTeammate(null);
      setPointsInputValue("100");

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
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Points to give indicator */}
        <div className="flex items-center gap-2 pb-3">
          <span className="text-[13px] font-normal" style={{ color: '#9996AA' }}>Points to give</span>
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
            {monthlyPoints}
          </span>
        </div>

        {/* Divider after points to give */}
        <div className="border-t border-border" />

        {/* Composer with avatar */}
        <div className="relative flex-1 flex flex-col pt-3" ref={containerRef}>
          <div className="flex gap-3">
            {/* User Avatar */}
            <Avatar className="h-[30px] w-[30px] flex-shrink-0 mt-1">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Your avatar" />
              ) : null}
              <AvatarFallback className="text-xs bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col">
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
                  <div className="py-2">
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

                {/* Image Preview */}
                {selectedImageUrl && (
                  <div className="py-2">
                    <div className="relative inline-block">
                      <img
                        src={selectedImageUrl}
                        alt="Selected attachment"
                        className="max-w-[240px] max-h-[180px] rounded-md object-cover"
                      />
                      <button
                        onClick={() => setSelectedImageUrl(null)}
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
                {/* Select teammate dropdown */}
                <Popover open={teammatePopoverOpen} onOpenChange={setTeammatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        teammatePopoverOpen
                          ? "border-[1.5px] border-[#7F2BFE] text-[#0F0533]"
                          : "border border-[#E8E6F0] text-[#9996AA] hover:bg-muted/50"
                      } ${selectedTeammate ? "text-[#0F0533]" : ""}`}
                    >
                      {selectedTeammate ? selectedTeammate.name : "Select teammate"}
                      {selectedTeammate && (
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeammate(null);
                          }}
                        />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[220px] p-2 z-[200] bg-white border border-[#E8E6F0] rounded-[13.375px] shadow-md"
                  >
                    <Input
                      autoFocus
                      placeholder="Search..."
                      value={teammateSearch}
                      onChange={(e) => setTeammateSearch(e.target.value)}
                      className="h-9 mb-2 rounded-lg border-[1.5px] border-[#7F2BFE] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#7F2BFE] placeholder:text-[#9996AA]"
                    />
                    <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
                      {availableRecipients
                        .filter((m) =>
                          m.name.toLowerCase().includes(teammateSearch.toLowerCase())
                        )
                        .map((member) => {
                          const isSelected = selectedTeammate?.user_id === member.user_id;
                          return (
                            <button
                              key={member.user_id}
                              type="button"
                              onClick={() => {
                                setSelectedTeammate({
                                  id: member.id,
                                  name: member.name,
                                  user_id: member.user_id,
                                });
                                setTeammatePopoverOpen(false);
                                setTeammateSearch("");
                              }}
                              className={`flex items-center h-9 px-3 rounded-lg text-sm w-full text-left transition-colors ${
                                isSelected
                                  ? "bg-[#F3EBFF] text-[#7F2BFE] font-medium hover:bg-[#F3EBFF]"
                                  : "text-[#0F0533] hover:bg-[#F5F5F7]"
                              }`}
                            >
                              {member.name}
                            </button>
                          );
                        })}
                      {availableRecipients.filter((m) =>
                        m.name.toLowerCase().includes(teammateSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-[#9996AA]">No teammates found</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Company value dropdown */}
                <Popover open={valuePopoverOpen} onOpenChange={setValuePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                        valuePopoverOpen
                          ? "border-[1.5px] border-[#7F2BFE] text-[#0F0533]"
                          : "border border-[#E8E6F0] text-[#9996AA] hover:bg-muted/50"
                      } ${selectedValue ? "text-[#0F0533]" : ""}`}
                    >
                      {selectedValue ? selectedValue.name : "Company value"}
                      {selectedValue && (
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedValue(null);
                          }}
                        />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[220px] p-2 z-[200] bg-white border border-[#E8E6F0] rounded-[13.375px] shadow-md"
                  >
                    <Input
                      autoFocus
                      placeholder="Search..."
                      value={valueSearch}
                      onChange={(e) => setValueSearch(e.target.value)}
                      className="h-9 mb-2 rounded-lg border-[1.5px] border-[#7F2BFE] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#7F2BFE] placeholder:text-[#9996AA]"
                    />
                    <div className="flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
                      {companyValues
                        .filter((v) =>
                          v.name.toLowerCase().includes(valueSearch.toLowerCase())
                        )
                        .map((value) => {
                          const isSelected = selectedValue?.id === value.id;
                          return (
                            <button
                              key={value.id}
                              type="button"
                              onClick={() => {
                                setSelectedValue(value);
                                setValuePopoverOpen(false);
                                setValueSearch("");
                              }}
                              className={`flex items-center h-9 px-3 rounded-lg text-sm w-full text-left transition-colors ${
                                isSelected
                                  ? "bg-[#F3EBFF] text-[#7F2BFE] font-medium hover:bg-[#F3EBFF]"
                                  : "text-[#0F0533] hover:bg-[#F5F5F7]"
                              }`}
                            >
                              {value.name}
                            </button>
                          );
                        })}
                      {companyValues.filter((v) =>
                        v.name.toLowerCase().includes(valueSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-[#9996AA]">No values found</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Points dropdown */}
                <Popover open={pointsPopoverOpen} onOpenChange={setPointsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 text-[#0F0533] ${
                        pointsPopoverOpen
                          ? "border-[1.5px] border-[#7F2BFE]"
                          : "border border-[#E8E6F0] hover:bg-muted/50"
                      }`}
                    >
                      {pointsInputValue} pts
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="w-[200px] p-2 z-[200] bg-white border border-[#E8E6F0] rounded-[13.375px] shadow-md"
                  >
                    <Input
                      autoFocus
                      type="number"
                      min={1}
                      placeholder="Search..."
                      value={pointsSearch}
                      onChange={(e) => setPointsSearch(e.target.value)}
                      className="h-9 mb-2 rounded-lg border-[1.5px] border-[#7F2BFE] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#7F2BFE] placeholder:text-[#9996AA]"
                    />
                    <div className="border-t border-[#E8E6F0] -mx-2 mb-2" />
                    <div className="flex flex-col gap-0.5">
                      {[5, 10, 25]
                        .filter((v) =>
                          pointsSearch ? v.toString().includes(pointsSearch) : true
                        )
                        .map((value) => {
                          const isSelected = pointsInputValue === value.toString();
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setPointsInputValue(value.toString());
                                setPointsPopoverOpen(false);
                                setPointsSearch("");
                              }}
                              className={`flex items-center h-9 px-3 rounded-lg text-sm w-full text-left transition-colors ${
                                isSelected
                                  ? "text-[#7F2BFE] font-medium hover:bg-[#F5F5F7]"
                                  : "text-[#0F0533] hover:bg-[#F5F5F7]"
                              }`}
                            >
                              {value} pts
                            </button>
                          );
                        })}
                    </div>
                    <div className="border-t border-[#E8E6F0] -mx-2 mt-2 mb-2" />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Custom amount"
                        value={pointsSearch}
                        onChange={(e) => setPointsSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && pointsSearch && Number(pointsSearch) > 0) {
                            setPointsInputValue(pointsSearch);
                            setPointsPopoverOpen(false);
                            setPointsSearch("");
                          }
                        }}
                        className="h-8 flex-1 rounded-lg border border-[#E8E6F0] text-xs focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#7F2BFE] placeholder:text-[#9996AA]"
                      />
                      <button
                        type="button"
                        disabled={!pointsSearch || Number(pointsSearch) <= 0}
                        onClick={() => {
                          if (pointsSearch && Number(pointsSearch) > 0) {
                            setPointsInputValue(pointsSearch);
                            setPointsPopoverOpen(false);
                            setPointsSearch("");
                          }
                        }}
                        className="px-3 h-8 rounded-lg text-xs font-medium text-white bg-[#7F2BFE] hover:bg-[#6F1FE8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Set
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Divider above bottom bar */}
              <div className="border-t border-border" />

              {/* Bottom bar: icons left, send right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Emoji picker */}
                  <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors">
                        <Smile className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 z-[200]" align="start" sideOffset={8}>
                      <div className="grid grid-cols-8 gap-1">
                        {['😀','😂','😍','🥳','🎉','💪','🔥','⭐','💯','👏','🙌','❤️','💚','🤩','😎','👍','🚀','✨','🏆','💎','🌟','😊','🤗','💐'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              // Insert emoji into the editor by focusing and using execCommand
                              editorRef.current?.focus();
                              setTimeout(() => {
                                document.execCommand('insertText', false, emoji);
                              }, 0);
                              setEmojiPickerOpen(false);
                            }}
                            className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Image upload */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (!user || !companyId) {
                        toast.error("You must be signed in to upload");
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        toast.error("Please select an image file");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image must be 5MB or smaller");
                        return;
                      }
                      try {
                        setIsUploadingImage(true);
                        const ext = file.name.split('.').pop() || 'jpg';
                        const path = `${user.id}/${companyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                        const { error: uploadError } = await supabase.storage
                          .from('recognition-images')
                          .upload(path, file, { contentType: file.type, upsert: false });
                        if (uploadError) throw uploadError;
                        const { data: pub } = supabase.storage
                          .from('recognition-images')
                          .getPublicUrl(path);
                        setSelectedImageUrl(pub.publicUrl);
                        setSelectedGif(null);
                      } catch (err) {
                        console.error('Image upload failed:', err);
                        toast.error('Failed to upload image');
                      } finally {
                        setIsUploadingImage(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isSubmitting || isUploadingImage || !!selectedGif}
                    className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors disabled:opacity-40"
                    title={selectedGif ? "Remove GIF first" : "Attach image"}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>

                  {/* GIF picker */}
                  <GiphyPicker
                    onSelect={(gif) => { setSelectedGif(gif); setSelectedImageUrl(null); }}
                    disabled={isSubmitting || !!selectedImageUrl}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !text.trim() || (!selectedTeammate && mentions.length === 0) || (!(Number(pointsInputValue) > 0) && points.length === 0)}
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
          
          {/* Mention Dropdown */}
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

          {/* Point Dropdown */}
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
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-semibold rounded-full">
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
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-semibold rounded-full">
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
}