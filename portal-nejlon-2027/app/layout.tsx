import type { Metadata } from 'next';
import './globals.css';
import './nejlon-theme.css';
import {ContactPrescon} from '@/components/contact-prescon';
export const metadata: Metadata = { title: 'Portal de Governança | NejLon', description: 'Juntos pela excelência — Portal de Governança 2027' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR" suppressHydrationWarning>
   <head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=['light','dark'].includes(localStorage.getItem('nejlon-theme'))?localStorage.getItem('nejlon-theme'):'dark'}catch(e){document.documentElement.dataset.theme='dark'}"}}/></head>
   <body>{children}<ContactPrescon/></body>
  </html>;
}
