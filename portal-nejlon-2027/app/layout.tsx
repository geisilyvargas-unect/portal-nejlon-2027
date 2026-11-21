import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Portal de Governança | NejLon', description: 'Juntos pela excelência — Portal de Governança 2027' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
