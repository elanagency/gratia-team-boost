
import React from "react";
import { PointsHistory } from "@/components/points/PointsHistory";

const TeamRecognition = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">My Recognition History</h1>
      <PointsHistory personalView={true} />
    </div>
  );
};

export default TeamRecognition;
