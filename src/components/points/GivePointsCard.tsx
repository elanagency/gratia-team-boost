import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send, AtSign, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserPoints } from "@/hooks/useUserPoints";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { user, companyId } = useAuth();
  const { teamMembers } = useTeamMembers();
  const { monthlyPoints } = useUserPoints();

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMentionDropdown(false);
        setShowPointDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const availableRecipients = teamMembers?.filter(member => 
    member.user_id !== user?.id && member.invitation_status === 'active'
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleTextChange = (value: string, newMentions: Mention[], newPoints: PointBalloon[]) => {
    setText(value);
    setMentions(newMentions);
    setPoints(newPoints);
  };

  const handleMentionTrigger = (query: string, position: number) => {
    if (query === '' && position === -1) {
      setShowMentionDropdown(false);
      return;
    }
    
    setMentionQuery(query);
    setShowMentionDropdown(true);
    setShowPointDropdown(false);
  };

  const handlePointTrigger = (query: string, position: number) => {
    if (query === '' && position === -1) {
      setShowPointDropdown(false);
      return;
    }
    
    setPointQuery(query);
    setShowPointDropdown(true);
    setShowMentionDropdown(false);
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
  };

  const handleAmountButtonClick = () => {
    editorRef.current?.focus();
    setShowPointDropdown(true);
    setShowMentionDropdown(false);
    setPointQuery("");
  };

  const filteredMembers = availableRecipients.filter(member =>
    member.name.toLowerCase().includes(mentionQuery)
  );

  const commonPointValues = [10, 20, 25, 50, 100];
  const filteredPointValues = pointQuery 
    ? commonPointValues.filter(value => value.toString().includes(pointQuery))
    : commonPointValues;

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
      // Create a transaction for each mentioned person with the total points
      const transactions = mentions.map(mention => ({
        company_id: companyId,
        sender_profile_id: user.id,
        recipient_profile_id: mention.userId,
        points: totalPointsToGive,
        description: text
      }));

      const { error } = await supabase
        .from('point_transactions')
        .insert(transactions);

      if (error) throw error;

      toast.success(`Successfully gave ${totalPointsToGive} points to ${mentions.length} ${mentions.length === 1 ? 'person' : 'people'}!`);
      
      // Reset form
      setText("");
      setMentions([]);
      setPoints([]);
      
      // Invalidate queries to refresh feeds and points
      queryClient.invalidateQueries({ queryKey: ['userPoints'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      
      // Trigger refresh for any components using point transactions
      window.dispatchEvent(new CustomEvent('refreshRecognitionFeed'));
      
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="dashboard-card h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6 flex-shrink-0">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#F572FF]" />
          Give Recognition
        </CardTitle>
        <CardDescription className="text-sm">
          Recognize team members with points
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4 flex-1 flex flex-col">
        {/* Available Points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              You have <Badge variant="secondary" className="mx-1">{monthlyPoints}</Badge> points to give
            </span>
          </div>
        </div>

        {/* Composer */}
        <div className="relative flex-1 flex flex-col" ref={dropdownRef}>
          <div className="border rounded-lg bg-card flex flex-col flex-1">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b bg-muted/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMentionButtonClick}
                disabled={isSubmitting}
                className={`gap-1 ${showMentionDropdown ? 'bg-accent' : ''}`}
              >
                <AtSign className="h-3 w-3" />
                Mention
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAmountButtonClick}
                disabled={isSubmitting}
                className={`gap-1 ${showPointDropdown ? 'bg-accent' : ''}`}
              >
                <Plus className="h-3 w-3" />
                Amount
              </Button>
            </div>
            <RichTextEditor
              ref={editorRef}
              value={text}
              onChange={handleTextChange}
              onMentionTrigger={handleMentionTrigger}
              onPointTrigger={handlePointTrigger}
              placeholder="Give recognition... Type @ to mention someone and + to add points"
              disabled={isSubmitting}
              mentions={mentions}
              points={points}
            />
            
            {/* Mention Dropdown */}
            {showMentionDropdown && filteredMembers.length > 0 && (
              <div className="absolute z-[60] w-full mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredMembers.slice(0, 5).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => selectMention(member)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
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
              <div className="absolute z-[60] w-full mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                  Quick point values (Available: {monthlyPoints})
                </div>
                {filteredPointValues.filter(value => value <= monthlyPoints).map((value) => (
                  <button
                    key={value}
                    onClick={() => selectPoint(value)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 transition-colors"
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
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center gap-2 border-t transition-colors"
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

            {/* Bottom Bar */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
              {/* Summary */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {mentions.length > 0 && points.length > 0 && (
                  <span>
                    {points.reduce((sum, point) => sum + point.value, 0)} pts × {mentions.length} {mentions.length === 1 ? 'person' : 'people'} = {points.reduce((sum, point) => sum + point.value, 0) * mentions.length} total
                  </span>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim() || mentions.length === 0 || points.length === 0}
                size="sm"
                className="gap-1 bg-accent hover:bg-accent/90"
              >
                {isSubmitting ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Send Recognition
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}