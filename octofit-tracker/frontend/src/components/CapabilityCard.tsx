import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  statusText?: string;
  statusRole?: 'status' | 'alert';
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  statusText = 'Implementation pending',
  statusRole = 'status',
  children,
}: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {children ?? <p role={statusRole}>{statusText}</p>}
      </div>
    </section>
  );
}
