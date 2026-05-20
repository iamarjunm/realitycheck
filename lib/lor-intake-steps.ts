import type { LorIntakeAnswers } from './lor-session';

export type IntakeStep = {
  id: keyof LorIntakeAnswers;
  type: 'select' | 'text';
  question: string;
  hint?: string;
  options?: { value: string; label: string }[]; // present when type === 'select'
};

export const LOR_INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'role',
    type: 'select',
    question: 'What was your actual role at Thriftz?',
    hint: 'Be honest. We have the org chart somewhere.',
    options: [
      { value: 'web_dev', label: 'Web Dev — marketplace site, HQ portal, deployments' },
      { value: 'marketing', label: 'Marketing — TikToks, Reels, campus hype' },
      { value: 'bizdev', label: 'Business Dev — college outreach, partnerships' },
      { value: 'community', label: 'Community — affiliates, WhatsApp chaos control' },
      { value: 'design', label: 'Graphic Design — posters, brand, making us look legit' },
      { value: 'floating', label: 'Floating intern — did whatever was yelled in the WhatsApp group' },
    ],
  },
  {
    id: 'callsAttended',
    type: 'select',
    question: 'How many weekly team calls did you actually attend? (~12 total)',
    options: [
      { value: 'all', label: '10–12 — I lived on Google Meet' },
      { value: 'most', label: '7–9 — missed a few, always had a reason' },
      { value: 'half', label: '4–6 — half-in, half ghost' },
      { value: 'few', label: '1–3 — camera off, name only' },
      { value: 'zero', label: '0 — I heard they happened' },
    ],
  },
  {
    id: 'missedMeetingsPattern',
    type: 'select',
    question: 'When you DID miss meetings, what was usually going on?',
    options: [
      { value: 'never_missed', label: "I didn't miss — I was always there" },
      { value: 'monday_mornings', label: 'Monday 9 AM calls (sleep schedule cooked)' },
      { value: 'exam_weeks', label: 'Midterm / final exam weeks only' },
      { value: 'async_excuse', label: '"I work async" — I was on WhatsApp only' },
      { value: 'forgot', label: 'Forgot until someone called me on WhatsApp' },
      { value: 'side_hustle', label: 'Overlapping with another internship / job' },
    ],
  },
  {
    id: 'peakActivity',
    type: 'select',
    question: 'When were you most active for Thriftz?',
    options: [
      { value: 'morning', label: '6–11 AM — morning grinder' },
      { value: 'afternoon', label: '12–6 PM — normal human hours' },
      { value: 'night', label: '7 PM–midnight — after classes' },
      { value: 'witching', label: '1–5 AM — production pushes & chaos' },
      { value: 'weekends', label: 'Weekends only — weekday ghost' },
      { value: 'random', label: 'Random 20-min bursts then silence' },
    ],
  },
  {
    id: 'biggestContribution',
    type: 'text',
    question: 'In your own words, what was your biggest contribution to Thriftz? (1–3 sentences)',
    hint: 'Describe the work and its impact. Be specific where possible (feature, metric, or outcome).',
  },
  {
    id: 'commitVolume',
    type: 'select',
    question: 'Roughly how many commits did YOU push to Thriftz repos?',
    options: [
      { value: '50+', label: '50+ — I basically owned a module' },
      { value: '20-49', label: '20–49 — consistent contributor' },
      { value: '5-19', label: '5–19 — sporadic but real' },
      { value: '1-4', label: '1–4 — README, typo, config tweak' },
      { value: '0', label: '0 — I am not a developer' },
      { value: 'unknown', label: "I don't know / someone else committed for me" },
    ],
  },
  {
    id: 'whatsappEngagement',
    type: 'select',
    question: 'How would you describe your WhatsApp presence?',
    options: [
      { value: 'backbone', label: 'Answered questions, threads, unblocked people daily' },
      { value: 'active', label: 'Regular messages + thoughtful replies' },
      { value: 'polls', label: 'Polls, reacts, voice notes — light on substance' },
      { value: 'lurker', label: 'Read everything, typed almost nothing' },
      { value: 'ghost', label: 'Left on read energy' },
    ],
  },
  {
    id: 'helpedOthers',
    type: 'select',
    question: 'Did you help other interns?',
    options: [
      { value: 'often', label: 'Yes — regularly mentored / reviewed / unblocked' },
      { value: 'sometimes', label: 'Sometimes when asked' },
      { value: 'rarely', label: 'Rarely — too underwater myself' },
      { value: 'no', label: 'No — focused on my own lane' },
    ],
  },
  {
    id: 'hoursPerWeek',
    type: 'select',
    question: 'Honest hours per week on Thriftz (unpaid)',
    options: [
      { value: '35+', label: '35+ — this was my personality' },
      { value: '20-34', label: '20–34 — serious side quest' },
      { value: '10-19', label: '10–19 — part-time energy' },
      { value: '5-9', label: '5–9 — minimum viable intern' },
      { value: 'under5', label: 'Under 5 — I was technically enrolled' },
    ],
  },
  {
    id: 'productionMoment',
    type: 'select',
    question: 'Your relationship with production incidents',
    options: [
      { value: 'fixed', label: 'I fixed a live outage / critical bug' },
      { value: 'caused_fixed', label: 'I broke prod, then fixed it same night' },
      { value: 'caused', label: 'I broke prod. Someone else cleaned up.' },
      { value: 'watched', label: 'I watched in the WhatsApp group with popcorn' },
      { value: 'unaware', label: "Didn't know we had production" },
    ],
  },
  {
    id: 'biggestMistake',
    type: 'select',
    question: 'Biggest mistake or cringe moment',
    options: [
      { value: 'missed_deadline', label: 'Missed a deadline / went MIA' },
      { value: 'wrong_deploy', label: 'Bad deploy / broke something' },
      { value: 'whatsapp_blunder', label: 'Sent something unhinged in the team WhatsApp' },
      { value: 'overpromised', label: 'Overpromised then disappeared' },
      { value: 'affiliate_incident', label: 'Awkward moment with an affiliate / partner' },
      { value: 'none_major', label: 'Nothing major — mostly clean' },
    ],
  },
  {
    id: 'deservesMost',
    type: 'text',
    question: 'Name the person who deserves an LOR the MOST (besides yourself) and why',
    hint: 'Include the person\'s name and a short reason (role or specific action).',
  },
  {
    id: 'doesNotDeserve',
    type: 'text',
    question: 'Who do you think does NOT deserve an LOR and why (honest opinion)',
    hint: 'Name and short reason. Be concise but truthful.',
  },
  {
    id: 'sadMoment',
    type: 'text',
    question: 'Describe one incident at Thriftz that upset you or that you didn\'t like (briefly)',
    hint: 'A short description of the incident and why it affected you.',
  },
];

export function getIntakeAnswerLabel(id: keyof LorIntakeAnswers, value: string): string {
  const step = LOR_INTAKE_STEPS.find((s) => s.id === id);
  if (!step) return value;
  if (step.type === 'select' && step.options) {
    return step.options.find((o) => o.value === value)?.label ?? value;
  }
  // For text answers, return the raw user-provided value
  return value;
}

export function intakeToQA(intake: LorIntakeAnswers): { question: string; answer: string }[] {
  return LOR_INTAKE_STEPS.map((step) => ({
    question: step.question,
    answer: getIntakeAnswerLabel(step.id, intake[step.id]),
  }));
}
