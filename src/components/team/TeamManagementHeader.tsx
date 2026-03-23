import React, { useState } from "react";
import TeamInviteManager from "./TeamInviteManager";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import SlackImportDialog from "./SlackImportDialog";
import { useSlackIntegration } from "@/hooks/useSlackIntegration";

interface TeamManagementHeaderProps {
  onInviteSuccess?: () => void;
}

const TeamManagementHeader: React.FC<TeamManagementHeaderProps> = ({ 
  onInviteSuccess 
}) => {
  const { isConnected } = useSlackIntegration();
  const [slackImportOpen, setSlackImportOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
        Team Management
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {isConnected && (
          <Button
            variant="outline"
            onClick={() => setSlackImportOpen(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Import from Slack
          </Button>
        )}
        <TeamInviteManager onSuccess={onInviteSuccess} />
      </div>

      <SlackImportDialog
        open={slackImportOpen}
        onOpenChange={setSlackImportOpen}
        onSuccess={onInviteSuccess}
      />
    </div>
  );
};

export default TeamManagementHeader;