import { Center } from '@astryxdesign/core/Center';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { HealthStatus } from '../../health';

export function HomePage() {
  return (
    <main>
      <Center minHeight="100vh" padding={6}>
        <Card maxWidth={560} elevation="low">
          <VStack gap={4} align="start">
            <VStack gap={2} align="start">
              <Heading level={1}>UnMute</Heading>
              <Text type="body" color="secondary">
                A video platform smart enough to take the heat, take the notes, and let you take the
                credit.
              </Text>
            </VStack>
            <HealthStatus />
          </VStack>
        </Card>
      </Center>
    </main>
  );
}
