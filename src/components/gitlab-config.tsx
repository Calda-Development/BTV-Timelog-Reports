"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitLabConfig, JiraConfig, DataSource } from "@/lib/types";

interface PlatformConfigProps {
  dataSource: DataSource;
  gitlabConfig: GitLabConfig;
  jiraConfig: JiraConfig;
  onGitlabConfigChange: (config: GitLabConfig) => void;
  onJiraConfigChange: (config: JiraConfig) => void;
  onSave: () => void;
}

export function PlatformConfigComponent({
  dataSource,
  gitlabConfig,
  jiraConfig,
  onGitlabConfigChange,
  onJiraConfigChange,
  onSave,
}: PlatformConfigProps) {
  const [localGitlabConfig, setLocalGitlabConfig] =
    useState<GitLabConfig>(gitlabConfig);
  const [localJiraConfig, setLocalJiraConfig] =
    useState<JiraConfig>(jiraConfig);

  useEffect(() => {
    setLocalGitlabConfig(gitlabConfig);
  }, [gitlabConfig]);

  useEffect(() => {
    setLocalJiraConfig(jiraConfig);
  }, [jiraConfig]);

  const handleSave = () => {
    onGitlabConfigChange(localGitlabConfig);
    onJiraConfigChange(localJiraConfig);
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Configuration</CardTitle>
        <CardDescription>
          Configure your API access for the selected platform. These settings
          will be saved in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={dataSource} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gitlab">GitLab</TabsTrigger>
            <TabsTrigger value="jira">Jira</TabsTrigger>
          </TabsList>

          <TabsContent value="gitlab" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="gitlab-url">GitLab GraphQL API URL</Label>
              <Input
                id="gitlab-url"
                type="url"
                placeholder="https://gitlab.example.com/api/graphql"
                value={localGitlabConfig.gitlabUrl}
                onChange={(e) =>
                  setLocalGitlabConfig({
                    ...localGitlabConfig,
                    gitlabUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitlab-token">Access Token</Label>
              <Input
                id="gitlab-token"
                type="password"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                value={localGitlabConfig.accessToken}
                onChange={(e) =>
                  setLocalGitlabConfig({
                    ...localGitlabConfig,
                    accessToken: e.target.value,
                  })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="jira" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="jira-url">Jira API URL</Label>
              <Input
                id="jira-url"
                type="url"
                placeholder="https://your-domain.atlassian.net"
                value={localJiraConfig.jiraUrl}
                onChange={(e) =>
                  setLocalJiraConfig({
                    ...localJiraConfig,
                    jiraUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jira-email">Email</Label>
              <Input
                id="jira-email"
                type="email"
                placeholder="your-email@example.com"
                value={localJiraConfig.email}
                onChange={(e) =>
                  setLocalJiraConfig({
                    ...localJiraConfig,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jira-token">API Token</Label>
              <Input
                id="jira-token"
                type="password"
                placeholder="your-jira-api-token"
                value={localJiraConfig.accessToken}
                onChange={(e) =>
                  setLocalJiraConfig({
                    ...localJiraConfig,
                    accessToken: e.target.value,
                  })
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="w-full mt-4">
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}
