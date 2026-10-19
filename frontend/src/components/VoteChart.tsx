import React from 'react';
import { prefersReducedMotion } from '../motion/gsap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface VoteChartProps {
  data: Array<{ name: string; votes: number }>;
}

export const VoteChart: React.FC<VoteChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={data} margin={{ left: -16 }}>
      <CartesianGrid vertical={false} stroke="rgb(var(--line))" />
      <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgb(var(--muted))" />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="rgb(var(--muted))" />
      <Tooltip
        cursor={{ fill: 'rgb(var(--ink) / 0.06)' }}
        contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 6, color: 'rgb(var(--ink))' }}
      />
      <Bar dataKey="votes" name="Voix" isAnimationActive={!prefersReducedMotion()} fill="rgb(var(--smoke))" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
