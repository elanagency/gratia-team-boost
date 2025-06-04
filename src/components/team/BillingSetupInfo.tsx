
import React from "react";
import { CreditCard } from "lucide-react";

interface BillingSetupInfoProps {
  isFirstMember: boolean;
}

const BillingSetupInfo = ({ isFirstMember }: BillingSetupInfoProps) => {
  if (!isFirstMember) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Billing Setup Required
          </h4>
          <p className="text-sm text-blue-700">
            This is your first team member. You'll be redirected to Stripe to start your subscription after adding them.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingSetupInfo;
