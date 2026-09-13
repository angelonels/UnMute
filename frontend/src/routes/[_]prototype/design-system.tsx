/**
 * Living reference for the locked UnMute design foundation.
 * It uses the real theme and Astryx primitives so it catches integration drift.
 */
import { AppShell } from '@astryxdesign/core/AppShell';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Section } from '@astryxdesign/core/Section';
import { Selector } from '@astryxdesign/core/Selector';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Switch } from '@astryxdesign/core/Switch';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import { MediaTheme, Theme } from '@astryxdesign/core/theme';
import { createFileRoute } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { Captions, Sparkles, Users, Video } from 'lucide-react';
import { unmuteTheme } from '../../theme/unmute';

export const Route = createFileRoute('/_prototype/design-system')({
  component: DesignSystemPage,
});

type ThemeMode = 'dark' | 'light';

function DesignSystemPage() {
  const [mode, setMode] = useState<ThemeMode>('dark');

  return (
    <Theme theme={unmuteTheme} mode={mode}>
      <AppShell contentPadding={0} height="auto" variant="section">
        <VStack gap={0} align="stretch">
          <FoundationHeader mode={mode} onModeChange={setMode} />

          <Section padding={6} variant="transparent">
            <VStack gap={8} align="stretch">
              <SurfaceHierarchySection />
              <TypographySection />
              <ActionsSection />
              <FormsSection />
              <ProductLanguageSection />
              <FeedbackSection />
              <LiveMediaSection />
            </VStack>
          </Section>
        </VStack>
      </AppShell>
    </Theme>
  );
}

function FoundationHeader({
  mode,
  onModeChange,
}: {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}) {
  return (
    <Section padding={6} dividers={['bottom']}>
      <VStack gap={4} align="stretch">
        <HStack gap={4} justify="between" vAlign="center" wrap="wrap">
          <VStack gap={1} align="start">
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Token label="Foundation 02" size="sm" />
              <StatusDot variant="success" label="Foundation is active" />
            </HStack>
            <Heading level={1}>A vivid studio for better conversations.</Heading>
            <Text color="secondary">
              Cool midnight surfaces keep people in focus. Volt makes the next
              meaningful action unmistakable.
            </Text>
          </VStack>
          <SegmentedControl
            label="Preview color mode"
            size="sm"
            value={mode}
            onChange={(value) => onModeChange(value as ThemeMode)}
          >
            <SegmentedControlItem value="dark" label="Dark" />
            <SegmentedControlItem value="light" label="Light sheet" />
          </SegmentedControl>
        </HStack>
        <HStack gap={2} wrap="wrap">
          <Token label="Volt signal" />
          <Token label="Midnight ink" />
          <Token label="IBM Plex" />
          <Token label="4px rhythm" />
          <Token label="Layered depth" />
        </HStack>
      </VStack>
    </Section>
  );
}

function SurfaceHierarchySection() {
  return (
    <FoundationSection
      title="Surface hierarchy"
      description="Use spacing first, sections for page regions, and cards only for things that can stand alone."
    >
      <Grid columns={{ minWidth: 220, max: 3, repeat: 'fit' }} gap={3}>
        <Section variant="muted" padding={4}>
          <VStack gap={1} align="start">
            <Text weight="semibold">Muted section</Text>
            <Text type="supporting" color="secondary">
              Recessed guidance and low-emphasis regions.
            </Text>
          </VStack>
        </Section>
        <Card elevation="none">
          <VStack gap={1} align="start">
            <Text weight="semibold">Resting card</Text>
            <Text type="supporting" color="secondary">
              A discrete object with a real boundary.
            </Text>
          </VStack>
        </Card>
        <Card elevation="med">
          <VStack gap={1} align="start">
            <Text weight="semibold">Floating surface</Text>
            <Text type="supporting" color="secondary">
              Reserved for overlays, menus, and temporary focus.
            </Text>
          </VStack>
        </Card>
      </Grid>
    </FoundationSection>
  );
}

