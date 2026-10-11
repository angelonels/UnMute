import { useGetApiHealth } from '../../../api/generated/endpoints';

export function HealthStatus() {
  const health = useGetApiHealth();

  if (health.isPending) {
    return <p role="status">Checking API…</p>;
  }

  if (health.isError) {
    return <p role="status">API unavailable</p>;
  }

  return <p role="status">API healthy</p>;
}
