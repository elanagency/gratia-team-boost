import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InviteTeamMemberDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { companyId, user } = useAuth();
  
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
      console.log("Inviting team member:", { email, name, role });
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { 
          email, 
          name, 
          companyId,
          role,
          invitedBy: user?.id
        }
      });
      
      if (error) throw error;
      
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
          
          toast.info(`${name} has been added! After viewing the password, you'll be redirected to complete billing setup.`);
        } else {
          // Existing user, redirect immediately
          setOpen(false);
          setEmail('');
          setName('');
          setRole('member');
          
          toast.info(`${name} has been added! Redirecting to billing setup...`);
          
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
  
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(passwordInfo.password)
      .then(() => {
        toast.success("Password copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy password");
      });
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Add a new team member to your company.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select onValueChange={setRole} defaultValue={role}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="ml-auto bg-[#F572FF] hover:bg-[#E061EE] text-white">
              {isSubmitting ? "Submitting..." : "Invite"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog - Using separate Dialog component */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Team Member Created</DialogTitle>
            <DialogDescription>
              A new account has been created for {passwordInfo.name}. Share these temporary credentials with them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <div className="col-span-3 bg-gray-100 p-2 rounded text-sm">
                {passwordInfo.email}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Password</Label>
              <div className="col-span-3 bg-gray-100 p-2 rounded text-sm font-mono flex items-center justify-between">
                {passwordInfo.password}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyPasswordToClipboard} 
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-amber-600 mt-2">
              <strong>Important:</strong> This password will only be shown once. Make sure to copy it before closing this dialog.
            </div>
          </div>
          <Button 
            onClick={closePasswordDialog} 
            className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteTeamMemberDialog;
