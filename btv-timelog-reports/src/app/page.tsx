'use client';

import { useState, useEffect } from 'react';
import { Loader2, GitBranch, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/date-picker';
import { TimelogResults } from '@/components/timelog-results';
import { TimelogData } from '@/lib/types';
import { getDatesToFetch } from '@/lib/utils';

export default function Home() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [timelogData, setTimelogData] = useState<TimelogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDates(getDatesToFetch());
  }, []);

  const fetchTimelogs = async () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    setLoading(true);
    setError(null);
    setTimelogData(null);

    try {
      const response = await fetch('/api/timelogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetDates: selectedDates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      setTimelogData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-black rounded-full">
                <GitBranch className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-black mb-4">
              GitLab Timelog Reports
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Generate clean, formatted reports from your GitLab timelogs. 
              Select dates, fetch data, and copy results with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            <div className="xl:col-span-2">
              <div className="sticky top-6 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 text-black mr-3" />
                    <h2 className="text-lg font-semibold text-black">Date Selection</h2>
                  </div>
                  <DatePicker
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                  />
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <Download className="h-5 w-5 text-black mr-3" />
                    <h2 className="text-lg font-semibold text-black">Generate Report</h2>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Fetch timelog data for the selected dates from GitLab
                  </p>
                  <Button 
                    onClick={fetchTimelogs}
                    disabled={loading || selectedDates.length === 0}
                    className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Fetching Data...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                  {selectedDates.length === 0 && (
                    <p className="text-gray-500 text-xs mt-3 text-center">
                      Select at least one date to generate a report
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {timelogData && (
                <TimelogResults
                  data={timelogData}
                  selectedDates={selectedDates}
                />
              )}

              {!timelogData && !error && !loading && (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GitBranch className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to Generate Report
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Select your dates and click &quot;Generate Report&quot; to fetch timelog data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
