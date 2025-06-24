
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Users, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CSVRow {
  Name: string;
  Email: string;
  Role: string;
}

interface ParsedMember {
  name: string;
  email: string;
  role: string;
  isValid: boolean;
  errors: string[];
  rowIndex: number;
}

interface BulkUploadDialogProps {
  onSuccess: () => void;
  availableSlots: number;
}

const BulkUploadDialog = ({ onSuccess, availableSlots }: BulkUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'results'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { companyId, user } = useAuth();

  const downloadSampleCSV = () => {
    const sampleData = [
      { Name: "John Doe", Email: "john.doe@company.com", Role: "member" },
      { Name: "Jane Smith", Email: "jane.smith@company.com", Role: "member" },
      { Name: "Bob Johnson", Email: "bob.johnson@company.com", Role: "admin" }
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'team_members_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success("Sample CSV template downloaded");
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRole = (role: string): boolean => {
    const validRoles = ['member', 'admin'];
    return validRoles.includes(role.toLowerCase());
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const validatedMembers: ParsedMember[] = [];

        data.forEach((row, index) => {
          const errors: string[] = [];
          
          if (!row.Name?.trim()) {
            errors.push("Name is required");
          }
          
          if (!row.Email?.trim()) {
            errors.push("Email is required");
          } else if (!validateEmail(row.Email.trim())) {
            errors.push("Invalid email format");
          }
          
          if (!row.Role?.trim()) {
            errors.push("Role is required");
          } else if (!validateRole(row.Role.trim())) {
            errors.push("Role must be 'member' or 'admin'");
          }

          // Skip completely empty rows
          if (!row.Name && !row.Email && !row.Role) {
            return;
          }

          validatedMembers.push({
            name: row.Name?.trim() || '',
            email: row.Email?.trim().toLowerCase() || '',
            role: row.Role?.trim().toLowerCase() || 'member',
            isValid: errors.length === 0,
            errors,
            rowIndex: index + 1
          });
        });

        // Check for duplicate emails within the file
        const emailCounts = new Map<string, number>();
        validatedMembers.forEach(member => {
          const count = emailCounts.get(member.email) || 0;
          emailCounts.set(member.email, count + 1);
        });

        validatedMembers.forEach(member => {
          if (emailCounts.get(member.email)! > 1) {
            member.errors.push("Duplicate email in file");
            member.isValid = false;
          }
        });

        setParsedMembers(validatedMembers);
        setCurrentStep('preview');
      },
      error: (error) => {
        toast.error("Error parsing CSV file: " + error.message);
      }
    });
  };

  const handleBulkUpload = async () => {
    const validMembers = parsedMembers.filter(member => member.isValid);
    
    if (validMembers.length === 0) {
      toast.error("No valid members to upload");
      return;
    }

    if (validMembers.length > availableSlots) {
      toast.error(`You have ${availableSlots} slots available but trying to add ${validMembers.length} members`);
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-create-team-members', {
        body: {
          members: validMembers.map(member => ({
            name: member.name,
            email: member.email,
            role: member.role
          })),
          companyId,
          invitedBy: user?.id
        }
      });

      if (error) {
        throw error;
      }

      setUploadResults(data);
      setCurrentStep('results');
      
      if (data.successCount > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error("Failed to upload team members");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setCurrentStep('upload');
    setParsedMembers([]);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetDialog, 200);
  };

  const validCount = parsedMembers.filter(m => m.isValid).length;
  const invalidCount = parsedMembers.length - validCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Team Members</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple team members at once.
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Upload CSV File</p>
              <p className="text-sm text-gray-500 mb-4">
                Select a CSV file with team member information
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="mr-2"
              >
                Choose File
              </Button>
              <Button variant="outline" onClick={downloadSampleCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Headers: Name, Email, Role</li>
                <li>• Role must be 'member' or 'admin'</li>
                <li>• Email addresses must be unique</li>
                <li>• You have {availableSlots} team slots available</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Review Members</h3>
              <div className="flex gap-2 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {validCount} Valid
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {invalidCount} Invalid
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 border-b">Name</th>
                    <th className="text-left p-2 border-b">Email</th>
                    <th className="text-left p-2 border-b">Role</th>
                    <th className="text-left p-2 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMembers.map((member, index) => (
                    <tr key={index} className={member.isValid ? '' : 'bg-red-50'}>
                      <td className="p-2 border-b">{member.name}</td>
                      <td className="p-2 border-b">{member.email}</td>
                      <td className="p-2 border-b">{member.role}</td>
                      <td className="p-2 border-b">
                        {member.isValid ? (
                          <span className="text-green-600 text-xs">Valid</span>
                        ) : (
                          <div className="text-red-600 text-xs">
                            {member.errors.map((error, i) => (
                              <div key={i}>{error}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetDialog}>
                Upload Different File
              </Button>
              <Button
                onClick={handleBulkUpload}
                disabled={validCount === 0 || isProcessing}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {isProcessing ? 'Processing...' : `Add ${validCount} Members`}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'results' && uploadResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Upload Results</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Successfully Added</span>
                </div>
                <p className="text-2xl font-bold text-green-800 mt-1">
                  {uploadResults.successCount}
                </p>
              </div>
              
              {uploadResults.failureCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800 mt-1">
                    {uploadResults.failureCount}
                  </p>
                </div>
              )}
            </div>

            {uploadResults.results && uploadResults.results.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Email</th>
                      <th className="text-left p-2 border-b">Status</th>
                      <th className="text-left p-2 border-b">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResults.results.map((result: any, index: number) => (
                      <tr key={index} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="p-2 border-b">{result.name}</td>
                        <td className="p-2 border-b">{result.email}</td>
                        <td className="p-2 border-b">
                          <span className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="p-2 border-b text-xs">
                          {result.success ? (
                            result.isNewUser ? 'New user created' : 'Existing user added'
                          ) : (
                            result.error
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
