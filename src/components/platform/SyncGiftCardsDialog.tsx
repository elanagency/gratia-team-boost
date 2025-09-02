import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Clock } from "lucide-react";
import { useSyncGiftCards } from "@/hooks/useSyncGiftCards";

export const SyncGiftCardsDialog = () => {
  const { isOpen, setIsOpen, syncStatus, syncMutation, refreshCatalog, isLoading } = useSyncGiftCards();

  const handleSync = () => {
    syncMutation.mutate();
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
            {syncStatus?.count && syncStatus.count > 0 ? (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last synced: {syncStatus.lastSynced ? new Date(syncStatus.lastSynced).toLocaleString() : 'Never'}
                </div>
                <div className="text-sm font-medium mt-1">
                  {syncStatus.count} gift cards in database
                </div>
              </div>
            ) : (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  No gift cards synced yet
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              This will fetch all gift cards from Goody's catalog and save their IDs for fast loading. 
              This process may take a few minutes.
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Start Sync'
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};