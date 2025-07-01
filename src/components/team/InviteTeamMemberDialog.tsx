
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import InviteForm from "./InviteForm";

const InviteTeamMemberDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyId, user } = useAuth();
  const { teamSlots } = useTeamMembers();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Inviting team member:", { email, name, companyId, teamSlots });
      
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { 
          email, 
          name, 
          companyId,
          role: 'member',
          invitedBy: user?.id,
          origin
        }
      });
      
      if (error) {
        console.error("Error from create-team-member:", error);
        throw error;
      }
      
      console.log("Team member creation response:", data);
      
      // Check if billing setup is needed (no slots purchased)
      if (data.needsBillingSetup && data.checkoutUrl) {
        console.log("No team slots purchased, redirecting to checkout");
        
        setEmail('');
        setName('');
        setOpen(false);
        
        toast.success("Team Slots Required - Redirecting to team slots purchase. Complete payment to add the team member.");
        
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1500);
        
        return;
      }

      // Check if all slots are exhausted
      if (data.slotsExhausted) {
        console.log("All team slots are used");
        toast.error(data.error || "All team slots are in use. Please upgrade your subscription.");
        return;
      }

      // Check if user was already a member
      if (data.alreadyMember) {
        console.log("User is already a member");
        toast.info(`${name} is already a member of this company.`);
        return;
      }
      
      // Success - member was created
      setOpen(false);
      setEmail('');
      setName('');
      
      // Show appropriate success message based on email status
      if (data.emailSent) {
        toast.success(`${name} has been added to the team and an invitation email has been sent with login details.`);
      } else {
        // Show warning if email failed but member was still created
        toast.warning(`${name} has been added to the team, but the invitation email could not be sent. Please contact them directly with their login details.`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error("Failed to invite team member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const canAddMembers = teamSlots.total > 0 && teamSlots.available > 0;
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
          disabled={!canAddMembers}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            Add a new team member to your company. They will receive an email with login details and a link to access the platform.
          </DialogDescription>
        </DialogHeader>
        
        {teamSlots.total === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Team Slots Required</h4>
            <p className="text-sm text-amber-700 mb-3">
              You need to purchase team slots before adding members. 
              The first member will trigger the billing setup process.
            </p>
            <p className="text-xs text-amber-600">
              • $2.99 per team slot per month<br/>
              • Choose any number of slots you need<br/>
              • Add members up to your slot limit
            </p>
          </div>
        ) : teamSlots.available === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">No Available Slots</h4>
            <p className="text-sm text-red-700 mb-3">
              All {teamSlots.total} team slots are in use. Upgrade your subscription to add more members.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Team Slots Available</h4>
            <p className="text-sm text-green-700 mb-2">
              {teamSlots.available} of {teamSlots.total} slots available for new team members.
            </p>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Mail className="h-4 w-4" />
              <span>Invitation emails will be sent automatically</span>
            </div>
          </div>
        )}
        
        <InviteForm
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          isSubmitting={isSubmitting}
          isFirstMember={teamSlots.total === 0}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamMemberDialog;
