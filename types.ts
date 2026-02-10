export enum ProjectType {
  ADU = 'ADU',
  SingleFamily = 'Single-Family',
  MultiFamily = 'Multi-Family',
  CommercialTI = 'Commercial TI',
  Feasibility = 'Feasibility',
  Other = 'Other'
}

export enum PrimaryStatus {
  P0 = 'P0 – Lead / Inquiry',
  P1 = 'P1 – Contracted / Onboarding',
  P2 = 'P2 – Design Active',
  P3 = 'P3 – Submitted / In Review',
  P4 = 'P4 – Correction / Resubmittal',
  P5 = 'P5 – Permit Issued',
  P6 = 'P6 – Construction Support',
  P7 = 'P7 – Closed / Dormant'
}

export enum BlockerType {
  None = 'None',
  Client = 'Client',
  CityAgency = 'City / Agency',
  Consultant = 'Consultant (Structural/MEP/Survey)',
  Internal = 'Internal',
  External = 'External (HOA/Utility/Other)'
}

export enum BlockerOwner {
  Client = 'Client',
  City = 'City',
  Consultant = 'Consultant',
  Internal = 'Internal'
}

export enum NextActionOwner {
  Internal = 'Internal',
  Client = 'Client',
  City = 'City',
  Consultant = 'Consultant'
}

export enum ProjectHealth {
  Green = 'Green – progressing normally',
  Yellow = 'Yellow – delayed but recoverable',
  Red = 'Red – stalled / attention required'
}

export interface DesignChecklist {
  conceptApproved: boolean;
  zoningConfirmed: boolean;
  plans60Complete: boolean;
  plans90Complete: boolean;
  internalQA: boolean;
  clientSignOff: boolean;
}

export interface PermittingChecklist {
  initialSubmittal: boolean;
  firstPlanCheck: boolean;
  correctionsResubmitted: boolean;
  planCheck2Received: boolean;
  corrections2Submitted: boolean;
  permitIssued: boolean;
}

export interface ConstructionChecklist {
  permitSetReleased: boolean;
  submittalsReviewed: boolean;
  rfisResponded: boolean;
  designChangesEvaluated: boolean;
  inspectionSupportCompleted: boolean;
}

export interface ProjectBlocker {
  id: string;
  type: BlockerType;
  owner?: BlockerOwner;
  description: string;
}

export interface ProjectOperation {
  id: string;
  description: string;
  owner: NextActionOwner;
  isCompleted: boolean;
  date: string;
  linkedBlockerId?: string;
  linkedTrackId?: string;
}

export interface PermitTrack {
  id: string;
  name: string;
  blockers: ProjectBlocker[];
}

export interface Project {
  id: string;
  name: string;
  city: string;
  type: ProjectType;
  // Detailed Client Info
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  
  projectManager: string;
  status: PrimaryStatus;
  // Global Health and Operations
  health: ProjectHealth;
  operations: ProjectOperation[];
  
  // Detailed Permit Tracks (Dynamic Array)
  permitTracks: PermitTrack[];
  // Checklists
  designChecklist: DesignChecklist;
  permittingChecklist: PermittingChecklist;
  constructionChecklist: ConstructionChecklist;
  createdAt: string;
  isArchived: boolean;
}

export type ViewType = 'EiDaily' | 'Blocked' | 'City' | 'DesignActive' | 'Construction' | 'Completed' | 'Archived' | 'All';

export type DisplayMode = 'grid' | 'tasks';

export type TaskLayout = 'expanded' | 'compact';
