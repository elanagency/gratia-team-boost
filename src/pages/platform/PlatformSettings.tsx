import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Users, Settings2, CreditCard, Star, TestTube, Globe, AlertTriangle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { usePlatformAdmins } from "@/hooks/usePlatformAdmins";
import { usePlatformPaymentMethods } from "@/hooks/usePlatformPaymentMethods";

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
  isDefault: boolean;
}

interface PlatformConfigForm {
  pointRate: string;
  minPurchase: string;
  maxPurchase: string;
  defaultSlots: string;
  memberPrice: string;
}

const PlatformSettings = () => {
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [showLiveConfirmation, setShowLiveConfirmation] = useState(false);
  
  const { settings, isLoading, updateSetting, isUpdating, getSetting } = usePlatformSettings();
  const { 
    platformAdmins, 
    isLoading: isLoadingAdmins, 
    addAdmin, 
    removeAdmin, 
    isAdding, 
    isRemoving 
  } = usePlatformAdmins();
  
  const {
    paymentMethods,
    isLoading: isLoadingPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    isAdding: isAddingPayment,
    isUpdating: isUpdatingPayment,
    isRemovingPaymentMethod,
  } = usePlatformPaymentMethods();

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
      isDefault: false,
    },
  });

  const configForm = useForm<PlatformConfigForm>({
    defaultValues: {
      pointRate: "",
      minPurchase: "",
      maxPurchase: "",
      defaultSlots: "",
      memberPrice: "",
    },
  });

  // Memoize the initial form values to prevent infinite loop
  const initialFormValues = useMemo(() => {
    if (!settings || settings.length === 0) return null;
    
    return {
      pointRate: getSetting('point_exchange_rate'),
      minPurchase: getSetting('min_point_purchase'),
      maxPurchase: getSetting('max_point_purchase'),
      defaultSlots: getSetting('default_team_slots'),
      memberPrice: (parseInt(getSetting('member_monthly_price_cents') || '299') / 100).toFixed(2),
    };
  }, [settings, getSetting]);

  // Update form when settings are loaded - with stable dependency
  useEffect(() => {
    if (initialFormValues) {
      configForm.reset(initialFormValues);
    }
  }, [initialFormValues, configForm]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    // Remove all spaces and non-digits
    const cardNumber = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Add spaces every 4 digits
    const formattedCardNumber = cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formattedCardNumber.substring(0, 19);
  };

  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const formatted = formatCardNumber(e.target.value);
    onChange(formatted);
  };

  // Set default checkbox when adding first payment method
  useEffect(() => {
    if (paymentMethods.length === 0) {
      form.setValue('isDefault', true);
    }
  }, [paymentMethods.length, form]);

  const onSubmitPaymentMethod = (data: PaymentMethodForm) => {
    // Remove spaces from card number before submitting
    const cardNumberWithoutSpaces = data.cardNumber.replace(/\s/g, '');
    
    addPaymentMethod({
      cardNumber: cardNumberWithoutSpaces,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      cvv: data.cvv,
      nameOnCard: data.nameOnCard,
      isDefault: data.isDefault,
    });
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
    updateSetting({ key: 'member_monthly_price_cents', value: (parseFloat(data.memberPrice) * 100).toString() });
  };

  const handleAddAdmin = () => {
    if (newAdminEmail.trim()) {
      addAdmin(newAdminEmail.trim());
      setNewAdminEmail("");
    }
  };

  const handleSetDefault = (id: string) => {
    updatePaymentMethod({ id, isDefault: true });
  };

  const handleRemovePaymentMethod = (id: string) => {
    console.log('Remove button clicked for payment method:', id);
    removePaymentMethod(id);
  };

  const currentEnvironment = getSetting('environment_mode') || 'test';
  const isLiveMode = currentEnvironment === 'live';

  const handleEnvironmentToggle = (checked: boolean) => {
    if (checked) {
      setShowLiveConfirmation(true);
    } else {
      updateSetting({ key: 'environment_mode', value: 'test' });
    }
  };

  const confirmLiveMode = () => {
    updateSetting({ key: 'environment_mode', value: 'live' });
    setShowLiveConfirmation(false);
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

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLiveMode ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <TestTube className="h-5 w-5 text-orange-600" />
            )}
            Environment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  Current Environment: {' '}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    isLiveMode 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {isLiveMode ? (
                      <>
                        <Globe className="h-3 w-3" />
                        Live
                      </>
                    ) : (
                      <>
                        <TestTube className="h-3 w-3" />
                        Test
                      </>
                    )}
                  </span>
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                {isLiveMode 
                  ? 'Edge functions are using production APIs and live payment processing'
                  : 'Edge functions are using test APIs and sandbox payment processing'
                }
              </p>
              {isLiveMode && (
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Live mode processes real transactions
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Test</span>
              <AlertDialog open={showLiveConfirmation} onOpenChange={setShowLiveConfirmation}>
                <AlertDialogTrigger asChild>
                  <div>
                    <Switch
                      checked={isLiveMode}
                      onCheckedChange={handleEnvironmentToggle}
                      disabled={isUpdating}
                    />
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Switch to Live Mode?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will switch all edge functions to use production APIs and live payment processing. 
                      Real transactions will be processed and charges will be made to actual payment methods.
                      <br /><br />
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmLiveMode}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Yes, Switch to Live
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <span className="text-sm font-medium text-gray-700">Live</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
                disabled={isAddingPayment}
              >
                {isAddingPayment ? 'Adding...' : 'Add Payment Method'}
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
                            <Input 
                              placeholder="1234 5678 9012 3456" 
                              value={field.value}
                              onChange={(e) => handleCardNumberChange(e, field.onChange)}
                              maxLength={19}
                            />
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
                  
                  {paymentMethods.length > 0 && (
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Set as default payment method
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  
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
                    <Button 
                      type="submit" 
                      className="bg-[#F572FF] hover:bg-[#E061EE]"
                      disabled={isAddingPayment}
                    >
                      {isAddingPayment ? 'Saving...' : 'Save Payment Method'}
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
            {isLoadingPaymentMethods ? (
              <div className="text-center py-4 text-gray-500">Loading payment methods...</div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">•••• •••• •••• {method.card_last_four}</p>
                          {method.is_default && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {method.card_type} • Expires {method.expiry_month}/{method.expiry_year} • {method.cardholder_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_default && paymentMethods.length > 1 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          disabled={isUpdatingPayment}
                        >
                          {isUpdatingPayment ? 'Setting...' : 'Set Default'}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        disabled={isRemovingPaymentMethod(method.id)}
                      >
                        {isRemovingPaymentMethod(method.id) ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-3 border border-dashed rounded">
                No payment methods saved yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Management - Updated with real data */}
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
              <Input 
                id="new-admin" 
                placeholder="admin@email.com" 
                className="flex-1"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <Button 
                onClick={handleAddAdmin}
                disabled={isAdding || !newAdminEmail.trim()}
                className="bg-[#F572FF] hover:bg-[#E061EE]"
              >
                {isAdding ? 'Adding...' : 'Add Admin'}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-4">Current Platform Admins</h4>
            {isLoadingAdmins ? (
              <div className="text-center py-4 text-gray-500">Loading platform admins...</div>
            ) : platformAdmins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.first_name && admin.last_name 
                          ? `${admin.first_name} ${admin.last_name}`
                          : 'No name set'
                        }
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
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
              <div className="text-center py-4 text-gray-500 border border-dashed rounded">
                No platform admins found
              </div>
            )}
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
