import { format } from 'date-fns';
import { MoreHorizontal, Eye, CheckCircle, XCircle, Clock, CalendarOff } from 'lucide-react';
import { Cheque, ChequeStatus } from '@/types/cheque';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HolidayIndicator } from '@/components/HolidayIndicator';

interface ChequeTableProps {
  cheques: Cheque[];
  onStatusChange: (id: string, status: ChequeStatus) => void;
  onView: (cheque: Cheque) => void;
}

const statusConfig: Record<ChequeStatus, { label: string; variant: 'pending' | 'cleared' | 'bounced'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'pending', icon: Clock },
  cleared: { label: 'Cleared', variant: 'cleared', icon: CheckCircle },
  bounced: { label: 'Bounced', variant: 'bounced', icon: XCircle },
};

export function ChequeTable({ cheques, onStatusChange, onView }: ChequeTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Cheque No.</TableHead>
            <TableHead className="font-semibold">Payee</TableHead>
            <TableHead className="font-semibold">Bank</TableHead>
            <TableHead className="font-semibold">Amount</TableHead>
            <TableHead className="font-semibold">Due Date</TableHead>
            <TableHead className="font-semibold">Reminder Date</TableHead>
            <TableHead className="font-semibold">Branch</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cheques.map((cheque) => {
            const status = statusConfig[cheque.status];
            const StatusIcon = status.icon;
            const isAdjusted = cheque.isHolidayAdjusted && cheque.reminderDate;
            
            return (
              <TableRow key={cheque.id} className="group">
                <TableCell className="font-medium">{cheque.chequeNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{cheque.payeeName}</p>
                    <p className="text-sm text-muted-foreground">{cheque.accountNumber}</p>
                  </div>
                </TableCell>
                <TableCell>{cheque.bankName}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(cheque.amount)}</TableCell>
                <TableCell>
                  <span className={isAdjusted ? 'line-through text-muted-foreground' : ''}>
                    {format(new Date(cheque.dueDate), 'MMM dd, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  {cheque.reminderDate ? (
                    <div className="space-y-1">
                      <span className="font-medium">
                        {format(new Date(cheque.reminderDate), 'MMM dd, yyyy')}
                      </span>
                      {isAdjusted && (
                        <HolidayIndicator
                          originalDate={new Date(cheque.dueDate)}
                          reminderDate={new Date(cheque.reminderDate)}
                          skippedDays={cheque.holidaySkipped || []}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{cheque.branch}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(cheque)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(cheque.id, 'pending')}
                        disabled={cheque.status === 'pending'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(cheque.id, 'cleared')}
                        disabled={cheque.status === 'cleared'}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Cleared
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(cheque.id, 'bounced')}
                        disabled={cheque.status === 'bounced'}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark as Bounced
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
