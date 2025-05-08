
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UserPlus, Mail, Trash2, Trophy } from "lucide-react";
import { Label } from "@/components/ui/label";

const TeamManagement = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  // Sample team data
  const teamMembers = [
    { id: 1, name: "Jane Cooper", email: "jane.cooper@example.com", role: "Admin", recognitionsReceived: 12, recognitionsGiven: 8 },
    { id: 2, name: "Michael Johnson", email: "michael.j@example.com", role: "Member", recognitionsReceived: 8, recognitionsGiven: 15 },
    { id: 3, name: "David Williams", email: "david.w@example.com", role: "Member", recognitionsReceived: 5, recognitionsGiven: 2 },
  ];

  const handleInvite = () => {
    // Handle invite logic here
    console.log("Inviting:", email);
    setEmail("");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Team Management</h1>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F572FF] hover:bg-[#E061EE]">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
      
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Recognitions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span 
                        className={`py-1 px-2 rounded-full text-xs ${
                          member.role === "Admin" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                        <span>{member.recognitionsReceived} received</span>
                        <span className="mx-2">|</span>
                        <span>{member.recognitionsGiven} given</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No team members yet</p>
              <p className="text-sm mt-1">Invite team members to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800">Free Plan Limit</h3>
        <p className="text-blue-700">Your current plan allows up to 3 team members. Upgrade your plan to add more team members.</p>
        <Button className="bg-[#F572FF] hover:bg-[#E061EE] mt-3">
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
};

export default TeamManagement;
