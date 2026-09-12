import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { useGetApiHealth } from '../../../api/generated/endpoints';

export function HealthStatus() {
  const health = useGetApiHealth();

  if (health.isPending) {
    return <Text type="supporting">Checking API…</Text>;
  }

  if (health.isError) {
    return <Badge variant="error" label="API unavailable" />;
  }

  return <Badge variant="success" label="API healthy" />;
}
