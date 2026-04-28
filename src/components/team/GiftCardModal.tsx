import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GiftCard } from "@/hooks/useRewardsShop";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GiftCardModalProps {
  reward: GiftCard | null;
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: string;
  onRedemptionSuccess?: (data: {
    brandName: string;
    dollarAmount: number;
    pointsSpent: number;
    giftLink?: string;
  }) => void;
}

const inputStyle: React.CSSProperties = {
  borderRadius: 13.375,
  border: '2px solid #E8E6F0',
  background: '#F5F5F7',
  height: 43.75,
  padding: '9.375px 15px',
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  width: '100%',
  outline: 'none',
};

const SECTION_PADDING = '18.75px';

export const GiftCardModal = ({ reward, isOpen, onClose, exchangeRate, onRedemptionSuccess }: GiftCardModalProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints, firstName, lastName } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dollarAmount, setDollarAmount] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  const rate = parseFloat(exchangeRate) || 1;

  useEffect(() => {
    if (isOpen) {
      setDollarAmount('');
      setPointsAmount('');
      setRecipientEmail('');
    }
  }, [isOpen]);

  if (!reward) return null;

  // Sanitize: keep digits and at most one decimal point
  const sanitizeDecimal = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length <= 1) return cleaned;
    return parts[0] + '.' + parts.slice(1).join('').slice(0, 2);
  };
  const sanitizeInt = (val: string) => val.replace(/[^\d]/g, '');

  // Format with commas; preserves trailing decimal/zeros while typing
  const formatWithCommas = (val: string) => {
    if (!val) return '';
    const [intPart, decPart] = val.split('.');
    const intFormatted = intPart ? Number(intPart).toLocaleString('en-US') : '0';
    return decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
  };

  const formatDollarTwoDp = (num: number) =>
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDollarChange = (raw: string) => {
    const val = sanitizeDecimal(raw.replace(/,/g, ''));
    setDollarAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setPointsAmount(String(Math.round(num / rate)));
    } else {
      setPointsAmount('');
    }
  };

  const handleDollarBlur = () => {
    if (!dollarAmount) return;
    const num = parseFloat(dollarAmount);
    if (!isNaN(num)) setDollarAmount(num.toFixed(2));
  };

  const handlePointsChange = (raw: string) => {
    const val = sanitizeInt(raw.replace(/,/g, ''));
    setPointsAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setDollarAmount((Math.round(num * rate * 100) / 100).toFixed(2));
    } else {
      setDollarAmount('');
    }
  };

  const parsedDollar = parseFloat(dollarAmount) || 0;
  const parsedPoints = parseInt(pointsAmount) || 0;
  const canRedeem = parsedDollar > 0 && parsedPoints > 0 && parsedPoints <= (recognitionPoints ?? 0) && recipientEmail.trim().length > 0 && !isProcessing;

  const handleRedeem = async () => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('giftbit-redemption-service', {
        body: {
          brandCode: reward.external_id,
          brandName: reward.name,
          dollarAmount: parsedDollar,
          recipientEmail: recipientEmail.trim(),
          recipientFirstName: firstName || '',
          recipientLastName: lastName || '',
        }
      });

      if (error) throw error;

      if (data?.success) {
        if (onRedemptionSuccess) {
          onRedemptionSuccess({
            brandName: reward.name,
            dollarAmount: parsedDollar,
            pointsSpent: data.pointsSpent,
            giftLink: data.giftLink,
          });
        }
        onClose();
      } else {
        throw new Error(data?.error || 'Redemption failed');
      }
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast.error(error.message || 'Failed to redeem reward');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 overflow-hidden gap-0"
        style={{ borderRadius: 13.4, maxWidth: 560, width: '100%' }}
      >
        {/* Header */}
        <div
          style={{
            padding: `0 ${SECTION_PADDING}`,
            height: 66,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #E8E6F0',
          }}
        >
          <DialogHeader className="space-y-0">
            <DialogTitle style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F0533' }}>
              Redeem {reward.name} Gift Card
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body */}
        <div style={{ padding: SECTION_PADDING }}>
          {/* Brand image */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E6F0',
              borderRadius: 13.375,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              height: 122,
            }}
          >
            <img
              src={reward.image_url || '/placeholder.svg'}
              alt={reward.name}
              style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Available Points pill */}
          <div
            style={{
              background: '#F5F5F7',
              borderRadius: 13.375,
              height: 46.5,
              padding: '11.25px 15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 400, fontFamily: 'Inter, sans-serif', color: '#9996AA', lineHeight: '19.5px' }}>
              Available Points
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F0533', lineHeight: '24px' }}>
              {isLoadingPoints ? '...' : (recognitionPoints ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Enter Amount label */}
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#9996AA', marginTop: 16, marginBottom: 8 }}>
            Enter Amount or Enter Points
          </p>

          {/* Dollar + Points inputs */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 15,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#0F0533',
                  pointerEvents: 'none',
                }}
              >
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={formatWithCommas(dollarAmount)}
                onChange={(e) => handleDollarChange(e.target.value)}
                onBlur={handleDollarBlur}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatWithCommas(pointsAmount)}
                onChange={(e) => handlePointsChange(e.target.value)}
                style={{ ...inputStyle, paddingRight: 56 }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 15,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  color: '#9996AA',
                  pointerEvents: 'none',
                }}
              >
                points
              </span>
            </div>
          </div>

          {/* Recipient Email */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#0F0533', marginTop: 16, marginBottom: 6 }}>
            Recipient Email
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, fontWeight: 400, fontFamily: 'Inter, sans-serif', color: '#9996AA', marginTop: 4 }}>
            The gift link will be sent to this email address
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: SECTION_PADDING,
            borderTop: '1px solid #E8E6F0',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              borderRadius: 13.375,
              border: '2px solid #E8E6F0',
              background: 'transparent',
              height: 46,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              color: '#0F0533',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRedeem}
            disabled={!canRedeem}
            style={{
              flex: 1,
              borderRadius: 13.375,
              border: 'none',
              background: 'linear-gradient(135deg, #7F2BFE, #FC5BFF)',
              height: 46,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              color: '#FFFFFF',
              cursor: canRedeem ? 'pointer' : 'not-allowed',
              opacity: canRedeem ? 1 : 0.5,
              padding: '9.375px 36px',
            }}
          >
            {isProcessing ? 'Processing...' : 'Confirm Redeem'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
