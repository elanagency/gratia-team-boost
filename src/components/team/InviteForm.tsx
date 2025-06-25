
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InviteFormProps {
  email: string;
  setEmail: (email: string) => void;
  name: string;
  setName: (name: string) => void;
  isSubmitting: boolean;
  isFirstMember: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const InviteForm = ({
  email,
  setEmail,
  name,
  setName,
  isSubmitting,
  isFirstMember,
  onSubmit,
}: InviteFormProps) => {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
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
      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="ml-auto bg-[#F572FF] hover:bg-[#E061EE] text-white"
      >
        {isSubmitting ? "Adding..." : isFirstMember ? "Add Member & Setup Billing" : "Invite"}
      </Button>
    </form>
  );
};

export default InviteForm;
