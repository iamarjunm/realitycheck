import type { LorIntakeAnswers } from './lor-session';

export type IntakeStep = {
  id: keyof LorIntakeAnswers;
  type: 'select';
  question: string;
  hint?: string;
  options: { value: string; label: string }[];
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
    type: 'select',
    question: 'Your biggest contribution to Thriftz',
    options: [
      { value: 'shipped_product', label: 'Shipped a real feature / page / flow' },
      { value: 'fixed_outage', label: 'Fixed a live bug or outage' },
      { value: 'campus_growth', label: 'Grew campus reach / affiliates / partnerships' },
      { value: 'design_brand', label: 'Levelled up brand / posters / content' },
      { value: 'whatsapp_carry', label: 'Kept the WhatsApp group alive & unblocked people' },
      { value: 'mentored', label: 'Helped other interns ship their work' },
      { value: 'minimal', label: 'Honestly… not much concrete' },
    ],
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
    type: 'select',
    question: 'Who on the team deserves an LOR the MOST (besides yourself)?',
    options: [
      { value: 'dev_carry', label: 'The dev who actually shipped / fixed prod' },
      { value: 'community_carry', label: 'The person who held WhatsApp & affiliates together' },
      { value: 'marketing_carry', label: 'The person who drove outreach & content' },
      { value: 'quiet_grinder', label: 'The quiet intern who did more than they advertised' },
      { value: 'founder', label: 'Honestly? Arjun / the founders — they carried us' },
      { value: 'nobody', label: 'Nobody — we were all equally chaotic' },
    ],
  },
  {
    id: 'doesNotDeserve',
    type: 'select',
    question: "Who does NOT deserve an LOR and why (in your honest opinion)?",
    options: [
      { value: 'ghost_intern', label: 'The ghost — barely showed up, zero output' },
      { value: 'hype_only', label: 'The hype machine — all talk, no delivery' },
      { value: 'whatsapp_only', label: 'Emoji-only energy — polls but no real work' },
      { value: 'blame_shifter', label: 'Always had excuses, never owned mistakes' },
      { value: 'myself', label: 'Me — I know my file is weak' },
      { value: 'no_one', label: "No one — everyone tried in their own way" },
    ],
  },
  {
    id: 'sadMoment',
    type: 'select',
    question: 'A moment at Thriftz that made you sad, stressed, or not enjoy it',
    options: [
      { value: 'unpaid_burnout', label: 'Unpaid burnout — too much work, no compensation' },
      { value: 'ignored_ideas', label: 'My ideas / work got ignored in the group chat' },
      { value: 'prod_disaster', label: 'A production disaster I got blamed for' },
      { value: 'team_drama', label: 'Team drama or tension in WhatsApp' },
      { value: 'founder_chaos', label: 'Chaotic founder energy / unclear direction' },
      { value: 'nothing_major', label: 'Nothing major — rough but fine overall' },
    ],
  },
];

export function getIntakeAnswerLabel(id: keyof LorIntakeAnswers, value: string): string {
  const step = LOR_INTAKE_STEPS.find((s) => s.id === id);
  if (!step) return value;
  return step.options.find((o) => o.value === value)?.label ?? value;
}

export function intakeToQA(intake: LorIntakeAnswers): { question: string; answer: string }[] {
  return LOR_INTAKE_STEPS.map((step) => ({
    question: step.question,
    answer: getIntakeAnswerLabel(step.id, intake[step.id]),
  }));
}
