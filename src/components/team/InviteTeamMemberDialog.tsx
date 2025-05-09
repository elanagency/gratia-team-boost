
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { Mail, UserPlus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface InviteTeamMemberDialogProps {
  onSuccess: () => void;
}

const InviteTeamMemberDialog: React.FC<InviteTeamMemberDialogProps> = ({ 
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { user, companyId, isLoading } = useAuth();
  
  // Enable the button if the user is logged in and not in loading state
  const buttonDisabled = isLoading || !user?.id || !companyId;

  // Debug logging
  useEffect(() => {
    if (open) {
      console.log("Invite Dialog State:", { 
        userId: user?.id,
        companyId, 
        isLoading
      });
    }
  }, [open, user?.id, companyId, isLoading]);

  const handleInvite = async () => {
    if (!email || !name) {
      toast.error("Please provide both name and email");
      return;
    }
    
    if (!user?.id) {
      toast.error("User session expired. Please login again.");
      return;
    }
    
    // Verify company ID before sending invitation
    if (!companyId) {
      console.error("Missing companyId when attempting to invite:", { companyId, userId: user.id });
      toast.error("You need to be part of a company to invite members. Please refresh the page.");
      return;
    }
    
    // We already have a valid company ID from useAuth
    await sendInvitation(companyId);
  };
  
  const sendInvitation = async (companyId: string) => {
    setIsSending(true);
    
    try {
      console.log("Creating invitation for:", { email, name, companyId, invitedBy: user?.id });
      
      // Create team invitation record
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .insert({
          company_id: companyId,
          invited_by: user?.id,
          email,
          name,
          role: 'member'
        })
        .select()
        .single();
      
      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        throw invitationError;
      }

      console.log("Invitation created:", invitation);

      // Reset form and close dialog
      setName("");
      setEmail("");
      setOpen(false);
      
      // Call the onSuccess callback to refresh the team members list
      onSuccess();
      toast.success(`Invitation sent to ${name}`);
      
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error(error.message || "Failed to invite team member");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#F572FF] hover:bg-[#E061EE]"
          disabled={buttonDisabled}
          title={
            !user?.id ? "Please login first" : 
            !companyId ? "You don't belong to any company" : 
            isLoading ? "Please wait..." : 
            "Invite a team member"
          }
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        {!companyId && (
          <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md flex items-start">
            <AlertCircle className="text-yellow-500 mr-2 h-5 w-5 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">No company detected</p>
              <p className="text-yellow-700 text-sm">
                You need to be part of a company to invite members. 
                Please refresh the page to create or join a company.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="colleague@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button 
            className="bg-[#F572FF] hover:bg-[#E061EE]" 
            onClick={handleInvite}
            disabled={isSending || !companyId}
          >
            {isSending ? "Inviting..." : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamMemberDialog;
