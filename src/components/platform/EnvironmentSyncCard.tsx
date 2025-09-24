import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, TestTube, Globe, Clock } from "lucide-react";
import { useSyncGiftCards } from "@/hooks/useSyncGiftCards";
import { format } from "date-fns";

interface EnvironmentSyncCardProps {
  environment: 'test' | 'live';
}

export const EnvironmentSyncCard = ({ environment }: EnvironmentSyncCardProps) => {
  const {
    syncStatus,
    syncMutation,
    testConnection,
    syncProgress,
    isLoading
  } = useSyncGiftCards(environment);

  const isLive = environment === 'live';
  const icon = isLive ? Globe : TestTube;
  const Icon = icon;
  
  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleTest = async () => {
    await testConnection();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <CardTitle className="text-base lg:text-lg">
              {isLive ? 'Production' : 'Test'} Catalog
            </CardTitle>
            <CardDescription className="text-sm">
              {isLive ? 'Live gift cards for production use' : 'Test gift cards for development'}
            </CardDescription>
          </div>
        </div>
        <Badge variant={isLive ? "default" : "secondary"} className="w-fit">
          {environment.toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Products Available:</span>
          <span className="font-medium">{syncStatus?.count || 0}</span>
        </div>
        
        {syncStatus?.lastSynced && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last synced: {format(new Date(syncStatus.lastSynced), 'MMM d, yyyy HH:mm')}</span>
          </div>
        )}

        {/* Progress Bar */}
        {syncProgress.isActive && (
          <div className="space-y-2">
            <Progress value={syncProgress.progress || 0} className="h-2" />
            <p className="text-sm text-muted-foreground">{syncProgress.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSync}
            disabled={isLoading}
            size="sm"
            variant="default"
            className="flex-1 sm:min-w-0"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? 'Syncing...' : 'Sync Catalog'}
          </Button>
          
          <Button
            onClick={handleTest}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="sm:w-auto"
          >
            Test API
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};