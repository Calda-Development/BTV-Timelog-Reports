'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TimelogData, TimelogEntry } from '@/lib/types';
import { getDisplayName, formatDateRange, convertTime, NAME_MAPPING } from '@/lib/utils';

interface TimelogResultsProps {
  data: TimelogData;
  selectedDates: string[];
  selectedUsers: string[];
}

export function TimelogResults({ data, selectedDates, selectedUsers }: TimelogResultsProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedDay, setCopiedDay] = useState<string | null>(null);

  const copyToClipboard = (text: string, index?: number, day?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (day) {
        setCopiedDay(day);
        setTimeout(() => setCopiedDay(null), 2000);
      } else if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      
      toast({
        title: "Copied to clipboard",
        description: day ? `${day} report copied` : "Report copied successfully",
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const buildTextReport = () => {
    const dateRange = formatDateRange(selectedDates);
    let message = '*DAILY ☀️*\n';

    if (selectedDates.length === 1) {
      const date = new Date(selectedDates[0] + 'T00:00:00');
      const europeanDate = date.toLocaleDateString('en-GB');
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

  const buildDayReport = (date: string) => {
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

  const userEntries: Record<string, TimelogEntry[]> = {};
  
  selectedDates.forEach(date => {
    const entries = data.timelogGroups[date] || [];
    entries.forEach(entry => {
      const displayName = getDisplayName(entry.userName);
      if (!userEntries[displayName]) {
        userEntries[displayName] = [];
      }
      userEntries[displayName].push(entry);
    });
  });

  const daysWithData = selectedDates.filter(date => 
    data.timelogGroups[date] && data.timelogGroups[date].length > 0
  );
  const isMultiDay = daysWithData.length > 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-3" />
                Time Log Report
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {formatDateRange(selectedDates)}
              </p>
            </div>
            <Button 
              onClick={() => copyToClipboard(buildTextReport())}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Daily
            </Button>
          </div>
        </CardHeader>
        <CardContent className="border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{Object.keys(userEntries).length}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {Object.values(userEntries).reduce((acc, entries) => acc + entries.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{daysWithData.length}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {convertTime(
                  Object.values(userEntries)
                    .flat()
                    .reduce((acc, entry) => {
                      const timeInSeconds = entry.timeSpent.split(':').reduce((acc: number, time: string, index: number) => {
                        return acc + parseInt(time) * Math.pow(60, 2 - index);
                      }, 0);
                      return acc + timeInSeconds;
                    }, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-foreground mb-4">Individual Hours</h3>
            <div className="space-y-2">
              {Object.entries(userEntries).map(([displayName, entries]) => {
                const totalSeconds = entries.reduce((acc, entry) => {
                  const timeInSeconds = entry.timeSpent.split(':').reduce((acc: number, time: string, index: number) => {
                    return acc + parseInt(time) * Math.pow(60, 2 - index);
                  }, 0);
                  return acc + timeInSeconds;
                }, 0);
                
                return (
                  <div key={displayName} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-lg">
                    <span className="font-medium text-foreground">{displayName}</span>
                    <span className="font-mono text-sm text-muted-foreground">{convertTime(totalSeconds)}</span>
                  </div>
                );
              })}
              
              {(() => {
                const allTeamMembers = ["Tim", "Črt", "Niko", "Jan", "Daniel", "Edis"];
                const activeMembers = Object.keys(userEntries);
                const missingMembers = allTeamMembers.filter(displayName => !activeMembers.includes(displayName));
                
                // Only show missing members when all users are selected (not filtered)
                const allUsersSelected = selectedUsers.length === Object.keys(NAME_MAPPING).length;
                
                console.log('All team members:', allTeamMembers);
                console.log('Active members:', activeMembers);
                console.log('Missing members:', missingMembers);
                console.log('All users selected:', allUsersSelected);
                
                return (allUsersSelected && missingMembers.length > 0) ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Missing Time Logs</h4>
                    {missingMembers.map(member => (
                      <div key={member} className="flex justify-between items-center py-2 px-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <span className="font-medium text-destructive">{member}</span>
                        <span className="text-sm text-destructive">No entries</span>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {isMultiDay && (
        <Card className="border-[#9d6221]/30 bg-[#9d6221]/10 dark:border-[#9d6221]/50 dark:bg-[#9d6221]/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-[#9d6221] dark:text-[#d4a574] text-lg">
              <Calendar className="h-4 w-4 mr-2" />
              Daily Breakdown
              <span className="text-muted-foreground font-normal ml-2">(for AirTable)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {daysWithData.map((date) => {
                const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                const dayEntries = data.timelogGroups[date] || [];
                const [year, month, day] = date.split('-');
                const europeanDate = `${day}/${month}`;
                
                const totalSeconds = dayEntries.reduce((acc, entry) => {
                  const timeInSeconds = entry.timeSpent.split(':').reduce((acc, time, index) => {
                    return acc + parseInt(time) * Math.pow(60, 2 - index);
                  }, 0);
                  return acc + timeInSeconds;
                }, 0);
                const totalHours = convertTime(totalSeconds);
                
                return (
                  <div key={date} className="flex items-center justify-between p-3 bg-background border border-[#9d6221]/20 dark:border-[#9d6221]/40 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{dayOfWeek}</span>
                        <span className="text-muted-foreground ml-1">{europeanDate}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{dayEntries.length} entries</span>
                      <span className="text-xs font-mono font-medium text-[#9d6221] dark:text-[#d4a574] bg-[#9d6221]/15 dark:bg-[#9d6221]/20 px-2 py-1 rounded">
                        {totalHours}
                      </span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(buildDayReport(date), undefined, date)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium border-[#9d6221] text-[#9d6221] hover:bg-[#9d6221] hover:text-white dark:border-[#d4a574] dark:text-[#d4a574] dark:hover:bg-[#d4a574] dark:hover:text-black transition-colors"
                    >
                      {copiedDay === date ? (
                        <>
                          <span className="mr-1">✓</span>
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(userEntries).map(([displayName, entries], userIndex) => (
        <Card key={displayName}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{displayName}</CardTitle>
              <Button 
                onClick={() => copyToClipboard(
                  entries.map(entry => {
                    const cleanedTitle = entry.issueTitle.replace(/\[|\]/g, '');
                    return `[${cleanedTitle}](${entry.issueWebUrl})\n  ${entry.summary}\n  *Time spent:* ${entry.timeSpent}`;
                  }).join('\n\n'),
                  userIndex
                )}
                variant="outline"
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="border rounded-xl p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-medium text-foreground text-sm leading-relaxed flex-1">
                      {entry.issueTitle}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {entry.timeSpent}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(entry.issueWebUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {entry.summary}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 