import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Users, Settings2, CreditCard } from "lucide-react";
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

interface PaymentMethodForm {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
  billingAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PlatformConfigForm {
  pointRate: string;
  minPurchase: string;
  maxPurchase: string;
  defaultSlots: string;
}

const PlatformSettings = () => {
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const { settings, isLoading, updateSetting, isUpdating, getSetting } = usePlatformSettings();

  const form = useForm<PaymentMethodForm>({
    defaultValues: {
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      nameOnCard: "",
      billingAddress: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const configForm = useForm<PlatformConfigForm>({
    defaultValues: {
      pointRate: "",
      minPurchase: "",
      maxPurchase: "",
      defaultSlots: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings && settings.length > 0) {
      configForm.reset({
        pointRate: getSetting('point_exchange_rate'),
        minPurchase: getSetting('min_point_purchase'),
        maxPurchase: getSetting('max_point_purchase'),
        defaultSlots: getSetting('default_team_slots'),
      });
    }
  }, [settings, getSetting, configForm]);

  const onSubmitPaymentMethod = (data: PaymentMethodForm) => {
    console.log("Payment method data:", data);
    // Here you would integrate with Rye API to save the payment method
    setIsAddingPaymentMethod(false);
    form.reset();
  };

  const onSubmitConfiguration = (data: PlatformConfigForm) => {
    console.log("Configuration data:", data);
    
    // Update each setting
    updateSetting({ key: 'point_exchange_rate', value: data.pointRate });
    updateSetting({ key: 'min_point_purchase', value: data.minPurchase });
    updateSetting({ key: 'max_point_purchase', value: data.maxPurchase });
    updateSetting({ key: 'default_team_slots', value: data.defaultSlots });
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
                  name="minPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Point Purchase</FormLabel>
                      <FormControl>
                        <Input placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="maxPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Point Purchase</FormLabel>
                      <FormControl>
                        <Input placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="defaultSlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Team Slots</FormLabel>
                      <FormControl>
                        <Input placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="submit" 
                className="bg-[#F572FF] hover:bg-[#E061EE]"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Billing & Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Rye Payment Methods</h4>
                <p className="text-sm text-gray-600">Manage payment methods for Rye marketplace orders</p>
              </div>
              <Button 
                onClick={() => setIsAddingPaymentMethod(true)}
                className="bg-[#F572FF] hover:bg-[#E061EE]"
              >
                Add Payment Method
              </Button>
            </div>
          </div>
          
          {isAddingPaymentMethod && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h5 className="font-medium mb-4">Add New Payment Method</h5>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPaymentMethod)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nameOnCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name on Card</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiryMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Month</FormLabel>
                          <FormControl>
                            <Input placeholder="MM" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiryYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Year</FormLabel>
                          <FormControl>
                            <Input placeholder="YYYY" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input placeholder="123" maxLength={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <h6 className="font-medium">Billing Address</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billingAddress"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-[#F572FF] hover:bg-[#E061EE]">
                      Save Payment Method
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingPaymentMethod(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Saved Payment Methods</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 1234</p>
                    <p className="text-xs text-gray-500">Expires 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Remove</Button>
              </div>
              <div className="text-sm text-gray-500 p-3 border border-dashed rounded">
                No payment methods saved yet
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-admin">Add New Platform Admin</Label>
            <div className="flex space-x-2">
              <Input id="new-admin" placeholder="admin@email.com" className="flex-1" />
              <Button>Add Admin</Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Current Platform Admins</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">admin@grattia.com</span>
                <Button variant="outline" size="sm">Remove</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Database Health</h4>
              <p className="text-sm text-gray-600">Excellent</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium">Active Users</h4>
              <p className="text-sm text-gray-600">1,245</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium">Security Status</h4>
              <p className="text-sm text-gray-600">Secure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSettings;
