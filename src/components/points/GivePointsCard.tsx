import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserPoints } from "@/hooks/useUserPoints";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RichTextEditor, type RichTextEditorRef, type Mention } from "@/components/ui/rich-text-editor";

export function GivePointsCard() {
  const [text, setText] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<number>(1);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  const { user, companyId } = useAuth();
  const { teamMembers } = useTeamMembers();
  const { userPoints } = useUserPoints();

  const availableRecipients = teamMembers?.filter(member => member.user_id !== user?.id) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleTextChange = (value: string, newMentions: Mention[]) => {
    setText(value);
    setMentions(newMentions);
  };

  const handleMentionTrigger = (query: string, position: number) => {
    if (query === '' && position === -1) {
      setShowMentionDropdown(false);
      return;
    }
    
    setMentionQuery(query);
    setShowMentionDropdown(true);
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

  const filteredMembers = availableRecipients.filter(member =>
    member.name.toLowerCase().includes(mentionQuery)
  );

  const handleSubmit = async () => {
    if (!text.trim() || mentions.length === 0) {
      toast.error("Please write a message and mention at least one person");
      return;
    }

    if (selectedPoints <= 0) {
      toast.error("Please enter a valid number of points");
      return;
    }

    if (selectedPoints > userPoints) {
      toast.error("You don't have enough points to give");
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
      setSelectedPoints(1);
      
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
            <RichTextEditor
              ref={editorRef}
              value={text}
              onChange={handleTextChange}
              onMentionTrigger={handleMentionTrigger}
              placeholder="Give recognition... Type @ to mention someone"
              disabled={isSubmitting}
              mentions={mentions}
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

            {/* Bottom Bar */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
              {/* Points Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Points:</span>
                <Input
                  type="number"
                  value={selectedPoints}
                  onChange={(e) => setSelectedPoints(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={userPoints}
                  className="w-20 h-7 text-xs"
                  disabled={isSubmitting}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim() || mentions.length === 0 || selectedPoints <= 0 || selectedPoints > userPoints}
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