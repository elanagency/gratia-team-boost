import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Props = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function TeamsNotificationToggleRow({
  id,
  title,
  description,
  checked,
  disabled,
  comingSoon,
  onCheckedChange,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id}>{title}</Label>
          {comingSoon ? (
            <Badge variant="secondary" className="whitespace-nowrap">
              Coming soon
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
