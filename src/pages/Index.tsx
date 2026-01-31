import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  Download
} from 'lucide-react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { ChequeTable } from '@/components/ChequeTable';
import { AddChequeDialog } from '@/components/AddChequeDialog';
import { ChequeDetailsDialog } from '@/components/ChequeDetailsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockCheques, branches } from '@/data/mockData';
import { Cheque, ChequeStatus } from '@/types/cheque';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [cheques, setCheques] = useState<Cheque[]>(mockCheques);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChequeStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const { toast } = useToast();

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

  const handleStatusChange = (id: string, status: ChequeStatus) => {
    setCheques(prev => 
      prev.map(cheque => 
        cheque.id === id ? { ...cheque, status } : cheque
      )
    );
    toast({
      title: 'Status Updated',
      description: `Cheque has been marked as ${status}.`,
    });
  };

  const handleAddCheque = (newCheque: Omit<Cheque, 'id' | 'createdAt'>) => {
    const cheque: Cheque = {
      ...newCheque,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCheques(prev => [cheque, ...prev]);
    toast({
      title: 'Cheque Added',
      description: `${cheque.chequeNumber} has been added successfully.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Cheques Table */}
        <ChequeTable
          cheques={filteredCheques}
          onStatusChange={handleStatusChange}
          onView={setSelectedCheque}
        />

        {filteredCheques.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No cheques found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || branchFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first cheque to get started'}
            </p>
          </div>
        )}
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
