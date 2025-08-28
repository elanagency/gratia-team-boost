import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleSubmit = async () => {
    if (!text.trim() || mentions.length === 0) {
      toast.error("Please write a message and mention at least one person");
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
        points: selectedPoints,
        description: text
      }));

      const { error } = await supabase
        .from('point_transactions')
        .insert(transactions);

      if (error) throw error;

      const totalPoints = selectedPoints * mentions.length;
      toast.success(`Successfully gave ${selectedPoints} points to ${mentions.length} ${mentions.length === 1 ? 'person' : 'people'}!`);
      
      // Reset form
      setText("");
      setMentions([]);
      setSelectedPoints(10);
      
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="dashboard-card h-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#F572FF]" />
          Give Recognition
        </CardTitle>
        <CardDescription className="text-sm">
          Recognize team members with points
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Available Points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              You have <Badge variant="secondary" className="mx-1">{userPoints}</Badge> points to give
            </span>
          </div>
        </div>

        {/* Composer */}
        <div className="relative">
          <div className="border rounded-lg bg-card">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Give recognition... Type @ to mention someone"
              className="w-full min-h-[100px] p-3 bg-transparent border-0 resize-none focus:outline-none text-sm placeholder:text-muted-foreground"
              disabled={isSubmitting}
            />
            
            {/* Mention Dropdown */}
            {showMentionDropdown && filteredMembers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredMembers.slice(0, 5).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => selectMention(member)}
                    className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
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

            {/* Mentioned People */}
            {mentions.length > 0 && (
              <div className="px-3 pb-2">
                <div className="flex flex-wrap gap-1">
                  {mentions.map((mention, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      @{mention.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
              {/* Point Selection */}
              <div className="flex items-center gap-1">
                {pointPresets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPoints === preset.value;
                  return (
                    <Button
                      key={preset.value}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedPoints(preset.value)}
                      className="h-7 px-2 gap-1 text-xs"
                    >
                      <Icon className="h-3 w-3" />
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim() || mentions.length === 0}
                size="sm"
                className="gap-1 bg-accent hover:bg-accent/90"
              >
                {isSubmitting ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    Give {selectedPoints} pts
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