'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TimelogData, TimelogEntry } from '@/lib/types';
import { getDisplayName, convertTime, formatDateRange } from '@/lib/utils';

interface TimelogResultsProps {
  data: TimelogData;
  selectedDates: string[];
}

export function TimelogResults({ data, selectedDates }: TimelogResultsProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (typeof index === 'number') {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const buildTextReport = (): string => {
    const dateRange = formatDateRange(selectedDates);
    let message = `GitLab Time Log Report for ${dateRange}\n\n`;

    const allEntries = [];
    let hasAnyEntries = false;

    for (const date of selectedDates) {
      if (data.timelogGroups[date] && data.timelogGroups[date].length > 0) {
        allEntries.push(...data.timelogGroups[date]);
        hasAnyEntries = true;
      }
    }

    if (!hasAnyEntries) {
      message += `No time logs found for ${dateRange}\n\n`;
      message += `Generated on ${new Date().toISOString()}`;
      return message;
    }

    const userEntries: Record<string, TimelogEntry[]> = {};
    for (const entry of allEntries) {
      const displayName = getDisplayName(entry.userName);
      if (!userEntries[displayName]) {
        userEntries[displayName] = [];
      }
      userEntries[displayName].push(entry);
    }

    message += `Summary by User:\n`;
    for (const [gitlabName, totalSeconds] of Object.entries(data.userTotals)) {
      const displayName = getDisplayName(gitlabName);
      const totalTime = convertTime(totalSeconds);
      message += `• ${displayName}: ${totalTime}\n`;
    }
    message += `\n`;

    for (const [displayName, entries] of Object.entries(userEntries)) {
      message += `-----\n`;
      message += `${displayName}\n`;

      for (const entry of entries) {
        message += `  ${entry.issueTitle}\n`;
        message += `   ${entry.summary}\n`;
        message += `   Time spent: ${entry.timeSpent}\n`;
        message += `   ${entry.issueWebUrl}\n`;
      }
      message += `\n`;
    }

    message += `Generated on ${new Date().toISOString()}`;
    return message;
  };

  const hasData = selectedDates.some(date => 
    data.timelogGroups[date] && data.timelogGroups[date].length > 0
  );

  if (!hasData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">No Data Found</h3>
        <p className="text-yellow-700 text-sm">
          No time logs found for the selected dates: {selectedDates.join(', ')}
        </p>
      </div>
    );
  }

  const userEntries: Record<string, TimelogEntry[]> = {};
  const allEntries = [];
  
  for (const date of selectedDates) {
    if (data.timelogGroups[date]) {
      allEntries.push(...data.timelogGroups[date]);
    }
  }

  for (const entry of allEntries) {
    const displayName = getDisplayName(entry.userName);
    if (!userEntries[displayName]) {
      userEntries[displayName] = [];
    }
    userEntries[displayName].push(entry);
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-black mr-3" />
              <h2 className="text-xl font-bold text-black">
                Time Log Report
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              {formatDateRange(selectedDates)}
            </p>
          </div>
          <Button 
            onClick={() => copyToClipboard(buildTextReport())}
            className="bg-black hover:bg-gray-800 text-white rounded-xl px-4 py-2 text-sm font-medium"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy All
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center mb-4">
            <Users className="h-4 w-4 text-black mr-2" />
            <h3 className="font-semibold text-black">Summary by User</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.userTotals).map(([gitlabName, totalSeconds]) => {
              const displayName = getDisplayName(gitlabName);
              const totalTime = convertTime(totalSeconds);
              return (
                <div key={gitlabName} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                  <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{totalTime}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {Object.entries(userEntries).map(([displayName, entries], userIndex) => (
        <div key={displayName} className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black">{displayName}</h3>
            <Button 
              onClick={() => copyToClipboard(
                entries.map(entry => 
                  `${entry.issueTitle}\n  ${entry.summary}\n  Time spent: ${entry.timeSpent}\n  ${entry.issueWebUrl}`
                ).join('\n\n'),
                userIndex
              )}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl text-sm"
            >
              {copiedIndex === userIndex ? (
                "Copied!"
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            {entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-medium text-gray-900 text-sm leading-relaxed flex-1">
                    {entry.issueTitle}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {entry.timeSpent}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      onClick={() => window.open(entry.issueWebUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {entry.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 