'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GitLabConfig } from '@/lib/types';

interface GitLabConfigProps {
  config: GitLabConfig;
  onConfigChange: (config: GitLabConfig) => void;
  onSave: () => void;
}

export function GitLabConfigComponent({ config, onConfigChange, onSave }: GitLabConfigProps) {
  const [localConfig, setLocalConfig] = useState<GitLabConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitLab Configuration</CardTitle>
        <CardDescription>
          Configure your GitLab API access. These settings will be saved in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gitlab-url">GitLab GraphQL API URL</Label>
          <Input
            id="gitlab-url"
            type="url"
            placeholder="https://gitlab.example.com/api/graphql"
            value={localConfig.gitlabUrl}
            onChange={(e) => setLocalConfig({ ...localConfig, gitlabUrl: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="access-token">Access Token</Label>
          <Input
            id="access-token"
            type="password"
            placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
            value={localConfig.accessToken}
            onChange={(e) => setLocalConfig({ ...localConfig, accessToken: e.target.value })}
          />
        </div>
        
        <Button onClick={handleSave} className="w-full">
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
} 