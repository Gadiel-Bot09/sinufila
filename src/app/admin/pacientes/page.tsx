import { getPatients } from './actions';
import PacientesClient from './PacientesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pacientes — SinuFila',
};

export default async function PacientesPage() {
  const { patients, total } = await getPatients('', 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PacientesClient initialPatients={patients} initialTotal={total} />
    </div>
  );
}
