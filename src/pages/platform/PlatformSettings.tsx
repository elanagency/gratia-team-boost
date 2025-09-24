import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Settings2, RefreshCw, ExternalLink } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { usePlatformAdmins } from "@/hooks/usePlatformAdmins";

interface PlatformConfigForm {
  pointRate: string;
  memberPrice: string;
}

const PlatformSettings = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  
  const { 
    settings, 
    isLoading, 
    updateSetting, 
    isUpdating, 
    getSetting,
    syncStripePricing,
    isSyncingStripe,
    stripeProductIdLive,
    stripeProductIdTest,
    stripePriceIdLive,
    stripePriceIdTest
  } = usePlatformSettings();
  const { 
    platformAdmins, 
    isLoading: isLoadingAdmins, 
    addAdmin, 
    removeAdmin, 
    isAdding, 
    isRemoving 
  } = usePlatformAdmins();

  const configForm = useForm<PlatformConfigForm>({
    defaultValues: {
      pointRate: "",
      memberPrice: "",
    },
  });

  // Memoize the initial form values to prevent infinite loop
  const initialFormValues = useMemo(() => {
    if (!settings) return null;
    
    return {
      pointRate: getSetting('point_exchange_rate'),
      memberPrice: (parseInt(getSetting('member_monthly_price_cents') || '299') / 100).toFixed(2),
    };
  }, [settings, getSetting]);

  // Update form when settings are loaded - with stable dependency
  useEffect(() => {
    if (initialFormValues) {
      configForm.reset(initialFormValues);
    }
  }, [initialFormValues, configForm]);

  const onSubmitConfiguration = (data: PlatformConfigForm) => {
    console.log("Configuration data:", data);
    
    // Update each setting
    updateSetting({ key: 'point_exchange_rate', value: data.pointRate });
    updateSetting({ key: 'member_monthly_price_cents', value: (parseFloat(data.memberPrice) * 100).toString() });
    
    // Automatically sync Stripe pricing after updating prices
    setTimeout(() => {
      syncStripePricing();
    }, 1000);
  };

  const handleAddAdmin = () => {
    if (newAdminEmail.trim()) {
      addAdmin(newAdminEmail.trim());
      setNewAdminEmail("");
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-600">Loading platform settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings</p>
        </div>
      </div>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...configForm}>
            <form onSubmit={configForm.handleSubmit(onSubmitConfiguration)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={configForm.control}
                  name="pointRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Point Exchange Rate (USD per point)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="memberPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price per Member (USD)</FormLabel>
                      <FormControl>
                        <Input placeholder="2.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="bg-[#F572FF] hover:bg-[#E061EE]"
                  disabled={isUpdating || isSyncingStripe}
                >
                  {isUpdating ? 'Saving...' : 'Save Configuration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => syncStripePricing()}
                  disabled={isSyncingStripe}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingStripe ? 'animate-spin' : ''}`} />
                  {isSyncingStripe ? 'Syncing...' : 'Sync Stripe'}
                </Button>
              </div>
            </form>
          </Form>
          
          {/* Stripe Integration Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Stripe Integration Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Live Environment</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                      {stripeProductIdLive || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price ID:</span>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                      {stripePriceIdLive || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Test Environment</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                      {stripeProductIdTest || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price ID:</span>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                      {stripePriceIdTest || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <ExternalLink className="h-3 w-3 inline mr-1" />
              These IDs are automatically created and updated when you change pricing above.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Admin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Platform Administrators</h4>
                <p className="text-sm text-gray-600">Manage users who have platform admin access</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Admin email address"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
            />
            <Button 
              onClick={handleAddAdmin}
              className="bg-[#F572FF] hover:bg-[#E061EE]"
              disabled={isAdding || !newAdminEmail.trim()}
            >
              {isAdding ? 'Adding...' : 'Add Admin'}
            </Button>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Current Platform Admins</h4>
            {isLoadingAdmins ? (
              <div className="text-center py-4 text-gray-500">Loading administrators...</div>
            ) : platformAdmins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        {admin.first_name} {admin.last_name}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        Admin
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAdmin(admin.id)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No platform administrators added yet</p>
                <p className="text-sm">Add an administrator to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default PlatformSettings;