import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { useAuth } from "@/context/AuthContext";
import { CSVUploadStep } from "./csv/CSVUploadStep";
import { CSVPreviewStep } from "./csv/CSVPreviewStep";
import { CSVProcessingStep } from "./csv/CSVProcessingStep";

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
  const { user, companyId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedMembers, setParsedMembers] = useState<CSVMember[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);

  const downloadSampleCSV = useCallback(() => {
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
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    // File size validation (5MB limit)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File too large. Please use a file smaller than 5MB.");
      return;
    }
    
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
  }, []);

  const parseCSV = useCallback((file: File): Promise<CSVMember[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize headers to handle common variations
          const normalized = header.toLowerCase().trim();
          if (normalized === 'name' || normalized === 'full name' || normalized === 'fullname') return 'name';
          if (normalized === 'email' || normalized === 'email address' || normalized === 'emailaddress') return 'email';
          if (normalized === 'department' || normalized === 'dept') return 'department';
          return normalized;
        },
        complete: (results) => {
          console.log('Papa parse results:', results);
          console.log('Raw data:', results.data);
          console.log('Fields detected:', results.meta?.fields);
          
          if (results.errors.length > 0) {
            console.error('Papa parse errors:', results.errors);
          }

          const rawMembers = results.data as any[];
          console.log('Raw members before mapping:', rawMembers);
          
          // Map raw data to CSVMember format
          const members: CSVMember[] = rawMembers.map(row => {
            console.log('Processing row:', row);
            return {
              name: (row.name || row.Name || row['full name'] || row['Full Name'] || '').toString().trim(),
              email: (row.email || row.Email || row['email address'] || row['Email Address'] || '').toString().trim(),
              department: (row.department || row.Department || row.dept || row.Dept || '').toString().trim()
            };
          });
          
          console.log('Mapped members:', members);
          
          // Basic filtering - full validation happens in preview
          const basicFilteredMembers = members.filter(member => {
            const isValid = member.name && member.email && 
              member.name.trim() !== '' && member.email.trim() !== '';
            console.log(`Member ${member.name} (${member.email}) is valid:`, isValid);
            return isValid;
          });
          
          console.log('Filtered members:', basicFilteredMembers);
          resolve(basicFilteredMembers);
        },
        error: (error) => {
          console.error('Papa parse error:', error);
          reject(error);
        }
      });
    });
  }, []);

  const startProcessing = useCallback(() => {
    const validMembers = parsedMembers.filter(member => 
      member.name && member.email && 
      member.name.trim() !== '' && member.email.trim() !== '' &&
      /\S+@\S+\.\S+/.test(member.email)
    );
    
    const results: ProcessingResult[] = validMembers.map(member => ({
      member,
      status: 'pending'
    }));
    setProcessingResults(results);
    setCurrentStep('processing');
    setCurrentProcessingIndex(0);
    processNextMember(results, 0);
  }, [parsedMembers]);

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

  const goBackToUpload = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setParsedMembers([]);
  }, []);

  // No longer need loading state since auth is available immediately

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
              {currentStep === 'upload' && (
                <CSVUploadStep
                  onFileChange={handleFileChange}
                  onDownloadSample={downloadSampleCSV}
                />
              )}

              {currentStep === 'preview' && (
                <CSVPreviewStep
                  parsedMembers={parsedMembers}
                  onBack={goBackToUpload}
                  onStartProcessing={startProcessing}
                />
              )}

              {currentStep === 'processing' && (
                <CSVProcessingStep
                  processingResults={processingResults}
                  currentProcessingIndex={currentProcessingIndex}
                  isProcessing={isProcessing}
                  onClose={handleClose}
                />
              )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };