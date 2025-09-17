"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, Zap, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { TimelogResults } from "@/components/timelog-results";
import { UserFilter } from "@/components/user-filter";
import { DataSourceSelector } from "@/components/data-source-selector";
import { PlatformConfigComponent } from "@/components/gitlab-config";
import { TimelogData, DataSource, GitLabConfig, JiraConfig } from "@/lib/types";
import { getDatesToFetch, NAME_MAPPING } from "@/lib/utils";

const AirtableIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="17"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 215"
  >
    <path
      fill="#FFBF00"
      d="M114.25873,2.70101695 L18.8604023,42.1756384 C13.5552723,44.3711638 13.6102328,51.9065311 18.9486282,54.0225085 L114.746142,92.0117514 C123.163769,95.3498757 132.537419,95.3498757 140.9536,92.0117514 L236.75256,54.0225085 C242.08951,51.9065311 242.145916,44.3711638 236.83934,42.1756384 L141.442459,2.70101695 C132.738459,-0.900338983 122.961284,-0.900338983 114.25873,2.70101695"
    ></path>
    <path
      fill="#26B5F8"
      d="M136.349071,112.756863 L136.349071,207.659101 C136.349071,212.173089 140.900664,215.263892 145.096461,213.600615 L251.844122,172.166219 C254.281184,171.200072 255.879376,168.845451 255.879376,166.224705 L255.879376,71.3224678 C255.879376,66.8084791 251.327783,63.7176768 247.131986,65.3809537 L140.384325,106.815349 C137.94871,107.781496 136.349071,110.136118 136.349071,112.756863"
    ></path>
    <path
      fill="#ED3049"
      d="M111.422771,117.65355 L79.742409,132.949912 L76.5257763,134.504714 L9.65047684,166.548104 C5.4112904,168.593211 0.000578531073,165.503855 0.000578531073,160.794612 L0.000578531073,71.7210757 C0.000578531073,70.0173017 0.874160452,68.5463864 2.04568588,67.4384994 C2.53454463,66.9481944 3.08848814,66.5446689 3.66412655,66.2250305 C5.26231864,65.2661153 7.54173107,65.0101153 9.47981017,65.7766689 L110.890522,105.957098 C116.045234,108.002206 116.450206,115.225166 111.422771,117.65355"
    ></path>
    <path
      fillOpacity=".25"
      d="M111.422771,117.65355 L79.742409,132.949912 L2.04568588,67.4384994 C2.53454463,66.9481944 3.08848814,66.5446689 3.66412655,66.2250305 C5.26231864,65.2661153 7.54173107,65.0101153 9.47981017,65.7766689 L110.890522,105.957098 C116.045234,108.002206 116.450206,115.225166 111.422771,117.65355"
    ></path>
  </svg>
);

