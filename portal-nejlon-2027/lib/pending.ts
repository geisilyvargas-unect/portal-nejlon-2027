export type PendingEj = { id: string; name: string; slug: string };
/** Calcula as EJs pendentes exclusivamente a partir das respostas reais. */
export function getPendingEjs<T extends PendingEj>(ejs: T[], responseEjs: Array<{ ej_id: string }>): T[] {
  const replied = new Set(responseEjs.map(r => r.ej_id));
  return ejs.filter(ej => !replied.has(ej.id));
}
export function reminderText(title: string, ej: string, dueAt: string): string {
  return `Olá! Tudo bem? 💙\n\nEstamos acompanhando as respostas à deliberação ${title}.\n\nAinda não identificamos o retorno da ${ej}.\n\nPrazo: ${dueAt}.\n\nConseguimos contar com a resposta de vocês? Se houver alguma dúvida ou ressalva, podem nos sinalizar.\n\nPRESCON NejLon`;
}
