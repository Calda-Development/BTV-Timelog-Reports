'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDatesToFetch, getPreviousDay } from '@/lib/utils';

interface DatePickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
}

export function DatePicker({ selectedDates, onDatesChange }: DatePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  const handlePresetClick = (preset: string) => {
    let dates: string[];
    
    switch (preset) {
      case 'yesterday':
        dates = [getPreviousDay()];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setDate({ from: yesterday, to: yesterday });
        break;
      case 'last7':
        dates = [];
        const startDate = new Date();
        const endDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() - 1);
        
        for (let i = 7; i >= 1; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dates.push(`${year}-${month}-${day}`);
        }
        
        setDate({ from: startDate, to: endDate });
        break;
      default:
        return;
    }
    
    onDatesChange(dates);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      const dates: string[] = [];
      const currentDate = new Date(range.from);
      const endDate = new Date(range.to);
      
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      onDatesChange(dates);
    } else if (range?.from && !range?.to) {
      const singleDate = new Date(range.from);
      const year = singleDate.getFullYear();
      const month = String(singleDate.getMonth() + 1).padStart(2, '0');
      const day = String(singleDate.getDate()).padStart(2, '0');
      onDatesChange([`${year}-${month}-${day}`]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-sm mb-3">Quick presets</p>
        <div className="grid grid-cols-1 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePresetClick('yesterday')}
            className="justify-start h-10"
          >
            Yesterday
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePresetClick('last7')}
            className="justify-start h-10"
          >
            <span>Last 7 Days <span className="text-muted-foreground">(Daily breakdown! - for airtable)</span></span>
          </Button>
        </div>
      </div>
      
      <div>
        <p className="text-muted-foreground text-sm mb-3">Custom date range</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-10',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'MMM dd, yyyy')} - {format(date.to, 'MMM dd, yyyy')}
                  </>
                ) : (
                  format(date.from, 'MMM dd, yyyy')
                )
              ) : (
                <span>Pick date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {selectedDates.length > 0 && (
        <div className="bg-muted/30 border rounded-lg p-3">
          <p className="text-xs font-medium text-foreground mb-2">Selected dates:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedDates.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
} 