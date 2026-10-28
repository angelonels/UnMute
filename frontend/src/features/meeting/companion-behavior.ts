import type { ExpressionName, StateName } from '../../components/companion/dotty-engine';

export interface CompanionBehavior {
  activity:
    | 'wandering'
    | 'attentive'
    | 'composing'
    | 'reading'
    | 'thinking'
    | 'working'
    | 'celebrating'
    | 'alert'
    | 'settling';
  state: StateName;
  expression: ExpressionName | null;
  attention: 'composer' | 'answer' | null;
  caption: string;
}

/** Response ownership wins; local attention can interrupt a completed-response celebration. */
export function companionBehavior(input: {
  response: StateName;
  busy: boolean;
  focused: boolean;
  draft: string;
  reading: boolean;
}): CompanionBehavior {
  if (input.busy)
    return {
      activity: input.response === 'thinking' ? 'thinking' : 'working',
      state: input.response === 'thinking' ? 'thinking' : 'working',
      expression: null,
      attention: input.response === 'thinking' ? null : 'answer',
      caption: input.response === 'thinking' ? 'Thinking it through…' : 'On it…',
    };
  if (input.focused && input.draft.trim())
    return {
      activity: 'composing',
      state: 'listening',
      expression: 'inspecting',
      attention: 'composer',
      caption: 'What’s on your mind?',
    };
  if (input.response === 'celebrating' || input.response === 'alert')
    return {
      activity: input.response,
      state: input.response,
      expression: null,
      attention: null,
      caption: input.response === 'celebrating' ? 'There we go!' : 'Let’s try that again',
    };
  if (input.focused)
    return {
      activity: 'attentive',
      state: 'listening',
      expression: 'happy',
      attention: 'composer',
      caption: 'All ears',
    };
  if (input.reading)
    return {
      activity: 'reading',
      state: 'idle',
      expression: 'inspecting',
      attention: 'answer',
      caption: 'Taking another look',
    };
  if (input.response === 'listening')
    return {
      activity: 'settling',
      state: 'listening',
      expression: 'happy',
      attention: null,
      caption: 'Right here',
    };
  return {
    activity: 'wandering',
    state: 'idle',
    expression: 'happy',
    attention: null,
    caption: 'A little company for your thoughts',
  };
}
