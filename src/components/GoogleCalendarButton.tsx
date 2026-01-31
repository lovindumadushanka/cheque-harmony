import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';

export function GoogleCalendarButton() {
  const { isConnected, isLoading, isConnecting, isSyncing, connect, disconnect, syncAllCheques } = useGoogleCalendar();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Calendar className="h-4 w-4 animate-pulse" />
        Checking...
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2",
            isConnected && "border-[hsl(var(--success))] text-[hsl(var(--success))]"
          )}
        >
          <Calendar className="h-4 w-4" />
          Google Calendar
          {isConnected && (
            <Badge variant="outline" className="ml-1 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30 text-[10px] px-1.5">
              Connected
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Google Calendar Sync</h4>
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? 'Your cheques are automatically synced to Google Calendar.'
                : 'Connect to automatically add cheque reminders to your Google Calendar.'}
            </p>
          </div>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--success))]/10 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--success))]/20">
                  <Calendar className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sync Active</p>
                  <p className="text-xs text-muted-foreground">New cheques will appear in your calendar</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={syncAllCheques}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync All Cheques Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={connect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Calendar className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            We'll only access your calendar to create cheque reminder events.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
