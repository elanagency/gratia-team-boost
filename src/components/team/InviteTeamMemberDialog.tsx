
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
import { Mail, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteTeamMemberDialogProps {
  companyId: string | null;
  userId: string;
  onSuccess: () => void;
  isLoading?: boolean;
}

const InviteTeamMemberDialog: React.FC<InviteTeamMemberDialogProps> = ({ 
  companyId, 
  userId,
  onSuccess,
  isLoading = false
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [validCompanyId, setValidCompanyId] = useState(false);
  
  useEffect(() => {
    // Validate the company ID whenever it changes
    setValidCompanyId(typeof companyId === 'string' && companyId.length > 0);
  }, [companyId]);

  const handleInvite = async () => {
    if (!email || !name) {
      toast.error("Please provide both name and email");
      return;
    }
    
    if (!validCompanyId) {
      toast.error("Company information not available. Please refresh the page and try again.");
      return;
    }

    if (!userId) {
      toast.error("User session expired. Please login again.");
      return;
    }
    
    setIsSending(true);
    
    try {
      console.log("Creating invitation for:", { email, name, companyId, invitedBy: userId });
      
      // Create team invitation record
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .insert({
          company_id: companyId,
          invited_by: userId,
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

  const buttonDisabled = isLoading || !validCompanyId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#F572FF] hover:bg-[#E061EE]"
          disabled={buttonDisabled}
          title={buttonDisabled ? "Company information loading..." : "Invite a team member"}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
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
            disabled={isSending || !validCompanyId}
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
