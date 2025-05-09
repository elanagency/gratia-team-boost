
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
import { Mail, UserPlus, AlertCircle, Loader2 } from "lucide-react";
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
    await createTeamMember(companyId);
  };
  
  const createTeamMember = async (companyId: string) => {
    setIsSending(true);
    
    try {
      console.log("Creating team member:", { email, name, companyId, invitedBy: user?.id });
      
      // Call the edge function to create the team member
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: {
          email,
          name,
          companyId,
          role: 'member',
          invitedBy: user?.id
        }
      });
      
      if (error) {
        console.error("Error creating team member:", error);
        throw new Error(error.message || "Failed to invite team member");
      }

      console.log("Team member creation response:", data);

      // Reset form and close dialog
      setName("");
      setEmail("");
      setOpen(false);
      
      // Call the onSuccess callback to refresh the team members list
      onSuccess();
      
      if (data.alreadyMember) {
        toast.info(`${name} is already a member of your team`);
      } else {
        toast.success(`${name} has been added to your team`);
      }
      
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
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamMemberDialog;
