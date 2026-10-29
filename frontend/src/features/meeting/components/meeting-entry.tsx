import type { AIStreamSource } from '../ai-stream';
import { useState } from 'react';
import { authClient } from '../../../api/auth-client';
import { AuthPage } from '../../auth';
import { MeetingPage } from './meeting-page';

export function MeetingEntry({
  demo,
  microphone,
  camera,
  aiSource,
}: {
  aiSource?: AIStreamSource;
  demo: boolean;
  microphone: boolean;
  camera: boolean;
}) {
  const { data: session, isPending, error } = authClient.useSession();
  const [revision, setRevision] = useState(0);
  const developmentDemo = import.meta.env.DEV && demo;
  if (!developmentDemo && (!session || isPending || error)) return <AuthPage />;
  return (
    <MeetingPage
      key={revision}
      aiSource={aiSource}
      userName={developmentDemo ? 'Alex Morgan' : (session?.user.name ?? 'You')}
      demo={developmentDemo}
      initialMicrophone={microphone}
      initialCamera={camera}
      onRestart={() => setRevision((previous) => previous + 1)}
    />
  );
}
