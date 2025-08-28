import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, Award, Zap, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserPoints } from "@/hooks/useUserPoints";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const pointPresets = [
  { value: 10, label: "10", icon: Heart, color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { value: 20, label: "20", icon: Star, color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { value: 25, label: "25", icon: Award, color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { value: 50, label: "50", icon: Zap, color: "bg-accent/10 text-accent hover:bg-accent/20" },
  { value: 100, label: "100", icon: Award, color: "bg-accent/10 text-accent hover:bg-accent/20" },
];

interface Mention {
  id: string;
  name: string;
  userId: string;
}

export function GivePointsCard() {
  const [text, setText] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<number>(10);
  const [customPoints, setCustomPoints] = useState("");
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, companyId } = useAuth();
  const { teamMembers } = useTeamMembers();
  const { userPoints } = useUserPoints();

  const availableRecipients = teamMembers?.filter(member => member.user_id !== user?.id) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textUpToCursor = value.slice(0, cursorPos);
    const atIndex = textUpToCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === ' ')) {
      const query = textUpToCursor.slice(atIndex + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    
    setShowMentionDropdown(false);
  };

  const selectMention = (member: any) => {
    const textUpToCursor = text.slice(0, cursorPosition);
    const atIndex = textUpToCursor.lastIndexOf('@');
    const textAfterCursor = text.slice(cursorPosition);
    
    const beforeMention = text.slice(0, atIndex);
    const newText = beforeMention + `@${member.name} ` + textAfterCursor;
    
    setText(newText);
    setMentions([...mentions, { id: member.id, name: member.name, userId: member.user_id }]);
    setShowMentionDropdown(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = atIndex + member.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const filteredMembers = availableRecipients.filter(member =>
    member.name.toLowerCase().includes(mentionQuery)
  );

  const getPointsToGive = () => {
    return parseInt(customPoints) || selectedPoints;
  };

  const handleSubmit = async () => {
    const pointsToGive = getPointsToGive();
    
    if (!text.trim() || mentions.length === 0) {
      toast.error("Please write a message and mention at least one person");
      return;
    }

    if (pointsToGive <= 0) {
      toast.error("Please select or enter valid points");
      return;
    }

    if (!user || !companyId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a transaction for each mentioned person
      const transactions = mentions.map(mention => ({
        company_id: companyId,
        sender_id: user.id,
        recipient_id: mention.userId,
        points: pointsToGive,
        description: text
      }));

      const { error } = await supabase
        .from('point_transactions')
        .insert(transactions);

      if (error) throw error;

      const totalPoints = pointsToGive * mentions.length;
      toast.success(`Successfully gave ${pointsToGive} points to ${mentions.length} ${mentions.length === 1 ? 'person' : 'people'}!`);
      
      // Reset form
      setText("");
      setMentions([]);
      setSelectedPoints(10);
      setCustomPoints("");
      
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-0 shadow-2xl shadow-accent/10 hover:shadow-accent/20 transition-all duration-500">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-accent/20 to-accent/30 flex items-center justify-center">
              <Heart className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Give Recognition</h2>
              <p className="text-sm text-muted-foreground">Share appreciation with your team</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
            {userPoints} points
          </Badge>
        </div>

        {/* Composer */}
        <div className="relative">
          <div className="border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all focus-within:border-accent/50 focus-within:shadow-lg focus-within:shadow-accent/10">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="🎉 Give recognition... Type @ to mention someone"
              className="w-full min-h-[120px] p-4 bg-transparent border-0 resize-none focus:outline-none text-sm placeholder:text-muted-foreground rounded-t-xl"
              disabled={isSubmitting}
            />
            
            {/* Mention Dropdown */}
            {showMentionDropdown && filteredMembers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredMembers.slice(0, 5).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => selectMention(member)}
                    className="w-full px-4 py-3 text-left hover:bg-accent/10 hover:text-accent-foreground flex items-center gap-3 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs bg-accent/20 text-accent">{getInitials(member.name)}</AvatarFallback>
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

            {/* Mentioned People */}
            {mentions.length > 0 && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {mentions.map((mention, index) => (
                    <Badge key={index} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                      @{mention.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="flex items-center justify-between p-4 border-t border-border/30 bg-muted/30 rounded-b-xl">
              {/* Point Selection */}
              <div className="flex items-center gap-2">
                {pointPresets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPoints === preset.value && !customPoints;
                  return (
                    <Button
                      key={preset.value}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setSelectedPoints(preset.value);
                        setCustomPoints("");
                      }}
                      className={`h-8 px-3 gap-1.5 text-sm transition-all ${
                        isSelected 
                          ? "bg-accent text-accent-foreground shadow-md" 
                          : "hover:bg-accent/10 hover:text-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {preset.label}
                    </Button>
                  );
                })}
                
                {/* Custom Points Input */}
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-sm text-muted-foreground">or</span>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => {
                      setCustomPoints(e.target.value);
                      setSelectedPoints(0);
                    }}
                    placeholder="Custom"
                    className="w-20 h-8 px-3 text-sm border border-border/50 rounded-md text-center bg-background/80 focus:outline-none focus:border-accent/50 focus:bg-background transition-colors"
                    min="1"
                    max={userPoints}
                  />
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim() || mentions.length === 0}
                size="sm"
                className="gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground shadow-md hover:shadow-lg transition-all duration-200 px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Give {getPointsToGive()} pts
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