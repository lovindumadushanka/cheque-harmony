import { format } from 'date-fns';
import { Building2, Calendar, CreditCard, FileText, MapPin, User } from 'lucide-react';
import { Cheque, ChequeStatus } from '@/types/cheque';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChequeDetailsDialogProps {
  cheque: Cheque | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<ChequeStatus, { label: string; variant: 'pending' | 'cleared' | 'bounced' }> = {
  pending: { label: 'Pending', variant: 'pending' },
  cleared: { label: 'Cleared', variant: 'cleared' },
  bounced: { label: 'Bounced', variant: 'bounced' },
};

export function ChequeDetailsDialog({ cheque, open, onOpenChange }: ChequeDetailsDialogProps) {
  if (!cheque) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const status = statusConfig[cheque.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Cheque Details</DialogTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <span className="text-sm text-muted-foreground">Cheque Number</span>
            <span className="text-lg font-bold">{cheque.chequeNumber}</span>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Payee</p>
                <p className="font-medium">{cheque.payeeName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Bank</p>
                <p className="font-medium">{cheque.bankName}</p>
                <p className="text-sm text-muted-foreground">{cheque.accountNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(cheque.amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{format(new Date(cheque.issueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{format(new Date(cheque.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{cheque.branch}</p>
              </div>
            </div>

            {cheque.notes && (
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{cheque.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Created on {format(new Date(cheque.createdAt), 'PPP \'at\' p')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
