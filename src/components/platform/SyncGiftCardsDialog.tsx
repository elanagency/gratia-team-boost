import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Clock, Wifi, AlertTriangle, CheckCircle } from "lucide-react";
import { useSyncGiftCards } from "@/hooks/useSyncGiftCards";

export const SyncGiftCardsDialog = () => {
  const { 
    isOpen, 
    setIsOpen, 
    syncStatus, 
    syncMutation, 
    refreshCatalog, 
    testConnection,
    syncProgress,
    isLoading 
  } = useSyncGiftCards();

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleTestConnection = () => {
    testConnection();
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Sync Gift Cards
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Gift Cards</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Sync Status */}
            {syncStatus && (
              <div className={`p-3 rounded-lg ${syncStatus.count > 0 ? 'bg-muted' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center gap-2 text-sm">
                  {syncStatus.count > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">{syncStatus.count} gift cards in database</div>
                        <div className="text-muted-foreground">
                          Last synced: {syncStatus.lastSynced ? new Date(syncStatus.lastSynced).toLocaleString() : 'Never'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div className="text-yellow-800">No gift cards synced yet</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            {syncProgress.isActive && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription className="ml-2">
                  {syncProgress.message}
                  {syncProgress.progress !== undefined && (
                    <Progress value={syncProgress.progress} className="mt-2" />
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <div className="text-sm text-muted-foreground">
              This will fetch all gift cards from Goody's catalog and save them to the database for fast loading. 
              The process includes API connectivity testing and error recovery.
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {syncProgress.message || 'Syncing...'}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Start Sync
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
              
              {/* Test Connection Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="gap-2"
              >
                <Wifi className="h-4 w-4" />
                Test API Connection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};