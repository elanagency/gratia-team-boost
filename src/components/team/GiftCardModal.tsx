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

  const handleDollarChange = (val: string) => {
    setDollarAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setPointsAmount(String(Math.round(num / rate)));
    } else {
      setPointsAmount('');
    }
  };

  const handlePointsChange = (val: string) => {
    setPointsAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setDollarAmount(String(Math.round(num * rate * 100) / 100));
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
        className="max-w-lg p-0 overflow-hidden"
        style={{ borderRadius: 13.4 }}
      >
        <div style={{ padding: '24px 28px' }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: '#0F0533' }}>
              Redeem {reward.name} Gift Card
            </DialogTitle>
          </DialogHeader>

          {/* Brand image */}
          <div
            style={{
              background: '#F5F5F7',
              borderRadius: 13.375,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              marginTop: 16,
            }}
          >
            <img
              src={reward.image_url || '/placeholder.svg'}
              alt={reward.name}
              style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Available Points */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#9996AA' }}>
              Available Points
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: '#0F0533' }}>
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
              <input
                type="number"
                min={0}
                placeholder="$ 0"
                value={dollarAmount}
                onChange={(e) => handleDollarChange(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="number"
                min={0}
                placeholder="0 points"
                value={pointsAmount}
                onChange={(e) => handlePointsChange(e.target.value)}
                style={inputStyle}
              />
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

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                borderRadius: 13.375,
                border: '2px solid #E8E6F0',
                background: 'transparent',
                height: 40,
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
                height: 40,
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
