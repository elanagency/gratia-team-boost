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
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react";
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

export const CSVUploadDialog = ({ onUploadComplete }: CSVUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setUploadResults([]);
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

  const handleUpload = async () => {
    if (!file || !user || !companyId) {
      toast.error("Missing required information");
      return;
    }

    setIsUploading(true);
    try {
      const members = await parseCSV(file);
      
      if (members.length === 0) {
        toast.error("No valid members found in CSV");
        setIsUploading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("bulk-create-team-members", {
        body: {
          members: members,
          companyId: companyId,
          invitedBy: user.id
        }
      });

      if (error) {
        throw error;
      }

      setUploadResults(data.results || []);
      
      const successful = data.results?.filter((r: any) => r.success).length || 0;
      const failed = data.results?.filter((r: any) => !r.success).length || 0;
      
      if (successful > 0) {
        toast.success(`Successfully added ${successful} team members`);
        onUploadComplete();
      }
      
      if (failed > 0) {
        toast.error(`Failed to add ${failed} team members`);
      }

    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast.error("Failed to upload CSV file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setUploadResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Team Members CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with team member information. Required columns: Name, Email, Department
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          )}

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

          {uploadResults.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <Label>Upload Results:</Label>
              {uploadResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={result.success ? "text-green-700" : "text-red-700"}>
                    {result.email}: {result.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex-1"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};