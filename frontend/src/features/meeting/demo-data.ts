import type { AIStreamSource } from './ai-stream';
import type { MeetingMessage, Participant } from './meeting-model';

const names = [
  'Maya Chen',
  'Theo Bennett',
  'Amara Okafor',
  'Leo Martin',
  'Sofia Reyes',
  'Noah Park',
  'Priya Shah',
  'Ethan Cole',
  'Isla Wilson',
  'Mateo Silva',
  'Hana Kim',
  'Oliver Reed',
];
const tones: Participant['tone'][] = ['sage', 'clay', 'lavender', 'slate', 'sand', 'rose'];
const roles = [
  'Product designer',
  'Engineering',
  'Product',
  'Design systems',
  'Research',
  'Engineering',
];
export function demoParticipants(count: number, self: Participant): Participant[] {
  return [
    self,
    ...Array.from({ length: count - 1 }, (_, index): Participant => ({
      id: `demo-${index + 1}`,
      name: `${names[index % names.length]}${index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : ''}`,
      role: roles[index % roles.length] ?? 'Team member',
      tone: tones[index % tones.length] ?? 'sage',
      microphone: index % 3 === 0,
      camera: index % 4 !== 2,
      hand: index === 3,
    })),
  ];
}
export const demoMessages: MeetingMessage[] = [
  {
    id: 'demo-message-1',
    authorId: 'demo-1',
    text: 'Let’s keep the first version focused on the conversation.',
    createdAt: '2026-10-28T09:30:00Z',
  },
  {
    id: 'demo-message-2',
    authorId: 'demo-2',
    text: 'Agreed. A quieter interface gives people more room.',
    createdAt: '2026-10-28T09:31:00Z',
  },
  {
    id: 'demo-message-3',
    authorId: 'demo-3',
    text: 'I’ll bring the accessibility notes to our next review.',
    createdAt: '2026-10-28T09:32:00Z',
  },
];
export function demoAnswer(prompt: string) {
  if (/action|next|task/i.test(prompt))
    return '### Next steps\n\n- **Maya** · Refine the meeting layout.\n- **Theo** · Review the frontend interaction states.\n- **Amara** · Bring accessibility notes to the next review.\n\nFrom the sample discussion.';
  return '### A clearer meeting space\n\nThe team wants a quieter experience that keeps the conversation at the centre.\n\n- **People first.** Keep faces visible and supporting tools within reach.\n- **Clear controls.** Make microphone, camera and sharing states easy to read.\n- **A shared next step.** Review the layout and accessibility together.\n\nFrom the sample discussion.';
}

/** A development transport exercises the same reader, cancellation and partial-response path. */
export type DemoAIScenario = 'normal' | 'interrupted' | 'empty';
export const createDemoAIStream =
  (scenario: DemoAIScenario): AIStreamSource =>
  async ({ messages, signal }) => {
    const answer = demoAnswer(messages.at(-1)?.content ?? '');
    const chunks = answer.match(/.{1,18}(?:\s|$)|.{1,18}/gs) ?? [answer];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let index = 0;
    const clear = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    };
    let abort = () => {};
    return new ReadableStream<string>({
      start(controller) {
        abort = () => {
          clear();
          controller.error(new DOMException('Stopped', 'AbortError'));
        };
        signal.addEventListener('abort', abort, { once: true });
        const next = () => {
          if (signal.aborted) {
            abort();
            return;
          }
          if (scenario === 'interrupted' && index === 4) {
            clear();
            controller.error(new Error('Simulated interruption'));
            return;
          }
          if (scenario === 'empty') {
            clear();
            controller.close();
            return;
          }
          const chunk = chunks[index++];
          if (chunk === undefined) {
            clear();
            controller.close();
            return;
          }
          controller.enqueue(chunk);
          timer = setTimeout(next, 65);
        };
        timer = setTimeout(next, 400);
      },
      cancel: clear,
    });
  };
