'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Clock, Users, Calendar } from 'lucide-react';
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
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  const copyToClipboard = (text: string, index?: number, dayKey?: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        if (typeof index === 'number') {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
        if (dayKey) {
          setCopiedDay(dayKey);
          setTimeout(() => setCopiedDay(null), 2000);
        }
        toast({
          title: 'Copied to clipboard',
          description: 'Text has been copied to your clipboard',
        });
      } else {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy text to clipboard',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy text to clipboard',
        variant: 'destructive',
      });
    }

    document.body.removeChild(textArea);
  };

  const buildTextReport = (): string => {
    const dateRange = formatDateRange(selectedDates);
    let message = '';

    // Add header with European date format
    if (selectedDates.length === 1) {
      const date = new Date(selectedDates[0] + 'T00:00:00');
      const europeanDate = date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      message += `What we accomplished on ${europeanDate}:\n\n`;
    } else {
      const startDate = new Date(selectedDates[0] + 'T00:00:00');
      const endDate = new Date(selectedDates[selectedDates.length - 1] + 'T00:00:00');
      const europeanStartDate = startDate.toLocaleDateString('en-GB');
      const europeanEndDate = endDate.toLocaleDateString('en-GB');
      message += `What we accomplished from ${europeanStartDate} to ${europeanEndDate}:\n\n`;
    }

    const allEntries = [];
    let hasAnyEntries = false;

    for (const date of selectedDates) {
      if (data.timelogGroups[date] && data.timelogGroups[date].length > 0) {
        allEntries.push(...data.timelogGroups[date]);
        hasAnyEntries = true;
      }
    }

    if (!hasAnyEntries) {
      message += `No time logs found for ${dateRange}\n`;
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

    for (const [displayName, entries] of Object.entries(userEntries)) {
      message += `*${displayName}*\n`;

      for (const entry of entries) {
        const cleanedTitle = entry.issueTitle.replace(/\[|\]/g, '');
        message += `  [${cleanedTitle}](${entry.issueWebUrl})\n`;
        message += `   ${entry.summary}\n`;
        message += `   *Time spent:* ${entry.timeSpent}\n`;
      }
      message += `\n`;
    }

    return message;
  };

  const buildDayReport = (date: string): string => {
    const dayEntries = data.timelogGroups[date] || [];
    
    let message = '';

    if (dayEntries.length === 0) {
      message += `No time logs found for this day\n`;
      return message;
    }

    const userEntries: Record<string, TimelogEntry[]> = {};

    for (const entry of dayEntries) {
      const displayName = getDisplayName(entry.userName);
      if (!userEntries[displayName]) {
        userEntries[displayName] = [];
      }
      userEntries[displayName].push(entry);
    }

    for (const [displayName, entries] of Object.entries(userEntries)) {
      message += `*${displayName}*\n`;
      for (const entry of entries) {
        const cleanedTitle = entry.issueTitle.replace(/\[|\]/g, '');
        message += `  [${cleanedTitle}](${entry.issueWebUrl})\n`;
        message += `   ${entry.summary}\n`;
        message += `   *Time spent:* ${entry.timeSpent}\n`;
      }
      message += `\n`;
    }

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

  // Check if this is a multi-day report (more than 1 day with data)
  const daysWithData = selectedDates.filter(date => 
    data.timelogGroups[date] && data.timelogGroups[date].length > 0
  );
  const isMultiDay = daysWithData.length > 1;

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

      {/* Daily Breakdown for multi-day reports */}
      {isMultiDay && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-blue-900">Daily Breakdown</h3>
            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              Perfect for tables!
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daysWithData.map((date) => {
              const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
              const dayEntries = data.timelogGroups[date] || [];
              
              // Calculate total hours for this day
              const totalSeconds = dayEntries.reduce((acc, entry) => {
                const timeInSeconds = entry.timeSpent.split(':').reduce((acc, time, index) => {
                  return acc + parseInt(time) * Math.pow(60, 2 - index);
                }, 0);
                return acc + timeInSeconds;
              }, 0);
              const totalHours = convertTime(totalSeconds);
              
              return (
                <div key={date} className="bg-white border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{dayOfWeek}</h4>
                      <p className="text-xs text-gray-600">{date}</p>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(buildDayReport(date), undefined, date)}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs border-blue-200 hover:bg-blue-50"
                    >
                      {copiedDay === date ? (
                        "Copied!"
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      {dayEntries.length} entries
                    </div>
                    <div className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      Total: {totalHours}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.entries(userEntries).map(([displayName, entries], userIndex) => (
        <div key={displayName} className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black">{displayName}</h3>
            <Button 
              onClick={() => copyToClipboard(
                entries.map(entry => {
                  const cleanedTitle = entry.issueTitle.replace(/\[|\]/g, '');
                  return `[${cleanedTitle}](${entry.issueWebUrl})\n  ${entry.summary}\n  *Time spent:* ${entry.timeSpent}`;
                }).join('\n\n'),
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