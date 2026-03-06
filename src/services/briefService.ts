import { getMockBriefById, mockBriefs } from '@/data/mockBriefs';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { type BriefRow, type ProfileRow, mapRowToBrief } from '@/lib/briefUtils';
import type { ImplementationBrief } from '@/types/brief';

interface LoadBriefOptions {
  isShellMode: boolean;
  workspaceId?: string;
}

interface LoadBriefsListOptions {
  isShellMode: boolean;
  workspaceId?: string;
}

interface UpdateBriefOptions {
  isShellMode: boolean;
}

const BRIEF_UPDATE_FIELD_MAP: Record<string, keyof ImplementationBrief> = {
  workspace_id: 'workspaceId',
  project_type_id: 'projectTypeId',
  current_version: 'currentVersion',
  success_criteria: 'successCriteria',
  risk_factors: 'riskFactors',
  intake_responses: 'intakeResponses',
  advisor_id: 'advisorId',
  advisor_notes: 'advisorNotes',
  discovery_date: 'discoveryDate',
  discovery_notes: 'discoveryNotes',
  client_review_started_at: 'clientReviewStartedAt',
  client_review_completed_at: 'clientReviewCompletedAt',
  field_sources: 'fieldSources',
  client_notes: 'clientNotes',
  locked_at: 'lockedAt',
  locked_by: 'lockedBy',
  owner_id: 'ownerId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

const MOCK_ADVISOR_NAME_MAP: Record<string, string> = {
  'mock-advisor-001': 'Alex Carter',
  'mock-advisor-002': 'Jordan Lee',
};

function applyShellBriefUpdates(
  brief: ImplementationBrief,
  updates: Record<string, any>
): ImplementationBrief {
  const next = { ...brief } as Record<string, any>;

  Object.entries(updates).forEach(([key, value]) => {
    const mappedKey = BRIEF_UPDATE_FIELD_MAP[key] ?? key;
    next[mappedKey] = value;
  });

  next.updatedAt = new Date().toISOString();

  return next as ImplementationBrief;
}

export async function loadBrief(
  briefId: string,
  options: LoadBriefOptions
): Promise<{ brief: ImplementationBrief | null; error?: string; notFound?: boolean }> {
  const { isShellMode, workspaceId } = options;

  try {
    if (isShellMode) {
      const brief = getMockBriefById(briefId) ?? null;

      if (!brief) {
        return { brief: null, notFound: true, error: 'Brief not found.' };
      }

      if (workspaceId && brief.workspaceId !== workspaceId) {
        return { brief: null, notFound: true, error: 'You do not have access to this brief.' };
      }

      return { brief };
    }

    const { data, error } = await supabase
      .from('implementation_briefs')
      .select('*')
      .eq('id', briefId)
      .maybeSingle();

    if (error) {
      return { brief: null, error: error.message };
    }

    if (!data) {
      return { brief: null, notFound: true, error: 'Brief not found.' };
    }

    const mappedBrief = mapRowToBrief(data as BriefRow);

    if (workspaceId && mappedBrief.workspaceId !== workspaceId) {
      return { brief: null, notFound: true, error: 'You do not have access to this brief.' };
    }

    return { brief: mappedBrief };
  } catch (error: any) {
    return {
      brief: null,
      error: error?.message ?? 'Unable to load the implementation brief.',
    };
  }
}

export async function loadBriefsList(
  options: LoadBriefsListOptions
): Promise<{ briefs: ImplementationBrief[]; error?: string }> {
  const { isShellMode, workspaceId } = options;

  try {
    if (isShellMode) {
      const briefs = workspaceId
        ? mockBriefs.filter((brief) => brief.workspaceId === workspaceId)
        : mockBriefs;

      return { briefs };
    }

    let query = supabase
      .from('implementation_briefs')
      .select('*')
      .order('updated_at', { ascending: false });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      return { briefs: [], error: error.message };
    }

    const briefs = (data ?? []).map((row) => mapRowToBrief(row as BriefRow));

    return { briefs };
  } catch (error: any) {
    return {
      briefs: [],
      error: error?.message ?? 'Unable to load implementation briefs.',
    };
  }
}

export async function updateBrief(
  briefId: string,
  updates: Record<string, any>,
  options: UpdateBriefOptions
): Promise<{ brief: ImplementationBrief | null; error?: string }> {
  const { isShellMode } = options;

  try {
    if (isShellMode) {
      const index = mockBriefs.findIndex((brief) => brief.id === briefId);

      if (index === -1) {
        return { brief: null, error: 'Brief not found.' };
      }

      const nextBrief = applyShellBriefUpdates(mockBriefs[index], updates);
      mockBriefs[index] = nextBrief;

      return { brief: nextBrief };
    }

    const { data, error } = await supabase
      .from('implementation_briefs')
      .update(updates as Database['public']['Tables']['implementation_briefs']['Update'])
      .eq('id', briefId)
      .select('*')
      .maybeSingle();

    if (error) {
      return { brief: null, error: error.message };
    }

    if (!data) {
      return { brief: null, error: 'Brief not found.' };
    }

    return { brief: mapRowToBrief(data as BriefRow) };
  } catch (error: any) {
    return {
      brief: null,
      error: error?.message ?? 'Unable to update implementation brief.',
    };
  }
}

export async function loadAdvisorName(advisorId: string | undefined): Promise<string> {
  if (!advisorId) return 'Unassigned';

  if (MOCK_ADVISOR_NAME_MAP[advisorId]) {
    return MOCK_ADVISOR_NAME_MAP[advisorId];
  }

  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', advisorId)
      .maybeSingle();

    const advisorProfile = profileData as Pick<ProfileRow, 'id' | 'full_name' | 'email'> | null;

    return advisorProfile?.full_name?.trim() || advisorProfile?.email?.trim() || advisorId;
  } catch {
    return advisorId;
  }
}
