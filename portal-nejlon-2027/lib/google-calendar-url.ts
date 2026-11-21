export type CalendarLinkEvent={
 title:string;description:string|null;starts_at:string;ends_at?:string|null
};
function formatGoogleDate(value:Date) {
 return value.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
}
export function googleCalendarUrl(event:CalendarLinkEvent):string{
 const start=new Date(event.starts_at);
 const end=event.ends_at?new Date(event.ends_at):new Date(start.getTime()+60*60*1000);
 const params=new URLSearchParams({
  action:'TEMPLATE',
  text:event.title,
  dates:formatGoogleDate(start)+'/'+formatGoogleDate(end),
  details:(event.description||'')+'\n\nEvento do Portal NEJLON 2027. Salve na sua agenda Google para receber os lembretes do Google.',
  ctz:'America/Sao_Paulo'
 });
 return 'https://calendar.google.com/calendar/render?'+params.toString();
}
