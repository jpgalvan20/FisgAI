export type Stage = 'novo' | 'contatado' | 'respondeu' | 'reuniao' | 'fechado' | 'perdeu';

export type OpportunityLevel = 'alta' | 'media' | 'baixa';

export interface SignalItem {
  key: string;
  label: string;
  points: number;
  active: boolean;
  explanation: string;
}

export interface NoteItem {
  id: string;
  date: string;
  time: string;
  text: string;
  author: string;
}

export interface Company {
  id: string;
  name: string;
  niche: string;
  city: string;
  state: string;
  phone: string;
  rawPhone: string;
  hasWebsite: boolean;
  websiteUrl?: string;
  hasInstagram?: boolean;
  instagramUrl?: string;
  googleRating: number;
  reviewCount: number;
  score: number; // 0 - 100
  opportunityLevel: OpportunityLevel;
  stage: Stage;
  returnDate: string | null; // e.g. 'Hoje 14:30', 'Amanhã', '2026-10-18', or null
  returnStatus: 'today' | 'overdue' | 'future' | 'none';
  meetingTime?: string;
  meetingDate?: string;
  meetingCategory?: 'atrasada' | 'menos_1h' | 'futuro';
  meetingTitle?: string;
  meetingFinished?: boolean;
  meetingFinishedAt?: string;
  googleMapsUrl?: string;
  signals: SignalItem[];
  notes: NoteItem[];
  noteText?: string;
  assignedUser: 'lucas' | 'marcos';
  address: string;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastContactedAt?: string;
}

export interface ApproachTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
}

export interface UserProfile {
  id: 'lucas' | 'marcos';
  name: string;
  email: string;
  avatar: string;
  role: string;
  workspace: string;
}

export interface DispatchCounters {
  today: number;
  last7Days: number;
  month: number;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'Criador' | 'Administrador' | 'Membro' | 'Visualizador';
  isCreator?: boolean;
  addedAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  niche: string;
  image?: string;
  role: 'Proprietário' | 'Membro';
  creatorName?: string;
  members: string[];
  memberList?: WorkspaceMember[];
  stages?: StageConfig[];
  signalsConfig?: any[];
  approachText?: string;
  dailyGoal?: number;
}

export interface StageConfig {
  id: string;
  label: string;
  emptyText: string;
}
