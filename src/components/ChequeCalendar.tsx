import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Cheque } from '@/types/cheque';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isBankHoliday, getHolidayName } from '@/lib/sriLankanHolidays';

interface ChequeCalendarProps {
  cheques: Cheque[];
  onViewCheque: (cheque: Cheque) => void;
}

interface DayChequeData {
  cheques: Cheque[];
  totalAmount: number;
  count: number;
}

export function ChequeCalendar({ cheques, onViewCheque }: ChequeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group cheques by due date
  const chequesByDate = useMemo(() => {
    const map = new Map<string, DayChequeData>();
    
    cheques.forEach(cheque => {
      const dateKey = format(new Date(cheque.dueDate), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || { cheques: [], totalAmount: 0, count: 0 };
      existing.cheques.push(cheque);
      existing.totalAmount += cheque.amount;
      existing.count += 1;
      map.set(dateKey, existing);
    });
    
    return map;
  }, [cheques]);

  // Get days in current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days for the start of the month
    const startPadding = getDay(monthStart);
    const paddingDays: (Date | null)[] = Array(startPadding).fill(null);
    
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[hsl(var(--warning))]';
      case 'cleared': return 'bg-[hsl(var(--success))]';
      case 'bounced': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    let total = 0;
    let count = 0;
    
    chequesByDate.forEach((data, dateKey) => {
      const date = new Date(dateKey);
      if (isSameMonth(date, currentMonth)) {
        total += data.totalAmount;
        count += data.count;
      }
    });
    
    return { total, count };
  }, [chequesByDate, currentMonth]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-primary"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">This Month:</span>
            <Badge variant="outline" className="font-semibold">
              {monthlyTotals.count} cheques
            </Badge>
            <Badge className="bg-primary font-semibold">
              {formatFullCurrency(monthlyTotals.total)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map(day => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-sm font-medium text-muted-foreground",
              (day === 'Sun' || day === 'Sat') && "text-destructive/70"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`padding-${index}`} className="min-h-[100px] border-b border-r bg-muted/20" />;
          }

          const dateKey = format(day, 'yyyy-MM-dd');
          const dayData = chequesByDate.get(dateKey);
          const holiday = isBankHoliday(day) ? getHolidayName(day) : null;
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[100px] border-b border-r p-1 transition-colors",
                !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground",
                isCurrentDay && "bg-primary/5",
                holiday && "bg-destructive/5",
                isWeekend && !holiday && "bg-muted/10"
              )}
            >
              {/* Date Number */}
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                    isCurrentDay && "bg-primary text-primary-foreground",
                    isWeekend && !isCurrentDay && "text-destructive/70"
                  )}
                >
                  {format(day, 'd')}
                </span>
                {holiday && (
                  <span className="max-w-[80px] truncate text-[10px] text-destructive" title={holiday}>
                    {holiday}
                  </span>
                )}
              </div>

              {/* Cheque Data */}
              {dayData && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="mt-1 w-full rounded-md bg-gradient-to-r from-primary/10 to-primary/5 p-1.5 text-left transition-all hover:from-primary/20 hover:to-primary/10">
                      <div className="flex items-center gap-1 text-xs font-medium text-primary">
                        <FileText className="h-3 w-3" />
                        <span>{dayData.count} cheque{dayData.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-foreground">
                        LKR {formatCurrency(dayData.totalAmount)}
                      </div>
                      {/* Status dots */}
                      <div className="mt-1 flex gap-0.5">
                        {dayData.cheques.slice(0, 5).map((cheque, i) => (
                          <div
                            key={i}
                            className={cn("h-1.5 w-1.5 rounded-full", getStatusColor(cheque.status))}
                            title={cheque.status}
                          />
                        ))}
                        {dayData.cheques.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{dayData.cheques.length - 5}</span>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="border-b bg-muted/50 px-3 py-2">
                      <h4 className="font-semibold">{format(day, 'EEEE, MMMM d, yyyy')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dayData.count} cheque{dayData.count > 1 ? 's' : ''} • Total: {formatFullCurrency(dayData.totalAmount)}
                      </p>
                    </div>
                    <ScrollArea className="max-h-[250px]">
                      <div className="space-y-1 p-2">
                        {dayData.cheques.map(cheque => (
                          <button
                            key={cheque.id}
                            onClick={() => onViewCheque(cheque)}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                          >
                            <div className={cn("h-2 w-2 rounded-full", getStatusColor(cheque.status))} />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium">{cheque.payeeName}</p>
                              <p className="text-xs text-muted-foreground">{cheque.chequeNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatFullCurrency(cheque.amount)}</p>
                              <Badge variant={cheque.status as 'pending' | 'cleared' | 'bounced'} className="text-[10px] px-1.5 py-0">
                                {cheque.status}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 border-t px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--warning))]" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
          <span className="text-muted-foreground">Cleared</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Bounced</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-destructive/20" />
          <span className="text-muted-foreground">Bank Holiday</span>
        </div>
      </div>
    </div>
  );
}
