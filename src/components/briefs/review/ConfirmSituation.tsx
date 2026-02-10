import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, CircleHelp, FileText, PencilLine } from 'lucide-react';
import type { AECProjectType } from '@/data/aecProjectTypes';
import type { BusinessContext, FieldSource, ImplementationBrief } from '@/types/brief';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ConfirmSituationProps {
  brief: ImplementationBrief;
  projectType: AECProjectType | null;
  onUpdate: (updates: Partial<ImplementationBrief>) => void;
  onConfirmField: (fieldPath: string) => void;
}

type BusinessFieldKey = keyof BusinessContext;

const PROJECT_TYPE_NOTE_PATH = 'projectType.concern';

const BUSINESS_FIELDS: Array<{ key: BusinessFieldKey; label: string; multiline?: boolean }> = [
  { key: 'companyName', label: 'Company' },
  { key: 'companySize', label: 'Size' },
  { key: 'industry', label: 'Segment' },
  { key: 'currentState', label: 'Current State', multiline: true },
  { key: 'desiredOutcome', label: 'Desired Outcome', multiline: true },
  { key: 'keyStakeholders', label: 'Key Stakeholders', multiline: true },
  { key: 'decisionTimeline', label: 'Decision Timeline' },
];

const toFieldPath = (fieldKey: BusinessFieldKey) => `businessContext.${fieldKey}`;

const toEditableValue = (value: string | null | undefined): string => value ?? '';

