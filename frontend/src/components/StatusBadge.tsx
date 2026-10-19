import React from 'react';

const map: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: 'Pas encore ouvert', dot: 'bg-muted' },
  ACTIVE: { label: 'Ouvert au vote', dot: 'bg-ok' },
  COMPLETED: { label: 'Clos', dot: 'bg-smoke' },
  CANCELLED: { label: 'Annulé', dot: 'bg-bad' }
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = map[status] || { label: status, dot: 'bg-muted' };
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
};
