import { CalendarPlus, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { downloadAllChequesICS } from '@/lib/calendarExport';
import { Cheque } from '@/types/cheque';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportButtonProps {
  cheques: Cheque[];
}

export function CalendarExportButton({ cheques }: CalendarExportButtonProps) {
  const { toast } = useToast();
  const pendingCount = cheques.filter(c => c.status === 'pending').length;

  const handleExportAll = () => {
    if (pendingCount === 0) {
      toast({
        title: 'No Pending Cheques',
        description: 'There are no pending cheques to export.',
        variant: 'destructive',
      });
      return;
    }

    downloadAllChequesICS(cheques);
    toast({
      title: 'Calendar File Downloaded',
      description: `${pendingCount} cheque reminder${pendingCount > 1 ? 's' : ''} exported. Open the file to add to your calendar app.`,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Smartphone className="h-4 w-4" />
          Add to Calendar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Export to Mobile Calendar
            </h4>
            <p className="text-sm text-muted-foreground">
              Download cheque reminders as a calendar file (.ics) that works with any calendar app.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Pending cheques:</span>
              <span className="font-semibold">{pendingCount}</span>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleExportAll}
            disabled={pendingCount === 0}
          >
            <Download className="h-4 w-4" />
            Download Calendar File
          </Button>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download the .ics file</li>
              <li>Open it on your phone</li>
              <li>Choose your calendar app to import</li>
            </ol>
            <p className="mt-2">
              Works with: Apple Calendar, Google Calendar, Outlook, Samsung Calendar, and more.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
