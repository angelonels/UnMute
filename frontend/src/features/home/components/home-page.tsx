import { HealthStatus } from '../../health';

export function HomePage() {
  return (
    <main>
      <h1>UnMute</h1>
      <p>
        A video platform smart enough to take the heat, take the notes, and let you take the credit.
      </p>
      <HealthStatus />
    </main>
  );
}
