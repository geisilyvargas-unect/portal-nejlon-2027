import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Portal de Governança | NejLon', description: 'Juntos pela excelência — Portal de Governança 2027' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR" suppressHydrationWarning>
   <head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('nejlon-theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}"}}/></head>
   <body>{children}</body>
  </html>;
}
