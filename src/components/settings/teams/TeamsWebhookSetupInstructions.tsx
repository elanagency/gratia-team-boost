import React from "react";
import { ExternalLink } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const TEAMS_SETUP_VIDEO_IFRAME_SRC =
  "https://www.loom.com/embed/37be129ef8974b999f15b92586215353";

export function TeamsWebhookSetupInstructions() {
  return (
    <div className="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>
            1. In Microsoft Teams, open the Team and Channel where you want
            notifications.
          </li>
          <li>2. Open the “Workflows” app and create a new workflow.</li>
          <li>
            3. Choose a trigger that generates an HTTP endpoint (webhook).
          </li>
          <li>
            4. Add an action to post a message in a channel (select the same
            channel).
          </li>
          <li>5. Save the workflow and copy the generated webhook URL.</li>
          <li>
            6. Paste the webhook URL below and click “Connect Microsoft Teams”.
          </li>
        </ol>

        <a
          href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Microsoft documentation
        </a>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={TEAMS_SETUP_VIDEO_IFRAME_SRC}
            title="Microsoft Teams Workflows setup"
            className="h-full w-full rounded-md"
            allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </AspectRatio>
      </div>
    </div>
  );
}