export default function ConfirmSituation({
  brief,
  projectType,
  onUpdate,
  onConfirmField,
}: ConfirmSituationProps) {
  const [projectTypeMatches, setProjectTypeMatches] = useState(true);
  const [projectTypeConcern, setProjectTypeConcern] = useState('');

  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [manualEditOpen, setManualEditOpen] = useState<Record<string, boolean>>({});
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});

  const [confirmationSignals, setConfirmationSignals] = useState<Record<string, boolean>>({});

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const seenFieldRef = useRef<Record<string, boolean>>({});
  const latestBriefRef = useRef(brief);
  const manualEditOpenRef = useRef(manualEditOpen);

  useEffect(() => {
    latestBriefRef.current = brief;
  }, [brief]);

  useEffect(() => {
    manualEditOpenRef.current = manualEditOpen;
  }, [manualEditOpen]);

  useEffect(() => {
    const nextFieldDrafts: Record<string, string> = {};
    BUSINESS_FIELDS.forEach((field) => {
      const path = toFieldPath(field.key);
      nextFieldDrafts[path] = toEditableValue(brief.businessContext[field.key]);
    });

    const nextNotes = { ...(brief.clientNotes ?? {}) };
    const existingProjectTypeConcern = (nextNotes[PROJECT_TYPE_NOTE_PATH] ?? '').trim();

    setFieldDrafts(nextFieldDrafts);
    setNoteDrafts(nextNotes);
    setProjectTypeConcern(existingProjectTypeConcern);
    setProjectTypeMatches(existingProjectTypeConcern.length === 0);
    setManualEditOpen({});
    setNoteOpen({});
    setConfirmationSignals({});
    seenFieldRef.current = {};
  }, [brief.id]);

  const hasAnyFieldSourceData = useMemo(
    () => Boolean(brief.fieldSources && Object.keys(brief.fieldSources).length > 0),
    [brief.fieldSources]
  );

  const getSourceForField = (fieldPath: string, hasValue: boolean): FieldSource => {
    const explicitSource = brief.fieldSources?.[fieldPath];

    if (explicitSource) {
      return explicitSource;
    }

    if (!hasAnyFieldSourceData && hasValue) {
      return {
        source: 'advisor',
        confirmedByClient: true,
        markedForClientInput: false,
      };
    }

    return {
      source: 'advisor',
      confirmedByClient: false,
      markedForClientInput: false,
    };
  };

  const sendConfirmSignal = (fieldPath: string) => {
    if (confirmationSignals[fieldPath]) {
      return;
    }

    setConfirmationSignals((previous) => ({
      ...previous,
      [fieldPath]: true,
    }));

    onConfirmField(fieldPath);
  };

  const updateClientNote = (fieldPath: string, value: string) => {
    const nextNotes = { ...(brief.clientNotes ?? {}) };
    const trimmed = value.trim();

    if (trimmed.length > 0) {
      nextNotes[fieldPath] = trimmed;
    } else {
      delete nextNotes[fieldPath];
    }

    onUpdate({ clientNotes: nextNotes });
  };

  const applyFieldUpdate = (
    fieldKey: BusinessFieldKey,
    fieldPath: string,
    nextValue: string,
    options: {
      markSourceAsClient: boolean;
      clearMarkedForInput?: boolean;
      sendConfirmation?: boolean;
    }
  ) => {
    const previousValue = toEditableValue(brief.businessContext[fieldKey]);
    const hasNextValue = nextValue.trim().length > 0;

    const nextBusinessContext: BusinessContext = {
      ...brief.businessContext,
      [fieldKey]: nextValue,
    };

    const existingSource = getSourceForField(fieldPath, previousValue.trim().length > 0);

    const nextFieldSource: FieldSource = {
      ...existingSource,
      source: options.markSourceAsClient ? 'client' : existingSource.source,
      confirmedByClient: true,
      confirmedAt: new Date().toISOString(),
      markedForClientInput:
        (options.clearMarkedForInput ?? true) ? false : existingSource.markedForClientInput,
    };

    const nextFieldSources = {
      ...(brief.fieldSources ?? {}),
      [fieldPath]: nextFieldSource,
    };

    onUpdate({
      businessContext: nextBusinessContext,
      fieldSources: nextFieldSources,
    });

    if (hasNextValue && options.sendConfirmation !== false) {
      sendConfirmSignal(fieldPath);
    }
  };

  const confirmFieldWithoutEditing = (fieldKey: BusinessFieldKey, fieldPath: string) => {
    const currentValue = toEditableValue(brief.businessContext[fieldKey]);
    const hasValue = currentValue.trim().length > 0;

    if (!hasValue) {
      return;
    }

    const existingSource = getSourceForField(fieldPath, hasValue);

    const nextFieldSource: FieldSource = {
      ...existingSource,
      confirmedByClient: true,
      confirmedAt: new Date().toISOString(),
      markedForClientInput: false,
    };

    const nextFieldSources = {
      ...(brief.fieldSources ?? {}),
      [fieldPath]: nextFieldSource,
    };

    onUpdate({ fieldSources: nextFieldSources });

    if (hasValue) {
      sendConfirmSignal(fieldPath);
    }
  };

  const handleFieldConfirm = (fieldKey: BusinessFieldKey) => {
    const fieldPath = toFieldPath(fieldKey);
    const draftValue = toEditableValue(fieldDrafts[fieldPath]);
    const liveValue = toEditableValue(brief.businessContext[fieldKey]);
    const source = getSourceForField(fieldPath, liveValue.trim().length > 0);
    const isRequiredAndStillEmpty =
      source.markedForClientInput &&
      draftValue.trim().length === 0 &&
      liveValue.trim().length === 0;

    if (isRequiredAndStillEmpty) {
      return;
    }

    const changed = draftValue !== liveValue;

    if (changed) {
      applyFieldUpdate(fieldKey, fieldPath, draftValue, {
        markSourceAsClient: true,
      });
    } else {
      confirmFieldWithoutEditing(fieldKey, fieldPath);
    }

    setManualEditOpen((previous) => ({
      ...previous,
      [fieldPath]: false,
    }));
  };

  const syncDraftFromLiveValue = (fieldKey: BusinessFieldKey) => {
    const fieldPath = toFieldPath(fieldKey);
    setFieldDrafts((previous) => ({
      ...previous,
      [fieldPath]: toEditableValue(brief.businessContext[fieldKey]),
    }));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const fieldPath = element.dataset.fieldPath;

          if (!fieldPath) {
            return;
          }

          if (entry.isIntersecting) {
            seenFieldRef.current[fieldPath] = true;
            return;
          }

          if (!seenFieldRef.current[fieldPath]) {
            return;
          }

          if (manualEditOpenRef.current[fieldPath]) {
            return;
          }

          if (confirmationSignals[fieldPath]) {
            return;
          }

          const fieldKey = fieldPath.replace('businessContext.', '') as BusinessFieldKey;
          const currentValue = toEditableValue(latestBriefRef.current.businessContext[fieldKey]);

          if (currentValue.trim().length === 0) {
            return;
          }

          confirmFieldWithoutEditing(fieldKey, fieldPath);
        });
      },
      {
        root: null,
        threshold: 0.2,
      }
    );

    BUSINESS_FIELDS.forEach((field) => {
      const fieldPath = toFieldPath(field.key);
      const node = fieldRefs.current[fieldPath];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [confirmationSignals, brief.businessContext]);

  const handleProjectTypeYes = () => {
    setProjectTypeMatches(true);
    setProjectTypeConcern('');
    updateClientNote(PROJECT_TYPE_NOTE_PATH, '');
    sendConfirmSignal('projectType');
  };

  const handleProjectTypeNotQuite = () => {
    setProjectTypeMatches(false);
  };

  const saveProjectTypeConcern = () => {
    updateClientNote(PROJECT_TYPE_NOTE_PATH, projectTypeConcern);
    sendConfirmSignal('projectType');
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide">Confirm Your Situation</p>
          </div>
          <CardTitle className="text-xl">Project Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="space-y-3 rounded-md border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Project Type</p>
              <p className="text-base font-medium text-foreground">
                {projectType?.name || 'Project type not identified'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
              <p className="text-base text-foreground">{projectType?.category || '—'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap text-base text-foreground">{projectType?.description || '—'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Does this match your understanding?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={projectTypeMatches ? 'default' : 'outline'}
                onClick={handleProjectTypeYes}
              >
                Yes, this is correct
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!projectTypeMatches ? 'default' : 'outline'}
                onClick={handleProjectTypeNotQuite}
              >
                Not quite
              </Button>
            </div>

            {!projectTypeMatches && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Tell us what is different
                </Label>
                <Textarea
                  value={projectTypeConcern}
                  onChange={(event) => setProjectTypeConcern(event.target.value)}
                  onBlur={saveProjectTypeConcern}
                  placeholder="Describe how your situation differs so your advisor can adjust the brief."
                  className="min-h-[90px]"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-xl">Business Context</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {BUSINESS_FIELDS.map((field) => {
            const fieldPath = toFieldPath(field.key);
            const fieldValue = toEditableValue(brief.businessContext[field.key]);
            const hasValue = fieldValue.trim().length > 0;
            const source = getSourceForField(fieldPath, hasValue);
            const isMarkedForClientInput = source.markedForClientInput;
            const isManualEditOpen = Boolean(manualEditOpen[fieldPath]);
            const isClientNoteOpen = Boolean(noteOpen[fieldPath]);
            const hasClientNote = Boolean((brief.clientNotes?.[fieldPath] ?? '').trim());

            const isReadOnlyConfirmed = hasValue && !isMarkedForClientInput;
            const isSuggestedEditable = hasValue && isMarkedForClientInput;
            const isEmptyAndRequired = !hasValue && isMarkedForClientInput;
            const isEmptyAndOptional = !hasValue && !isMarkedForClientInput;

            const shouldRenderInput = isSuggestedEditable || isEmptyAndRequired || isManualEditOpen;

            const inputValue = toEditableValue(fieldDrafts[fieldPath] ?? fieldValue);

            return (
              <div
                key={fieldPath}
                ref={(node) => {
                  fieldRefs.current[fieldPath] = node;
                }}
                data-field-path={fieldPath}
                className={cn(
                  'space-y-3 rounded-md border p-4',
                  isEmptyAndRequired && 'border-destructive/50 bg-destructive/5',
                  isSuggestedEditable && 'border-warning/50 bg-warning/5',
                  (isReadOnlyConfirmed || isEmptyAndOptional || isManualEditOpen) && 'border-border/70 bg-card'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {field.label}
                      {isEmptyAndRequired && <span className="ml-1 text-destructive">*</span>}
                    </p>

                    {isReadOnlyConfirmed && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirmed
                      </div>
                    )}

                    {isSuggestedEditable && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-warning">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Please review
                      </div>
                    )}

                    {isEmptyAndRequired && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-destructive">
                        <CircleHelp className="h-3.5 w-3.5" />
                        Your advisor needs this information.
                      </div>
                    )}

                    {isEmptyAndOptional && (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isReadOnlyConfirmed && !isManualEditOpen && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setManualEditOpen((previous) => ({
                            ...previous,
                            [fieldPath]: true,
                          }));
                          setFieldDrafts((previous) => ({
                            ...previous,
                            [fieldPath]: fieldValue,
                          }));
                        }}
                      >
                        <PencilLine className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}

                    {isEmptyAndOptional && !isManualEditOpen && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          setManualEditOpen((previous) => ({
                            ...previous,
                            [fieldPath]: true,
                          }));
                          setFieldDrafts((previous) => ({
                            ...previous,
                            [fieldPath]: '',
                          }));
                        }}
                      >
                        Add
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setNoteOpen((previous) => ({
                          ...previous,
                          [fieldPath]: true,
                        }));
                        setNoteDrafts((previous) => ({
                          ...previous,
                          [fieldPath]: previous[fieldPath] ?? brief.clientNotes?.[fieldPath] ?? '',
                        }));
                      }}
                    >
                      {hasClientNote || isClientNoteOpen ? 'Edit note' : 'Add a note'}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleFieldConfirm(field.key)}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>

                {shouldRenderInput ? (
                  <div className="space-y-2">
                    {field.multiline ? (
                      <Textarea
                        value={inputValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFieldDrafts((previous) => ({
                            ...previous,
                            [fieldPath]: value,
                          }));
                        }}
                        onBlur={() => {
                          if (!isManualEditOpen) {
                            handleFieldConfirm(field.key);
                          }
                        }}
                        className={cn('min-h-[120px]', isEmptyAndRequired && 'border-destructive')}
                        placeholder={isEmptyAndRequired ? 'Required: please provide this information.' : undefined}
                      />
                    ) : (
                      <Input
                        value={inputValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFieldDrafts((previous) => ({
                            ...previous,
                            [fieldPath]: value,
                          }));
                        }}
                        onBlur={() => {
                          if (!isManualEditOpen) {
                            handleFieldConfirm(field.key);
                          }
                        }}
                        className={cn(isEmptyAndRequired && 'border-destructive')}
                        placeholder={isEmptyAndRequired ? 'Required' : undefined}
                      />
                    )}

                    {isManualEditOpen && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleFieldConfirm(field.key)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            syncDraftFromLiveValue(field.key);
                            setManualEditOpen((previous) => ({
                              ...previous,
                              [fieldPath]: false,
                            }));
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  hasValue && (
                    <p className="whitespace-pre-wrap text-base text-foreground">{fieldValue}</p>
                  )
                )}

                {isClientNoteOpen && (
                  <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Client note</Label>
                    <Input
                      value={toEditableValue(noteDrafts[fieldPath])}
                      onChange={(event) => {
                        const value = event.target.value;
                        setNoteDrafts((previous) => ({
                          ...previous,
                          [fieldPath]: value,
                        }));
                      }}
                      placeholder="Add context for your advisor..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const nextValue = toEditableValue(noteDrafts[fieldPath]);
                          updateClientNote(fieldPath, nextValue);
                          setNoteOpen((previous) => ({
                            ...previous,
                            [fieldPath]: false,
                          }));
                        }}
                      >
                        Save note
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNoteDrafts((previous) => ({
                            ...previous,
                            [fieldPath]: brief.clientNotes?.[fieldPath] ?? '',
                          }));
                          setNoteOpen((previous) => ({
                            ...previous,
                            [fieldPath]: false,
                          }));
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {isSuggestedEditable && (
                  <Badge variant="warning" className="w-fit">
                    Advisor suggestion - please confirm or adjust
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
