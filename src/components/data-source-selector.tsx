"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DataSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DataSourceSelectorProps {
  dataSource: DataSource;
  onDataSourceChange: (dataSource: DataSource) => void;
}

export function DataSourceSelector({
  dataSource,
  onDataSourceChange,
}: DataSourceSelectorProps) {
  return (
    <div className="space-y-3">
      <RadioGroup
        value={dataSource}
        onValueChange={(value) => onDataSourceChange(value as DataSource)}
        className="grid grid-cols-2 gap-3"
      >
        <Label
          htmlFor="gitlab"
          className={cn(
            "cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-colors",
            "hover:bg-muted/50",
            dataSource === "gitlab"
              ? "border-primary ring-2 ring-primary/30"
              : "border-border"
          )}
        >
          <RadioGroupItem id="gitlab" value="gitlab" className="sr-only" />
          <img
            src="https://cdn.simpleicons.org/gitlab"
            alt="GitLab"
            className="h-8 w-8"
          />
          <div className="flex-1">
            <div className="font-medium">GitLab</div>
            <div className="text-xs text-muted-foreground">Legacy source</div>
          </div>
        </Label>

        <Label
          htmlFor="jira"
          className={cn(
            "cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-colors",
            "hover:bg-muted/50",
            dataSource === "jira"
              ? "border-primary ring-2 ring-primary/30"
              : "border-border"
          )}
        >
          <RadioGroupItem id="jira" value="jira" className="sr-only" />
          <img
            src="https://cdn.simpleicons.org/jira"
            alt="Jira"
            className="h-8 w-8"
          />
          <div className="flex-1">
            <div className="font-medium">Jira</div>
            <div className="text-xs text-muted-foreground">Current source</div>
          </div>
        </Label>
      </RadioGroup>
    </div>
  );
}
