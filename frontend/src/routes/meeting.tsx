import { createFileRoute } from '@tanstack/react-router';
import { MeetingEntry } from '../features/meeting';

export const Route = createFileRoute('/meeting')({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: import.meta.env.DEV && (search.demo === true || search.demo === 'true'),
    microphone: search.microphone === true || search.microphone === 'true',
    camera: search.camera === true || search.camera === 'true',
  }),
  component: MeetingRoute,
});
function MeetingRoute() {
  const { demo, microphone, camera } = Route.useSearch();
  return <MeetingEntry demo={demo} microphone={microphone} camera={camera} />;
}
