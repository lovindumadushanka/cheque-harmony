import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getUpcomingHolidays } from '@/lib/sriLankanHolidays';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function UpcomingHolidays() {
  const holidays = getUpcomingHolidays(5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Upcoming Bank Holidays</CardTitle>
        </div>
        <CardDescription>Sri Lankan bank closed days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{holiday.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(holiday.date, 'EEEE')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {format(holiday.date, 'MMM dd')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(holiday.date, 'yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
