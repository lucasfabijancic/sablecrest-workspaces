import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Send, Upload, FileText, MessageSquare, ListChecks, Activity, Eye } from 'lucide-react';
import type { Request, ShortlistEntry, FileRecord, ActivityEvent, Profile, FileCategory } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

const fileCategories: FileCategory[] = ['Brief', 'Security', 'SOW', 'Other'];

type Tab = 'overview' | 'shortlist' | 'messages' | 'files' | 'activity';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isOpsOrAdmin } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
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

  useEffect(() => {
    if (!id) return;

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
  }, [id]);

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

  const tabs: { id: Tab; label: string; icon: typeof Eye; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'shortlist', label: 'Shortlist', icon: ListChecks, count: shortlist.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
    { id: 'files', label: 'Files', icon: FileText, count: files.length },
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
      <div className="border-b border-border px-6">
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
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

        {activeTab === 'shortlist' && (
          <div className="bg-card border border-border rounded-lg">
            {shortlist.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No providers shortlisted"
                description="Providers will appear here once they've been added to the shortlist."
              />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Est. Cost</th>
                    <th>Fit Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlist.map(entry => (
                    <tr key={entry.id} className="cursor-default">
                      <td className="font-medium">{entry.provider?.name}</td>
                      <td><StatusBadge status={entry.status} variant="shortlist" /></td>
                      <td className="text-muted-foreground">{entry.est_cost_band || '—'}</td>
                      <td className="text-muted-foreground max-w-xs truncate">{entry.fit_notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

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
    </div>
  );
}