import { CalendarOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HolidayIndicatorProps {
  originalDate: Date;
  reminderDate: Date;
  skippedDays: string[];
  className?: string;
}

export function HolidayIndicator({
  originalDate,
  reminderDate,
  skippedDays,
  className,
}: HolidayIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--status-pending-bg))] px-2 py-1 text-xs font-medium text-[hsl(var(--status-pending-foreground))] border border-[hsl(var(--status-pending)/0.3)]',
            className
          )}
        >
          <CalendarOff className="h-3 w-3" />
          <span>Holiday Adjusted</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-pending))]" />
            <span>Due Date Falls on Non-Working Day</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="line-through">{format(originalDate, 'MMM dd, yyyy')}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium text-foreground">
                {format(reminderDate, 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Skipped: </span>
            {skippedDays.join(', ')}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
