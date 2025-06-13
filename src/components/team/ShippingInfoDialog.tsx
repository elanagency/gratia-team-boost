
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface ShippingInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shippingInfo: ShippingInfo;
  onShippingInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const ShippingInfoDialog = ({
  isOpen,
  onOpenChange,
  shippingInfo,
  onShippingInfoChange,
  onSubmit,
  isProcessing
}: ShippingInfoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enter Shipping Information</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={shippingInfo.name} 
              onChange={onShippingInfoChange}
              placeholder="Full name for shipping"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              name="phone" 
              value={shippingInfo.phone} 
              onChange={onShippingInfoChange}
              placeholder="+1 555 123 4567"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={shippingInfo.address} 
              onChange={onShippingInfoChange}
              placeholder="Street address"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                name="city" 
                value={shippingInfo.city} 
                onChange={onShippingInfoChange}
                placeholder="City"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input 
                id="state" 
                name="state" 
                value={shippingInfo.state} 
                onChange={onShippingInfoChange}
                placeholder="State"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input 
                id="zipCode" 
                name="zipCode" 
                value={shippingInfo.zipCode} 
                onChange={onShippingInfoChange}
                placeholder="Zip code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                name="country" 
                value={shippingInfo.country} 
                onChange={onShippingInfoChange}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            className="bg-[#F572FF] hover:bg-[#F572FF]/90"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing Redemption..." : "Confirm Redemption"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
