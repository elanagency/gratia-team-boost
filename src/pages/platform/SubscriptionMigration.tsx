import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface MigrationAnalysis {
  companyId: string;
  companyName: string;
  currentSlots: number;
  currentMembers: number;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  stripeStatus: string;
  currentQuantity: number;
  migrationNeeded: boolean;
  estimatedCostChange: number;
}

export default function SubscriptionMigration() {
  const [migrationProgress, setMigrationProgress] = useState<number>(0);
  const [migrationResults, setMigrationResults] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Fetch migration analysis
  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['migration-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('migrate-subscriptions', {
        body: { action: 'analyze' }
      });
      
      if (error) throw error;
      return data.analysis as MigrationAnalysis[];
    },
  });

  // Individual migration mutation
  const migrateSingleMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('migrate-subscriptions', {
        body: { action: 'migrate', companyId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully migrated ${data.companyId}`);
      queryClient.invalidateQueries({ queryKey: ['migration-analysis'] });
    },
    onError: (error: any) => {
      toast.error(`Migration failed: ${error.message}`);
    },
  });

  // Bulk migration mutation
  const migrateAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('migrate-subscriptions', {
        body: { action: 'migrate_all' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setMigrationResults(data.results);
      toast.success("Bulk migration completed");
      queryClient.invalidateQueries({ queryKey: ['migration-analysis'] });
    },
    onError: (error: any) => {
      toast.error(`Bulk migration failed: ${error.message}`);
    },
  });

  const handleMigrateSingle = (companyId: string) => {
    migrateSingleMutation.mutate(companyId);
  };

  const handleMigrateAll = () => {
    if (window.confirm("Are you sure you want to migrate all subscriptions? This action cannot be undone.")) {
      migrateAllMutation.mutate();
    }
  };

  const pendingMigrations = analysis?.filter(item => item.migrationNeeded) || [];
  const totalSavings = analysis?.reduce((sum, item) => sum + (item.estimatedCostChange < 0 ? Math.abs(item.estimatedCostChange) : 0), 0) || 0;
  const totalIncreases = analysis?.reduce((sum, item) => sum + (item.estimatedCostChange > 0 ? item.estimatedCostChange : 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subscription Migration</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Migration</h1>
          <p className="text-muted-foreground">
            Transition from slot-based to usage-based billing
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Need Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingMigrations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${(totalSavings / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. Monthly Increases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${(totalIncreases / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Controls */}
      {pendingMigrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Actions</CardTitle>
            <CardDescription>
              Execute the migration to transition subscriptions from slot-based to usage-based billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Migration will update Stripe subscriptions immediately and may trigger prorated charges or credits.
                Ensure all customers have been notified before proceeding.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-4">
              <Button 
                onClick={handleMigrateAll} 
                disabled={migrateAllMutation.isPending}
                variant="default"
              >
                {migrateAllMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating All...
                  </>
                ) : (
                  `Migrate All (${pendingMigrations.length})`
                )}
              </Button>
            </div>

            {migrationProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migration Progress</span>
                  <span>{migrationProgress}%</span>
                </div>
                <Progress value={migrationProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Analysis</CardTitle>
          <CardDescription>
            Current state of all subscriptions and migration requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Current Slots</TableHead>
                <TableHead>Active Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost Impact</TableHead>
                <TableHead>Migration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis?.map((item) => (
                <TableRow key={item.companyId}>
                  <TableCell className="font-medium">{item.companyName}</TableCell>
                  <TableCell>{item.currentSlots}</TableCell>
                  <TableCell>{item.currentMembers}</TableCell>
                  <TableCell>
                    <Badge variant={item.stripeStatus === 'active' ? 'default' : 'secondary'}>
                      {item.stripeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${
                      item.estimatedCostChange < 0 ? 'text-success' : 
                      item.estimatedCostChange > 0 ? 'text-destructive' : 
                      'text-muted-foreground'
                    }`}>
                      {item.estimatedCostChange === 0 ? 'No change' : 
                       item.estimatedCostChange < 0 ? `-$${Math.abs(item.estimatedCostChange / 100).toFixed(2)}` :
                       `+$${(item.estimatedCostChange / 100).toFixed(2)}`
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.migrationNeeded ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Not Needed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.migrationNeeded && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMigrateSingle(item.companyId)}
                        disabled={migrateSingleMutation.isPending}
                      >
                        {migrateSingleMutation.isPending ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'Migrate'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {migrationResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell>{result.companyName}</TableCell>
                    <TableCell>
                      <Badge variant={result.status === 'migrated' ? 'secondary' : 'destructive'}>
                        {result.status === 'migrated' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-destructive text-sm">
                      {result.error || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}