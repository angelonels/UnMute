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
    return 'Example answer • demo notes\n\nMaya: refine the meeting layout.\nTheo: review the frontend interaction states.\nAmara: bring accessibility notes to the next review.\n\nThese are sample action items, not a live transcript.';
  return 'Example answer • demo notes\n\nThe team is exploring a quieter meeting experience. The current direction keeps people at the centre, puts supporting tools in side panels, and makes control states clear.\n\nThe next step is to review the layout and accessibility together. This response uses the sample discussion only.';
}
