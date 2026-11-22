'use client';
import {useMemo,useState} from 'react';
import {Building2,Instagram,MapPin,MessageCircle,Search,Share2,University} from 'lucide-react';
import {EJ_DIRECTORY,directoryBySlug,ejInstagramUrl,ejWhatsappUrl} from '@/lib/ej-directory';
import {EjBrand} from '@/components/ej-brand';

export type DirectoryEj={name:string;slug:string;id?:string};
const cities=['Todas','Londrina','Apucarana','Cornélio Procópio','Bandeirantes'];

export function EjDirectory({ejs}:{ejs:readonly DirectoryEj[]}){
 const [text,setText]=useState('');
 const [city,setCity]=useState('Todas');
 const [expanded,setExpanded]=useState<string|null>(null);
 const filtered=useMemo(()=>ejs.filter(e=>{
  const d=directoryBySlug.get(e.slug);
  const haystack=[e.name,d?.city,d?.university,d?.field,...(d?.services||[])].join(' ').toLocaleLowerCase('pt-BR');
  return (city==='Todas'||d?.city===city)&&haystack.includes(text.trim().toLocaleLowerCase('pt-BR'));
 }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),[ejs,text,city]);
 return <section className="ej-directory-module" aria-label="Diretório das empresas juniores">
  <div className="ej-directory-top">
   <div><span className="eyebrow">Conexão entre empresas</span><h2>Conheça as EJs da Rede</h2>
    <p className="muted small">Logos, áreas, instituições, cidades e serviços do Portfólio Unificado NEJLON.</p>
   </div>
   <span className="badge lime">{ejs.length} EJs</span>
  </div>
  <div className="ej-directory-filters">
   <label className="ej-directory-search"><Search size={18} aria-hidden="true"/>
    <span className="ej-sr-only">Buscar EJ, área ou serviço</span>
    <input value={text} onChange={e=>setText(e.target.value)} placeholder="Buscar EJ, área ou serviço..." aria-label="Buscar EJ, área ou serviço"/>
   </label>
   <label>Município<select value={city} onChange={e=>setCity(e.target.value)} aria-label="Filtrar cidade">
    {cities.map(c=><option key={c} value={c}>{c}</option>)}
   </select></label>
  </div>
  <p className="muted small">{filtered.length} empresa(s) encontrada(s)</p>
  <div className="ej-directory-cards">
   {filtered.map(e=>{
    const d=directoryBySlug.get(e.slug);
    if(!d)return <article key={e.slug} className="panel ej-directory-card">
     <Building2 aria-hidden="true"/><h3>{e.name}</h3><p className="muted small">Informações institucionais ainda não disponíveis no portfólio.</p>
    </article>;
    const whatsapp= d.whatsapp?ejWhatsappUrl(d.whatsapp,e.name):null;
    const shareText='Conheça a '+e.name+' no diretório das Empresas Juniores do NEJLON 2027.';
    const share='https://api.whatsapp.com/send?text='+encodeURIComponent(shareText);
    return <article key={e.slug} className="panel ej-directory-card">
     <header className="ej-directory-identity">
      <EjBrand slug={e.slug} name={e.name} large/>
      <div><h3>{e.name}</h3><div className="ej-directory-place"><MapPin size={13} aria-hidden="true"/>{d.city}/PR</div>
       <div className="ej-directory-place"><University size={13} aria-hidden="true"/>{d.university}</div>
      </div>
     </header>
     <p className="ej-directory-field">{d.field}</p>
     <button type="button" className="ej-directory-toggle"
      aria-expanded={expanded===e.slug} onClick={()=>setExpanded(expanded===e.slug?null:e.slug)}>
      {expanded===e.slug?'Ocultar serviços':'Ver serviços'} <span>{d.services.length}</span>
     </button>
     {expanded===e.slug&&<ul className="ej-directory-services">
      {d.services.map((item,i)=><li key={item+i}>{item}</li>)}
     </ul>}
     <div className="ej-directory-actions">
      {d.instagram&&<a className="button outline" href={ejInstagramUrl(d.instagram)}
       target="_blank" rel="noopener noreferrer"><Instagram size={15}/> Instagram</a>}
      {whatsapp
       ?<a className="button lime" href={whatsapp} target="_blank" rel="noopener noreferrer">
         <MessageCircle size={15}/> Mandar mensagem
        </a>
       :<a className="button outline" href={share} target="_blank" rel="noopener noreferrer"
         title="Compartilha a EJ no WhatsApp; não envia mensagem diretamente à empresa">
         <Share2 size={15}/> Compartilhar
        </a>}
     </div>
     {!whatsapp&&<p className="muted ej-directory-disclaimer">WhatsApp da EJ não informado no portfólio.</p>}
    </article>;
   })}
  </div>
  {!filtered.length&&<div className="panel"><p className="muted">Nenhuma EJ encontrada com estes filtros.</p></div>}
  <p className="muted small">Fonte: Portfólio Unificado NEJLON, páginas 4–32. Os dados são institucionais e podem precisar de atualização; não exibimos telefones pessoais.</p>
 </section>;
}
