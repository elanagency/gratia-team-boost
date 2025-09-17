import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Trophy, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Internal interface for the dialog
interface DialogTeamMember {
  id: string;
  name: string;
  email: string;
  user_id: string;
  points: number;
  department: string;
  status: 'invited' | 'active' | 'deactivated';
  first_login_at?: string;
}

interface GivePointsDialogProps {
  isTeamMember?: boolean;
}

export function GivePointsDialog({ isTeamMember = false }: GivePointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<DialogTeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DialogTeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<DialogTeamMember | null>(null);
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyPoints, setCompanyPoints] = useState(0);
  const [showInsufficientPoints, setShowInsufficientPoints] = useState(false);
  
  const { user, companyId, isAdmin, monthlyPoints } = useAuth();
  const queryClient = useQueryClient();

  // Fetch team members when dialog opens
  useEffect(() => {
    if (open && companyId) {
      fetchTeamMembers();
    } else {
      // Reset state when dialog closes
      setSearchQuery("");
      setSelectedMember(null);
      setDescription("");
      setPoints(1);
      setShowInsufficientPoints(false);
    }
  }, [open, companyId]);

  // Check if user has enough monthly points
  useEffect(() => {
    setShowInsufficientPoints(points > monthlyPoints);
  }, [points, monthlyPoints]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(teamMembers);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredMembers(
        teamMembers.filter((member) => 
          member.name.toLowerCase().includes(lowercaseQuery) || 
          member.email?.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
  }, [searchQuery, teamMembers]);


  const fetchTeamMembers = async () => {
    if (!companyId || !user) return;
    
    try {
      setIsSearching(true);
      
      // Get all profiles except the current user
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          points,
          department,
          status,
          first_login_at
        `)
        .eq('company_id', companyId)
        .neq('id', user.id)
        .eq('status', 'active');
      
      if (profilesError) throw profilesError;
      
      if (!profiles?.length) {
        setTeamMembers([]);
        return;
      }
      
      // Format team members directly from profiles data
      const formattedMembers: DialogTeamMember[] = profiles.map(profile => {
        const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        return {
          id: profile.id,
          name: memberName || 'No Name',
          email: '', // We don't have email in the profiles table
          user_id: profile.id,
          points: profile.points || 0,
          department: profile.department || '',
          status: (profile.status as 'invited' | 'active' | 'deactivated') || 'invited',
          first_login_at: profile.first_login_at
        };
      });
      
      setTeamMembers(formattedMembers);
      setFilteredMembers(formattedMembers);
      
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember || !description || points < 1 || !user?.id || !companyId) {
      toast.error("Please fill out all fields");
      return;
    }

    // Check if user has enough monthly points
    if (points > monthlyPoints) {
      setShowInsufficientPoints(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the point transaction
      const { error } = await supabase
        .from('point_transactions')
        .insert({
          company_id: companyId,
          sender_profile_id: user.id,
          recipient_profile_id: selectedMember.user_id,
          points: points,
          description: description
        });

      if (error) throw error;

      toast.success(`Successfully gave ${points} points to ${selectedMember.name}`);
      
      // Invalidate relevant queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['userPoints'] });
      
      setOpen(false);
    } catch (error) {
      console.error("Error giving points:", error);
      toast.error("Failed to give points");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availablePoints = monthlyPoints;
  const balanceLabel = "Available Points to Give";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#F572FF] hover:bg-[#E061EE]">
          <Trophy className="mr-2 h-4 w-4" />
          Give Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Give Points</DialogTitle>
          <DialogDescription>
            Recognize a team member's contribution by giving them points.
          </DialogDescription>
        </DialogHeader>
        
        {/* Points balance info */}
        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{balanceLabel}:</span>
            <span className="font-semibold">{availablePoints} points</span>
          </div>
        </div>
        
        {showInsufficientPoints && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">
                Insufficient points
              </p>
              <p className="text-xs text-red-500">
                You only have {monthlyPoints} points available to give this month.
              </p>
            </div>
          </div>
        )}
        
        {!selectedMember ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-8"
                placeholder="Search for a team member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#F572FF]" />
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#F572FF]/10 flex items-center justify-center text-[#F572FF]">
                          {member.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">Team Member</p>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">{member.points} points</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No team members found</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#F572FF]/10 flex items-center justify-center text-[#F572FF]">
                  {selectedMember.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-gray-500">Team Member</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                Change
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input 
                id="points" 
                type="number" 
                min="1" 
                max={availablePoints}
                value={points}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setPoints(value);
                }}
              />
              {availablePoints > 0 && (
                <p className="text-xs text-gray-500">Maximum: {availablePoints} points</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Why are you giving points?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {selectedMember && (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedMember || !description || points < 1 || isSubmitting || points > availablePoints}
              className="bg-[#F572FF] hover:bg-[#E061EE]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Give Points
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
