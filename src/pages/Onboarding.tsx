import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineUrgency, SensitivityLevel, BudgetBand } from '@/types/database';

const steps = [
  { id: 1, title: 'Workspace', description: 'Set up your workspace' },
  { id: 2, title: 'Request', description: 'Describe your need' },
  { id: 3, title: 'Constraints', description: 'Timeline & budget' },
];

const timelineOptions: TimelineUrgency[] = ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Flexible'];
const sensitivityOptions: SensitivityLevel[] = ['Standard', 'Confidential', 'Highly Confidential'];
const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, refreshWorkspaces } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1 - Workspace
  const [workspaceName, setWorkspaceName] = useState('');

  // Step 2 - Request
  const [requestTitle, setRequestTitle] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [context, setContext] = useState('');

  // Step 3 - Constraints
  const [timelineUrgency, setTimelineUrgency] = useState<TimelineUrgency | ''>('');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel | ''>('');
  const [budgetBand, setBudgetBand] = useState<BudgetBand | ''>('');

  const canProceed = () => {
    switch (currentStep) {
      case 1: return workspaceName.trim().length >= 2;
      case 2: return requestTitle.trim().length >= 3 && desiredOutcome.trim().length >= 10;
      case 3: return timelineUrgency !== '' && sensitivity !== '';
      default: return false;
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !workspaceName.trim()) return;
    
    setLoading(true);
    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: workspaceName.trim() })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      await supabase.from('memberships').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
      });

      if (requestTitle.trim()) {
        await supabase.from('requests').insert({
          workspace_id: workspace.id,
          title: requestTitle.trim(),
          desired_outcome: desiredOutcome.trim() || null,
          context: context.trim() || null,
          timeline_urgency: (timelineUrgency as TimelineUrgency) || null,
          sensitivity: (sensitivity as SensitivityLevel) || null,
          budget_band: (budgetBand as BudgetBand) || null,
          status: 'Draft',
        });
      }

      await refreshWorkspaces();
      toast({ title: 'Draft saved', description: 'Your workspace and request draft have been saved.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !canProceed()) return;
    
    setLoading(true);
    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ name: workspaceName.trim() })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      await supabase.from('memberships').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'admin',
      });

      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
          workspace_id: workspace.id,
          title: requestTitle.trim(),
          desired_outcome: desiredOutcome.trim(),
          context: context.trim() || null,
          timeline_urgency: timelineUrgency as TimelineUrgency,
          sensitivity: sensitivity as SensitivityLevel,
          budget_band: (budgetBand as BudgetBand) || null,
          status: 'Submitted',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      await supabase.from('conversations').insert({ request_id: request.id });

      await supabase.from('activity_events').insert({
        workspace_id: workspace.id,
        request_id: request.id,
        actor_user_id: user.id,
        event_type: 'request_submitted',
        event_payload: { title: requestTitle },
      });

      await refreshWorkspaces();
      toast({ title: 'Request submitted', description: 'Your workspace has been created and request submitted.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[10px]">S</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Sablecrest Ops</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Get Started</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create your workspace and submit your first request.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded",
                currentStep === step.id && 'bg-secondary'
              )}>
                <div className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium',
                  currentStep === step.id && 'bg-foreground text-background',
                  currentStep > step.id && 'bg-success text-success-foreground',
                  currentStep < step.id && 'bg-muted text-muted-foreground'
                )}>
                  {currentStep > step.id ? <Check className="h-2.5 w-2.5" /> : step.id}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg p-5">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <Label htmlFor="workspaceName" className="text-xs">Workspace name *</Label>
                    <Input
                      id="workspaceName"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      className="mt-1 h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Your organization's private workspace.</p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <Label htmlFor="requestTitle" className="text-xs">Request title *</Label>
                    <Input
                      id="requestTitle"
                      value={requestTitle}
                      onChange={(e) => setRequestTitle(e.target.value)}
                      placeholder="e.g., Enterprise CRM Implementation"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="desiredOutcome" className="text-xs">Desired outcome *</Label>
                    <Textarea
                      id="desiredOutcome"
                      value={desiredOutcome}
                      onChange={(e) => setDesiredOutcome(e.target.value)}
                      placeholder="What do you want to achieve?"
                      className="mt-1 min-h-[80px] text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="context" className="text-xs">Additional context</Label>
                    <Textarea
                      id="context"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Background, constraints..."
                      className="mt-1 min-h-[60px] text-xs"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <Label className="text-xs">Timeline urgency *</Label>
                    <Select value={timelineUrgency} onValueChange={(v) => setTimelineUrgency(v as TimelineUrgency)}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Select timeline..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timelineOptions.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sensitivity level *</Label>
                    <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as SensitivityLevel)}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Select sensitivity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sensitivityOptions.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Budget band</Label>
                    <Select value={budgetBand} onValueChange={(v) => setBudgetBand(v as BudgetBand)}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Select budget..." />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetOptions.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div>
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentStep(currentStep - 1)}>
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {currentStep >= 2 && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSaveDraft} disabled={loading || !workspaceName.trim()}>
                      Save Draft
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button size="sm" className="h-7 text-xs" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                      Continue
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={loading || !canProceed()}>
                      {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Submit Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-6">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Workspace</p>
                  <p className="text-xs font-medium text-foreground">{workspaceName || 'Untitled'}</p>
                </div>
                {(requestTitle || currentStep >= 2) && (
                  <>
                    <div className="border-t border-border pt-3">
                      <p className="text-[10px] text-muted-foreground">Request</p>
                      <p className="text-xs font-medium text-foreground">{requestTitle || 'Untitled'}</p>
                    </div>
                    {desiredOutcome && (
                      <div>
                        <p className="text-[10px] text-muted-foreground">Outcome</p>
                        <p className="text-xs text-foreground line-clamp-2">{desiredOutcome}</p>
                      </div>
                    )}
                  </>
                )}
                {(timelineUrgency || sensitivity || currentStep >= 3) && (
                  <div className="border-t border-border pt-3 space-y-1">
                    {timelineUrgency && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Timeline</span>
                        <span className="text-foreground">{timelineUrgency}</span>
                      </div>
                    )}
                    {sensitivity && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Sensitivity</span>
                        <span className="text-foreground">{sensitivity}</span>
                      </div>
                    )}
                    {budgetBand && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="text-foreground">{budgetBand}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}