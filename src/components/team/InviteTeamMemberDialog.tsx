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
import BillingSetupInfo from "./BillingSetupInfo";
import PasswordDisplayDialog from "./PasswordDisplayDialog";
import InviteForm from "./InviteForm";

const InviteTeamMemberDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyId, user } = useAuth();
  const { teamMembers } = useTeamMembers();
  
  // Check if this will be the first member (since teamMembers already excludes admins)
  const currentMemberCount = teamMembers?.length || 0;
  const isFirstMember = currentMemberCount === 0;
  
  // Add state for password info and dialog
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
      console.log("Inviting team member:", { email, name, role, companyId, isFirstMember });
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { 
          email, 
          name, 
          companyId,
          role,
          invitedBy: user?.id
        }
      });
      
      if (error) {
        console.error("Error from create-team-member:", error);
        throw error;
      }
      
      console.log("Team member creation response:", data);
      
      // Check if we need to redirect to checkout for billing setup
      if (data.needsBillingSetup && data.checkoutUrl) {
        console.log("Billing setup needed, redirecting to checkout");
        
        // If this is a new user, show password first, then redirect
        if (data.isNewUser && data.password) {
          setPasswordInfo({
            isNewUser: true,
            password: data.password,
            email: email,
            name: name
          });
          
          // Reset form fields
          setEmail('');
          setName('');
          setRole('member');
          
          // Show password dialog first
          setShowPasswordDialog(true);
          
          // Store checkout URL for later redirect
          sessionStorage.setItem('pendingCheckoutUrl', data.checkoutUrl);
          
          toast.success(`${name} has been added! After viewing the password, you'll be redirected to complete billing setup.`);
        } else {
          // Existing user, redirect immediately
          setOpen(false);
          setEmail('');
          setName('');
          setRole('member');
          
          toast.success(`${name} has been added! Redirecting to billing setup...`);
          
          // Redirect to Stripe checkout
          setTimeout(() => {
            window.location.href = data.checkoutUrl;
          }, 2000);
        }
        
        // Call onSuccess for UI refresh
        if (onSuccess) {
          onSuccess();
        }
        
        return;
      }
      
      // Check if this is a new user with a password (no billing setup needed)
      if (data.isNewUser && data.password) {
        console.log("New user created, showing password dialog");
        setPasswordInfo({
          isNewUser: true,
          password: data.password,
          email: email,
          name: name
        });
        
        // Reset form fields but keep the main dialog open until password dialog is closed
        setEmail('');
        setName('');
        setRole('member');
        
        // Important: Show password dialog AFTER updating state
        setShowPasswordDialog(true);
        console.log("Password dialog state set to:", true);
      } else {
        console.log("Existing user invited");
        setOpen(false);
        
        // Reset form
        setEmail('');
        setName('');
        setRole('member');
        
        toast.success(`${name} has been invited to join the team!`);
        
        // Call onSuccess for existing user
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
    setOpen(false); // Close the main dialog as well
    
    // Check if we need to redirect to checkout after showing password
    const pendingCheckoutUrl = sessionStorage.getItem('pendingCheckoutUrl');
    if (pendingCheckoutUrl) {
      sessionStorage.removeItem('pendingCheckoutUrl');
      console.log("Redirecting to pending checkout URL:", pendingCheckoutUrl);
      
      toast.info("Redirecting to billing setup...");
      setTimeout(() => {
        window.location.href = pendingCheckoutUrl;
      }, 1500);
    } else {
      // Now call onSuccess callback after user has seen the password
      if (onSuccess) {
        console.log("Calling onSuccess callback");
        onSuccess();
      }
      
      toast.success(`${passwordInfo.name} has been added to the team!`);
    }
  };
  
  // Make sure we don't close the main dialog while password dialog is showing
  const handleOpenChange = (newOpen: boolean) => {
    if (showPasswordDialog) {
      // If password dialog is open, don't allow closing the main dialog
      // This ensures the password dialog stays visible
      return;
    }
    setOpen(newOpen);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-[#F572FF] hover:bg-[#E061EE] text-white">
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
          
          <BillingSetupInfo isFirstMember={isFirstMember} />
          
          <InviteForm
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
            role={role}
            setRole={setRole}
            isSubmitting={isSubmitting}
            isFirstMember={isFirstMember}
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
