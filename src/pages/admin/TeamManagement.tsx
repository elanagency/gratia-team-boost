
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Mail, Trash2, Trophy, MoreHorizontal, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TeamManagement = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const { user, companyName } = useAuth();

  // Fetch team members
  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      // Get the company_id of the current user
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (companyMember) {
        // Fetch company members
        const { data: members, error } = await supabase
          .from('company_members')
          .select(`
            id,
            role,
            is_admin,
            user_id,
            profiles:user_id (
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('company_id', companyMember.company_id);

        if (error) throw error;

        // Format the data
        const formattedMembers = members.map(member => ({
          id: member.id,
          name: `${member.profiles.first_name || ''} ${member.profiles.last_name || ''}`.trim() || 'No Name',
          email: '', // We don't have email in the profiles table
          role: member.is_admin ? 'Admin' : member.role || 'Member',
          user_id: member.user_id,
          recognitionsReceived: 0, // Placeholder for now
          recognitionsGiven: 0 // Placeholder for now
        }));
        
        setTeamMembers(formattedMembers);

        // Now fetch pending invitations
        const { data: invitations } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('company_id', companyMember.company_id)
          .is('accepted_at', null);
        
        if (invitations?.length > 0) {
          const pendingInvitations = invitations.map(invite => ({
            id: invite.id,
            name: invite.name,
            email: invite.email,
            role: invite.role || 'Member',
            isPending: true,
            recognitionsReceived: 0,
            recognitionsGiven: 0
          }));
          
          setTeamMembers([...formattedMembers, ...pendingInvitations]);
        }
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to fetch team members");
    }
  };

  const handleInvite = async () => {
    if (!email || !name) {
      toast.error("Please provide both name and email");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get current company_id
      const { data: companyMember, error: companyError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (companyError) throw companyError;
      
      // Create team invitation record
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .insert({
          company_id: companyMember.company_id,
          invited_by: user.id,
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
            company_id: companyMember.company_id,
            user_id: authUser.user.id,
            role: 'member',
            is_admin: false
          });
          
        toast.success(`User account created for ${name} (${email})`);
      }
      
      // In a real app, you would send an email with login instructions here
      
      // Reset form and close dialog
      setName("");
      setEmail("");
      setOpen(false);
      
      // Refresh the team members list
      fetchTeamMembers();
      
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error(error.message || "Failed to invite team member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    
    try {
      // If it's a pending invitation
      if (memberToDelete.isPending) {
        await supabase
          .from('team_invitations')
          .delete()
          .eq('id', memberToDelete.id);
      } else {
        // If it's an actual team member
        await supabase
          .from('company_members')
          .delete()
          .eq('id', memberToDelete.id);
      }
      
      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    }
    
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Team Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
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
        </div>
      </div>
      
      <Card className="dashboard-card">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100">
              <TableHead className="text-gray-500">Name</TableHead>
              <TableHead className="text-gray-500">Email</TableHead>
              <TableHead className="text-gray-500">Role</TableHead>
              <TableHead className="text-gray-500">Recognitions</TableHead>
              <TableHead className="text-gray-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <TableRow key={member.id} className="border-gray-100">
                  <TableCell className="font-medium">
                    {member.name}
                    {member.isPending && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">{member.email}</TableCell>
                  <TableCell>
                    <span 
                      className={`py-1 px-2 rounded-full text-xs ${
                        member.role === "Admin" 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                      <span>{member.recognitionsReceived} received</span>
                      <span className="mx-2">|</span>
                      <span>{member.recognitionsGiven} given</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => {
                          setMemberToDelete(member);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No team members found. Invite your first team member!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-800">Free Plan Limit</h3>
        <p className="text-blue-600 text-sm mt-1">Your current plan allows up to 3 team members. Upgrade your plan to add more team members.</p>
        <Button className="bg-[#F572FF] hover:bg-[#E061EE] mt-3">
          Upgrade Plan
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToDelete?.name} from your team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={handleRemoveMember}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamManagement;
