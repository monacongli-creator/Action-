
import { 
  Project, 
  ProjectType, 
  PrimaryStatus, 
  BlockerType, 
  NextActionOwner, 
  ProjectHealth 
} from './types';

const today = new Date();
const getPastDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const createProject = (id: string, name: string, city: string, client: string = 'Private Client', status: PrimaryStatus = PrimaryStatus.P2, daysAgo: number = 0): Project => ({
  id,
  name,
  city,
  type: ProjectType.SingleFamily,
  clientName: client,
  clientPhone: '',
  clientEmail: '',
  clientAddress: '',
  projectManager: 'Internal',
  status,
  health: ProjectHealth.Green,
  operations: [
    {
      id: Math.random().toString(36).substr(2, 9),
      description: 'Initial project review and onboarding',
      owner: NextActionOwner.Internal,
      isCompleted: false,
      date: getPastDate(daysAgo).split('T')[0]
    }
  ],
  permitTracks: [
    { id: 'track-1', name: 'Planning Permit', blockers: [] }
  ],
  designChecklist: {
    conceptApproved: false,
    zoningConfirmed: false,
    plans60Complete: false,
    plans90Complete: false,
    internalQA: false,
    clientSignOff: false,
  },
  permittingChecklist: {
    initialSubmittal: false,
    firstPlanCheck: false,
    correctionsResubmitted: false,
    planCheck2Received: false,
    corrections2Submitted: false,
    permitIssued: false,
  },
  constructionChecklist: {
    permitSetReleased: false,
    submittalsReviewed: false,
    rfisResponded: false,
    designChangesEvaluated: false,
    inspectionSupportCompleted: false,
  },
  createdAt: getPastDate(daysAgo),
  isArchived: false
});

export const INITIAL_PROJECTS: Project[] = [
  createProject('p1', '01-11141 Limetree Dr', 'Santa Ana', 'Smith Family', PrimaryStatus.P2, 22),
  createProject('p2', '02-1354 MorningSide Dr', 'Laguna Beach', 'Jones Dev', PrimaryStatus.P2, 21),
  createProject('p3', '03-1048 Van Dyke', 'Laguna Beach', 'Miller Trust', PrimaryStatus.P2, 20),
  createProject('p4', '04-6 Montia', 'Irvine', 'Chen Holdings', PrimaryStatus.P2, 19),
  createProject('p5', '05-1149 Myrtle Drive', 'Sunnyvale', 'Private Client', PrimaryStatus.P2, 18),
  createProject('p6', '06-2680 Olive Pl', 'Reno', 'Nevada Partners', PrimaryStatus.P2, 17),
  createProject('p7', '07-4817 W 119St', 'Hawthrone', 'Private Client', PrimaryStatus.P2, 16),
  createProject('p8', '08-123 6th', 'Huntington Beach', 'Beach Side LLC', PrimaryStatus.P2, 15),
  createProject('p9', '09-4382&4380 Mission Blvd', 'Montclair', 'Commercial Group', PrimaryStatus.P2, 14),
  createProject('p10', '10-Port Chelsea Pl', 'Newport Beach', 'Private Client', PrimaryStatus.P2, 13),
  createProject('p11', '11-5 Rue Marseilles', 'Newport Beach', 'Estate Mgmt', PrimaryStatus.P2, 12),
  createProject('p12', '12-3451 Spurling Court', 'San Jose', 'Tech Homes', PrimaryStatus.P2, 11),
  createProject('p13', '13-5484 S Lindell Rd', 'Las Vegas', 'Vegas Dev', PrimaryStatus.P2, 10),
  createProject('p14', '14-28861 Aloma Ave', 'Laguna Niguel', 'Private Client', PrimaryStatus.P2, 9),
  createProject('p15', '15-21891 Huron Lane', 'Lake Forest', 'Wait List', PrimaryStatus.P0, 8),
  createProject('p16', '16-1505 Rosewood Ave', 'Santa Ana', 'Local Dev', PrimaryStatus.P2, 7),
  createProject('p17', '17-4342 Esmeralda Street', 'Los Angeles', 'LA Living', PrimaryStatus.P0, 6),
  createProject('p18', '18-4344 Esmeralda Street', 'Los Angeles', 'LA Living', PrimaryStatus.P0, 5),
  createProject('p19', '19-626 Inverness Dr', 'Santa Ana', 'Private Client', PrimaryStatus.P2, 4),
  createProject('p20', '20-Easy House Layouts', 'Remote', 'Standard Designs', PrimaryStatus.P2, 3),
  createProject('p21', '21-10 Alameda', 'Irvine', 'Irvine Co', PrimaryStatus.P0, 2),
  createProject('p22', '22-510 S Sheridan St', 'Corona', 'Dormant Client', PrimaryStatus.P7, 1),
  createProject('p23', '23-738 Westmount dr', 'West Hollywood', 'Hollywood Hills', PrimaryStatus.P0, 0),
];

export const STATUS_COLORS: Record<PrimaryStatus, string> = {
  [PrimaryStatus.P0]: 'bg-slate-100 text-slate-700 border-slate-200',
  [PrimaryStatus.P1]: 'bg-blue-50 text-blue-700 border-blue-200',
  [PrimaryStatus.P2]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [PrimaryStatus.P3]: 'bg-amber-50 text-amber-700 border-amber-200',
  [PrimaryStatus.P4]: 'bg-rose-50 text-rose-700 border-rose-200',
  [PrimaryStatus.P5]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [PrimaryStatus.P6]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  [PrimaryStatus.P7]: 'bg-gray-100 text-gray-500 border-gray-200'
};

export const HEALTH_COLORS: Record<ProjectHealth, string> = {
  [ProjectHealth.Green]: 'bg-emerald-500',
  [ProjectHealth.Yellow]: 'bg-amber-500',
  [ProjectHealth.Red]: 'bg-rose-500'
};
