export const LOR_SESSION_KEY = 'thriftz_lor_session';

export type LorIntakeAnswers = {
  role: string;
  callsAttended: string;
  missedMeetingsPattern: string;
  peakActivity: string;
  biggestContribution: string;
  commitVolume: string;
  whatsappEngagement: string;
  helpedOthers: string;
  hoursPerWeek: string;
  productionMoment: string;
  biggestMistake: string;
  deservesMost: string;
  doesNotDeserve: string;
  sadMoment: string;
};

export type LorIntakeQA = { question: string; answer: string };

export type LorMessage = {
  sender: 'founder' | 'user';
  text: string;
  time: string;
  stageLabel?: string;
};

export type LorSession = {
  userName: string;
  intake: LorIntakeAnswers;
  intakeQA: LorIntakeQA[];
  messages: LorMessage[];
  founderVibe: number;
  hubris: number;
  completedAt: string;
};

export function saveLorSession(session: LorSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOR_SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem('thriftz_lor_gossip');
  localStorage.setItem('thriftz_lor_transcript', JSON.stringify(session.messages));
}

export function loadLorSession(): LorSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOR_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LorSession & {
      intake?: Record<string, string> & { slackEngagement?: string; bestAchievement?: string };
      proofOfWork?: string;
      gossip?: string;
    };
    if (parsed.intake) {
      if (parsed.intake.slackEngagement && !parsed.intake.whatsappEngagement) {
        parsed.intake.whatsappEngagement = parsed.intake.slackEngagement;
      }
      if (parsed.intake.bestAchievement && !parsed.intake.biggestContribution) {
        parsed.intake.biggestContribution = parsed.intake.bestAchievement;
      }
    }
    return parsed as LorSession;
  } catch {
    return null;
  }
}

export function clearLorSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOR_SESSION_KEY);
  localStorage.removeItem('thriftz_lor_gossip');
  localStorage.removeItem('thriftz_lor_transcript');
}
