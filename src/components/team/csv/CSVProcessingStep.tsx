import React, { memo, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";

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

interface CSVProcessingStepProps {
  processingResults: ProcessingResult[];
  currentProcessingIndex: number;
  isProcessing: boolean;
  onClose: () => void;
}

export const CSVProcessingStep = memo(({ 
  processingResults, 
  currentProcessingIndex, 
  isProcessing, 
  onClose 
}: CSVProcessingStepProps) => {
  const progressPercentage = useMemo(() => 
    processingResults.length > 0 ? 
      (processingResults.filter(r => r.status !== 'pending').length / processingResults.length) * 100 : 0,
    [processingResults]
  );

  return (
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
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      )}
    </div>
  );
});

CSVProcessingStep.displayName = 'CSVProcessingStep';