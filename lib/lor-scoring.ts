import type { LorIntakeAnswers } from './lor-session';

export function computeLorRoleScores(
  intake: LorIntakeAnswers,
  founderVibe: number,
  hubris: number
): Record<string, number> {
  const scores: Record<string, number> = {
    THE_GHOST_INTERN: 0,
    THE_SLACK_POLL_ENTHUSIAST: 0,
    THE_OVER_PROMISER: 0,
    THE_LURKER_DEV: 0,
    THE_ENTITLED_CHANCER: 0,
    THE_LITERAL_SAVIOR: 0,
  };

  const add = (role: keyof typeof scores, n: number) => {
    scores[role] += n;
  };

  // Attendance — not everyone is the same
  switch (intake.callsAttended) {
    case 'all':
      add('THE_LITERAL_SAVIOR', 12);
      add('THE_OVER_PROMISER', 2);
      break;
    case 'most':
      add('THE_LITERAL_SAVIOR', 6);
      add('THE_OVER_PROMISER', 4);
      break;
    case 'half':
      add('THE_OVER_PROMISER', 6);
      add('THE_SLACK_POLL_ENTHUSIAST', 4);
      break;
    case 'few':
      add('THE_GHOST_INTERN', 8);
      add('THE_ENTITLED_CHANCER', 3);
      break;
    case 'zero':
      add('THE_GHOST_INTERN', 15);
      break;
  }

  switch (intake.missedMeetingsPattern) {
    case 'never_missed':
      add('THE_LITERAL_SAVIOR', 8);
      break;
    case 'monday_mornings':
    case 'exam_weeks':
      add('THE_OVER_PROMISER', 5);
      break;
    case 'async_excuse':
      add('THE_ENTITLED_CHANCER', 6);
      add('THE_OVER_PROMISER', 4);
      break;
    case 'forgot':
      add('THE_GHOST_INTERN', 6);
      break;
    case 'side_hustle':
      add('THE_GHOST_INTERN', 4);
      add('THE_ENTITLED_CHANCER', 3);
      break;
  }

  switch (intake.peakActivity) {
    case 'witching':
      add('THE_LURKER_DEV', 12);
      break;
    case 'morning':
    case 'afternoon':
      add('THE_LITERAL_SAVIOR', 6);
      break;
    case 'weekends':
      add('THE_LURKER_DEV', 4);
      add('THE_OVER_PROMISER', 3);
      break;
    case 'random':
      add('THE_GHOST_INTERN', 5);
      add('THE_SLACK_POLL_ENTHUSIAST', 3);
      break;
  }

  switch (intake.commitVolume) {
    case '50+':
      add('THE_LITERAL_SAVIOR', 14);
      add('THE_LURKER_DEV', 4);
      break;
    case '20-49':
      add('THE_LITERAL_SAVIOR', 10);
      add('THE_LURKER_DEV', 6);
      break;
    case '5-19':
      add('THE_LURKER_DEV', 8);
      break;
    case '1-4':
      add('THE_GHOST_INTERN', 6);
      add('THE_OVER_PROMISER', 4);
      break;
    case '0':
      add('THE_SLACK_POLL_ENTHUSIAST', 8);
      add('THE_GHOST_INTERN', 4);
      break;
    case 'unknown':
      add('THE_ENTITLED_CHANCER', 8);
      add('THE_OVER_PROMISER', 5);
      break;
  }

  switch (intake.biggestContribution) {
    case 'shipped_product':
    case 'fixed_outage':
      add('THE_LITERAL_SAVIOR', 10);
      add('THE_LURKER_DEV', 4);
      break;
    case 'campus_growth':
    case 'design_brand':
      add('THE_LITERAL_SAVIOR', 6);
      break;
    case 'whatsapp_carry':
      add('THE_SLACK_POLL_ENTHUSIAST', 6);
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'mentored':
      add('THE_LITERAL_SAVIOR', 12);
      break;
    case 'minimal':
      add('THE_GHOST_INTERN', 8);
      add('THE_OVER_PROMISER', 5);
      break;
  }

  switch (intake.biggestMistake) {
    case 'none_major':
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'overpromised':
    case 'missed_deadline':
      add('THE_OVER_PROMISER', 8);
      add('THE_GHOST_INTERN', 4);
      break;
    case 'whatsapp_blunder':
      add('THE_SLACK_POLL_ENTHUSIAST', 6);
      break;
    case 'wrong_deploy':
      add('THE_LURKER_DEV', 4);
      break;
  }

  switch (intake.whatsappEngagement) {
    case 'backbone':
      add('THE_LITERAL_SAVIOR', 12);
      break;
    case 'active':
      add('THE_LITERAL_SAVIOR', 6);
      break;
    case 'polls':
      add('THE_SLACK_POLL_ENTHUSIAST', 14);
      break;
    case 'lurker':
      add('THE_LURKER_DEV', 10);
      break;
    case 'ghost':
      add('THE_GHOST_INTERN', 12);
      break;
  }

  switch (intake.hoursPerWeek) {
    case '35+':
      add('THE_LITERAL_SAVIOR', 15);
      break;
    case '20-34':
      add('THE_LITERAL_SAVIOR', 8);
      break;
    case '10-19':
      add('THE_OVER_PROMISER', 5);
      break;
    case '5-9':
      add('THE_GHOST_INTERN', 6);
      add('THE_SLACK_POLL_ENTHUSIAST', 4);
      break;
    case 'under5':
      add('THE_GHOST_INTERN', 10);
      add('THE_ENTITLED_CHANCER', 5);
      break;
  }

  switch (intake.productionMoment) {
    case 'fixed':
      add('THE_LITERAL_SAVIOR', 12);
      break;
    case 'caused_fixed':
      add('THE_LURKER_DEV', 10);
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'caused':
      add('THE_OVER_PROMISER', 8);
      add('THE_ENTITLED_CHANCER', 4);
      break;
    case 'watched':
      add('THE_SLACK_POLL_ENTHUSIAST', 6);
      break;
    case 'unaware':
      add('THE_GHOST_INTERN', 8);
      break;
  }

  switch (intake.helpedOthers) {
    case 'often':
      add('THE_LITERAL_SAVIOR', 10);
      break;
    case 'sometimes':
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'rarely':
      add('THE_GHOST_INTERN', 3);
      break;
    case 'no':
      add('THE_GHOST_INTERN', 6);
      break;
  }

  switch (intake.deservesMost) {
    case 'founder':
    case 'dev_carry':
    case 'community_carry':
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'nobody':
      add('THE_SLACK_POLL_ENTHUSIAST', 3);
      break;
  }

  switch (intake.doesNotDeserve) {
    case 'myself':
      add('THE_GHOST_INTERN', 8);
      add('THE_OVER_PROMISER', 4);
      break;
    case 'ghost_intern':
    case 'hype_only':
    case 'whatsapp_only':
      add('THE_ENTITLED_CHANCER', 4);
      break;
    case 'no_one':
      add('THE_LITERAL_SAVIOR', 5);
      break;
  }

  switch (intake.sadMoment) {
    case 'nothing_major':
      add('THE_LITERAL_SAVIOR', 4);
      break;
    case 'unpaid_burnout':
      add('THE_LITERAL_SAVIOR', 6);
      add('THE_OVER_PROMISER', 3);
      break;
    case 'prod_disaster':
      add('THE_LURKER_DEV', 4);
      break;
    case 'team_drama':
    case 'founder_chaos':
      add('THE_OVER_PROMISER', 4);
      break;
  }

  // Negotiation gauges — dialogue outcomes
  if (hubris >= 85) {
    scores.THE_ENTITLED_CHANCER += 50;
  } else if (hubris >= 65) {
    scores.THE_ENTITLED_CHANCER += 25;
    scores.THE_OVER_PROMISER += 15;
  }

  if (founderVibe <= 15) {
    scores.THE_GHOST_INTERN += 40;
  } else if (founderVibe <= 35) {
    scores.THE_GHOST_INTERN += 20;
    scores.THE_OVER_PROMISER += 10;
  }

  if (founderVibe >= 80 && hubris <= 35) {
    scores.THE_LITERAL_SAVIOR += 35;
  } else if (founderVibe >= 65 && hubris <= 50) {
    scores.THE_LITERAL_SAVIOR += 15;
    scores.THE_LURKER_DEV += 15;
  } else if (founderVibe >= 55 && hubris <= 45) {
    scores.THE_LURKER_DEV += 20;
  }

  if (founderVibe >= 40 && founderVibe < 60 && hubris < 50) {
    scores.THE_SLACK_POLL_ENTHUSIAST += 15;
  }

  return scores;
}

export function getPersonalizedOpening(intake: LorIntakeAnswers, userName: string): string {
  const name = userName || 'Intern';
  const roleLabels: Record<string, string> = {
    web_dev: 'web dev',
    marketing: 'marketing',
    bizdev: 'business dev',
    community: 'community ops',
    design: 'design',
    floating: 'chaos agent',
  };
  const role = roleLabels[intake.role] ?? 'intern';

  let attendanceNote = '';
  if (intake.callsAttended === 'all') {
    attendanceNote = `I see you claim you attended basically every team call. Rare. I'll verify that.`;
  } else if (intake.callsAttended === 'zero' || intake.callsAttended === 'few') {
    attendanceNote = `Your intake says you barely showed up to calls. That already puts you on thin ice.`;
  } else {
    attendanceNote = `You said you hit ${intake.callsAttended === 'most' ? 'most' : 'some'} of the weekly calls — we'll see if that matches reality.`;
  }

  return `Hey ${name}. ${attendanceNote}\n\nYou listed yourself as ${role}. I've got your intake dossier from the team WhatsApp era — not convinced you deserve a Letter of Recommendation yet.\n\nThis is a live evaluation: quick intake, negotiation here, audit at the end. Don't perform.`;
}
