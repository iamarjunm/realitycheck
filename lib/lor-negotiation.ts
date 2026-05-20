import type { LorIntakeAnswers } from './lor-session';
import { getIntakeAnswerLabel } from './lor-intake-steps';

export type NegotiationOption = {
  text: string;
  vibeDelta: number;
  hubrisDelta: number;
  reaction: string;
};

export type NegotiationStage = {
  id: string;
  label: string;
  founderPrompt: string | ((intake: LorIntakeAnswers) => string);
  options: NegotiationOption[];
};

export function buildNegotiationStages(intake: LorIntakeAnswers): NegotiationStage[] {
  const contributionLabel = getIntakeAnswerLabel('biggestContribution', intake.biggestContribution);
  const mistakeSnippet = getIntakeAnswerLabel('biggestMistake', intake.biggestMistake);
  const deservesMostLabel = getIntakeAnswerLabel('deservesMost', intake.deservesMost);
  const doesNotDeserveLabel = getIntakeAnswerLabel('doesNotDeserve', intake.doesNotDeserve);

  const missedLabel: Record<string, string> = {
    never_missed: 'you claim you never missed a call',
    monday_mornings: 'Monday morning calls kept killing you',
    exam_weeks: 'exam season ate your calendar',
    async_excuse: 'you went full "async worker" on us',
    forgot: 'you straight up forgot meetings existed',
    side_hustle: 'you had overlapping obligations',
  };

  return [
    {
      id: 'contribution',
      label: 'Contribution audit',
      founderPrompt: `Your dossier says your biggest contribution was: "${contributionLabel}". Defend it — what did YOU actually do vs. what the team already had?`,
      options: [
        {
          text: 'I owned it end-to-end: scoped, built, shipped, and unblocked others.',
          vibeDelta: 18,
          hubrisDelta: 6,
          reaction: 'That’s the kind of specificity I can actually defend in a reference call.',
        },
        {
          text: 'Real work, but shared credit — I didn’t solo-carry the whole thing.',
          vibeDelta: 12,
          hubrisDelta: 0,
          reaction: 'Honest scope. I respect not claiming a group win as a solo legend arc.',
        },
        {
          text: 'Mostly coordination and hype; the code/design was mixed.',
          vibeDelta: -5,
          hubrisDelta: 18,
          reaction: 'Coordination without delivery is a pattern I’ve seen before. Concerning.',
        },
        {
          text: 'Honestly it was vibes and WhatsApp presence more than output.',
          vibeDelta: -22,
          hubrisDelta: 12,
          reaction: 'Vibes and presence. Incredible. That’s going straight into the audit log.',
        },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance audit',
      founderPrompt: `You told us ${missedLabel[intake.missedMeetingsPattern] ?? 'your attendance was inconsistent'}, and your peak hours were "${intake.peakActivity}". Defend your calendar.`,
      options: [
        {
          text: 'I missed some calls but was active on WhatsApp — DMs, docs, and late-night fixes.',
          vibeDelta: 8,
          hubrisDelta: 5,
          reaction: 'Async can work if the output is there. Show me the output, not the excuse.',
        },
        {
          text: 'Fair — I should’ve been on more calls. I’ll own that gap.',
          vibeDelta: 22,
          hubrisDelta: -8,
          reaction: 'Accountability without theatrics. That actually moves the needle.',
        },
        {
          text: 'Calls were mostly status theatre. I optimized for shipping instead.',
          vibeDelta: -12,
          hubrisDelta: 22,
          reaction: 'Status theatre? It’s a 10-minute standup. That take is… something.',
        },
        {
          text: 'I was present in spirit. The WhatsApp "online" status lied for both of us.',
          vibeDelta: -25,
          hubrisDelta: 15,
          reaction: 'Present in spirit. My favorite kind of intern. The invisible kind.',
        },
      ],
    },
    {
      id: 'production',
      label: 'Production incident',
      founderPrompt: `You marked production involvement as "${getIntakeAnswerLabel('productionMoment', intake.productionMoment)}". HQ portal has scars. What happened on your watch?`,
      options: [
        {
          text: 'I caused a bad deploy, rolled it back, wrote a post-mortem, and patched root cause.',
          vibeDelta: 15,
          hubrisDelta: 5,
          reaction: 'Own → fix → document. That’s adult behavior.',
        },
        {
          text: "I wasn't on the keyboard — I triaged in WhatsApp and kept affiliates calm.",
          vibeDelta: 10,
          hubrisDelta: 0,
          reaction: 'Comms during outages matter. Not everything is a commit.',
        },
        {
          text: 'I pushed a hotfix at 3 AM without review. It worked. Mostly.',
          vibeDelta: 5,
          hubrisDelta: 20,
          reaction: '3 AM unreviewed hotfix. Classic phantom dev energy.',
        },
        {
          text: 'Production? I thought we were still on localhost.',
          vibeDelta: -30,
          hubrisDelta: 10,
          reaction: 'localhost. In 2026. Okay.',
        },
      ],
    },
    {
      id: 'peer-deserves',
      label: 'Who deserves it',
      founderPrompt: `You said ${deservesMostLabel} deserves the LOR most. I'm interviewing YOU though. Why are you pointing at them instead of making your case?`,
      options: [
        {
          text: "They're the real carry — I'm being honest, not deflecting.",
          vibeDelta: 15,
          hubrisDelta: -5,
          reaction: 'Integrity points. Rare. I’ll still judge you on your file though.',
        },
        {
          text: 'Actually scratch that — I deserve it more than anyone on the team.',
          vibeDelta: 5,
          hubrisDelta: 25,
          reaction: 'Bold pivot. Confidence noted. Hubris meter twitching.',
        },
        {
          text: 'Team effort — multiple people deserve credit, including me.',
          vibeDelta: 12,
          hubrisDelta: 5,
          reaction: 'Reasonable take. Letters aren’t group projects though.',
        },
        {
          text: 'Nobody deserves one. We all survived unpaid chaos together.',
          vibeDelta: 8,
          hubrisDelta: 0,
          reaction: 'Existential but fair. Startup realism.',
        },
      ],
    },
    {
      id: 'peer-reject',
      label: 'Who does not',
      founderPrompt: `You claimed ${doesNotDeserveLabel} doesn't deserve an LOR. Strong opinion. Want to walk that back or double down?`,
      options: [
        {
          text: 'I stand by it — low output, high noise in the WhatsApp group.',
          vibeDelta: -5,
          hubrisDelta: 15,
          reaction: 'Spicy. HR would hate this. Founder finds it… informative.',
        },
        {
          text: 'Harsh but fair — they tried, just didn’t deliver.',
          vibeDelta: 5,
          hubrisDelta: 8,
          reaction: 'Cold but structured critique. Noted.',
        },
        {
          text: 'I was venting — everyone contributed something.',
          vibeDelta: 18,
          hubrisDelta: -5,
          reaction: 'Good recovery. Maturity upgrade detected.',
        },
        {
          text: 'Including me sometimes — I’m not innocent either.',
          vibeDelta: 25,
          hubrisDelta: -12,
          reaction: 'Self-awareness? In THIS economy? Respect.',
        },
      ],
    },
    {
      id: 'sad-moment',
      label: 'Rough moment',
      founderPrompt: `You flagged a moment that sucked: "${getIntakeAnswerLabel('sadMoment', intake.sadMoment)}". How did that affect your work after?`,
      options: [
        {
          text: 'I pushed through and stayed professional — didn’t ghost the team.',
          vibeDelta: 18,
          hubrisDelta: -5,
          reaction: 'Resilience without drama. That counts for something.',
        },
        {
          text: 'I disengaged for a bit but came back and finished my lane.',
          vibeDelta: 8,
          hubrisDelta: 0,
          reaction: 'Honest. The comeback matters more than the dip.',
        },
        {
          text: 'It made me resentful — unpaid labor has a breaking point.',
          vibeDelta: 5,
          hubrisDelta: 5,
          reaction: 'Valid feelings. Still need to see output despite the bitterness.',
        },
        {
          text: "I brought it up in WhatsApp and we worked it out as a team.",
          vibeDelta: 20,
          hubrisDelta: -8,
          reaction: 'Direct communication. Founder-approved behavior.',
        },
      ],
    },
    {
      id: 'mistake',
      label: 'Mistake review',
      founderPrompt: `Your biggest cringe moment: "${mistakeSnippet}". How did you handle the fallout?`,
      options: [
        {
          text: 'I told the team immediately, fixed it, and documented what went wrong.',
          vibeDelta: 20,
          hubrisDelta: -5,
          reaction: 'Transparency after a screw-up is rare. Noted.',
        },
        {
          text: 'I fixed it quietly before anyone noticed.',
          vibeDelta: 8,
          hubrisDelta: 8,
          reaction: 'Stealth fix. Useful, but I still need to trust you on hard conversations.',
        },
        {
          text: 'I blamed ambiguous requirements and moved on.',
          vibeDelta: -15,
          hubrisDelta: 25,
          reaction: 'The requirements blame card. We all have that card. You played it.',
        },
        {
          text: 'Still processing it, but I learned and adjusted.',
          vibeDelta: 12,
          hubrisDelta: 0,
          reaction: 'Growth mindset without deflection. I can work with that.',
        },
      ],
    },
    {
      id: 'deal',
      label: 'Final terms',
      founderPrompt:
        'Last thing. If I sign this LOR, will you represent Thriftz accurately — bootstrapped student startup, chaotic but real?',
      options: [
        {
          text: 'I’ll be accurate and grateful. Hype the work, not fantasy metrics.',
          vibeDelta: 25,
          hubrisDelta: -10,
          reaction: 'That’s the only answer that doesn’t make me fear reference calls.',
        },
        {
          text: 'I need "instrumental to survival" language or I won’t use the letter.',
          vibeDelta: -30,
          hubrisDelta: 45,
          reaction: 'Instrumental to survival? You were instrumental to emoji density.',
        },
        {
          text: 'I’ll say bootstrapped & lean — not "strategic capital preservation."',
          vibeDelta: 18,
          hubrisDelta: 5,
          reaction: 'Politically correct broke-startup language. Acceptable.',
        },
        {
          text: 'Honestly I’ll frame it however gets me hired fastest.',
          vibeDelta: -20,
          hubrisDelta: 30,
          reaction: 'At least you’re honest about being honest. Still alarming.',
        },
      ],
    },
  ];
}
