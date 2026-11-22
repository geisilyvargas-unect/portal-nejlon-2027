/** Portfólio Unificado NEJLON, páginas 4 a 32; sem contatos pessoais. */
import directoryData from '../../pages/ej-directory.json';
export type EJDirectoryEntry={slug:string;city:string;state:string;university:string;field:string;instagram:string;services:string[];whatsapp:string|null;logoIndex:number;sourcePage:number};
export const EJ_DIRECTORY=directoryData as EJDirectoryEntry[];
export const directoryBySlug=new Map(EJ_DIRECTORY.map(e=>[e.slug,e]));
export function ejInstagramUrl(handle:string){return 'https://www.instagram.com/'+handle.replace(/^@/,'')+'/';}
export function ejWhatsappUrl(phone:string,name:string){const digits=phone.replace(/\D/g,'');if(!/^55\d{10,11}$/.test(digits))return null;return 'https://wa.me/'+digits+'?text='+encodeURIComponent('Olá! Gostaria de falar com a '+name+'.');}
