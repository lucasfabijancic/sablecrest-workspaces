export interface ClientProfile {
  id: string;
  workspaceId: string;
  companyLegalName: string;
  companyDba?: string;
  annualRevenueRange: string;
  employeeCount?: number;
  officeFieldSplit?: string;
  activeProjectCount?: number;
  geographicFootprint: string;
  growthTrajectory?:
    | 'Stable'
    | 'Moderate Growth'
    | 'Rapid Growth'
    | 'Acquisition-Driven'
    | 'Contraction';
  currentSystems: string[];
  itMaturity?: 'No IT Staff' | 'IT Generalist' | 'IT Team' | 'IT Department';
  previousImplementations?: string;
  assignedAdvisorId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactRole?: string;
  discoveryCallDate?: string;
  discoveryCallNotes?: string;
  documentsReceived?: string[];
  onboardingStatus:
    | 'Pending Setup'
    | 'Brief In Progress'
    | 'Invitation Sent'
    | 'Client Active'
    | 'Paused';
  createdAt: string;
  updatedAt: string;
}

export interface ClientInvitation {
  id: string;
  clientProfileId: string;
  workspaceId: string;
  email: string;
  briefId: string;
  status: 'Pending' | 'Sent' | 'Opened' | 'Completed';
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  welcomeMessage?: string;
}
