import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { CountUp } from '../motion/CountUp';

export const StatsCard: React.FC<{ title: string; value: number; suffix?: string; loading?: boolean }> = ({
  title,
  value,
  suffix,
  loading
}) => (
  <div className="border-l-2 border-spark pl-4">
    <p className="font-display text-4xl font-extrabold tabular-nums">
      {loading ? <span aria-label="Chargement">…</span> : <CountUp value={value} suffix={suffix} />}
    </p>
    <p className="mt-1 text-sm text-muted">{title}</p>
  </div>
);

export const ElectionStats: React.FC<{ electionId: string; live?: boolean }> = ({ electionId, live }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['election-stats', electionId],
    queryFn: async () => (await api.get(`/analytics/election/${electionId}/stats`)).data.data,
    refetchInterval: live ? 5000 : false
  });

  if (isLoading) return <p className="text-muted">Chargement des chiffres…</p>;

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      <StatsCard title="Électeurs inscrits" value={stats?.totalVoters ?? 0} />
      <StatsCard title="Bulletins déposés" value={stats?.totalVotes ?? 0} />
      <StatsCard title="Participation" value={Math.round(Number(stats?.voterTurnout ?? 0))} suffix=" %" />
      <StatsCard title="Postes" value={stats?.positions?.length ?? 0} />
    </div>
  );
};
