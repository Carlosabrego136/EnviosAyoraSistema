'use client';

import { useFormStatus } from 'react-dom';
import { deleteRecordAction } from '@/app/admin/actions';

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn--danger"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm('¿Eliminar definitivamente? Esta acción quedará registrada en la bitácora.')) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Eliminando…' : label}
    </button>
  );
}

export function DeleteButton({ resourceKey, id, label = 'Eliminar' }: { resourceKey: string; id: number; label?: string }) {
  return (
    <form action={deleteRecordAction.bind(null, resourceKey, id)}>
      <Confirm label={label} />
    </form>
  );
}
