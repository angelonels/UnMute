import { Center } from '@astryxdesign/core/Center';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { APP_NAME, APP_TAGLINE } from '@unmute/shared';
import { HealthStatus } from '../../health/components/health-status';

export function HomePage() {
  return (
    <main>
      <Center minHeight="100vh" padding={6}>
        <Card maxWidth={560} elevation="low">
          <VStack gap={4} align="start">
            <VStack gap={2} align="start">
              <Heading level={1}>{APP_NAME}</Heading>
              <Text type="body" color="secondary">
                {APP_TAGLINE}
              </Text>
            </VStack>
            <HealthStatus />
          </VStack>
        </Card>
      </Center>
    </main>
  );
}
