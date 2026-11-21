export const ROLES = {
  prescon: 'PRESCON',
  nucleus_direx: 'DIREX do Núcleo',
  ej_direx: 'DIREX da EJ',
  counselor: 'Conselheiro(a)',
} as const;
export type Role = keyof typeof ROLES;
export const POSITIONS = {
  favorable: 'Favorável',
  qualified: 'Favorável com ressalvas',
  against: 'Contrário',
  abstention: 'Abstenção',
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
};
export type ResponseRow = {
  id: string; deliberation_id: string; ej_id: string; position: Position;
  justification: string | null; caveats: string | null; suggestions: string | null;
  updated_at: string;
};
export const formatDate = (iso: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
export const isAdmin = (role: Role) => role === 'prescon';
export const isCouncil = (role: Role) => role === 'counselor';
export const canManageEvents = (role: Role) => role === 'prescon' || role === 'nucleus_direx';
export const safeText = (v: FormDataEntryValue | null) => typeof v === 'string' ? v.trim() : '';
