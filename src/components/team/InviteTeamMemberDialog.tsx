
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
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import PasswordDisplayDialog from "./PasswordDisplayDialog";
import InviteForm from "./InviteForm";

const InviteTeamMemberDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyId, user } = useAuth();
  const { teamSlots } = useTeamMembers();
  
  const [passwordInfo, setPasswordInfo] = useState({ 
    isNewUser: false, 
    password: "", 
    email: "",
    name: ""
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast.error("Please fill out all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Inviting team member:", { email, name, role, companyId, teamSlots });
      
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { 
          email, 
          name, 
          companyId,
          role,
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
        setRole('member');
        setOpen(false);
        
        toast.success("Redirecting to team slots purchase. Complete payment to add the team member.");
        
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
      
      // Normal flow - member was created successfully
      if (data.isNewUser && data.password) {
        console.log("New user created, showing password dialog");
        setPasswordInfo({
          isNewUser: true,
          password: data.password,
          email: email,
          name: name
        });
        
        setEmail('');
        setName('');
        setRole('member');
        
        setShowPasswordDialog(true);
        console.log("Password dialog state set to:", true);
      } else {
        console.log("Existing user invited");
        setOpen(false);
        
        setEmail('');
        setName('');
        setRole('member');
        
        toast.success(`${name} has been invited to join the team!`);
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error("Failed to invite team member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closePasswordDialog = () => {
    console.log("Closing password dialog");
    setShowPasswordDialog(false);
    setOpen(false);
    
    if (onSuccess) {
      console.log("Calling onSuccess callback");
      onSuccess();
    }
    
    toast.success(`${passwordInfo.name} has been added to the team!`);
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (showPasswordDialog) {
      return;
    }
    setOpen(newOpen);
  };

  const canAddMembers = teamSlots.total > 0 && teamSlots.available > 0;
  
  return (
    <>
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
              Add a new team member to your company.
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
              <p className="text-sm text-green-700">
                {teamSlots.available} of {teamSlots.total} slots available for new team members.
              </p>
            </div>
          )}
          
          <InviteForm
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
            role={role}
            setRole={setRole}
            isSubmitting={isSubmitting}
            isFirstMember={teamSlots.total === 0}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <PasswordDisplayDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        passwordInfo={passwordInfo}
        onClose={closePasswordDialog}
      />
    </>
  );
};

export default InviteTeamMemberDialog;
