export const ROLES = {
  prescon: 'PRESCON',
  nucleus_direx: 'DIREX do Núcleo',
  ej_direx: 'DIREX da EJ',
  counselor: 'Conselheiro(a)',
} as const;
export type Role = keyof typeof ROLES;
export const POSITIONS = {
  favorable: 'Aprovo',
  suggestions: 'Aprovo com sugestões',
  qualified: 'Aprovo com ressalvas',
  against: 'Reprovo',
  abstention: 'Abstenho',
} as const;
export type Position = keyof typeof POSITIONS;
export type Profile = {
  id: string; email: string; full_name: string; role: Role;
  ej_id: string | null; active: boolean; phone: string | null;
  must_change_password: boolean;
};
export type Ej = { id: string; name: string; slug: string };
export type Deliberation = {
  id: string; title: string; description: string; due_at: string;
  status: 'draft' | 'open' | 'closed'; direx_visible: boolean;
  is_demo: boolean; report_notes: string | null; report_followup: string | null;
  created_at: string;
  scenarios?: DeliberationScenario[];
};
export type DeliberationScenario = { key: string; title: string; description?: string; material_url?: string };
export type ScenarioAnswer = { scenario_key: string; position: Position; justification: string; caveats: string; suggestions: string };
export type FinalFeedback = { clarity?: number; difficulty?: number; improvements?: string };
export type ResponseRow = {
  id: string; deliberation_id: string; ej_id: string; position: Position;
  justification: string | null; caveats: string | null; suggestions: string | null;
  updated_at: string;
  scenario_answers?: ScenarioAnswer[];
  final_feedback?: FinalFeedback;
};
export const formatDate = (iso: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
export const isAdmin = (role: Role) => role === 'prescon';
export const isCouncil = (role: Role) => role === 'counselor';
export const canManageEvents = (role: Role) => role === 'prescon' || role === 'nucleus_direx';
export const safeText = (v: FormDataEntryValue | null) => typeof v === 'string' ? v.trim() : '';
