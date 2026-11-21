'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, BellRing, FileBarChart2, Users, ListTodo, CalendarDays, FolderOpen, GraduationCap, Building2 } from 'lucide-react';
import type {Role} from '@/lib/constants';
const links=[
  {href:'/painel',label:'Visão geral',icon:LayoutDashboard},
  {href:'/deliberacoes',label:'Deliberações',icon:ClipboardList},
  {href:'/pendencias',label:'Pendências',icon:BellRing,roles:['prescon']},
  {href:'/relatorios',label:'Relatórios',icon:FileBarChart2,roles:['prescon']},
  {href:'/acessos',label:'Gestão de acessos',icon:Users,roles:['prescon']},
  {href:'/demandas',label:'Demandas',icon:ListTodo},
  {href:'/rede',label:'Rede de EJs',icon:Building2},
  {href:'/calendario',label:'Calendário',icon:CalendarDays},
  {href:'/biblioteca',label:'Biblioteca',icon:FolderOpen},
  {href:'/jornada',label:'Jornada do Conselho',icon:GraduationCap},
];
export function SideNav({role, mobile=false}:{role:Role;mobile?:boolean}){
  const pathname=usePathname();
  return <nav className={mobile?'mobile-nav':'navigation'} aria-label="Navegação principal">{links.filter(l=>!l.roles||l.roles.includes(role)).map(({href,label,icon:Icon})=>
    <Link key={href} href={href} className={`nav-link ${pathname===href || (href!='/painel' && pathname.startsWith(href+'/'))?'active':''}`}><Icon size={17} aria-hidden/> {label}</Link> )}</nav>;
}
