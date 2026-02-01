import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  CalendarOff,
  LayoutGrid,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { ChequeTable } from '@/components/ChequeTable';
import { ChequeCalendar } from '@/components/ChequeCalendar';
import { AddChequeDialog } from '@/components/AddChequeDialog';
import { ChequeDetailsDialog } from '@/components/ChequeDetailsDialog';
import { UpcomingHolidays } from '@/components/UpcomingHolidays';
import { CalendarExportButton } from '@/components/CalendarExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { branches } from '@/data/mockData';
import { Cheque, ChequeStatus } from '@/types/cheque';
import { useCheques } from '@/hooks/useCheques';

const Index = () => {
  const { cheques, isLoading, addCheque, updateStatus } = useCheques();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChequeStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = cheques.length;
    const pending = cheques.filter(c => c.status === 'pending');
    const cleared = cheques.filter(c => c.status === 'cleared');
    const bounced = cheques.filter(c => c.status === 'bounced');
    
    const totalAmount = cheques.reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = pending.reduce((sum, c) => sum + c.amount, 0);
    const clearedAmount = cleared.reduce((sum, c) => sum + c.amount, 0);
    const bouncedAmount = bounced.reduce((sum, c) => sum + c.amount, 0);

    return {
      total,
      pending: pending.length,
      cleared: cleared.length,
      bounced: bounced.length,
      totalAmount,
      pendingAmount,
      clearedAmount,
      bouncedAmount,
    };
  }, [cheques]);

  // Filter cheques
  const filteredCheques = useMemo(() => {
    return cheques.filter(cheque => {
      const matchesSearch = 
        cheque.chequeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cheque.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cheque.bankName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || cheque.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || cheque.branch === branchFilter;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [cheques, searchQuery, statusFilter, branchFilter]);

  const handleStatusChange = async (id: string, status: ChequeStatus) => {
    await updateStatus(id, status);
  };

  const handleAddCheque = async (newCheque: Omit<Cheque, 'id' | 'createdAt'>) => {
    const success = await addCheque({
      chequeNumber: newCheque.chequeNumber,
      bankName: newCheque.bankName,
      accountNumber: newCheque.accountNumber,
      payeeName: newCheque.payeeName,
      amount: newCheque.amount,
      issueDate: newCheque.issueDate,
      dueDate: newCheque.dueDate,
      status: newCheque.status,
      branch: newCheque.branch,
      notes: newCheque.notes,
    });
    return success;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Count holiday-adjusted cheques
  const holidayAdjustedCount = useMemo(() => {
    return cheques.filter(c => c.isHolidayAdjusted && c.status === 'pending').length;
  }, [cheques]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading cheques...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Cheque Management</h2>
            <p className="text-muted-foreground">
              Track and manage all cheques across your supermarket branches
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Cheque
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Cheques"
            value={stats.total}
            subtitle={formatCurrency(stats.totalAmount)}
            icon={FileText}
            variant="default"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            subtitle={formatCurrency(stats.pendingAmount)}
            icon={Clock}
            variant="pending"
          />
          <StatCard
            title="Cleared"
            value={stats.cleared}
            subtitle={formatCurrency(stats.clearedAmount)}
            icon={CheckCircle}
            variant="cleared"
          />
          <StatCard
            title="Bounced"
            value={stats.bounced}
            subtitle={formatCurrency(stats.bouncedAmount)}
            icon={XCircle}
            variant="bounced"
          />
          <StatCard
            title="Holiday Adjusted"
            value={holidayAdjustedCount}
            subtitle="Pending reminders shifted"
            icon={CalendarOff}
            variant="default"
          />
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cheques..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ChequeStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cleared">Cleared</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.name}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CalendarExportButton cheques={cheques} />

            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'table' | 'calendar')}
              className="border rounded-md"
            >
              <ToggleGroupItem value="table" aria-label="Table view" className="gap-2 px-3">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-2 px-3">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={viewMode === 'calendar' ? '' : 'grid gap-6 lg:grid-cols-[1fr,300px]'}>
          <div className="space-y-6">
            {/* Cheques View */}
            {viewMode === 'table' ? (
              <>
                <ChequeTable
                  cheques={filteredCheques}
                  onStatusChange={handleStatusChange}
                  onView={setSelectedCheque}
                />

                {filteredCheques.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No cheques found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' || branchFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Add your first cheque to get started'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <ChequeCalendar
                cheques={filteredCheques}
                onViewCheque={setSelectedCheque}
              />
            )}
          </div>

          {/* Sidebar - only show in table view */}
          {viewMode === 'table' && (
            <div className="hidden lg:block">
              <UpcomingHolidays />
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <AddChequeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCheque}
      />
      
      <ChequeDetailsDialog
        cheque={selectedCheque}
        open={!!selectedCheque}
        onOpenChange={(open) => !open && setSelectedCheque(null)}
      />
    </div>
  );
};

export default Index;
