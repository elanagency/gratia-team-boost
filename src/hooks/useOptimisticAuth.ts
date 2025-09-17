import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useOptimisticAuth = () => {
  const auth = useAuth();
  const [optimisticPoints, setOptimisticPoints] = useState<{
    monthly: number | null;
    recognition: number | null;
  }>({ monthly: null, recognition: null });

  const updateOptimisticPoints = useCallback((monthlyDelta: number = 0, recognitionDelta: number = 0) => {
    setOptimisticPoints(prev => ({
      monthly: prev.monthly !== null ? prev.monthly + monthlyDelta : (auth.monthlyPoints || 0) + monthlyDelta,
      recognition: prev.recognition !== null ? prev.recognition + recognitionDelta : (auth.recognitionPoints || 0) + recognitionDelta
    }));
  }, [auth.monthlyPoints, auth.recognitionPoints]);

  const rollbackOptimisticPoints = useCallback(() => {
    setOptimisticPoints({ monthly: null, recognition: null });
  }, []);

  const confirmOptimisticPoints = useCallback(() => {
    setOptimisticPoints({ monthly: null, recognition: null });
  }, []);

  // Return optimistic values if available, otherwise fallback to auth values
  const currentMonthlyPoints = optimisticPoints.monthly !== null ? optimisticPoints.monthly : auth.monthlyPoints;
  const currentRecognitionPoints = optimisticPoints.recognition !== null ? optimisticPoints.recognition : auth.recognitionPoints;

  return {
    ...auth,
    monthlyPoints: currentMonthlyPoints,
    recognitionPoints: currentRecognitionPoints,
    updateOptimisticPoints,
    rollbackOptimisticPoints,
    confirmOptimisticPoints,
    hasOptimisticUpdates: optimisticPoints.monthly !== null || optimisticPoints.recognition !== null
  };
};