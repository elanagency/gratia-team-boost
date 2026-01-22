import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type TeamsTestDiagnosticsData = {
  delivered: boolean;
  http_status?: number;
  response_body_preview?: string;
  webhook_host?: string;
  message_preview?: unknown;
};

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function TeamsTestDiagnostics({
  data,
  className,
}: {
  data: TeamsTestDiagnosticsData | null;
  className?: string;
}) {
  if (!data) return null;

  const statusLine =
    typeof data.http_status === "number" ? `HTTP ${data.http_status}` : "No HTTP status";

  const onCopyPayload = async () => {
    const txt = safeJsonStringify(data.message_preview ?? {});
    await navigator.clipboard.writeText(txt);
  };

  return (
    <div className={cn("rounded-lg border bg-muted/20 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Last test result</p>
          <p className="text-sm text-muted-foreground">
            {data.delivered ? "Sent" : "Failed"} • {statusLine}
            {data.webhook_host ? ` • ${data.webhook_host}` : null}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCopyPayload}>
          Copy payload
        </Button>
      </div>

      {(data.response_body_preview || data.message_preview) && <Separator className="my-3" />}

      {data.response_body_preview ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Response body (preview)</p>
          <pre className="max-h-40 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
            {data.response_body_preview}
          </pre>
        </div>
      ) : null}

      {data.message_preview ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Payload sent</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
            {safeJsonStringify(data.message_preview)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
