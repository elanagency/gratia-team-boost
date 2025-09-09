import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

interface CSVUploadDialogProps {
  onUploadComplete: () => void;
}

interface CSVMember {
  name: string;
  email: string;
  department: string;
}

interface ProcessingResult {
  member: CSVMember;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  userId?: string;
}

type DialogStep = 'upload' | 'preview' | 'processing';

export const CSVUploadDialog = ({ onUploadComplete }: CSVUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedMembers, setParsedMembers] = useState<CSVMember[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const { user, companyId } = useAuth();

  const downloadSampleCSV = () => {
    const sampleData = [
      ["Name", "Email", "Department"],
      ["John Doe", "john@example.com", "Engineering"],
      ["Jane Smith", "jane@example.com", "Marketing"],
      ["Mike Johnson", "mike@example.com", "Sales"]
    ];
    
    const csvContent = sampleData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "team_members_sample.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      try {
        const members = await parseCSV(selectedFile);
        setParsedMembers(members);
        setCurrentStep('preview');
      } catch (error) {
        toast.error("Failed to parse CSV file");
      }
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const parseCSV = (file: File): Promise<CSVMember[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const members = results.data as CSVMember[];
          const validMembers = members.filter(member => 
            member.name && member.email && 
            member.name.trim() !== '' && member.email.trim() !== ''
          );
          resolve(validMembers);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const startProcessing = () => {
    const results: ProcessingResult[] = parsedMembers.map(member => ({
      member,
      status: 'pending'
    }));
    setProcessingResults(results);
    setCurrentStep('processing');
    setCurrentProcessingIndex(0);
    processNextMember(results, 0);
  };

  const processNextMember = async (results: ProcessingResult[], index: number) => {
    if (index >= results.length) {
      setIsProcessing(false);
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      if (successful > 0) {
        toast.success(`Successfully invited ${successful} team members`);
        onUploadComplete();
      }
      if (failed > 0) {
        toast.error(`Failed to invite ${failed} team members`);
      }
      return;
    }

    setIsProcessing(true);
    setCurrentProcessingIndex(index);
    
    const updatedResults = [...results];
    updatedResults[index].status = 'processing';
    setProcessingResults(updatedResults);

    const member = results[index].member;
    
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          name: member.name,
          email: member.email,
          department: member.department || null,
          companyId: companyId,
          role: "member",
          invitedBy: user?.id,
          origin: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      updatedResults[index].status = 'success';
      updatedResults[index].message = 'Invited successfully';
      updatedResults[index].userId = data.userId;
      
    } catch (error: any) {
      updatedResults[index].status = 'error';
      updatedResults[index].message = error.message || 'Failed to invite member';
    }

    setProcessingResults(updatedResults);
    
    // Process next member after a short delay
    setTimeout(() => {
      processNextMember(updatedResults, index + 1);
    }, 500);
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep('upload');
    setFile(null);
    setParsedMembers([]);
    setProcessingResults([]);
    setIsProcessing(false);
    setCurrentProcessingIndex(0);
  };

  const goBackToUpload = () => {
    setCurrentStep('upload');
    setFile(null);
    setParsedMembers([]);
  };

  const validateMembers = (members: CSVMember[]) => {
    return members.filter(member => 
      member.name && member.email && 
      member.name.trim() !== '' && member.email.trim() !== '' &&
      /\S+@\S+\.\S+/.test(member.email)
    );
  };

  const validMembers = validateMembers(parsedMembers);
  const invalidMembers = parsedMembers.filter(member => !validMembers.includes(member));
  const progressPercentage = processingResults.length > 0 ? 
    (processingResults.filter(r => r.status !== 'pending').length / processingResults.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'upload' && "Upload a CSV file with team member information"}
            {currentStep === 'preview' && "Review and confirm the team members to invite"}
            {currentStep === 'processing' && "Inviting team members with email notifications"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 py-2">
          <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary' : currentStep === 'preview' || currentStep === 'processing' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</div>
            <span className="text-sm">Upload</span>
          </div>
          <div className="h-px w-8 bg-border"></div>
          <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary' : currentStep === 'processing' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : currentStep === 'processing' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
            <span className="text-sm">Preview</span>
          </div>
          <div className="h-px w-8 bg-border"></div>
          <div className={`flex items-center gap-2 ${currentStep === 'processing' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'processing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>3</div>
            <span className="text-sm">Process</span>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-3">
                <div>
                  <strong>CSV Format:</strong>
                  <br />
                  Name, Email, Department
                  <br />
                  John Doe, john@example.com, Engineering
                  <br />
                  Jane Smith, jane@example.com, Marketing
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="gap-2 h-8"
                >
                  <Download className="h-3 w-3" />
                  Download Sample
                </Button>
              </div>
            </>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <>
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
                    <thead className="bg-muted/50 sticky top-0">
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
                  <Button onClick={goBackToUpload} variant="outline">
                    Back
                  </Button>
                  <Button onClick={startProcessing} className="flex-1" disabled={validMembers.length === 0}>
                    Invite {validMembers.length} Members
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progressPercentage)}% complete
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {isProcessing && (
                    <div className="text-sm text-muted-foreground">
                      Processing {processingResults[currentProcessingIndex]?.member.name}...
                    </div>
                  )}
                </div>

                <div className="border rounded max-h-64 overflow-y-auto">
                  <div className="space-y-1 p-2">
                    {processingResults.map((result, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 rounded">
                        {result.status === 'pending' && (
                          <div className="w-4 h-4 rounded-full bg-muted"></div>
                        )}
                        {result.status === 'processing' && (
                          <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                        )}
                        {result.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {result.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="flex-1">{result.member.name} ({result.member.email})</span>
                        {result.message && (
                          <span className={`text-xs ${result.status === 'success' ? 'text-green-600' : result.status === 'error' ? 'text-destructive' : ''}`}>
                            {result.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {!isProcessing && (
                  <Button onClick={handleClose} className="w-full">
                    Done
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};