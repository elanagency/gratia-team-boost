
import React, { useState } from "react";
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
import { UserPlus, Mail, Trash2, Trophy, MoreHorizontal, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TeamManagement = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // Sample team data
  const teamMembers = [
    { id: 1, name: "Jane Cooper", email: "jane.cooper@example.com", role: "Admin", recognitionsReceived: 12, recognitionsGiven: 8 },
    { id: 2, name: "Michael Johnson", email: "michael.j@example.com", role: "Member", recognitionsReceived: 8, recognitionsGiven: 15 },
    { id: 3, name: "David Williams", email: "david.w@example.com", role: "Member", recognitionsReceived: 5, recognitionsGiven: 2 },
  ];

  const handleInvite = () => {
    // Handle invite logic here - ensuring role is 'member'
    console.log("Inviting:", { name, email, role: 'member' });
    
    // You would implement the actual invitation logic here, such as:
    // - Sending an email invitation
    // - Adding a record to the database with role='member'
    
    toast.success(`Invitation sent to ${name} (${email})`);
    
    // Reset form fields and close dialog
    setName("");
    setEmail("");
    setOpen(false);
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
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#F572FF] hover:bg-[#E061EE]" onClick={handleInvite}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
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
            {teamMembers.map((member) => (
              <TableRow key={member.id} className="border-gray-100">
                <TableCell className="font-medium">{member.name}</TableCell>
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
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
    </div>
  );
};

export default TeamManagement;
