import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Loader2, Send, Upload, FileText, MessageSquare, ListChecks, Activity, Eye,
  Scale, Vault, Package, ClipboardList, ChevronRight, Plus, X, CheckCircle, AlertTriangle,
  Shield, Users, DollarSign, FileCheck, BookOpen, Lock
} from 'lucide-react';
import type { Request, ShortlistEntry, FileRecord, ActivityEvent, Profile, FileCategory } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { mockProviders, mockPitchbooks, mockCriteriaSet, mockSelectionPack, mockGovernanceLog, mockEvidenceArtifacts } from '@/data/mockProviders';
import type { ProviderCardSummary, ProviderPitchbook, CompareProviderView, VerificationLevel } from '@/data/mockProviders';
import { mockRequests } from '@/data/mockData';

interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

const fileCategories: FileCategory[] = ['Brief', 'Security', 'SOW', 'Other'];

type Tab = 'overview' | 'criteria' | 'shortlist' | 'evidence' | 'messages' | 'files' | 'selection-pack' | 'governance' | 'activity';

const pitchbookTabs = [
  { id: 'summary', label: 'Summary', icon: Eye },
  { id: 'delivery', label: 'Delivery System', icon: Users },
  { id: 'proof', label: 'Proof', icon: FileCheck },
  { id: 'commercials', label: 'Commercials', icon: DollarSign },
  { id: 'risk', label: 'Risk & Controls', icon: AlertTriangle },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'references', label: 'References', icon: BookOpen },
];

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isOpsOrAdmin, isUiShellMode } = useAuth();
  const { toast } = useToast();

  // Initialize tab from URL query param
  const initialTab = (searchParams.get('tab') as Tab) || 'overview';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activities, setActivities] = useState<(ActivityEvent & { actor?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileCategory, setFileCategory] = useState<FileCategory>('Other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shortlist UI state
  const [selectedPitchbook, setSelectedPitchbook] = useState<ProviderPitchbook | null>(null);
  const [compareProviders, setCompareProviders] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [pitchbookTab, setPitchbookTab] = useState('summary');

  useEffect(() => {
    if (!id) return;

    // In UI shell mode, use mock data
    if (isUiShellMode) {
      const mockRequest = mockRequests.find(r => r.id === id) || mockRequests[0];
      setRequest(mockRequest);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const { data: reqData } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (reqData) setRequest(reqData as Request);

      const { data: convData } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', id)
        .maybeSingle();
      
      if (convData) {
        setConversationId(convData.id);
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true });
        
        if (msgData) {
          const userIds = [...new Set(msgData.map(m => m.sender_user_id))];
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          setMessages(msgData.map(m => ({ ...m, sender: profileMap.get(m.sender_user_id) as Profile | undefined })));
        }
      }

      const { data: shortlistData } = await supabase
        .from('shortlist_entries')
        .select('*, provider:providers(*)')
        .eq('request_id', id);
      if (shortlistData) setShortlist(shortlistData as ShortlistEntry[]);

      const { data: filesData } = await supabase.from('files').select('*').eq('request_id', id);
      if (filesData) setFiles(filesData as FileRecord[]);

      if (reqData) {
        const { data: activityData } = await supabase
          .from('activity_events')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: false });
        
        if (activityData) {
          const actorIds = [...new Set(activityData.filter(a => a.actor_user_id).map(a => a.actor_user_id!))];
          if (actorIds.length > 0) {
            const { data: actorProfiles } = await supabase.from('profiles').select('*').in('id', actorIds);
            const actorMap = new Map(actorProfiles?.map(p => [p.id, p]) || []);
            setActivities(activityData.map(a => ({ ...a, actor: a.actor_user_id ? actorMap.get(a.actor_user_id) as Profile | undefined : undefined })));
          } else {
            setActivities(activityData as (ActivityEvent & { actor?: Profile })[]);
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [id, isUiShellMode]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;
    setSending(true);
    
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      body: newMessage.trim(),
    });

    setNewMessage('');
    
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (msgData) {
      const userIds = [...new Set(msgData.map(m => m.sender_user_id))];
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setMessages(msgData.map(m => ({ ...m, sender: profileMap.get(m.sender_user_id) as Profile | undefined })));
    }
    
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;
    
    setUploading(true);
    try {
      const filePath = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('request-files').upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('request-files').getPublicUrl(filePath);

      await supabase.from('files').insert({
        request_id: id,
        uploader_user_id: user.id,
        filename: file.name,
        storage_url: urlData.publicUrl,
        category: fileCategory,
      });

      const { data: filesData } = await supabase.from('files').select('*').eq('request_id', id);
      if (filesData) setFiles(filesData as FileRecord[]);

      toast({ title: 'File uploaded', description: file.name });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatEventType = (type: string): string => {
    const labels: Record<string, string> = {
      'request_submitted': 'submitted this request',
      'request_updated': 'updated this request',
      'status_changed': 'changed the status',
      'shortlist_added': 'added a provider to shortlist',
      'file_uploaded': 'uploaded a file',
      'message_sent': 'sent a message',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const toggleCompare = (providerId: string) => {
    setCompareProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      }
      if (prev.length >= 4) {
        toast({ title: 'Compare limit', description: 'Maximum 4 providers can be compared', variant: 'destructive' });
        return prev;
      }
      return [...prev, providerId];
    });
  };

  const getVerificationBadge = (level: VerificationLevel) => {
    const styles: Record<VerificationLevel, string> = {
      'Provider-stated': 'bg-muted text-muted-foreground',
      'Documented': 'bg-blue-500/10 text-blue-500',
      'Reference-validated': 'bg-amber-500/10 text-amber-500',
      'Sablecrest-assessed': 'bg-emerald-500/10 text-emerald-500',
    };
    return <span className={cn("text-[9px] px-1.5 py-0.5 rounded", styles[level])}>{level}</span>;
  };

  const tabs: { id: Tab; label: string; icon: typeof Eye; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'criteria', label: 'Criteria & Weights', icon: Scale },
    { id: 'shortlist', label: 'Shortlist', icon: ListChecks, count: mockProviders.length },
    { id: 'evidence', label: 'Evidence Vault', icon: Vault },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
    { id: 'files', label: 'Files', icon: FileText, count: files.length },
    { id: 'selection-pack', label: 'Selection Pack', icon: Package },
    { id: 'governance', label: 'Governance', icon: ClipboardList },
    { id: 'activity', label: 'Activity', icon: Activity, count: activities.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-content">
        <EmptyState
          icon={FileText}
          title="Request not found"
          description="This request may have been deleted or you don't have access."
          action={{ label: 'Back to Requests', onClick: () => navigate('/requests') }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={request.title}
        actions={
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/requests')}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border">
        <StatusBadge status={request.status} variant="request" />
        {request.timeline_urgency && <StatusBadge status={request.timeline_urgency} variant="urgency" />}
        <span className="text-muted-foreground text-xs">·</span>
        <span className="text-muted-foreground text-xs">
          Updated {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="page-content animate-fade-in">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Desired Outcome</h3>
                <p className="text-sm text-foreground">{request.desired_outcome || 'Not specified'}</p>
              </div>
              {request.context && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Context</h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{request.context}</p>
                </div>
              )}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Scope Hypothesis</h3>
                <p className="text-sm text-muted-foreground italic">
                  Scope will be refined on scoping call. Initial hypothesis based on request details.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timeline</span>
                    <span className="text-foreground">{request.timeline_urgency || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sensitivity</span>
                    <span className="text-foreground">{request.sensitivity || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="text-foreground">{request.budget_band || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Criteria & Weights Tab */}
        {activeTab === 'criteria' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Selection Criteria</h3>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Criterion
                </Button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Criterion</th>
                    <th>Category</th>
                    <th>Weight</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCriteriaSet.criteria.map(criterion => (
                    <tr key={criterion.id}>
                      <td className="font-medium">{criterion.name}</td>
                      <td>
                        <Badge variant="outline" className="text-[10px]">{criterion.category}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${criterion.weight * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{criterion.weight}/10</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground text-xs">{criterion.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shortlist Tab with Compare + Pitchbook */}
        {activeTab === 'shortlist' && (
          <div className="space-y-4">
            {/* Provider List */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Curated Shortlist</h3>
                <span className="text-xs text-muted-foreground">{mockProviders.length} providers</span>
              </div>
              <div className="divide-y divide-border">
                {mockProviders.map(provider => (
                  <div key={provider.id} className="p-4 hover:bg-table-hover transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{provider.name}</span>
                          <Badge variant="outline" className="text-[10px]">{provider.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{provider.regions.join(', ')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{provider.fitSummary}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {provider.capabilities.slice(0, 5).map(cap => (
                            <span key={cap} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded">
                              {cap}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="ml-1 text-foreground">{provider.budgetBand}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timeline:</span>
                            <span className="ml-1 text-foreground">{provider.typicalTimeline}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Lead time:</span>
                            <span className="ml-1 text-foreground">{provider.leadTime}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <span className="ml-1 text-foreground">{provider.deliveryModel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className={cn(
                              "h-2 w-2 rounded-full",
                              provider.riskRating === 'Low' && "bg-emerald-500",
                              provider.riskRating === 'Medium' && "bg-amber-500",
                              provider.riskRating === 'High' && "bg-rose-500",
                            )} />
                            <span className="text-muted-foreground">{provider.riskRating} risk:</span>
                            <span className="text-foreground">{provider.riskReason}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Proof:</span>
                            <span className="ml-1 text-foreground">{provider.proofCount} projects</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">References:</span>
                            <span className={cn(
                              "ml-1",
                              provider.referenceAvailability === 'Yes' && "text-emerald-500",
                              provider.referenceAvailability === 'After NDA' && "text-amber-500",
                              provider.referenceAvailability === 'Limited' && "text-rose-500",
                            )}>{provider.referenceAvailability}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 text-[10px] px-2"
                          onClick={() => {
                            const pitchbook = mockPitchbooks[provider.id];
                            if (pitchbook) setSelectedPitchbook(pitchbook);
                          }}
                        >
                          Expand pitchbook
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                        <Button 
                          variant={compareProviders.includes(provider.id) ? "default" : "outline"}
                          size="sm" 
                          className="h-6 text-[10px] px-2"
                          onClick={() => toggleCompare(provider.id)}
                        >
                          {compareProviders.includes(provider.id) ? 'Added' : 'Add to Compare'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-primary">
                          Request Intro
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compare Tray */}
            {compareProviders.length >= 2 && (
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Compare ({compareProviders.length})</span>
                  <div className="flex gap-1">
                    {compareProviders.map(id => {
                      const p = mockProviders.find(p => p.id === id);
                      return p ? (
                        <Badge key={id} variant="secondary" className="text-[10px]">
                          {p.name}
                          <button 
                            className="ml-1 hover:text-destructive"
                            onClick={() => toggleCompare(id)}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCompareProviders([])}>
                    Clear
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={() => setShowCompare(true)}>
                    Compare Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence Vault Tab */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Evidence Artifacts</h3>
                <span className="text-xs text-muted-foreground">{mockEvidenceArtifacts.length} documents</span>
              </div>
              <div className="divide-y divide-border">
                {mockEvidenceArtifacts.map(artifact => (
                  <div key={artifact.id} className="px-4 py-3 flex items-center justify-between hover:bg-table-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">{artifact.name}</p>
                        <p className="text-xs text-muted-foreground">{artifact.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerificationBadge(artifact.verificationLevel)}
                      {artifact.ndaRequired && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500">
                          <Lock className="h-3 w-3" />
                          NDA
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Evidence Labels:</strong> Documents are labeled by verification level. 
                <span className="ml-2 px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px]">Provider-stated</span>
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px]">Documented</span>
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px]">Reference-validated</span>
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px]">Sablecrest-assessed</span>
              </p>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-card border border-border rounded-lg">
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-8">No messages yet.</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-medium">
                      {msg.sender?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{msg.sender?.email?.split('@')[0] || 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5">{msg.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[48px] text-xs resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button size="icon" className="h-12 w-12 shrink-0" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={fileCategory} onValueChange={(v) => setFileCategory(v as FileCategory)}>
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                Upload
              </Button>
            </div>
            <div className="bg-card border border-border rounded-lg">
              {files.length === 0 ? (
                <EmptyState icon={FileText} title="No files uploaded" description="Upload files to share documents with your team." />
              ) : (
                <div className="divide-y divide-border">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between px-4 py-3 hover:bg-table-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{file.filename}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-secondary rounded">{file.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Pack Tab */}
        {activeTab === 'selection-pack' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Selection Pack</h3>
                <p className="text-xs text-muted-foreground">Assemble and export your selection recommendation</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={mockSelectionPack.status === 'Draft' ? 'secondary' : 'default'}>
                  {mockSelectionPack.status}
                </Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Export PDF
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(mockSelectionPack.sections).map(([key, value]) => (
                <div key={key} className="bg-card border border-border rounded-lg p-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Governance Tab */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Governance Log</h3>
                <p className="text-xs text-muted-foreground">Weekly delivery oversight and status updates</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Entry
              </Button>
            </div>
            <div className="space-y-4">
              {mockGovernanceLog.entries.map(entry => (
                <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Week {entry.week}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px]",
                        entry.status === 'On Track' && "border-emerald-500 text-emerald-500",
                        entry.status === 'At Risk' && "border-amber-500 text-amber-500",
                        entry.status === 'Off Track' && "border-rose-500 text-rose-500",
                      )}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mb-3">{entry.summary}</p>
                  {entry.keyIssues.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Issues: </span>
                      <span className="text-xs text-foreground">{entry.keyIssues.join(', ')}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Next: </span>
                    <span className="text-xs text-foreground">{entry.nextActions.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-card border border-border rounded-lg">
            {activities.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" description="Actions on this request will be logged here." />
            ) : (
              <div className="divide-y divide-border">
                {activities.map(event => (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-medium">
                      {event.actor?.email?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs">
                        <span className="font-medium text-foreground">{event.actor?.email?.split('@')[0] || 'System'}</span>
                        <span className="text-muted-foreground"> {formatEventType(event.event_type)}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pitchbook Sheet */}
      <Sheet open={!!selectedPitchbook} onOpenChange={() => setSelectedPitchbook(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedPitchbook && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-base font-medium">
                  {mockProviders.find(p => p.id === selectedPitchbook.providerId)?.name} Pitchbook
                </SheetTitle>
              </SheetHeader>

              <Tabs value={pitchbookTab} onValueChange={setPitchbookTab}>
                <TabsList className="w-full justify-start overflow-x-auto mb-6">
                  {pitchbookTabs.map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                      <tab.icon className="h-3 w-3 mr-1" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.summary.verificationLevel)}</div>
                  <p className="text-sm text-foreground">{selectedPitchbook.summary.overview}</p>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Key Strengths</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPitchbook.summary.keyStrengths.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Ideal For</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPitchbook.summary.idealFor.map(s => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.deliverySystem.verificationLevel)}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Team Size</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.deliverySystem.teamSize}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Methodology</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.deliverySystem.methodology}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Delivery Approach</span>
                    <p className="text-sm text-foreground">{selectedPitchbook.deliverySystem.deliveryApproach}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Key Personnel</h4>
                    <div className="space-y-2">
                      {selectedPitchbook.deliverySystem.keyPersonnel.map((p, i) => (
                        <div key={i} className="bg-muted/50 rounded p-2">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.role} · {p.bio}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="proof" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.proof.verificationLevel)}</div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Case Studies</h4>
                    <div className="space-y-2">
                      {selectedPitchbook.proof.caseStudies.map((cs, i) => (
                        <div key={i} className="bg-muted/50 rounded p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">{cs.title}</p>
                            {cs.verified && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{cs.client}</p>
                          <p className="text-xs text-foreground mt-1">{cs.outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commercials" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.commercials.verificationLevel)}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Pricing Model</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.commercials.pricingModel}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Typical Engagement</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.commercials.typicalEngagement}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Payment Terms</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.commercials.paymentTerms}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.riskAndControls.verificationLevel)}</div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Insurances</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPitchbook.riskAndControls.insurances.map(i => (
                        <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPitchbook.riskAndControls.certifications.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Data Handling</span>
                    <p className="text-sm text-foreground">{selectedPitchbook.riskAndControls.dataHandling}</p>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.security.verificationLevel)}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Security Level</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.security.securityLevel}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Data Residency</span>
                      <p className="text-sm text-foreground">{selectedPitchbook.security.dataResidency}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Compliance</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPitchbook.security.compliance.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="references" className="space-y-4">
                  <div className="flex justify-end">{getVerificationBadge(selectedPitchbook.references.verificationLevel)}</div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className={selectedPitchbook.references.available ? 'text-emerald-500' : 'text-rose-500'}>
                      {selectedPitchbook.references.available ? 'Yes' : 'No'}
                    </span>
                    {selectedPitchbook.references.ndaRequired && (
                      <span className="flex items-center gap-1 text-amber-500 text-xs">
                        <Lock className="h-3 w-3" />
                        NDA Required
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedPitchbook.references.recentReferences.map((ref, i) => (
                      <div key={i} className="bg-muted/50 rounded p-3">
                        <p className="text-sm font-medium text-foreground">{ref.company}</p>
                        <p className="text-xs text-muted-foreground">{ref.contact} · {ref.project}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Compare Sheet */}
      <Sheet open={showCompare} onOpenChange={setShowCompare}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-base font-medium">Compare Providers</SheetTitle>
          </SheetHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Field</th>
                  {compareProviders.map(id => {
                    const p = mockProviders.find(p => p.id === id);
                    return (
                      <th key={id} className="text-left py-2 px-2 font-medium text-foreground min-w-[160px]">
                        {p?.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Budget Band', key: 'budgetBand' },
                  { label: 'Timeline', key: 'typicalTimeline' },
                  { label: 'Lead Time', key: 'leadTime' },
                  { label: 'Delivery Model', key: 'deliveryModel' },
                  { label: 'Engagement Type', key: 'engagementType' },
                  { label: 'Risk Rating', key: 'riskRating' },
                  { label: 'Risk Reason', key: 'riskReason' },
                  { label: 'Proof Count', key: 'proofCount' },
                  { label: 'References', key: 'referenceAvailability' },
                ].map(row => (
                  <tr key={row.key} className="border-b border-border">
                    <td className="py-2 pr-4 text-muted-foreground">{row.label}</td>
                    {compareProviders.map(id => {
                      const p = mockProviders.find(p => p.id === id);
                      return (
                        <td key={id} className="py-2 px-2 text-foreground">
                          {p ? String((p as any)[row.key]) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
