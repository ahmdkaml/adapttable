import type { ReactNode } from "react";
import { Table as BootstrapTable } from "react-bootstrap";

export function Table({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <BootstrapTable
      bordered
      hover
      responsive
      striped
      className="align-middle mb-0"
    >
      {children}
    </BootstrapTable>
  );
}
