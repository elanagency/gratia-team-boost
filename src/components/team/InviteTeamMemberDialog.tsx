
import React, { useState } from "react";
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
}

const InviteTeamMemberDialog: React.FC<InviteTeamMemberDialogProps> = ({ 
  companyId, 
  userId,
  onSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!email || !name) {
      toast.error("Please provide both name and email");
      return;
    }
    
    if (!companyId) {
      toast.error("Company information not available");
      return;
    }
    
    setIsLoading(true);
    
    try {
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
      
      if (invitationError) throw invitationError;

      // Generate a random password for the new user
      const tempPassword = Math.random().toString(36).slice(-12);
      
      // Create the user account in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ')
        }
      });
      
      if (authError) {
        // If user already exists, we don't need to create them
        if (!authError.message.includes('already registered')) {
          throw authError;
        }
        
        toast.info(`User ${email} already exists and will receive an invitation`);
      } else {
        // Update the invitation with the user_id
        await supabase
          .from('team_invitations')
          .update({ user_id: authUser.user.id })
          .eq('id', invitation.id);
          
        // Create profile if it doesn't exist
        const firstName = name.split(' ')[0];
        const lastName = name.split(' ').slice(1).join(' ');
        
        // Add user to the company_members table
        await supabase
          .from('company_members')
          .insert({
            company_id: companyId,
            user_id: authUser.user.id,
            role: 'member',
            is_admin: false
          });
          
        toast.success(`User account created for ${name} (${email})`);
      }
      
      // Reset form and close dialog
      setName("");
      setEmail("");
      setOpen(false);
      
      // Call the onSuccess callback to refresh the team members list
      onSuccess();
      
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error(error.message || "Failed to invite team member");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#F572FF] hover:bg-[#E061EE]">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="bg-[#F572FF] hover:bg-[#E061EE]" 
            onClick={handleInvite}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Create & Invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamMemberDialog;