function TypographySection() {
  return (
    <FoundationSection
      title="Type and hierarchy"
      description="IBM Plex Sans carries the interface; Plex Mono is reserved for AI cues, timestamps, and technical detail."
    >
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={5}>
        <VStack gap={3} align="start">
          <Heading level={2}>A clear room changes the conversation.</Heading>
          <Heading level={3}>One lead per region</Heading>
          <Text>
            Body copy stays at its default size. Weight and color create
            hierarchy before another font size is introduced.
          </Text>
          <Text type="supporting" color="secondary">
            Supporting text explains, timestamps, or adds quiet metadata.
          </Text>
        </VStack>
        <Card variant="muted" elevation="none">
          <VStack gap={3} align="start">
            <Text type="supporting" color="secondary">
              AI cue · 09:42
            </Text>
            <Text type="code">Ask who owns the launch readiness review.</Text>
            <Text type="code" color="secondary">
              confidence 0.86 · source transcript
            </Text>
          </VStack>
        </Card>
      </Grid>
    </FoundationSection>
  );
}

function ActionsSection() {
  return (
    <FoundationSection
      title="Actions"
      description="One primary action per region. Every press is tactile; icon-only controls always explain themselves."
    >
      <VStack gap={4} align="stretch">
        <HStack gap={2} wrap="wrap" vAlign="center">
          <Button label="Join meeting" variant="primary" />
          <Button label="Check setup" variant="secondary" />
          <Button label="Not now" variant="ghost" />
          <Button label="Leave call" variant="destructive" />
        </HStack>
        <HStack gap={2} wrap="wrap" vAlign="center">
          <Button label="Small" size="sm" variant="secondary" />
          <Button label="Medium" size="md" variant="secondary" />
          <Button label="Large" size="lg" variant="secondary" />
          <Button label="Saving" isLoading variant="primary" />
          <Button label="Unavailable" isDisabled variant="secondary" />
          <IconButton
            label="Mute microphone"
            tooltip="Mute microphone"
            icon={<Icon icon="microphone" />}
            variant="ghost"
          />
          <IconButton
            label="More meeting actions"
            tooltip="More meeting actions"
            icon={<Icon icon="moreHorizontal" />}
            variant="ghost"
          />
        </HStack>
      </VStack>
    </FoundationSection>
  );
}

function FormsSection() {
  const [meetingName, setMeetingName] = useState('Weekly product review');
  const [transcription, setTranscription] = useState(true);
  const [camera, setCamera] = useState('studio');
  const [consent, setConsent] = useState(true);

  return (
    <FoundationSection
      title="Forms and settings"
      description="Labels stay visible, status messages explain the problem, and touch targets remain comfortable."
    >
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={5}>
        <VStack gap={4} align="stretch">
          <TextInput
            label="Meeting name"
            description="Visible to everyone in the room."
            value={meetingName}
            onChange={setMeetingName}
            hasClear
          />
          <Selector
            label="Camera"
            description="Select the camera used when joining a room."
            options={[
              { value: 'studio', label: 'Studio Display camera' },
              { value: 'continuity', label: 'Continuity Camera' },
            ]}
            value={camera}
            onChange={setCamera}
            presentation="adaptive"
            startIcon={Video}
          />
          <TextInput
            label="Room code"
            value="q3-review"
            onChange={() => undefined}
            status={{
              type: 'success',
              message: 'This room code is available.',
            }}
            statusVariant="detached"
          />
        </VStack>
        <VStack gap={4} align="stretch">
          <TextInput
            label="Guest email"
            value="alex@"
            onChange={() => undefined}
            status={{
              type: 'error',
              message: 'Enter a complete email address.',
            }}
            statusVariant="detached"
          />
          <Switch
            label="Live transcription"
            value={transcription}
            onChange={setTranscription}
          />
          <CheckboxInput
            label="Let participants know transcription is active"
            description="Consent stays visible instead of being hidden in meeting settings."
            value={consent}
            onChange={setConsent}
          />
          <Switch
            label="Record automatically"
            value={false}
            onChange={() => undefined}
            isDisabled
          />
        </VStack>
      </Grid>
    </FoundationSection>
  );
}

