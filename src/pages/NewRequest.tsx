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
import { Loader2, Check, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineUrgency, SensitivityLevel, BudgetBand } from '@/types/database';
import { Link } from 'react-router-dom';

const steps = [
  { id: 1, title: 'Request', description: 'Describe your need' },
  { id: 2, title: 'Constraints', description: 'Timeline & budget' },
  { id: 3, title: 'Review', description: 'Confirm and submit' },
];

const timelineOptions: TimelineUrgency[] = ['Immediate', 'Within 2 weeks', 'Within 1 month', 'Within 3 months', 'Flexible'];
const sensitivityOptions: SensitivityLevel[] = ['Standard', 'Confidential', 'Highly Confidential'];
const budgetOptions: BudgetBand[] = ['Under $10K', '$10K-$50K', '$50K-$150K', '$150K-$500K', 'Over $500K'];

export default function NewRequest() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, currentWorkspace } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 1 - Request
  const [requestTitle, setRequestTitle] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [context, setContext] = useState('');

  // Step 2 - Constraints
  const [timelineUrgency, setTimelineUrgency] = useState<TimelineUrgency | ''>('');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel | ''>('');
  const [budgetBand, setBudgetBand] = useState<BudgetBand | ''>('');

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return requestTitle.trim().length >= 3 && desiredOutcome.trim().length >= 10;
      case 2:
        return timelineUrgency !== '' && sensitivity !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !currentWorkspace || !requestTitle.trim()) return;
    
    setLoading(true);
    try {
      await supabase.from('requests').insert({
        workspace_id: currentWorkspace.id,
        title: requestTitle.trim(),
        desired_outcome: desiredOutcome.trim() || null,
        context: context.trim() || null,
        timeline_urgency: (timelineUrgency as TimelineUrgency) || null,
        sensitivity: (sensitivity as SensitivityLevel) || null,
        budget_band: (budgetBand as BudgetBand) || null,
        status: 'Draft',
      });

      toast({
        title: 'Draft saved',
        description: 'Your request draft has been saved.',
      });
      navigate('/requests');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspace || !canProceed()) return;
    
    setLoading(true);
    try {
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
          workspace_id: currentWorkspace.id,
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

      // Create conversation for the request
      await supabase.from('conversations').insert({
        request_id: request.id,
      });

      // Log activity
      await supabase.from('activity_events').insert({
        workspace_id: currentWorkspace.id,
        request_id: request.id,
        actor_user_id: user.id,
        event_type: 'request_submitted',
        event_payload: { title: requestTitle },
      });

      toast({
        title: 'Request submitted',
        description: 'Your request has been submitted successfully.',
      });
      navigate(`/requests/${request.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Please select a workspace first.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/requests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to requests
      </Link>

      <h1 className="text-xl font-semibold text-foreground mb-2">New Request</h1>
      <p className="text-muted-foreground mb-6">Create a new request in {currentWorkspace.name}</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md',
                currentStep === step.id && 'bg-primary/10',
                currentStep > step.id && 'text-success'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                  currentStep === step.id && 'bg-primary text-primary-foreground',
                  currentStep > step.id && 'bg-success text-success-foreground',
                  currentStep < step.id && 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? <Check className="h-3 w-3" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  currentStep === step.id && 'text-foreground',
                  currentStep !== step.id && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg p-6">
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label htmlFor="requestTitle">Request title *</Label>
                  <Input
                    id="requestTitle"
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder="e.g., Enterprise CRM Implementation"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="desiredOutcome">Desired outcome *</Label>
                  <Textarea
                    id="desiredOutcome"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="What do you want to achieve? Be specific about success criteria..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="context">Additional context (optional)</Label>
                  <Textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Background information, constraints, stakeholders..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <Label>Timeline urgency *</Label>
                  <Select value={timelineUrgency} onValueChange={(v) => setTimelineUrgency(v as TimelineUrgency)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select timeline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {timelineOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sensitivity level *</Label>
                  <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as SensitivityLevel)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select sensitivity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sensitivityOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Budget band (optional)</Label>
                  <Select value={budgetBand} onValueChange={(v) => setBudgetBand(v as BudgetBand)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget range..." />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-medium text-foreground">Review your request</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Title</span>
                    <span className="text-foreground font-medium">{requestTitle}</span>
                  </div>
                  <div className="py-2 border-b border-border">
                    <span className="text-muted-foreground block mb-1">Desired Outcome</span>
                    <span className="text-foreground">{desiredOutcome}</span>
                  </div>
                  {context && (
                    <div className="py-2 border-b border-border">
                      <span className="text-muted-foreground block mb-1">Context</span>
                      <span className="text-foreground">{context}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Timeline</span>
                    <span className="text-foreground">{timelineUrgency}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Sensitivity</span>
                    <span className="text-foreground">{sensitivity}</span>
                  </div>
                  {budgetBand && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="text-foreground">{budgetBand}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep >= 1 && (
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={loading || !requestTitle.trim()}
                  >
                    Save Draft
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !canProceed()}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Preview</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Request</p>
                <p className="text-sm font-medium text-foreground">
                  {requestTitle || 'Untitled request'}
                </p>
              </div>

              {desiredOutcome && (
                <div>
                  <p className="text-xs text-muted-foreground">Desired outcome</p>
                  <p className="text-sm text-foreground line-clamp-3">{desiredOutcome}</p>
                </div>
              )}

              {(timelineUrgency || sensitivity || currentStep >= 2) && (
                <div className="border-t border-border pt-4 space-y-2">
                  {timelineUrgency && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Timeline</span>
                      <span className="text-foreground">{timelineUrgency}</span>
                    </div>
                  )}
                  {sensitivity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sensitivity</span>
                      <span className="text-foreground">{sensitivity}</span>
                    </div>
                  )}
                  {budgetBand && (
                    <div className="flex items-center justify-between text-sm">
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
  );
}
