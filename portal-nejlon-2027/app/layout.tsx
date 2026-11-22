import type { Metadata } from 'next';
import './globals.css';
import './nejlon-theme.css';
import {ContactPrescon} from '@/components/contact-prescon';
export const metadata: Metadata = { title: 'Portal de Governança | NejLon', description: 'Juntos pela excelência — Portal de Governança 2027' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR" suppressHydrationWarning>
   <head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=['light','dark'].includes(localStorage.getItem('nejlon-theme'))?localStorage.getItem('nejlon-theme'):'dark'}catch(e){document.documentElement.dataset.theme='dark'}"}}/></head>
   <body>{children}<ContactPrescon/><script dangerouslySetInnerHTML={{__html:"(()=>{const selector='.hero h1,.main h1,.main h2,.main h3,.main h4,.panel h2,.panel h3,.page-title,.section-title';function sync(){document.querySelectorAll(selector).forEach(el=>{if(el.closest('.nejlon-title-back')||el.querySelector(':scope > .nejlon-title-back'))return;const layer=document.createElement('span');layer.className='nejlon-title-back';layer.setAttribute('aria-hidden','true');layer.innerHTML=el.innerHTML;el.classList.add('nejlon-layer-title');el.prepend(layer)})}let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}function start(){sync();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})()"}}/></body>
  </html>;
}
