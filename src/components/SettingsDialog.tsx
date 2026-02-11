import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Branch } from '@/types/cheque';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  onAddBranch: (name: string, code: string) => Promise<boolean>;
  onRemoveBranch: (id: string) => Promise<boolean>;
}

export function SettingsDialog({ open, onOpenChange, branches, onAddBranch, onRemoveBranch }: SettingsDialogProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim() || !newCode.trim()) return;
    setIsAdding(true);
    const success = await onAddBranch(newName.trim(), newCode.trim().toUpperCase());
    if (success) {
      setNewName('');
      setNewCode('');
    }
    setIsAdding(false);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await onRemoveBranch(id);
    setRemovingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your branches and preferences.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <h3 className="text-sm font-semibold">Branches</h3>

          {/* Branch list */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {branches.map(branch => (
              <div key={branch.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <span className="font-medium text-sm">{branch.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({branch.code})</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(branch.id)}
                  disabled={removingId === branch.id}
                >
                  {removingId === branch.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
            {branches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No branches yet. Add one below.</p>
            )}
          </div>

          <Separator />

          {/* Add branch form */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Add New Branch</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Branch name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Input
                placeholder="Code"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                disabled={isAdding}
                className="w-20"
                maxLength={5}
              />
              <Button onClick={handleAdd} disabled={isAdding || !newName.trim() || !newCode.trim()} size="icon">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
