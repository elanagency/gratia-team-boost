import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Award, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserPoints } from "@/hooks/useUserPoints";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const pointPresets = [
  { value: 10, label: "+10", icon: Heart, color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { value: 20, label: "+20", icon: Star, color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
  { value: 25, label: "+25", icon: Award, color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { value: 50, label: "+50", icon: Zap, color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  { value: 100, label: "+100", icon: Award, color: "bg-green-100 text-green-700 hover:bg-green-200" },
];

export function GivePointsCard() {
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [customPoints, setCustomPoints] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, companyId } = useAuth();
  const { teamMembers } = useTeamMembers();
  const { userPoints } = useUserPoints();

  const handlePointSelect = (points: number) => {
    setSelectedPoints(points);
    setCustomPoints("");
  };

  const handleCustomPointsChange = (value: string) => {
    setCustomPoints(value);
    setSelectedPoints(null);
  };

  const getPointsToGive = () => {
    return selectedPoints || parseInt(customPoints) || 0;
  };

  const handleSubmit = async () => {
    const pointsToGive = getPointsToGive();
    
    if (!selectedRecipient || !description.trim() || pointsToGive <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user || !companyId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalDescription = hashtags.trim() 
        ? `${description} ${hashtags.split(/\s+/).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}`
        : description;

      const { error } = await supabase
        .from('point_transactions')
        .insert({
          company_id: companyId,
          sender_id: user.id,
          recipient_id: selectedRecipient,
          points: pointsToGive,
          description: finalDescription
        });

      if (error) throw error;

      toast.success(`Successfully gave ${pointsToGive} points!`);
      
      // Reset form
      setSelectedPoints(null);
      setCustomPoints("");
      setSelectedRecipient("");
      setDescription("");
      setHashtags("");
      
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRecipients = teamMembers?.filter(member => member.user_id !== user?.id) || [];

  return (
    <Card className="dashboard-card h-fit">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Heart className="h-5 w-5 text-[#F572FF]" />
          Give Recognition
        </CardTitle>
        <CardDescription className="text-sm">
          You have <Badge variant="secondary" className="mx-1">{userPoints}</Badge> points to give
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Quick Point Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quick Points</label>
          <div className="grid grid-cols-3 gap-2">
            {pointPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPoints === preset.value;
              return (
                <Button
                  key={preset.value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePointSelect(preset.value)}
                  className={`gap-1 h-10 ${!isSelected ? preset.color : ''}`}
                >
                  <Icon className="h-3 w-3" />
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Custom Points */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Amount</label>
          <Input
            type="number"
            placeholder="Enter custom points"
            value={customPoints}
            onChange={(e) => handleCustomPointsChange(e.target.value)}
            min="1"
            max={userPoints}
            className="h-10"
          />
        </div>

        {/* Recipient Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recipient *</label>
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {availableRecipients.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.name} 
                  {member.department && ` (${member.department})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recognition Message *</label>
          <Textarea
            placeholder="What did they do great? Be specific..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-16 resize-none"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (optional)</label>
          <Input
            placeholder="#teamwork #innovation #excellence"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedRecipient || !description.trim() || getPointsToGive() <= 0}
          className="w-full h-11 bg-[#F572FF] hover:bg-[#F572FF]/90"
        >
          {isSubmitting ? "Giving Points..." : `Give ${getPointsToGive()} Points`}
        </Button>
      </CardContent>
    </Card>
  );
}