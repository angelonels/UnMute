import type { AIStreamSource } from '../ai-stream';
import { useState } from 'react';
import { authClient } from '../../../api/auth-client';
import { AuthPage, SessionPending } from '../../auth';
import { MeetingPage } from './meeting-page';

type EntryProps = {
  aiSource?: AIStreamSource;
  demo: boolean;
  microphone: boolean;
  camera: boolean;
};

export function MeetingEntry(props: EntryProps) {
  // The public development preview owns no session and must not consume auth rate limits.
  if (import.meta.env.DEV && props.demo)
    return <MeetingPreview {...props} demo userName="Alex Morgan" />;
  return <AuthenticatedMeeting {...props} />;
}

function AuthenticatedMeeting(props: EntryProps) {
  const { data: session, isPending, error } = authClient.useSession();
  if (isPending) return <SessionPending />;
  if (!session || error) return <AuthPage />;
  return <MeetingPreview {...props} demo={false} userName={session.user.name ?? 'You'} />;
}

function MeetingPreview({
  demo,
  microphone,
  camera,
  aiSource,
  userName,
}: EntryProps & { userName: string }) {
  const [revision, setRevision] = useState(0);
  return (
    <MeetingPage
      key={revision}
      aiSource={aiSource}
      userName={userName}
      demo={demo}
      initialMicrophone={microphone}
      initialCamera={camera}
      onRestart={() => setRevision((previous) => previous + 1)}
    />
  );
}
