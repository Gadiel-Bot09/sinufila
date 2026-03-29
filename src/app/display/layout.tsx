import PWARegister from './PWARegister';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SinuFila Display',
  description: 'Pantalla pública de turnos',
  manifest: '/manifest.json',
};

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PWARegister />
      {children}
    </>
  );
}
