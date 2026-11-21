import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{
 return {
  id:'/',
  name:'Portal de Governança NEJLON 2027',
  short_name:'NEJLON',
  description:'Deliberações, agenda, Conselho e PRESCON',
  start_url:'/painel',
  display:'standalone',
  orientation:'portrait-primary',
  background_color:'#090b0d',
  theme_color:'#d12d32',
  lang:'pt-BR',
  icons:[{src:'/icon',sizes:'512x512',type:'image/png',purpose:'any maskable'}]
 };
}
