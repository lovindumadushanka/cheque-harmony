import { Calendar, RefreshCw, Link2, Unlink, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/hooks/useAuth';

export function GoogleCalendarSync() {
  const { user } = useAuth();
  const { 
    isConnected, 
    isLoading, 
    isSyncing, 
    lastSyncResult,
    connect, 
    disconnect, 
    sync 
  } = useGoogleCalendar();

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Google Calendar Sync</CardTitle>
        </div>
        <CardDescription className="text-sm">
          {isConnected 
            ? 'Your cheque reminders sync automatically to Google Calendar'
            : 'Connect to sync cheque reminders to your calendar'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Connected to Google Calendar</span>
            </div>
            
            {lastSyncResult && (
              <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                Last sync: {lastSyncResult.synced} added, {lastSyncResult.updated} updated, {lastSyncResult.deleted} removed
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sync}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={disconnect}
                disabled={isLoading}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button 
            onClick={connect} 
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Connect Google Calendar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