function ProductLanguageSection() {
  return (
    <FoundationSection
      title="Product language"
      description="Common concepts are composed from Astryx primitives. They stay local until real features prove a reusable domain contract."
    >
      <Grid columns={{ minWidth: 250, max: 3, repeat: 'fit' }} gap={4}>
        <Card elevation="low">
          <VStack gap={4} align="stretch">
            <HStack gap={3} justify="between" vAlign="center">
              <HStack gap={2} vAlign="center">
                <Icon icon={Users} color="accent" />
                <Text weight="semibold">Room presence</Text>
              </HStack>
              <StatusDot variant="success" label="12 people connected" />
            </HStack>
            <VStack gap={1} align="start">
              <Heading level={3}>12 people are ready</Heading>
              <Text color="secondary">
                One participant is reconnecting. Audio remains available.
              </Text>
            </VStack>
            <ProgressBar
              label="Participant connection quality"
              value={92}
              hasValueLabel
            />
          </VStack>
        </Card>
        <Card variant="muted" elevation="none">
          <VStack gap={4} align="stretch">
            <HStack gap={2} vAlign="center">
              <Icon icon={Captions} color="accent" />
              <Text type="supporting" color="secondary">
                LIVE TRANSCRIPT · 09:42
              </Text>
            </HStack>
            <Text>
              “Let’s confirm the rollout owner before we leave this topic.”
            </Text>
            <HStack gap={2} wrap="wrap">
              <Button label="Open transcript" size="sm" variant="secondary" />
              <Button label="Copy quote" size="sm" variant="ghost" />
            </HStack>
          </VStack>
        </Card>
        <Card elevation="med">
          <VStack gap={4} align="stretch">
            <HStack gap={2} vAlign="center">
              <Icon icon={Sparkles} color="accent" />
              <Text type="supporting" color="secondary">
                UNMUTE CUE
              </Text>
            </HStack>
            <VStack gap={1} align="start">
              <Heading level={3}>Close the open loop</Heading>
              <Text type="code">
                Ask who owns the launch readiness review.
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Button label="Use this cue" size="sm" variant="primary" />
              <Button label="Dismiss" size="sm" variant="ghost" />
            </HStack>
          </VStack>
        </Card>
      </Grid>
    </FoundationSection>
  );
}

function FeedbackSection() {
  return (
    <FoundationSection
      title="Feedback and system states"
      description="The foundation includes loading, empty, success, warning, and error—not only the happy path."
    >
      <VStack gap={4} align="stretch">
        <Banner
          status="warning"
          title="Connection is unstable"
          description="Video quality was reduced to keep audio clear."
          endContent={<Button label="View details" size="sm" variant="ghost" />}
        />
        <HStack gap={3} wrap="wrap" vAlign="center">
          <StatusDot variant="success" label="Connection healthy" />
          <StatusDot variant="warning" label="Connection recovering" />
          <StatusDot variant="error" label="Connection interrupted" />
          <Text type="supporting" color="secondary">
            Status always pairs color with a visible label.
          </Text>
        </HStack>
        <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
          <Card>
            <VStack gap={3} align="stretch">
              <HStack gap={2} vAlign="center">
                <Skeleton width={36} height={36} radius="rounded" />
                <VStack gap={1} align="stretch" width="100%">
                  <Skeleton width="42%" height={12} />
                  <Skeleton width="68%" height={10} index={1} />
                </VStack>
              </HStack>
              <Skeleton width="100%" height={76} index={2} />
            </VStack>
          </Card>
          <Card>
            <EmptyState
              isCompact
              headingLevel={3}
              title="No notes yet"
              description="Notes appear here when the conversation starts."
              icon={<Icon icon="microphone" />}
              actions={
                <Button label="Start a note" size="sm" variant="secondary" />
              }
            />
          </Card>
        </Grid>
      </VStack>
    </FoundationSection>
  );
}

function LiveMediaSection() {
  return (
    <FoundationSection
      title="Live-media chrome"
      description="Meeting controls remain dim, readable, and compact even when the surrounding sheet is light."
    >
      <MediaTheme mode="dark">
        <Card elevation="high">
          <HStack gap={3} justify="between" vAlign="center" wrap="wrap">
            <HStack gap={2} vAlign="center">
              <Avatar name="Maya Chen" size="md" />
              <VStack gap={0.5} align="start">
                <HStack gap={1} vAlign="center">
                  <StatusDot variant="success" label="Maya Chen is speaking" />
                  <Text weight="semibold">Maya Chen</Text>
                </HStack>
                <Text type="supporting" color="secondary">
                  Speaking now
                </Text>
              </VStack>
            </HStack>
            <Text type="code">Ask about the rollout owner</Text>
            <HStack gap={2} vAlign="center">
              <IconButton
                label="Mute microphone"
                tooltip="Mute"
                icon={<Icon icon="microphone" />}
              />
              <Button label="Share" size="sm" variant="primary" />
            </HStack>
          </HStack>
        </Card>
      </MediaTheme>
    </FoundationSection>
  );
}

function FoundationSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <VStack as="section" gap={4} align="stretch">
      <VStack gap={1} align="start">
        <Heading level={2}>{title}</Heading>
        <Text color="secondary">{description}</Text>
      </VStack>
      {children}
    </VStack>
  );
}
