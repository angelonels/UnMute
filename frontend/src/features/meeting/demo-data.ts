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

export type DemoDataMode = 'demo' | 'worst' | 'empty' | 'one' | 'large';

const worstNames = [
  'Aleksandra Wiśniewska-Kowalczyk',
  'Christopher Alexander Montgomery III',
  'Jo',
  '👩🏽‍💻 Amara Okafor',
  'محمد عبد الرحمن',
  'Nguyễn Thị Thanh Huyền',
  '山田 太郎',
];
const worstRoles = [
  'Principal accessibility and internationalization design systems researcher',
  '',
  'Engineering',
  'Customer experience and accessibility',
  'باحث تجربة المستخدم',
];

export function fixtureParticipants(mode: DemoDataMode, count: number, self: Participant) {
  if (mode === 'demo') return demoParticipants(count, self);
  if (mode === 'empty' || mode === 'one') return [self];
  const people = demoParticipants(mode === 'large' ? 1284 : 8, self);
  return people.map((person, index) =>
    person.self
      ? person
      : {
          ...person,
          name: worstNames[(index - 1) % worstNames.length] ?? person.name,
          role: worstRoles[(index - 1) % worstRoles.length] ?? '',
          hand: index === 2,
        },
  );
}

export function fixtureMessages(mode: DemoDataMode): MeetingMessage[] {
  if (mode === 'empty') return [];
  if (mode === 'one')
    return [
      {
        id: 'one-message',
        authorId: 'self',
        text: 'One message in the meeting.',
        createdAt: '2026-10-28T09:30:00Z',
      },
    ];
  if (mode === 'demo') return demoMessages;
  return [
    {
      id: 'worst-1',
      authorId: 'demo-1',
      text: 'Please review https://example.com/projects/accessibility-internationalization/customer-onboarding/very-long-reference-document?view=complete&section=participant-experience before our next meeting.',
      createdAt: '2026-10-28T09:30:00Z',
    },
    {
      id: 'worst-2',
      authorId: 'demo-2',
      text:
        'Line one: a note about the design.\nLine two: **bold** and <script>alert(1)</script> should stay literal.\n\n' +
        'Accessibility, language, and keyboard support need review before the release. '.repeat(18),
      createdAt: '2026-10-28T09:31:00Z',
    },
    {
      id: 'worst-3',
      authorId: 'demo-3',
      text: '👍🏽 ありがとう — شكراً',
      createdAt: '2026-10-28T09:32:00Z',
    },
  ];
}
