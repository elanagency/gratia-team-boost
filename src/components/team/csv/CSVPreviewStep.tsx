import React, { memo, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, AlertCircle } from "lucide-react";

interface CSVMember {
  name: string;
  email: string;
  department: string;
}

interface CSVPreviewStepProps {
  parsedMembers: CSVMember[];
  onBack: () => void;
  onStartProcessing: () => void;
}

export const CSVPreviewStep = memo(({ parsedMembers, onBack, onStartProcessing }: CSVPreviewStepProps) => {
  const { validMembers, invalidMembers } = useMemo(() => {
    console.log('CSVPreviewStep - Parsed members received:', parsedMembers);
    
    const valid = parsedMembers.filter(member => {
      const hasName = member.name && member.name.trim() !== '';
      const hasEmail = member.email && member.email.trim() !== '';
      const isValidEmail = hasEmail && /\S+@\S+\.\S+/.test(member.email.trim());
      
      console.log(`Validating member:`, {
        member,
        hasName,
        hasEmail,
        isValidEmail,
        isValid: hasName && hasEmail && isValidEmail
      });
      
      return hasName && hasEmail && isValidEmail;
    });
    
    const invalid = parsedMembers.filter(member => !valid.includes(member));
    
    console.log('Valid members:', valid);
    console.log('Invalid members:', invalid);
    
    return { validMembers: valid, invalidMembers: invalid };
  }, [parsedMembers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Preview Members</span>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {validMembers.length} valid
        </Badge>
      </div>

      {invalidMembers.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
          <div className="flex items-center gap-2 text-destructive font-medium mb-2">
            <AlertCircle className="h-4 w-4" />
            {invalidMembers.length} Invalid Entries
          </div>
          <div className="text-sm text-destructive/80">
            These entries will be skipped due to missing or invalid data.
          </div>
        </div>
      )}

      <div className="border rounded max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium">Name</th>
              <th className="text-left p-2 font-medium">Email</th>
              <th className="text-left p-2 font-medium">Department</th>
            </tr>
          </thead>
          <tbody>
            {validMembers.map((member, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{member.name}</td>
                <td className="p-2">{member.email}</td>
                <td className="p-2">{member.department || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onStartProcessing} className="flex-1" disabled={validMembers.length === 0}>
          Invite {validMembers.length} Members
        </Button>
      </div>
    </div>
  );
});

CSVPreviewStep.displayName = 'CSVPreviewStep';