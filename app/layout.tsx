import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="app-header">
          <div className="container">
            <h1>Control de horas SST</h1>
            <nav>
              <a href="/">Registro diario</a>
              <a href="/bulk-upload">Carga masiva</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
