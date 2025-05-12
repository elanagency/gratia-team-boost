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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, UserPlus, AlertCircle, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface InviteTeamMemberDialogProps {
  onSuccess: () => void;
}

interface CreatedUserInfo {
  name: string;
  email: string;
  password?: string;
  isNewUser: boolean;
}

const InviteTeamMemberDialog: React.FC<InviteTeamMemberDialogProps> = ({ 
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { user, companyId, isLoading } = useAuth();
  const [createdUser, setCreatedUser] = useState<CreatedUserInfo | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  
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

  const copyToClipboard = () => {
    if (!createdUser) return;
    
    const textToCopy = `
Name: ${createdUser.name}
Email: ${createdUser.email}
Password: ${createdUser.password || "N/A - Existing user"}
    `.trim();
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success("Credentials copied to clipboard"))
      .catch(() => toast.error("Failed to copy credentials"));
  };

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

      if (data.alreadyMember) {
        toast.info(`${name} is already a member of your team`);
      } else {
        // If this is a new user, show their credentials
        if (data.isNewUser && data.password) {
          setCreatedUser({
            name,
            email,
            password: data.password,
            isNewUser: true
          });
          setShowCredentials(true);
        } else {
          // Existing user was added to team
          setCreatedUser({
            name,
            email,
            isNewUser: false
          });
          setShowCredentials(true);
        }
        
        toast.success(`${name} has been added to your team`);
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
      setIsSending(false);
    }
  };

  const handleCredentialsClose = () => {
    setShowCredentials(false);
    setCreatedUser(null);
  };

  return (
    <>
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

      {/* Credentials Dialog */}
      <AlertDialog open={showCredentials} onOpenChange={handleCredentialsClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              {createdUser?.isNewUser ? "New Team Member Created" : "Team Member Added"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {createdUser?.isNewUser 
                ? "A new account has been created. Please save these credentials:" 
                : "An existing user has been added to your team:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 my-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{createdUser?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{createdUser?.email}</p>
              </div>
              {createdUser?.isNewUser && createdUser?.password && (
                <div>
                  <p className="text-sm text-gray-500">Password</p>
                  <p className="font-medium font-mono bg-white p-1 border border-gray-200 rounded">
                    {createdUser.password}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {createdUser?.isNewUser && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Please make sure to save these credentials. They will not be shown again.
              </p>
            </div>
          )}
          
          <AlertDialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              className="flex-1 sm:flex-none"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
            <AlertDialogAction className="bg-[#F572FF] hover:bg-[#E061EE] flex-1 sm:flex-none">
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InviteTeamMemberDialog;
