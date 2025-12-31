import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Send, Upload, FileText } from 'lucide-react';
import type { Request, ShortlistEntry, FileRecord, ActivityEvent, Profile, FileCategory } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender?: Profile;
}

const fileCategories: FileCategory[] = ['Brief', 'Security', 'SOW', 'Other'];

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isOpsOrAdmin } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
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
          // Fetch sender profiles separately
          const userIds = [...new Set(msgData.map(m => m.sender_user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          const messagesWithSenders = msgData.map(m => ({
            ...m,
            sender: profileMap.get(m.sender_user_id) as Profile | undefined
          }));
          setMessages(messagesWithSenders);
        }
      }

      const { data: shortlistData } = await supabase
        .from('shortlist_entries')
        .select('*, provider:providers(*)')
        .eq('request_id', id);
      if (shortlistData) setShortlist(shortlistData as ShortlistEntry[]);

      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('request_id', id);
      if (filesData) setFiles(filesData as FileRecord[]);

      // Fetch activity events
      if (reqData) {
        const { data: activityData } = await supabase
          .from('activity_events')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: false });
        
        if (activityData) {
          const actorIds = [...new Set(activityData.filter(a => a.actor_user_id).map(a => a.actor_user_id!))];
          if (actorIds.length > 0) {
            const { data: actorProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', actorIds);
            const actorMap = new Map(actorProfiles?.map(p => [p.id, p]) || []);
            const activitiesWithActors = activityData.map(a => ({
              ...a,
              actor: a.actor_user_id ? actorMap.get(a.actor_user_id) as Profile | undefined : undefined
            }));
            setActivities(activitiesWithActors);
          } else {
            setActivities(activityData as ActivityEvent[]);
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
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const messagesWithSenders = msgData.map(m => ({
        ...m,
        sender: profileMap.get(m.sender_user_id) as Profile | undefined
      }));
      setMessages(messagesWithSenders);
    }
    
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;
    
    setUploading(true);
    try {
      const filePath = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('request-files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('request-files')
        .getPublicUrl(filePath);

      await supabase.from('files').insert({
        request_id: id,
        uploader_user_id: user.id,
        filename: file.name,
        storage_url: urlData.publicUrl,
        category: fileCategory,
      });

      // Refresh files
      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('request_id', id);
      if (filesData) setFiles(filesData as FileRecord[]);

      toast({ title: 'File uploaded', description: file.name });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return <div className="p-6 text-muted-foreground">Request not found.</div>;
  }

  return (
    <div className="p-6">
      <Link to="/requests" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to requests
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{request.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={request.status} variant="request" />
            {request.timeline_urgency && (
              <StatusBadge status={request.timeline_urgency} variant="urgency" />
            )}
            <span className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shortlist">Shortlist ({shortlist.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Desired Outcome</h3>
              <p className="text-foreground mt-1">{request.desired_outcome || 'Not specified'}</p>
            </div>
            {request.context && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Context</h3>
                <p className="text-foreground mt-1">{request.context}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Sensitivity</h3>
                <p className="text-foreground mt-1">{request.sensitivity || 'Not set'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Budget</h3>
                <p className="text-foreground mt-1">{request.budget_band || 'Not set'}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shortlist">
          <div className="bg-card border border-border rounded-lg">
            {shortlist.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No providers on shortlist yet.
              </div>
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
                    <tr key={entry.id}>
                      <td className="font-medium">{entry.provider?.name}</td>
                      <td><StatusBadge status={entry.status} variant="shortlist" /></td>
                      <td>{entry.est_cost_band || '-'}</td>
                      <td className="text-muted-foreground">{entry.fit_notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium">
                        {(msg.sender as any)?.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{(msg.sender as any)?.email || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{msg.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[60px]"
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={fileCategory} onValueChange={(v) => setFileCategory(v as FileCategory)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload File
              </Button>
            </div>
            {files.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {files.map(file => (
                  <li key={file.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{file.filename}</span>
                    </div>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-background rounded">{file.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-card border border-border rounded-lg p-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map(event => (
                  <li key={event.id} className="flex items-start gap-3 p-2 border-b border-border last:border-0">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium">
                        {event.actor?.email?.[0]?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">{event.actor?.email || 'System'}</span>
                        <span className="text-muted-foreground"> {formatEventType(event.event_type)}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatEventType(type: string): string {
  const eventLabels: Record<string, string> = {
    'request_submitted': 'submitted this request',
    'request_updated': 'updated this request',
    'status_changed': 'changed the status',
    'shortlist_added': 'added a provider to shortlist',
    'file_uploaded': 'uploaded a file',
    'message_sent': 'sent a message',
  };
  return eventLabels[type] || type.replace(/_/g, ' ');
}
