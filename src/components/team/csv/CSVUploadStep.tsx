import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

interface CSVUploadStepProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSample: () => void;
}

export const CSVUploadStep = memo(({ onFileChange, onDownloadSample }: CSVUploadStepProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="csv-file">CSV File</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={onFileChange}
        />
      </div>

      <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-3">
        <div>
          <strong>CSV Format:</strong>
          <br />
          Name, Email, Department, Role, Birthday, Company Start Date
          <br />
          John Doe, john@example.com, Engineering, user, 1990-05-15, 2023-01-10
          <br />
          Jane Smith, jane@example.com, Marketing, admin, , 2022-06-01
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownloadSample}
          className="gap-2 h-8"
        >
          <Download className="h-3 w-3" />
          Download Sample
        </Button>
      </div>
    </>
  );
});

CSVUploadStep.displayName = 'CSVUploadStep';