export default function Home() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timelogData, setTimelogData] = useState<TimelogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [dataSource, setDataSource] = useState<DataSource>("jira");
  const [gitlabConfig, setGitlabConfig] = useState<GitLabConfig>({
    gitlabUrl: "",
    accessToken: "",
  });
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>({
    jiraUrl: "",
    accessToken: "",
    email: "",
  });
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSelectedUser, setExportSelectedUser] = useState<string>("");
  const [confirmationName, setConfirmationName] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSelectedDates(getDatesToFetch());
    setSelectedUsers(Object.keys(NAME_MAPPING));

    const savedDataSource = localStorage.getItem("dataSource") as DataSource;
    if (savedDataSource && ["gitlab", "jira"].includes(savedDataSource)) {
      setDataSource(savedDataSource);
    }

    const savedGitlabConfig = localStorage.getItem("gitlabConfig");
    if (savedGitlabConfig) {
      setGitlabConfig(JSON.parse(savedGitlabConfig));
    }

    const savedJiraConfig = localStorage.getItem("jiraConfig");
    if (savedJiraConfig) {
      setJiraConfig(JSON.parse(savedJiraConfig));
    }
  }, []);

  const fetchTimelogs = async () => {
    if (selectedDates.length === 0) {
      setError("Please select at least one date");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    setLoading(true);
    setError(null);
    setTimelogData(null);

    try {
      const response = await fetch("/api/timelogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetDates: selectedDates,
          selectedUsers: selectedUsers,
          dataSource: dataSource,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await response.json();
      setTimelogData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExportDialog = () => {
    setExportDialogOpen(true);
    setExportSelectedUser("");
    setConfirmationName("");
  };

  const handleUserChange = (value: string) => {
    setExportSelectedUser(value);
    setConfirmationName("");
  };

  const handleExport = async () => {
    if (!exportSelectedUser || !confirmationName.trim()) {
      return;
    }

    const expectedName =
      NAME_MAPPING[exportSelectedUser as keyof typeof NAME_MAPPING];
    if (confirmationName.trim() !== expectedName) {
      return;
    }

    setExporting(true);

    try {
      const response = await fetch("/api/export-airtable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timelogData,
          selectedUser: exportSelectedUser,
          confirmedBy: confirmationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      const result = await response.json();
      console.log("Export successful:", result);

      setExportDialogOpen(false);
      setExportSelectedUser("");
      setConfirmationName("");
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDataSourceChange = (newDataSource: DataSource) => {
    setDataSource(newDataSource);
    localStorage.setItem("dataSource", newDataSource);
  };

  const handleGitlabConfigChange = (config: GitLabConfig) => {
    setGitlabConfig(config);
    localStorage.setItem("gitlabConfig", JSON.stringify(config));
  };

  const handleJiraConfigChange = (config: JiraConfig) => {
    setJiraConfig(config);
    localStorage.setItem("jiraConfig", JSON.stringify(config));
  };

  const handleConfigSave = () => {
    setConfigDialogOpen(false);
  };

  const expectedUserName = exportSelectedUser
    ? NAME_MAPPING[exportSelectedUser as keyof typeof NAME_MAPPING]
    : "";
  const canExport =
    exportSelectedUser &&
    confirmationName.trim() === expectedUserName &&
    !exporting;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center">
              <img
                src="/beaver-logo.png"
                alt="Beaver Logo"
                className="h-32 w-32 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Timelog Reports
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Generate clean, formatted reports from your GitLab or Jira
              timelogs. Select dates, fetch data, and copy results with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-2">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5" />
                        Quick Setup
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigDialogOpen(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Config
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Choose source, pick dates and users, then generate your
                      report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Data Source
                      </Label>
                      <DataSourceSelector
                        dataSource={dataSource}
                        onDataSourceChange={handleDataSourceChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <DatePicker
                        selectedDates={selectedDates}
                        onDatesChange={setSelectedDates}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Users
                      </Label>
                      <UserFilter
                        selectedUsers={selectedUsers}
                        onUsersChange={setSelectedUsers}
                      />
                    </div>

                    <div className="space-y-3 pt-1">
                      <Button
                        onClick={fetchTimelogs}
                        disabled={
                          loading ||
                          selectedDates.length === 0 ||
                          selectedUsers.length === 0
                        }
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Fetching Data...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Generate Report
                          </>
                        )}
                      </Button>
                      {(selectedDates.length === 0 ||
                        selectedUsers.length === 0) && (
                        <p className="text-muted-foreground text-xs text-center">
                          {selectedDates.length === 0
                            ? "Select at least one date"
                            : "Select at least one user"}{" "}
                          to generate a report
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="xl:col-span-3">
              {loading && (
                <Card className="border-[#9d6221]/30 bg-[#9d6221]/10 dark:border-[#9d6221]/50 dark:bg-[#9d6221]/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#9d6221] dark:text-[#d4a574] mx-auto mb-4" />
                        <h3 className="font-semibold text-[#9d6221] dark:text-[#d4a574] mb-2">
                          Fetching Data
                        </h3>
                        <p className="text-[#9d6221]/80 dark:text-[#d4a574]/80 text-sm">
                          Retrieving timelog data from{" "}
                          {dataSource === "jira" ? "Jira" : "GitLab"} for{" "}
                          {selectedDates.length} date
                          {selectedDates.length !== 1 ? "s" : ""} and{" "}
                          {selectedUsers.length} user
                          {selectedUsers.length !== 1 ? "s" : ""}...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-destructive mb-2">
                      Error
                    </h3>
                    <p className="text-destructive text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              {timelogData && !loading && (
                <TimelogResults
                  data={timelogData}
                  selectedDates={selectedDates}
                  selectedUsers={selectedUsers}
                />
              )}

              {!timelogData && !error && !loading && (
                <Card className="border-dashed min-h-96 flex items-center justify-center">
                  <CardContent className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Ready to Generate Report
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Select your dates, users, and click &quot;Generate
                      Report&quot; to fetch timelog data
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AirtableIcon />
              Export to AirTable
            </DialogTitle>
            <DialogDescription>
              Select which user&apos;s data to export and confirm your identity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <Select
                value={exportSelectedUser}
                onValueChange={handleUserChange}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Choose a user to export" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NAME_MAPPING).map(([key, displayName]) => (
                    <SelectItem key={key} value={key}>
                      {displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation-name">Confirm User Name</Label>
              <Input
                id="confirmation-name"
                placeholder={
                  exportSelectedUser
                    ? `Type "${
                        NAME_MAPPING[
                          exportSelectedUser as keyof typeof NAME_MAPPING
                        ]
                      }" to confirm`
                    : "Select a user first"
                }
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                disabled={!exportSelectedUser}
              />
              <p className="text-sm text-muted-foreground">
                {exportSelectedUser
                  ? `Please type "${
                      NAME_MAPPING[
                        exportSelectedUser as keyof typeof NAME_MAPPING
                      ]
                    }" to confirm this export action.`
                  : "Select a user from the dropdown above to enable confirmation."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!canExport}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to AirTable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Platform Configuration</DialogTitle>
            <DialogDescription>
              Configure your API access for GitLab and Jira platforms.
            </DialogDescription>
          </DialogHeader>

          <PlatformConfigComponent
            dataSource={dataSource}
            gitlabConfig={gitlabConfig}
            jiraConfig={jiraConfig}
            onGitlabConfigChange={handleGitlabConfigChange}
            onJiraConfigChange={handleJiraConfigChange}
            onSave={handleConfigSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
