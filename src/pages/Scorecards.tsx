import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Scale, 
  GripVertical, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: '1-5' | '1-10';
  guidance: string;
}

interface Scorecard {
  id: string;
  name: string;
  domain: string;
  status: 'Draft' | 'Active' | 'Archived';
  criteria: Criterion[];
  updatedAt: string;
}

// Mock scorecards
const initialScorecards: Scorecard[] = [
  {
    id: 'sc-1',
    name: 'Cloud Migration Assessment',
    domain: 'Infrastructure',
    status: 'Active',
    criteria: [
      { id: 'c1', name: 'Technical Expertise', description: 'Deep expertise in cloud platforms', weight: 25, scale: '1-5', guidance: '5 = Multi-cloud certified, extensive migration experience' },
      { id: 'c2', name: 'Security Posture', description: 'Security certifications and practices', weight: 20, scale: '1-5', guidance: '5 = SOC2 Type II, ISO 27001, zero breaches' },
      { id: 'c3', name: 'Delivery Track Record', description: 'Successful project completions', weight: 30, scale: '1-5', guidance: '5 = 95%+ on-time, on-budget delivery' },
      { id: 'c4', name: 'Cultural Fit', description: 'Alignment with client values', weight: 15, scale: '1-5', guidance: '5 = Proactive communication, shared values' },
      { id: 'c5', name: 'Pricing Competitiveness', description: 'Value for investment', weight: 10, scale: '1-5', guidance: '5 = Best-in-class value, transparent pricing' },
    ],
    updatedAt: '2024-01-15',
  },
  {
    id: 'sc-2',
    name: 'Security Vendor Evaluation',
    domain: 'Security',
    status: 'Draft',
    criteria: [
      { id: 'c1', name: 'Compliance Coverage', description: 'Regulatory compliance support', weight: 35, scale: '1-10', guidance: '10 = Full SOC2, HIPAA, PCI-DSS coverage' },
      { id: 'c2', name: 'Response Time SLA', description: 'Incident response capabilities', weight: 25, scale: '1-10', guidance: '10 = < 15 min response, 24/7 coverage' },
      { id: 'c3', name: 'Integration Depth', description: 'Integration with existing tools', weight: 20, scale: '1-10', guidance: '10 = Native integrations, API-first' },
      { id: 'c4', name: 'Reporting Quality', description: 'Audit-ready reporting', weight: 20, scale: '1-10', guidance: '10 = Real-time dashboards, executive summaries' },
    ],
    updatedAt: '2024-01-10',
  },
];

export default function Scorecards() {
  const [scorecards, setScorecards] = useState<Scorecard[]>(initialScorecards);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScorecard, setEditingScorecard] = useState<Scorecard | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValidWeight = totalWeight === 100;

  const handleAddCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: `c-${Date.now()}`,
        name: '',
        description: '',
        weight: 0,
        scale: '1-5',
        guidance: '',
      },
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleUpdateCriterion = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleMoveCriterion = (index: number, direction: 'up' | 'down') => {
    const newCriteria = [...criteria];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= criteria.length) return;
    [newCriteria[index], newCriteria[targetIndex]] = [newCriteria[targetIndex], newCriteria[index]];
    setCriteria(newCriteria);
  };

  const handleSave = () => {
    if (!name || !isValidWeight) return;

    const newScorecard: Scorecard = {
      id: editingScorecard?.id || `sc-${Date.now()}`,
      name,
      domain,
      status: 'Draft',
      criteria,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (editingScorecard) {
      setScorecards(scorecards.map(s => s.id === editingScorecard.id ? newScorecard : s));
    } else {
      setScorecards([...scorecards, newScorecard]);
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (scorecard: Scorecard) => {
    setEditingScorecard(scorecard);
    setName(scorecard.name);
    setDomain(scorecard.domain);
    setCriteria(scorecard.criteria);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setDomain('');
    setCriteria([]);
    setEditingScorecard(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Scorecards" 
        description="Criteria & Weights library for vendor evaluation"
      >
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scorecard
        </Button>
      </PageHeader>

      <div className="page-content">
        {scorecards.length === 0 ? (
          <div className="border border-border rounded-sm">
            <EmptyState
              icon={Scale}
              title="No scorecards yet"
              description="Create your first scorecard to standardize vendor evaluation"
              action={
                <Button size="sm" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scorecard
                </Button>
              }
            />
          </div>
        ) : (
          <div className="border border-border rounded-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecards.map((scorecard) => (
                  <TableRow key={scorecard.id}>
                    <TableCell>
                      <span className="font-medium text-foreground">{scorecard.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{scorecard.domain}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{scorecard.criteria.length} criteria</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-sm",
                        scorecard.status === 'Active' && "bg-success/10 text-success",
                        scorecard.status === 'Draft' && "bg-muted text-muted-foreground",
                        scorecard.status === 'Archived' && "bg-muted text-muted-foreground/70"
                      )}>
                        {scorecard.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{scorecard.updatedAt}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(scorecard)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingScorecard ? 'Edit Scorecard' : 'Create Scorecard'}</DialogTitle>
            <DialogDescription>
              Define evaluation criteria with weights. Total weight must equal 100.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Scorecard Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Cloud Migration Assessment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="e.g., Infrastructure, Security, Data"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
            </div>

            {/* Criteria Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Criteria</Label>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-sm flex items-center gap-1",
                    isValidWeight ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  )}>
                    {isValidWeight ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    Weight: {totalWeight}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {criteria.map((criterion, index) => (
                  <div key={criterion.id} className="border border-border rounded-sm p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 pt-2">
                        <button 
                          onClick={() => handleMoveCriterion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded-sm disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleMoveCriterion(index, 'down')}
                          disabled={index === criteria.length - 1}
                          className="p-1 hover:bg-muted rounded-sm disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="flex-1 grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Criterion name"
                            value={criterion.name}
                            onChange={(e) => handleUpdateCriterion(criterion.id, 'name', e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Weight"
                              min={0}
                              max={100}
                              value={criterion.weight || ''}
                              onChange={(e) => handleUpdateCriterion(criterion.id, 'weight', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <Select
                              value={criterion.scale}
                              onValueChange={(value) => handleUpdateCriterion(criterion.id, 'scale', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-5">1-5</SelectItem>
                                <SelectItem value="1-10">1-10</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Input
                          placeholder="Short description"
                          value={criterion.description}
                          onChange={(e) => handleUpdateCriterion(criterion.id, 'description', e.target.value)}
                        />
                        <Textarea
                          placeholder="Guidance: What does a top score look like?"
                          value={criterion.guidance}
                          onChange={(e) => handleUpdateCriterion(criterion.id, 'guidance', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <button 
                        onClick={() => handleRemoveCriterion(criterion.id)}
                        className="p-2 hover:bg-destructive/10 rounded-sm text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={handleAddCriterion} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Criterion
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name || !isValidWeight || criteria.length === 0}>
              {editingScorecard ? 'Save Changes' : 'Create Scorecard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
