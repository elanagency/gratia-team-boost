
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
import { usePricing } from "@/hooks/usePricing";
import { useDepartments } from "@/hooks/useDepartments";
import InviteForm from "./InviteForm";

const InviteTeamMemberDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyId, user } = useAuth();
  const { teamSlots } = useTeamMembers();
  const { pricePerMember } = usePricing();
  const { refetch: refetchDepartments } = useDepartments();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !department) {
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
          department,
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
      
      // Check if billing setup is needed (no subscription and no billing ready)
      if (data.needsBillingSetup && data.checkoutUrl) {
        console.log("Billing setup needed, redirecting to setup flow");
        
        setEmail('');
        setName('');
        setDepartment('');
        setOpen(false);
        
        // Show billing explanation popup first
        if (window.confirm(
          "To invite team members, we need to set up your billing. You won't be charged until your first team member logs in.\n\n" +
          "• No charge for setting up payment method\n" +
          "• Billing starts when first invited member logs in\n" +
          "• Only pay for active team members\n" +
          "• Cancel anytime\n\n" +
          "Continue to set up billing?"
        )) {
          window.location.href = data.checkoutUrl;
        }
        
        return;
      }

      // Handle any other errors
      if (data.error && !data.needsBillingSetup) {
        console.log("Error adding team member:", data.error);
        toast.error(data.error);
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
      setDepartment('');
      
      // Show appropriate success message based on email status
      if (data.emailSent) {
        toast.success(`${name} has been added to the team and an invitation email has been sent with login details.`);
      } else {
        // Show warning if email failed but member was still created
        toast.warning(`${name} has been added to the team, but the invitation email could not be sent. Please contact them directly with their login details.`);
      }
      
      // Refresh departments list to include any new departments
      refetchDepartments();
      
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

  const canAddMembers = true; // Always allow adding members with usage-based billing
  
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
        
        {teamSlots.used === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">First Team Member</h4>
            <p className="text-sm text-blue-700 mb-3">
              Set up billing first, then invite team members. You'll only be charged when your first team member logs in at ${pricePerMember}/month per active member.
            </p>
            <p className="text-xs text-blue-600">
              • No upfront charges - setup payment method only<br/>
              • Billing starts when first member logs in<br/>
              • Pay only for active team members<br/>
              • Billing adjusts automatically each month
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">Add Team Member</h4>
            <p className="text-sm text-green-700 mb-2">
              Current team: {teamSlots.used} members
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
          department={department}
          setDepartment={setDepartment}
          isSubmitting={isSubmitting}
          isFirstMember={teamSlots.used === 0}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InviteTeamMemberDialog;
