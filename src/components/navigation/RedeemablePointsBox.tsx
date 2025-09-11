import React from "react";
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useAuth } from "@/context/AuthContext";

interface RedeemablePointsBoxProps {
  className?: string;
}

export const RedeemablePointsBox = ({ className = "" }: RedeemablePointsBoxProps) => {
  const navigate = useNavigate();
  const { recognitionPoints, isLoading } = useUserPoints();
  const { isAdmin } = useAuth();

  const handleClick = () => {
    navigate("/dashboard/gift-cards");
  };

  if (isLoading) {
    return (
      <div className={`flex items-center px-4 py-2 rounded-lg bg-white/10 ${className}`}>
        <Coins className="h-4 w-4 text-white/70 mr-2" />
        <div className="animate-pulse">
          <div className="h-4 w-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-white/10 text-white hover:bg-white/20 hover:shadow-lg ${className}`}
    >
      <Coins className="h-4 w-4 text-white mr-2" />
      <div className="flex flex-col items-start">
        <span className="text-xs text-white/80 hidden sm:inline">Redeemable Points</span>
        <span className="font-bold text-white">{recognitionPoints}</span>
      </div>
    </button>
  );
};