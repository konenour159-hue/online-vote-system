import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <section className={`rounded-lg border border-line bg-surface p-6 ${className || ''}`}>{children}</section>
);

export const CardHeader: React.FC<CardProps> = ({ children, className }) => (
  <div className={`mb-4 ${className || ''}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className }) => (
  <h2 className={`text-2xl font-bold ${className || ''}`}>{children}</h2>
);

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={className || ''}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className }) => (
  <div className={`mt-6 flex gap-2 ${className || ''}`}>{children}</div>
);
