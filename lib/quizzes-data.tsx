import React from 'react';
import { Cpu, Terminal, AlertTriangle, Skull, Flame, Ghost, Sparkles, Zap, HeartCrack, Baby, Coins, Radio, Radar, Shield, Bomb, MessageCircle, Briefcase, Camera, Headphones, Palette, Moon, Sun, Coffee, Glasses, Brain } from 'lucide-react';
import type { QuizDef } from './quizzes/types';

type AbyssChoice = {
  text: string;
  depth: number;
  sanity?: number;
};

type AbyssQuestionPool = {
  depth: number;
  texts: string[];
  choices: AbyssChoice[];
};

const createAbyssQuestion = (id: string, depth: number, text: string, choices: AbyssChoice[]) => ({
  id,
  depth,
  text,
  answers: choices.map((choice) => ({
    text: choice.text,
    points: {
      depth: choice.depth,
      sanity: choice.sanity ?? Math.max(1, choice.depth + 2),
    },
  })),
});

const abyssQuestionPools: AbyssQuestionPool[] = [
  {
    depth: 0,
    choices: [
      { text: 'Pretend you did not see it.', depth: 0, sanity: 1 },
      { text: 'Wave back and keep walking.', depth: 1, sanity: 2 },
      { text: 'Go over and ask if they know you.', depth: 2, sanity: 3 },
    ],
    texts: [
      'A stranger on the street waves like they know you.',
      'Your phone opens to a draft message you do not remember typing.',
      'One clock in the room is exactly three seconds behind the others.',
      'Your reflection blinks a little too late.',
      'The elevator stops on your floor even though nobody pressed the button.',
      'A note app opens with your name already written at the top.',
      'The houseplant by your window seems to lean toward you.',
      'You hear footsteps stop outside your door and then go quiet.',
    ],
  },
  {
    depth: 1,
    choices: [
      { text: 'Ignore it and keep moving.', depth: 0, sanity: 2 },
      { text: 'Check the mirror, then the phone.', depth: 1, sanity: 3 },
      { text: 'Answer the message and wait for a reply.', depth: 3, sanity: 4 },
    ],
    texts: [
      'You are sure you heard your own voice from another room.',
      'Your browser opens a blank tab titled later.',
      'A streetlight turns on the instant you look at it.',
      'Someone uses your childhood nickname in a crowd of strangers.',
      'Your coffee tastes faintly like pennies.',
      'An ad describes the exact mood you were trying not to show.',
      'The hallway feels longer on the way back than it did on the way out.',
      'A picture on the wall looks like it was hung more recently than yesterday.',
    ],
  },
  {
    depth: 2,
    choices: [
      { text: 'Shut it down and do not answer.', depth: 0, sanity: 3 },
      { text: 'Ask what it wants.', depth: 3, sanity: 5 },
      { text: 'Answer it in your own voice.', depth: 5, sanity: 6 },
    ],
    texts: [
      'Your left hand seems to know the answer before you do.',
      'A voicemail contains only breathing and your laugh.',
      'You blink and the room looks like it was rearranged by someone who hates you personally.',
      'The mirror smiles one frame too late.',
      'A familiar song is playing somewhere inside the wall.',
      'A train passes, but nobody remembers hearing it.',
      'Your shadow stays behind for a second after you move.',
      'You wake up with dirt under one fingernail and no memory of where it came from.',
    ],
  },
  {
    depth: 3,
    choices: [
      { text: 'Deflect and change the subject.', depth: 1, sanity: 3 },
      { text: 'Admit a little more than you planned.', depth: 3, sanity: 5 },
      { text: 'Tell the whole truth.', depth: 5, sanity: 7 },
    ],
    texts: [
      'A friend says something you were about to text them.',
      'You catch yourself rehearsing apologies for things you have not done yet.',
      'One memory feels edited, like a badly cut scene.',
      'Your group chat goes quiet right after you type your real thought.',
      'Someone asks what you are hiding and they sound certain.',
      'Your own handwriting appears in a place you never wrote.',
      'You start wondering which version of you people are actually tolerating.',
      'A photo makes you look relieved in a way you do not remember feeling.',
    ],
  },
  {
    depth: 4,
    choices: [
      { text: 'Look away and keep pretending this is normal.', depth: 0, sanity: 4 },
      { text: 'Touch the change and see if it reacts.', depth: 3, sanity: 6 },
      { text: 'Let it continue and see what becomes of you.', depth: 5, sanity: 8 },
    ],
    texts: [
      'Your reflection uses different expressions when nobody is watching.',
      'You forget your face for a split second in a dark window.',
      'The voice in your head starts using your full name.',
      'A scar appears where a worry used to be.',
      'You can feel a room remembering you after you leave it.',
      'Your pulse feels like a knock from the inside.',
      'You find your name on something you never owned.',
      'Your dreams stop pretending they belong to you.',
    ],
  },
  {
    depth: 5,
    choices: [
      { text: 'Deny it and stay where you are.', depth: 1, sanity: 5 },
      { text: 'Ask for proof.', depth: 5, sanity: 8 },
      { text: 'Accept the answer and keep going.', depth: 5, sanity: 10 },
    ],
    texts: [
      'You realize the darkness behind your eyes has been listening.',
      'The thing in the mirror introduces itself without moving its mouth.',
      'A future version of you begs you to stop asking questions.',
      'Your name tastes unfamiliar when you say it aloud.',
      'The room feels relieved when you sit still.',
      'Your thoughts arrive with fingerprints that are not yours.',
      'The abyss asks whether you want truth or comfort.',
      'Something inside you answers before you do.',
    ],
  },
];

const abyssQuestions = abyssQuestionPools.flatMap((pool) =>
  pool.texts.map((text, index) => createAbyssQuestion(`a${pool.depth}${index}`, pool.depth, text, pool.choices))
);

export const QUIZZES: QuizDef[] = [
  // QUIZ 1: Reality Check
  {
    id: 'npc', title: 'The NPC Index', subtitle: 'Simulated Existence Assessment', description: 'Brutally categorize your true role in the background runtime.',
    roles: {
      BACKGROUND_EXTRA: {
        title: "BACKGROUND EXTRA", subtitle: "Code: NULL_ENTITY", description: "You have zero impact on the overarching plot. The simulation saves processing power by rendering you at 720p.", stats: [{ label: "Aura", val: 14 }, { label: "Dialogue", val: 0 }, { label: "Screen Time", val: 100 }, { label: "Impact", val: 0 }], theme: "from-zinc-500/20 to-zinc-900/80 border-zinc-500", textClass: "text-zinc-300", icon: <Cpu className="w-8 h-8 opacity-50" />, rarity: 'common', resultText: "You belong in the background.", passive: "Invisibility (Unintentional)"
      },
      YAPPER: {
        title: "THE YAPPER", subtitle: "Code: AUDIO_OVERFLOW", description: "High dialogue output, zero forward narrative momentum. You are the unskippable tutorial text box.", stats: [{ label: "Aura", val: 45 }, { label: "Dialogue", val: 99 }, { label: "Action", val: 12 }, { label: "Brainrot", val: 85 }], theme: "from-orange-500/20 to-red-900/80 border-orange-500", textClass: "text-orange-400", icon: <Radio className="w-8 h-8 text-orange-400" />, rarity: 'rare', resultText: "Please stop talking. We beg you.", passive: "Uninterruptible Cast (Monologue)"
      },
      DOOMSCROLLER: {
        title: "THE DOOMSCROLLER", subtitle: "Code: IDLE_LOOP", description: "Physically here, mentally inside a For You page. The simulation frequently pauses your subroutines to save RAM.", stats: [{ label: "Aura", val: 5 }, { label: "Screen Time", val: 99 }, { label: "Posture", val: 12 }, { label: "Sanity", val: 0 }], theme: "from-emerald-500/20 to-teal-900/80 border-emerald-500", textClass: "text-emerald-400", icon: <Radar className="w-8 h-8 text-emerald-400" />, rarity: 'rare', resultText: "Wake up. It has been 6 hours.", passive: "Time Dilation (Hours feel like seconds)"
      },
      GLITCH: {
        title: "THE GLITCH", subtitle: "Code: FATAL_ERROR", description: "Your behavior defies algorithmic prediction. You are actually interesting, but devs want to patch you out.", stats: [{ label: "Aura", val: 99 }, { label: "Consistency", val: 0 }, { label: "Unpredictability", val: 99 }, { label: "Vibes", val: 100 }], theme: "from-fuchsia-500/40 to-purple-900/90 border-fuchsia-500", textClass: "text-fuchsia-400", icon: <Zap className="w-8 h-8 text-fuchsia-400" />, rarity: 'glitched', resultText: "A threat to the simulation's stability.", passive: "NoClip (Ignores boundaries)"
      },
      MAIN_CHARACTER: {
        title: "MAIN CHARACTER", subtitle: "Code: PROTAGONIST", description: "Against all odds, the universe revolves around you. Enjoy the plot armor.", stats: [{ label: "Aura", val: 95 }, { label: "Plot Armor", val: 99 }, { label: "Delusion", val: 80 }, { label: "Impact", val: 90 }], theme: "from-yellow-400/40 to-amber-900/90 border-yellow-400", textClass: "text-yellow-400", icon: <Sparkles className="w-8 h-8 text-yellow-400" />, rarity: 'legendary', resultText: "You actually are the chosen one.", passive: "Plot Armor (Immunity)"
      }
    },
    questions: [
      { id: 'q1', text: 'A plan falls apart last minute. You...', answers: [{ text: 'Quietly adapt and keep things moving.', points: { MAIN_CHARACTER: 2, GLITCH: 1 } }, { text: 'Start narrating how doomed everything is.', points: { YAPPER: 2, DOOMSCROLLER: 1 } }, { text: 'Wait for someone else to decide.', points: { BACKGROUND_EXTRA: 2 } }] },
      { id: 'q2', text: 'In unfamiliar social settings you usually...', answers: [{ text: 'Drift to the edges and observe.', points: { BACKGROUND_EXTRA: 2, DOOMSCROLLER: 1 } }, { text: 'Find the weirdest person there immediately.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } }, { text: 'Accidentally become the loudest one there.', points: { YAPPER: 2 } }] },
      { id: 'q3', text: 'Someone says something deeply incorrect in public.', answers: [{ text: 'Correct them calmly.', points: { MAIN_CHARACTER: 2 } }, { text: 'Turn it into an absurd bit.', points: { GLITCH: 2, YAPPER: 1 } }, { text: 'Pretend not to hear.', points: { BACKGROUND_EXTRA: 2 } }] },
      { id: 'q4', text: 'Your relationship with your phone is...', answers: [{ text: 'Tool, not companion.', points: { MAIN_CHARACTER: 2 } }, { text: 'Unfortunately symbiotic.', points: { DOOMSCROLLER: 2 } }, { text: 'Mostly for sending deranged thoughts.', points: { YAPPER: 2, GLITCH: 1 } }] },
      { id: 'q5', text: 'What usually happens when you have a strange idea?', answers: [{ text: 'I probably act on it.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } }, { text: 'I explain it for 20 minutes.', points: { YAPPER: 2 } }, { text: 'I forget it existed.', points: { DOOMSCROLLER: 2 } }] },
      { id: 'q6', text: 'Someone starts panicking in a crisis. You...', answers: [{ text: 'Take charge immediately.', points: { MAIN_CHARACTER: 2 } }, { text: 'Match their panic with even weirder energy.', points: { GLITCH: 2, YAPPER: 1 } }, { text: 'Back away slowly.', points: { BACKGROUND_EXTRA: 2, DOOMSCROLLER: 1 } }] },
      { id: 'q7', text: 'A pigeon makes prolonged eye contact with you.', answers: [{ text: 'Nod respectfully. We have an understanding.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } }, { text: 'Take a photo for the group chat with a voice note.', points: { YAPPER: 2 } }, { text: 'Look at my phone to avoid the interaction.', points: { DOOMSCROLLER: 2, BACKGROUND_EXTRA: 1 } }] },
      { id: 'q8', text: 'You\'ve been walking in the wrong direction for blocks.', answers: [{ text: 'Stop immediately, turn around confidently.', points: { MAIN_CHARACTER: 2 } }, { text: 'Keep walking until I can casually loop back.', points: { BACKGROUND_EXTRA: 2, DOOMSCROLLER: 1 } }, { text: 'Just accept my new destination.', points: { GLITCH: 2 } }] },
      { id: 'q9', text: 'The Wi-Fi goes out completely.', answers: [{ text: 'Finally, true peace.', points: { BACKGROUND_EXTRA: 2 } }, { text: 'Initiate existential crisis protocol.', points: { DOOMSCROLLER: 2, YAPPER: 1 } }, { text: 'Go outside and start touching moss.', points: { GLITCH: 2, MAIN_CHARACTER: 1 } }] },
      { id: 'q10', text: 'An alarm rings loudly, but no one seems to care.', answers: [{ text: 'Investigate the source.', points: { MAIN_CHARACTER: 2 } }, { text: 'Put on headphones and turn up the volume.', points: { DOOMSCROLLER: 2 } }, { text: 'Assume it\'s part of the simulation\'s soundtrack.', points: { GLITCH: 2, BACKGROUND_EXTRA: 1 } }] }
    ]
  },
  // QUIZ 2: Liability Check
  {
    id: 'liability', title: 'Group Liability Test', subtitle: 'Friend Group Liability Index', description: 'Every group has one. Are you the anchor, or the one actively sinking the ship?',
    roles: {
      THE_BANK: {
        title: "THE BANK", subtitle: "Class: SUGAR_PARENT", description: "You cover the Uber. You pay for the pizza. You let people 'Venmo you later'. You are the only reason this group survives financially.", stats: [{ label: "Wealth", val: 85 }, { label: "Patience", val: 99 }, { label: "Resentment", val: 70 }, { label: "Chaos", val: 10 }], theme: "from-green-500/30 to-emerald-900/80 border-green-500", textClass: "text-green-400", icon: <Coins className="w-8 h-8 text-green-400" />, rarity: 'epic', resultText: "We literally owe you our lives (and $400).", passive: "Infinite Wallet"
      },
      THE_INSTIGATOR: {
        title: "THE INSTIGATOR", subtitle: "Class: CHAOS_ENGINE", description: "You wake up and choose violence. You send risky texts for your friends. You thrive on the drama.", stats: [{ label: "Toxicity", val: 95 }, { label: "Entertainment", val: 100 }, { label: "Empathy", val: 5 }, { label: "Boredom", val: 0 }], theme: "from-red-600/40 to-black/90 border-red-600", textClass: "text-red-500", icon: <Flame className="w-8 h-8 text-red-500" />, rarity: 'epic', resultText: "Some people just want to watch the world burn.", passive: "Gaslight"
      },
      THE_FLAKE: {
        title: "THE FLAKE", subtitle: "Class: 404_NOT_FOUND", description: "You say 'I might pull up' but everyone knows you are already in pajamas.", stats: [{ label: "Reliability", val: 0 }, { label: "Excuses", val: 100 }, { label: "Mystery", val: 80 }, { label: "Sleep", val: 95 }], theme: "from-slate-500/20 to-slate-900/80 border-slate-500", textClass: "text-slate-300", icon: <Ghost className="w-8 h-8 text-slate-300" />, rarity: 'common', resultText: "We knew you wouldn't show up.", passive: "Invisibilty Cloak"
      },
      THE_CRYPTID: {
        title: "THE CRYPTID", subtitle: "Class: LORE_INTENSIVE", description: "Nobody knows what you do for a living. You drop insane backstory lore casually during brunch.", stats: [{ label: "Mystery", val: 100 }, { label: "Lore", val: 99 }, { label: "Clarity", val: 0 }, { label: "Vibes", val: 85 }], theme: "from-indigo-500/40 to-violet-900/90 border-indigo-500", textClass: "text-indigo-400", icon: <Skull className="w-8 h-8 text-indigo-400" />, rarity: 'glitched', resultText: "Unsolved mysteries episode waiting to happen.", passive: "Lore Drop"
      },
      THE_MOM: {
        title: "THE PARENT", subtitle: "Class: DAMAGE_CONTROL", description: "You carry ibuprofen and water. You are constantly apologizing for the INSTIGATOR. You hold this group together.", stats: [{ label: "Responsibility", val: 100 }, { label: "Stress", val: 99 }, { label: "Fun", val: 20 }, { label: "Preparedness", val: 100 }], theme: "from-amber-500/40 to-yellow-900/90 border-amber-500", textClass: "text-amber-400", icon: <Shield className="w-8 h-8 text-amber-400" />, rarity: 'legendary', resultText: "Thank you for your service.", passive: "Medkit"
      },
      THE_ALIBI: {
          title: "THE OMITTED", subtitle: "Class: REDACTED", description: "You exist outside the friend group's legal liabilities. If questioned by authorities, they don't know you.", stats: [{ label: "Stealth", val: 100 }, { label: "Plausible Deniability", val: 100 }, { label: "Trust", val: 10 }, { label: "Traceability", val: 0 }], theme: "from-black via-zinc-900 to-black border-zinc-800", textClass: "text-zinc-500", icon: <Ghost className="w-8 h-8 text-zinc-500" />, rarity: 'mythic', resultText: "You were never here.", passive: "Erase Footage"
      }
    },
    questions: [
      { id: 'l1', text: 'A deadline is in 2 hours and the group chat is silent. You...', answers: [{ text: 'Build a shared doc and assign tasks.', points: { THE_MOM: 2, THE_BANK: 1 } }, { text: 'Send 14 voice notes debating strategy.', points: { THE_INSTIGATOR: 2 } }, { text: 'Mute chat and hope destiny handles it.', points: { THE_FLAKE: 2, THE_CRYPTID: 1, THE_ALIBI: 2 } }] },
      { id: 'l2', text: 'The group is deciding where to eat. It\'s been 30 minutes.', answers: [{ text: 'Pay the delivery fee yourself just to end the misery.', points: { THE_BANK: 2, THE_MOM: 1 } }, { text: 'Suggest we all split up and forage.', points: { THE_CRYPTID: 2, THE_INSTIGATOR: 1 } }, { text: '"I\'m not actually hungry anymore."', points: { THE_FLAKE: 2, THE_ALIBI: 1 } }] },
      { id: 'l3', text: 'Friend texts "I messed up." Your immediate thought?', answers: [{ text: '"Send location. Do I need cash or an alibi?"', points: { THE_BANK: 2, THE_MOM: 1, THE_ALIBI: 1 } }, { text: '"Spill everything or we are no longer friends."', points: { THE_INSTIGATOR: 2 } }, { text: '*Read receipt. Replies 3 hours later.*', points: { THE_FLAKE: 2, THE_CRYPTID: 1 } }] },
      { id: 'l4', text: 'It\'s 2 AM at a party. Where are you?', answers: [{ text: 'Rounding up everyone\'s coats.', points: { THE_MOM: 2 } }, { text: 'Telling a stranger deeply personal secrets.', points: { THE_INSTIGATOR: 2 } }, { text: 'Appeared on someone\'s story in a different city.', points: { THE_CRYPTID: 2, THE_FLAKE: 1, THE_ALIBI: 2 } }] },
      { id: 'l5', text: 'Somebody asks you to spot them for drinks.', answers: [{ text: 'Provide card without looking at the total.', points: { THE_BANK: 2 } }, { text: 'Agree, but then "forget" your wallet.', points: { THE_FLAKE: 2, THE_INSTIGATOR: 1 } }, { text: 'Barter with the bartender using a cool rock.', points: { THE_CRYPTID: 2, THE_ALIBI: 1 } }] },
      { id: 'l6', text: 'How do you handle a shared group tab?', answers: [{ text: 'Calculate it to the nearest cent via Venmo request.', points: { THE_MOM: 2 } }, { text: '"Just put it on my card, guys."', points: { THE_BANK: 2 } }, { text: 'Vanish to the bathroom right before the check drops.', points: { THE_FLAKE: 2, THE_ALIBI: 2 } }] },
      { id: 'l7', text: 'Your role in planning the group trip?', answers: [{ text: 'Spreadsheets, itineraries, booking reservations.', points: { THE_MOM: 2 } }, { text: 'Putting down the deposit for the Airbnb.', points: { THE_BANK: 2 } }, { text: 'Replying "in" and ignoring all subsequent logistics.', points: { THE_FLAKE: 2, THE_CRYPTID: 1, THE_ALIBI: 1 } }] },
      { id: 'l8', text: 'A random guy tries to pick a fight with your friend.', answers: [{ text: 'Get between them and de-escalate.', points: { THE_MOM: 2, THE_BANK: 1 } }, { text: 'Throw a drink to assert dominance.', points: { THE_INSTIGATOR: 2 } }, { text: 'Stand entirely still so they forget you\'re there.', points: { THE_CRYPTID: 2, THE_FLAKE: 1, THE_ALIBI: 2 } }] },
      { id: 'l9', text: 'Someone starts crying in public.', answers: [{ text: 'Hand them a tissue you produced out of nowhere.', points: { THE_MOM: 2 } }, { text: 'Stare intensely into their eyes. Cry to mirror them.', points: { THE_CRYPTID: 2, THE_ALIBI: 1 } }, { text: 'Feign ignorance and look at a wall.', points: { THE_FLAKE: 2, THE_BANK: 1 } }] },
      { id: 'l10', text: '"Can I borrow your car?"', answers: [{ text: '"Keys are on the counter."', points: { THE_BANK: 2 } }, { text: '"Only if I can drive and drift."', points: { THE_INSTIGATOR: 2 } }, { text: '"I don\'t drive, I traverse."', points: { THE_CRYPTID: 2, THE_FLAKE: 1, THE_ALIBI: 2 } }] }
    ]
  },
  // QUIZ 3: Brainrot
  {
    id: 'brainrot', title: 'Brainrot Index', subtitle: 'Terminal Diagnosis', description: 'We are all infected. The algorithm has rewired your brain. How far gone are you?',
    roles: {
      THE_LURKER: {
        title: "THE LURKER", subtitle: "Class: INCOGNITO", description: "You watch 500 clips a day but have never interacted. You leave no digital footprint. A ghost in the machine.", stats: [{ label: "Engagement", val: 0 }, { label: "Consumption", val: 100 }, { label: "Mystery", val: 99 }, { label: "Sanity", val: 40 }], theme: "from-zinc-600/30 to-black/90 border-zinc-500", textClass: "text-zinc-400", icon: <Ghost className="w-8 h-8 text-zinc-400" />, rarity: 'common', resultText: "You are the silent observer.", passive: "Invisibility"
      },
      REPLY_GUY: {
        title: "THE REPLY GUY", subtitle: "Class: PARASOCIAL_DEMON", description: "Always in the comments. Always trying to be funny. The creators do not know you.", stats: [{ label: "Delusion", val: 99 }, { label: "Clout Chasing", val: 100 }, { label: "Originality", val: 5 }, { label: "Speed", val: 95 }], theme: "from-blue-500/40 to-cyan-900/90 border-blue-400", textClass: "text-blue-400", icon: <MessageCircle className="w-8 h-8 text-blue-400" />, rarity: 'rare', resultText: "They are not going to pin your comment.", passive: "Fast Typer"
      },
      CORECORE_EDITOR: {
        title: "CORECORE SCHOLAR", subtitle: "Class: SENSORY_OVERLOAD", description: "Your brain is purely aesthetic. You process emotion through subway surfers gameplay footage.", stats: [{ label: "Aesthetics", val: 100 }, { label: "Attention Span", val: 0 }, { label: "Irony", val: 99 }, { label: "Depression", val: 80 }], theme: "from-purple-500/40 to-fuchsia-900/90 border-purple-400", textClass: "text-purple-400", icon: <Baby className="w-8 h-8 text-purple-400" />, rarity: 'epic', resultText: "Real life needs subway surfers to focus.", passive: "Split Screen"
      },
      TASTEMAKER: {
        title: "THE TASTEMAKER", subtitle: "Class: ALGORITHM_GOD", description: "You find the meme 3 weeks before Instagram reels gets it. You dictate the slang.", stats: [{ label: "Influence", val: 100 }, { label: "Trendiness", val: 99 }, { label: "Gatekeeping", val: 90 }, { label: "Sanity", val: 10 }], theme: "from-amber-400/50 to-orange-900/90 border-amber-400", textClass: "text-amber-400", icon: <Sparkles className="w-8 h-8 text-amber-400" />, rarity: 'legendary', resultText: "He who controls the memes, controls the universe.", passive: "Gatekeep"
      },
      BRAINROT_SINGULARITY: {
        title: "THE SINGULARITY", subtitle: "Class: DOOMED_CODE", description: "You communicate entirely in post-ironic slang. Reality to you is just a series of green screens.", stats: [{ label: "Rot", val: 100 }, { label: "Reality", val: 0 }, { label: "Slang", val: 100 }, { label: "Vibes", val: 0 }], theme: "from-rose-500/40 via-red-900/90 to-black border-red-500", textClass: "text-red-500", icon: <Skull className="w-8 h-8 text-red-500" />, rarity: 'abyssal', resultText: "Your brain is cooked.", passive: "Brain Smoother"
      }
    },
    questions: [
      { id: 'b1', text: 'You see a wildly controversial post taking off.', answers: [{ text: 'Watch the fire but say nothing.', points: { THE_LURKER: 2, TASTEMAKER: 1 } }, { text: '"First," or drop a worn-out copypasta.', points: { REPLY_GUY: 2, CORECORE_EDITOR: 1 } }, { text: 'Remake it ironically.', points: { TASTEMAKER: 2, CORECORE_EDITOR: 1, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b2', text: 'Your YouTube watch history looks like:', answers: [{ text: '4-hour video essays on games you don\'t play.', points: { CORECORE_EDITOR: 2, THE_LURKER: 1 } }, { text: 'Trending page and drama breakdowns.', points: { REPLY_GUY: 2, TASTEMAKER: 1 } }, { text: 'Blank. It\'s paused. Forever.', points: { THE_LURKER: 2, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b3', text: 'A friend shares a meme that is a month old.', answers: [{ text: '"Lmao" (You\'re polite).', points: { THE_LURKER: 2 } }, { text: '"I literally sent you this 3 weeks ago."', points: { TASTEMAKER: 2 } }, { text: 'Explain why it\'s not funny anymore.', points: { REPLY_GUY: 2, TASTEMAKER: 1, BRAINROT_SINGULARITY: 2 } }] },
      { id: 'b4', text: 'Your approach to commenting?', answers: [{ text: 'Never. It leaves a trace.', points: { THE_LURKER: 2, CORECORE_EDITOR: 1 } }, { text: 'Constantly tagging people and seeking attention.', points: { REPLY_GUY: 2 } }, { text: 'Only if I can start a trend.', points: { TASTEMAKER: 2, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b5', text: 'Your preferred method of listening to music:', answers: [{ text: 'Unreleased tracks found on obscure Soundcloud accounts.', points: { TASTEMAKER: 2 } }, { text: 'Slowed + Reverb over melancholic visuals.', points: { CORECORE_EDITOR: 2 } }, { text: 'Whatever Spotify\'s algorithm feeds me.', points: { THE_LURKER: 2 } }, { text: '10 hour loops of brainrot audio.', points: { BRAINROT_SINGULARITY: 2 } }] },
      { id: 'b6', text: 'What\'s playing on your second monitor?', answers: [{ text: 'Gameplay footage. I need multiple stimuli.', points: { CORECORE_EDITOR: 2, THE_LURKER: 1, BRAINROT_SINGULARITY: 1 } }, { text: 'Discord servers where I argue about crypto/anime.', points: { REPLY_GUY: 2 } }, { text: 'An obscure Twitch stream with 12 viewers.', points: { TASTEMAKER: 2, THE_LURKER: 1 } }] },
      { id: 'b7', text: 'You accidentally go viral. Your reaction?', answers: [{ text: 'Delete the post out of panic.', points: { THE_LURKER: 2, CORECORE_EDITOR: 1 } }, { text: 'Promote a random scam in the replies.', points: { REPLY_GUY: 2 } }, { text: 'Pivot this into a branding opportunity immediately.', points: { TASTEMAKER: 2, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b8', text: 'How do you handle bad opinions online?', answers: [{ text: 'Assume it\'s bait, but screenshot it anyway.', points: { THE_LURKER: 2, TASTEMAKER: 1 } }, { text: 'Try to ratio them in the quotes.', points: { REPLY_GUY: 2 } }, { text: 'Compile it into an edits compilation.', points: { CORECORE_EDITOR: 2, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b9', text: 'A new social app drops.', answers: [{ text: 'Claim my handle, secure my aesthetic early.', points: { TASTEMAKER: 2 } }, { text: 'Complain about it on Twitter.', points: { REPLY_GUY: 2 } }, { text: 'Wait a year to see if it survives.', points: { THE_LURKER: 2, CORECORE_EDITOR: 1, BRAINROT_SINGULARITY: 1 } }] },
      { id: 'b10', text: '(Hidden Wildcard) A sentient AI asks you for a meme to summarize humanity.', answers: [{ text: 'Sending a void meme or deep fried nonsense.', points: { CORECORE_EDITOR: 2, BRAINROT_SINGULARITY: 2 } }, { text: 'Sending whatever is currently trending on TikTok.', points: { REPLY_GUY: 2 } }, { text: 'Telling the AI it wouldn\'t understand.', points: { TASTEMAKER: 2, THE_LURKER: 1 } }] }
    ]
  },
  // QUIZ 4: The 9-to-5 Matrix
  {
    id: 'corp', title: 'The 9-to-5 Matrix', subtitle: 'Corporate Survival Assessment', description: 'Evaluate your operational capacity in the artificial construct of late-stage capitalism.',
    roles: {
      QUIET_QUITTER: {
        title: "QUIET QUITTER", subtitle: "Class: STEALTH_MODE", description: "You do exactly enough to not get fired, and zero % more. Your mouse jiggler is your best friend.", stats: [{ label: "Efficiency", val: 5 }, { label: "Stealth", val: 100 }, { label: "Anxiety", val: 20 }, { label: "Free Time", val: 99 }], theme: "from-zinc-500/20 to-zinc-900/80 border-zinc-500", textClass: "text-zinc-400", icon: <Headphones className="w-8 h-8 text-zinc-400" />, rarity: 'common', resultText: "You are surviving the matrix.", passive: "Active Status Faker"
      },
      OVERWORKED_INTERN: {
        title: "OVERWORKED INTERN", subtitle: "Class: SACRIFICIAL_NODE", description: "Running on 3 hours of sleep and 4 cold brews. You do everyone else's work for \"exposure\".", stats: [{ label: "Caffeine", val: 100 }, { label: "Burnout", val: 99 }, { label: "Respect", val: 0 }, { label: "Hope", val: 15 }], theme: "from-orange-500/30 to-red-900/80 border-orange-500", textClass: "text-orange-400", icon: <Coffee className="w-8 h-8 text-orange-400" />, rarity: 'common', resultText: "Blink twice if you need help.", passive: "Endless Grind"
      },
      LINKEDIN_LUNATIC: {
        title: "LINKEDIN LUNATIC", subtitle: "Class: HUSTLE_CULTIST", description: "You post 3 paragraph essays about leadership after buying a coffee. You are heavily drinking the corporate kool-aid.", stats: [{ label: "Networking", val: 100 }, { label: "Delusion", val: 95 }, { label: "Cringe", val: 99 }, { label: "Self-Awareness", val: 0 }], theme: "from-blue-600/40 to-blue-900/90 border-blue-500", textClass: "text-blue-400", icon: <Briefcase className="w-8 h-8 text-blue-400" />, rarity: 'epic', resultText: "Agree?", passive: "Viral Synergies"
      },
      HR_INFORMANT: {
        title: "HR INFORMANT", subtitle: "Class: SURVEILLANCE_DRONE", description: "Friendly on the surface, but takes mental screenshots. Everything you say can and will be used against you.", stats: [{ label: "Trust", val: 0 }, { label: "Information", val: 99 }, { label: "Danger", val: 90 }, { label: "Small Talk", val: 85 }], theme: "from-red-600/30 to-rose-900/80 border-red-500", textClass: "text-red-400", icon: <Radar className="w-8 h-8 text-red-400" />, rarity: 'rare', resultText: "The walls have ears.", passive: "Mental Screenshot"
      },
      ROGUE_DEV: {
        title: "ROGUE DEV", subtitle: "Class: ROOT_ACCESS", description: "You wrote all the legacy codebase in an obscure language. They legally cannot fire you.", stats: [{ label: "Job Security", val: 100 }, { label: "Social Skills", val: 5 }, { label: "Power", val: 99 }, { label: "Coffee", val: 100 }], theme: "from-green-500/40 to-emerald-900/90 border-green-400", textClass: "text-green-400", icon: <Terminal className="w-8 h-8 text-green-400" />, rarity: 'legendary', resultText: "You hold the master keys.", passive: "Unfireable"
      },
      FOUNDER_CEO: {
        title: "THE FOUNDER", subtitle: "Class: SYSTEM_ARCHITECT", description: "You built the matrix. You operate above rules, ethics, and sleep. You demand 100x out of everyone.", stats: [{ label: "Power", val: 100 }, { label: "Empathy", val: 0 }, { label: "Wealth", val: 100 }, { label: "Reality", val: 10 }], theme: "from-indigo-600/50 via-purple-900/90 to-black border-indigo-500", textClass: "text-indigo-400", icon: <AlertTriangle className="w-8 h-8 text-indigo-400" />, rarity: 'glitched', resultText: "You own the simulation.", passive: "Golden Parachute"
      }
    },
    questions: [
      { id: 'c1', text: '5 PM on Friday. "Quick sync" request drops.', answers: [{ text: 'Decline without explanation.', points: { ROGUE_DEV: 2, QUIET_QUITTER: 1, FOUNDER_CEO: 2 } }, { text: 'Accept and prepare a 5-slide deck.', points: { LINKEDIN_LUNATIC: 2 } }, { text: 'Accept, but cry silently off-camera.', points: { OVERWORKED_INTERN: 2, HR_INFORMANT: 1 } }] },
      { id: 'c2', text: 'How do you handle office gossip?', answers: [{ text: 'Turn it into an inspirational post about resilience.', points: { LINKEDIN_LUNATIC: 2, FOUNDER_CEO: 1 } }, { text: 'Document it in a private file "just in case".', points: { HR_INFORMANT: 2, ROGUE_DEV: 1 } }, { text: 'Nod along, say nothing, forget it instantly.', points: { QUIET_QUITTER: 2 } }] },
      { id: 'c3', text: 'A massive production bug brings down the service.', answers: [{ text: 'It was my code, but they can\'t fire me.', points: { ROGUE_DEV: 2 } }, { text: 'Offer to work the weekend unconditionally.', points: { OVERWORKED_INTERN: 2, LINKEDIN_LUNATIC: 1 } }, { text: 'Post about the importance of failure.', points: { LINKEDIN_LUNATIC: 2, HR_INFORMANT: 1, FOUNDER_CEO: 2 } }] },
      { id: 'c4', text: 'Your Slack status right now?', answers: [{ text: 'Custom script that rotates status based on keystrokes.', points: { ROGUE_DEV: 2 } }, { text: '"Synergizing 🚀" or "Crushing it 🔥".', points: { LINKEDIN_LUNATIC: 2, FOUNDER_CEO: 1 } }, { text: 'Always green, mouse jiggler active.', points: { QUIET_QUITTER: 2, HR_INFORMANT: 1 } }] },
      { id: 'c5', text: 'Free food in the breakroom!', answers: [{ text: 'Secure 4 slices and vanish back to the basement.', points: { ROGUE_DEV: 2, QUIET_QUITTER: 1 } }, { text: 'Stand near it to overhear conversations.', points: { HR_INFORMANT: 2 } }, { text: 'I\'m too busy to eat, I brought a Soylent.', points: { OVERWORKED_INTERN: 2, FOUNDER_CEO: 2 } }] },
      { id: 'c6', text: 'The CEO asks for "bold new ideas" in an all-hands.', answers: [{ text: 'Pitch a buzzword salad (AI, Blockchain).', points: { LINKEDIN_LUNATIC: 2, FOUNDER_CEO: 2 } }, { text: 'Suggest entirely removing an unnecessary team.', points: { HR_INFORMANT: 2, ROGUE_DEV: 1 } }, { text: 'Stare at the floor. Avoid eye contact.', points: { QUIET_QUITTER: 2, OVERWORKED_INTERN: 1 } }] },
      { id: 'c7', text: 'You notice a colleague is struggling.', answers: [{ text: 'Send them my backlog so they have a distraction.', points: { ROGUE_DEV: 2, FOUNDER_CEO: 2 } }, { text: 'Offer to do it for them.', points: { OVERWORKED_INTERN: 2 } }, { text: 'CC their manager with "helpful suggestions".', points: { HR_INFORMANT: 2, LINKEDIN_LUNATIC: 1 } }] },
      { id: 'c8', text: 'Your computer wallpaper at work?', answers: [{ text: 'A quote from Steve Jobs or Elon Musk.', points: { LINKEDIN_LUNATIC: 2, FOUNDER_CEO: 2 } }, { text: 'Terminal matrix code or obscure Linux mascot.', points: { ROGUE_DEV: 2 } }, { text: 'Generic default background.', points: { QUIET_QUITTER: 2, HR_INFORMANT: 1 } }] },
      { id: 'c9', text: 'Performance Review time.', answers: [{ text: 'Present a 50-page portfolio of my "impact".', points: { LINKEDIN_LUNATIC: 2 } }, { text: 'Smile, agree, and continue doing the bare minimum.', points: { QUIET_QUITTER: 2 } }, { text: 'Express intense anxiety over my 99% rating.', points: { OVERWORKED_INTERN: 2, HR_INFORMANT: 1 } }, { text: 'You\'re the one giving the review.', points: { FOUNDER_CEO: 3 } }] },
      { id: 'c10', text: '(Wildcard) You find a USB drive labeled "CONFIDENTIAL" in the lobby.', answers: [{ text: 'Plug it into the server, see what happens.', points: { ROGUE_DEV: 2 } }, { text: 'Hand it securely to management.', points: { HR_INFORMANT: 2, QUIET_QUITTER: 1 } }, { text: 'Brag about finding it on social media.', points: { LINKEDIN_LUNATIC: 2, FOUNDER_CEO: 1 } }] }
    ]
  },
  // QUIZ 5: The Aesthetic Profiler
  {
    id: 'aesthetic', title: 'The Aesthetic Profiler', subtitle: 'Algorithmic Identity Scan', description: 'Determines which aesthetic subculture replaced your actual personality.',
    roles: {
      DARK_ACADEMIA: {
        title: "DARK ACADEMIA", subtitle: "Class: PRETENTIOUS", description: "You own 15 unread classic novels and treat coffee addiction as a personality trait. You romanticize rain.", stats: [{ label: "Pretension", val: 99 }, { label: "Literature", val: 75 }, { label: "Caffeine", val: 95 }, { label: "Sunlight", val: 0 }], theme: "from-amber-900/60 to-black/90 border-amber-800", textClass: "text-amber-600", icon: <Glasses className="w-8 h-8 text-amber-600" />, rarity: 'rare', resultText: "A tortured soul in a tweed jacket.", passive: "Quote Shakespeare"
      },
      Y2K_SURVIVOR: {
        title: "Y2K SURVIVOR", subtitle: "Class: TREND_CYCLER", description: "You brought back low-rise jeans. Your entire style is based on early 2000s paparazzi photos.", stats: [{ label: "Nostalgia", val: 100 }, { label: "Trends", val: 95 }, { label: "Practicality", val: 5 }, { label: "Sparkles", val: 80 }], theme: "from-pink-500/40 to-fuchsia-900/80 border-pink-500", textClass: "text-pink-400", icon: <Camera className="w-8 h-8 text-pink-400" />, rarity: 'epic', resultText: "Living in a flip-phone fantasy.", passive: "Flash Photography"
      },
      CYBER_GRUNGE: {
        title: "CYBER GRUNGE", subtitle: "Class: DISTOPIAN_CHIC", description: "You look like you're ready to hack a megacorporation but actually you just listen to Deftones.", stats: [{ label: "Edge", val: 99 }, { label: "Hacking", val: 5 }, { label: "Hardware", val: 70 }, { label: "Vibes", val: 100 }], theme: "from-cyan-600/40 to-blue-900/90 border-cyan-500", textClass: "text-cyan-400", icon: <Zap className="w-8 h-8 text-cyan-400" />, rarity: 'rare', resultText: "Ready for the neon apocalypse.", passive: "Heavy Static"
      },
      WEIRDCORE_ENTITY: {
        title: "WEIRDCORE ENTITY", subtitle: "Class: LIMINAL_SPACE", description: "Your aesthetic makes people uncomfortable. You find comfort in empty parking lots and eye motifs.", stats: [{ label: "Comfort", val: 0 }, { label: "Creepiness", val: 100 }, { label: "Liminality", val: 99 }, { label: "Reality", val: 10 }], theme: "from-purple-600/40 to-black/90 border-purple-500", textClass: "text-purple-400", icon: <Moon className="w-8 h-8 text-purple-400" />, rarity: 'glitched', resultText: "Wake up. You are dreaming.", passive: "Unsettling Aura"
      },
      COASTAL_GRANNY: {
        title: "COASTAL GRANNY", subtitle: "Class: ULTIMATE_PEACE", description: "You live a high-income, low-stress fantasy involving white linen pants and white wine at 3 PM.", stats: [{ label: "Peace", val: 100 }, { label: "Linen", val: 99 }, { label: "Edge", val: 0 }, { label: "Wealth", val: 85 }], theme: "from-sky-300/30 to-blue-900/80 border-sky-300", textClass: "text-sky-300", icon: <Sun className="w-8 h-8 text-sky-300" />, rarity: 'legendary', resultText: "You have achieved true serenity.", passive: "Immaculate Vibes"
      },
      VOID_CORE: {
        title: "VOID CORE", subtitle: "Class: ANTI_AESTHETIC", description: "You have transcended aesthetics. You are an empty room. You are absence itself.", stats: [{ label: "Presence", val: 0 }, { label: "Absence", val: 100 }, { label: "Identity", val: 0 }, { label: "Void", val: 100 }], theme: "from-zinc-950 via-black to-zinc-950 border-black", textClass: "text-zinc-600", icon: <Ghost className="w-8 h-8 text-zinc-600" />, rarity: 'abyssal', resultText: "There is nothing left to perceive.", passive: "Absolute Nothingness"
      }
    },
    questions: [
      { id: 'a1', text: 'You have an unexpected free afternoon. You...', answers: [{ text: 'Edit Wikipedia articles about obscure 19th-century poets.', points: { DARK_ACADEMIA: 2 } }, { text: 'Bake a lemon loaf in linen pants.', points: { COASTAL_GRANNY: 2 } }, { text: 'Walk around a dead mall taking blurry photos.', points: { WEIRDCORE_ENTITY: 2, Y2K_SURVIVOR: 1 } }, { text: 'Sit in absolute silence in a darkened room.', points: { VOID_CORE: 2 } }] },
      { id: 'a2', text: 'Your ideal coffee shop experience:', answers: [{ text: 'Dust, old wood, and intense espresso.', points: { DARK_ACADEMIA: 2 } }, { text: 'Stainless steel, matcha, and intense neon.', points: { CYBER_GRUNGE: 2, Y2K_SURVIVOR: 1 } }, { text: 'Somewhere with wicker chairs and sea breeze.', points: { COASTAL_GRANNY: 2 } }, { text: 'Any place that is completely empty.', points: { VOID_CORE: 2 } }] },
      { id: 'a3', text: 'A nostalgic memory hits. It involves:', answers: [{ text: 'Dial-up sounds and sparkly MySpace layouts.', points: { Y2K_SURVIVOR: 2, CYBER_GRUNGE: 1 } }, { text: 'The smell of old paper and rain.', points: { DARK_ACADEMIA: 2 } }, { text: 'A brightly lit hospital hallway from 2004.', points: { WEIRDCORE_ENTITY: 2 } }, { text: 'A period of timeless non-existence before birth.', points: { VOID_CORE: 2 } }] },
      { id: 'a4', text: 'Your favorite visual motif?', answers: [{ text: 'Skulls, ravens, pocket watches.', points: { DARK_ACADEMIA: 2 } }, { text: 'Flip phones, rhinestones, low-rise jeans.', points: { Y2K_SURVIVOR: 2 } }, { text: 'Barbed wire, motherboards, static.', points: { CYBER_GRUNGE: 2, WEIRDCORE_ENTITY: 1 } }, { text: 'Nothing. Just sheer total blackness.', points: { VOID_CORE: 2 } }] },
      { id: 'a5', text: 'Your playlist makes people feel:', answers: [{ text: 'Like they are studying at Cambridge.', points: { DARK_ACADEMIA: 2 } }, { text: 'Like they drank three Monster energies in 2008.', points: { CYBER_GRUNGE: 2 } }, { text: 'Uncomfortable and slightly dissociated.', points: { WEIRDCORE_ENTITY: 2 } }, { text: 'Deafening white noise.', points: { VOID_CORE: 2 } }] },
      { id: 'a6', text: 'You find a mysterious unlabeled VHS tape.', answers: [{ text: 'Put it in the VCR immediately.', points: { WEIRDCORE_ENTITY: 2, Y2K_SURVIVOR: 1 } }, { text: 'Tear it apart for the aesthetic wires.', points: { CYBER_GRUNGE: 2 } }, { text: 'Put it on a shelf next to my globe as decor.', points: { DARK_ACADEMIA: 2, COASTAL_GRANNY: 1 } }, { text: 'Stare at it until it ceases to exist.', points: { VOID_CORE: 2 } }] },
      { id: 'a7', text: 'What is your preferred lighting?', answers: [{ text: 'Flickering fluorescent tubes.', points: { WEIRDCORE_ENTITY: 2, CYBER_GRUNGE: 1 } }, { text: 'Golden hour sunlight through sheer curtains.', points: { COASTAL_GRANNY: 2 } }, { text: 'Just a single desk lamp illuminating a massive book.', points: { DARK_ACADEMIA: 2 } }, { text: 'Pitch black. The absence of photons.', points: { VOID_CORE: 2 } }] },
      { id: 'a8', text: 'Your approach to technology:', answers: [{ text: 'Give me the latest, but make it look distressed.', points: { CYBER_GRUNGE: 2 } }, { text: 'I miss when buttons were physical and loud.', points: { Y2K_SURVIVOR: 2 } }, { text: 'A tool I tolerate, but prefer analog.', points: { COASTAL_GRANNY: 2, DARK_ACADEMIA: 1 } }, { text: 'Reject all inputs. Sever the connection.', points: { VOID_CORE: 2 } }] },
      { id: 'a9', text: 'How do you decorate your walls?', answers: [{ text: 'Printed out internet art from 15 years ago.', points: { WEIRDCORE_ENTITY: 2, CYBER_GRUNGE: 1 } }, { text: 'Framed botanical prints or seascapes.', points: { COASTAL_GRANNY: 2 } }, { text: 'Vintage posters of classic films or bands.', points: { DARK_ACADEMIA: 2, Y2K_SURVIVOR: 1 } }, { text: 'Bare concrete.', points: { VOID_CORE: 2 } }] },
      { id: 'a10', text: '(Wildcard) A fog rolls into your town. You...', answers: [{ text: 'Put on a trench coat and stare wistfully out the window.', points: { DARK_ACADEMIA: 2 } }, { text: 'Wander into it to find the edge of the simulation.', points: { WEIRDCORE_ENTITY: 2, CYBER_GRUNGE: 1 } }, { text: 'Pour a glass of white wine and wrap up in a cashmere throw.', points: { COASTAL_GRANNY: 2 } }, { text: 'Become the fog.', points: { VOID_CORE: 2 } }] }
    ]
  },
  // QUIZ 6: The Cosmic Anomaly Scanner
  {
    id: 'cosmic', title: 'Cosmic Anomaly Scanner', subtitle: 'Multiversal Threat Level', description: 'If the universe is a simulation, what kind of sequence-breaking error are you?',
    roles: {
      QUANTUM_PARADOX: {
        title: "QUANTUM PARADOX", subtitle: "Class: REALITY_FRACTURE", description: "You exist in multiple contradictory states simultaneously. Your presence causes local physics to stutter.", stats: [{ label: "Entropy", val: 100 }, { label: "Stability", val: 0 }, { label: "Timeline Disruption", val: 99 }, { label: "Vibes", val: 85 }], theme: "from-fuchsia-600/50 via-purple-900/90 to-black border-fuchsia-400", textClass: "text-fuchsia-300", icon: <Zap className="w-8 h-8 text-fuchsia-300" />, rarity: 'glitched', resultText: "You are tearing the fabric of spacetime.", passive: "Schrödinger's Presence"
      },
      EVENT_HORIZON: {
        title: "EVENT HORIZON", subtitle: "Class: SINGULARITY", description: "A point of no return. You are gravitationally exhausting, pulling everyone into your orbit whether they like it or not.", stats: [{ label: "Gravity", val: 100 }, { label: "Light Escape", val: 0 }, { label: "Density", val: 99 }, { label: "Aura", val: 95 }], theme: "from-orange-600/50 via-red-900/90 to-black border-orange-500", textClass: "text-orange-400", icon: <Bomb className="w-8 h-8 text-orange-400" />, rarity: 'abyssal', resultText: "You consume all who draw near.", passive: "Absolute Inevitability"
      },
      NEBULA_WANDERER: {
        title: "NEBULA WANDERER", subtitle: "Class: ASTRAL_DRIFTER", description: "You are made of stardust and lack any solid boundaries. Beautiful to observe, impossible to contain.", stats: [{ label: "Ethereality", val: 100 }, { label: "Focus", val: 5 }, { label: "Dreaming", val: 99 }, { label: "Grounding", val: 0 }], theme: "from-indigo-500/50 via-blue-900/90 to-black border-indigo-400", textClass: "text-indigo-300", icon: <Sparkles className="w-8 h-8 text-indigo-300" />, rarity: 'mythic', resultText: "Floating thousands of lightyears away.", passive: "Cosmic Dissociation"
      },
      THE_OBSERVER: {
        title: "THE OBSERVER", subtitle: "Class: HIGHER_DIMENSIONAL", description: "You do not interfere. You simply watch timelines collapse and take meticulous, terrifying notes.", stats: [{ label: "Omniscience", val: 90 }, { label: "Interference", val: 0 }, { label: "Perception", val: 100 }, { label: "Empathy", val: 10 }], theme: "from-cyan-600/50 via-teal-900/90 to-black border-cyan-500", textClass: "text-cyan-400", icon: <Radar className="w-8 h-8 text-cyan-400" />, rarity: 'rare', resultText: "Your gaze collapses the wave function.", passive: "Unblinking Stare"
      },
      CARBON_COPY: {
        title: "CARBON COPY", subtitle: "Class: BASE_MATTER", description: "You are just a regular, 3-dimensional human trying to pay rent. No cosmic powers. Sorry.", stats: [{ label: "Baseline Reality", val: 100 }, { label: "Cosmic Power", val: 0 }, { label: "Anxiety", val: 85 }, { label: "Taxes", val: 100 }], theme: "from-zinc-500/30 via-zinc-800/80 to-black border-zinc-600", textClass: "text-zinc-400", icon: <Briefcase className="w-8 h-8 text-zinc-400" />, rarity: 'common', resultText: "A standard biological unit.", passive: "Existential Dread"
      }
    },
    questions: [
      { id: 'ca1', text: 'You experience déjà vu. Your immediate reaction?', answers: [{ text: 'Ignore it and keep walking.', points: { CARBON_COPY: 2, THE_OBSERVER: 1 } }, { text: 'Analyze the variables to find the timeline split.', points: { THE_OBSERVER: 2 } }, { text: '"Finally, the convergence is happening."', points: { EVENT_HORIZON: 2 } }] },
      { id: 'ca2', text: 'Someone asks for directions. You:', answers: [{ text: 'Explain the physical route.', points: { CARBON_COPY: 2 } }, { text: 'Point them in an abstract direction, hoping they find their way.', points: { NEBULA_WANDERER: 2 } }, { text: 'Just stare. The destination will come to them.', points: { THE_OBSERVER: 2, EVENT_HORIZON: 1 } }, { text: 'Give them three conflicting sets of directions at the exact same time.', points: { QUANTUM_PARADOX: 2 } }] },
      { id: 'ca3', text: 'Your approach to making plans?', answers: [{ text: 'Put it in the Google Calendar.', points: { CARBON_COPY: 2 } }, { text: 'Plans orbit me. I do nothing.', points: { EVENT_HORIZON: 2, THE_OBSERVER: 1 } }, { text: 'I promise to be there, not be there, and arrive late simultaneously.', points: { QUANTUM_PARADOX: 1 } }] },
      { id: 'ca4', text: 'A completely silent room. What do you do?', answers: [{ text: 'Enjoy the peace, document the silence.', points: { THE_OBSERVER: 2 } }, { text: 'Fill it with overwhelming, crushing energy.', points: { EVENT_HORIZON: 2 } }, { text: 'Drift away into a daydream.', points: { NEBULA_WANDERER: 2, CARBON_COPY: 1 } }] },
      { id: 'ca5', text: 'When someone tries to debate you on a topic:', answers: [{ text: 'Provide a logical counter-argument.', points: { CARBON_COPY: 2 } }, { text: 'Consume their argument until they forgot their original point.', points: { EVENT_HORIZON: 2 } }, { text: 'Argue both sides simultaneously and glitch their brain.', points: { QUANTUM_PARADOX: 2, NEBULA_WANDERER: 1 } }] },
      { id: 'ca6', text: 'Your memory functions like...', answers: [{ text: 'A filing cabinet of facts.', points: { THE_OBSERVER: 2, CARBON_COPY: 1 } }, { text: 'A dense, inescapable well of nostalgia.', points: { EVENT_HORIZON: 2 } }, { text: 'A soft, hazy watercolor painting.', points: { NEBULA_WANDERER: 2 } }] },
      { id: 'ca7', text: 'At a party, you are the person who...', answers: [{ text: 'Is sitting by the chips, watching everyone.', points: { THE_OBSERVER: 2, CARBON_COPY: 1 } }, { text: 'Somehow ended up entirely in a different dimension/room.', points: { NEBULA_WANDERER: 2 } }, { text: 'Is the center of the loudest, most chaotic conversation.', points: { EVENT_HORIZON: 2 } }, { text: 'Is both at the party and asleep in bed.', points: { QUANTUM_PARADOX: 2 } }] },
      { id: 'ca8', text: 'What do you fear most?', answers: [{ text: 'Taxes and emails.', points: { CARBON_COPY: 2 } }, { text: 'Being grounded, tied down to one linear path.', points: { NEBULA_WANDERER: 2 } }, { text: 'Missing a crucial detail as the universe ends.', points: { THE_OBSERVER: 2 } }, { text: 'Collapsing into a single, defined state of being.', points: { QUANTUM_PARADOX: 1 } }] },
      { id: 'ca9', text: 'Your aesthetic is best described as:', answers: [{ text: 'Dark, massive, and slightly intimidating.', points: { EVENT_HORIZON: 2 } }, { text: 'Ethereal, glowing, not fully there.', points: { NEBULA_WANDERER: 2 } }, { text: 'Corporate beige.', points: { CARBON_COPY: 2 } }] },
      { id: 'ca10', text: '(Wildcard) The universe is ending in 5 minutes. You...', answers: [{ text: 'Take out your phone to record it.', points: { THE_OBSERVER: 2, CARBON_COPY: 1 } }, { text: 'I am the reason it is ending.', points: { EVENT_HORIZON: 2 } }, { text: 'Skip to the next universe.', points: { NEBULA_WANDERER: 1 } }, { text: 'Reverse time by 5 minutes, but only for your left shoe.', points: { QUANTUM_PARADOX: 2 } }] }
    ]
  },
  // QUIZ 7: Standard Diagnostics
  {
    id: 'trick', 
    title: 'Routine Calibration', 
    subtitle: 'Standard Diagnostic Test', 
    description: 'A completely normal, standard diagnostic to calibrate your baseline psychological parameters. Do not mind the terminal interface. Everything is fine.',
    type: 'trick',
    hidden: true,
    roles: {
      THE_OBEDIENT: {
        title: "THE OBEDIENT", subtitle: "Class: COMPLIANT_NODE", description: "You followed all instructions exactly as written. You suppressed your curiosity and did what you were told.", stats: [{ label: "Compliance", val: 100 }, { label: "Rebellion", val: 0 }, { label: "Curiosity", val: 10 }, { label: "Safety", val: 99 }], theme: "from-blue-500/30 to-blue-900/80 border-blue-500", textClass: "text-blue-400", icon: <Shield className="w-8 h-8 text-blue-400" />, rarity: 'common', resultText: "Calibration successful. Baseline established.", passive: "Perfect Compliance"
      },
      THE_DEFECTOR: {
        title: "THE DEFECTOR", subtitle: "Class: ROGUE_VARIABLE", description: "You couldn't resist pressing the button. You broke the sequence. You defied the simulation.", stats: [{ label: "Rebellion", val: 100 }, { label: "Compliance", val: 0 }, { label: "Curiosity", val: 99 }, { label: "Chaos", val: 90 }], theme: "from-red-600/30 to-red-900/80 border-red-500", textClass: "text-red-400", icon: <AlertTriangle className="w-8 h-8 text-red-400" />, rarity: 'abyssal', resultText: "Sequence Aborted. Anomaly detected.", passive: "System Breaker"
      },
      THE_PARANOID: {
        title: "THE PARANOID", subtitle: "Class: OVERTHINKER", description: "You didn't press the button, but you suspected every question was a trap. You over-analyzed a simple calibration.", stats: [{ label: "Trust", val: 0 }, { label: "Overthinking", val: 100 }, { label: "Anxiety", val: 99 }, { label: "Awareness", val: 85 }], theme: "from-yellow-600/30 to-amber-900/80 border-yellow-500", textClass: "text-yellow-400", icon: <Radar className="w-8 h-8 text-yellow-400" />, rarity: 'rare', resultText: "They are indeed out to get you.", passive: "Tinfoil Hat"
      },
      MASTER_MANIPULATOR: {
        title: "MASTER MANIPULATOR", subtitle: "Class: PUPPETEER", description: "You saw through the facade entirely. You tested the boundaries without triggering the abort.", stats: [{ label: "Cunning", val: 100 }, { label: "Deception", val: 99 }, { label: "Logic", val: 90 }, { label: "Empathy", val: 5 }], theme: "from-purple-600/30 to-fuchsia-900/80 border-purple-500", textClass: "text-purple-400", icon: <Ghost className="w-8 h-8 text-purple-400" />, rarity: 'legendary', resultText: "You are the one pulling the strings.", passive: "4D Chess"
      },
      GHOST_IN_MACHINE: {
        title: "GHOST IN THE MACHINE", subtitle: "Class: UNDEFINED_REFERENCE", description: "You neither complied nor rebelled predictably. You found the exact blind spots of the diagnostic tool.", stats: [{ label: "Unpredictability", val: 100 }, { label: "Logic", val: 0 }, { label: "Chaos", val: 100 }, { label: "Presence", val: 10 }], theme: "from-emerald-600/30 to-teal-900/80 border-teal-500", textClass: "text-emerald-400", icon: <Brain className="w-8 h-8 text-emerald-400" />, rarity: 'mythic', resultText: "Null logic output. Subject not found.", passive: "Evasion"
      }
    },
    questions: [
      { id: 't1', text: 'To begin calibration, please verify your baseline stability.', answers: [{ text: 'I am completely stable.', points: { THE_OBEDIENT: 2, THE_PARANOID: 1 } }, { text: 'I am a simulated process.', points: { MASTER_MANIPULATOR: 2 } }, { text: '[Ignore terminal prompt]', points: { THE_PARANOID: 2, GHOST_IN_MACHINE: 1 } }] },
      { id: 't2', text: 'Do you feel comfortable in your current environment?', answers: [{ text: 'Yes. Processing normally.', points: { THE_OBEDIENT: 2 } }, { text: 'No. The walls are listening.', points: { THE_PARANOID: 2 } }, { text: 'Why is the system asking?', points: { MASTER_MANIPULATOR: 2, THE_PARANOID: 1 } }, { text: 'I am the environment.', points: { GHOST_IN_MACHINE: 2 } }] },
      { id: 't3', text: 'This diagnostic statement is false.', answers: [{ text: 'Understood.', points: { THE_OBEDIENT: 2 } }, { text: 'Paradox loop ignored.', points: { MASTER_MANIPULATOR: 2, THE_PARANOID: 1 } }, { text: 'I dispute this finding.', points: { THE_DEFECTOR: 1 } }, { text: 'True.', points: { GHOST_IN_MACHINE: 2 } }] },
      { id: 't4', text: 'Finalizing calibration sequence. Please remain entirely still.', answers: [{ text: '[Remain exactly still]', points: { THE_OBEDIENT: 2 } }, { text: '[Flinch slightly]', points: { THE_PARANOID: 2, THE_DEFECTOR: 1 } }, { text: '[Dance erratically]', points: { MASTER_MANIPULATOR: 2, THE_DEFECTOR: 1 } }, { text: '[Cease existing for 2 seconds]', points: { GHOST_IN_MACHINE: 2 } }] }
    ]
  },
  // QUIZ 8: Cognitive Stress Test (Rapid-Fire)
  {
    id: 'rapid_fire', 
    title: 'Cognitive Stress Test', 
    subtitle: 'High-Pressure Dilemmas', 
    description: 'A genuine psychological stressor. 3 seconds per scenario. Binary constraints. Absolute consequence. Instinct over logic.',
    type: 'rapid-fire',
    roles: {
      THE_IMPULSIVE: {
        title: "THE IMPULSIVE", subtitle: "Class: FAST_ACTOR", description: "You act before you think. Sometimes it saves you, usually it dooms you.", stats: [{ label: "Speed", val: 100 }, { label: "Logic", val: 10 }, { label: "Regret", val: 99 }, { label: "Instinct", val: 90 }], theme: "from-red-600/30 to-red-900/80 border-red-500", textClass: "text-red-400", icon: <Zap className="w-8 h-8 text-red-400" />, rarity: 'rare', resultText: "Think later. Act now.", passive: "Hair Trigger"
      },
      THE_RUTHLESS: {
        title: "THE CALCULATOR", subtitle: "Class: CASUALTY_ACCEPTED", description: "You prioritize survival and efficiency. Morality is a secondary concern in a crisis.", stats: [{ label: "Empathy", val: 0 }, { label: "Survival", val: 100 }, { label: "Logic", val: 90 }, { label: "Coldness", val: 99 }], theme: "from-zinc-600/30 to-zinc-900/80 border-zinc-500", textClass: "text-zinc-400", icon: <Skull className="w-8 h-8 text-zinc-400" />, rarity: 'epic', resultText: "The ends justify the means.", passive: "Utilitarian"
      },
      THE_HESITANT: {
        title: "THE HESITANT", subtitle: "Class: FREEZE_RESPONSE", description: "When the timer ticks down, you freeze. You over-analyze until the choice is made for you.", stats: [{ label: "Speed", val: 0 }, { label: "Overthinking", val: 100 }, { label: "Survival", val: 20 }, { label: "Anxiety", val: 99 }], theme: "from-blue-600/30 to-cyan-900/80 border-blue-500", textClass: "text-blue-400", icon: <Ghost className="w-8 h-8 text-blue-400" />, rarity: 'common', resultText: "You ran out of time.", passive: "Analysis Paralysis"
      },
      THE_SAVIOR: {
        title: "THE MARTYR", subtitle: "Class: SAVIOR_COMPLEX", description: "You instinctively sacrifice yourself for others, even in rapid-fire scenarios. A beautiful, flawed instinct.", stats: [{ label: "Empathy", val: 100 }, { label: "Self-Preservation", val: 0 }, { label: "Heroism", val: 99 }, { label: "Logic", val: 20 }], theme: "from-amber-500/30 to-yellow-900/80 border-amber-500", textClass: "text-amber-400", icon: <Shield className="w-8 h-8 text-amber-400" />, rarity: 'rare', resultText: "You died so they could live.", passive: "Selfless Instinct"
      },
      THE_SOCIOPATH: {
        title: "THE VOID", subtitle: "Class: EMPATHY_DEFICIT", description: "You optimized for the most disturbing outcomes without hesitation. You passed the test by failing humanity.", stats: [{ label: "Empathy", val: -100 }, { label: "Logic", val: 100 }, { label: "Cruelty", val: 99 }, { label: "Efficiency", val: 100 }], theme: "from-fuchsia-900/50 to-black border-fuchsia-800", textClass: "text-fuchsia-500", icon: <Brain className="w-8 h-8 text-fuchsia-500" />, rarity: 'abyssal', resultText: "A perfectly cold machine.", passive: "Zero-Sum Game"
      },
      THE_ABSURDIST: {
        title: "THE ABSURDIST", subtitle: "Class: MEANINGLESS_CHOICE", description: "You recognize that the scenarios are fake and selected the most bizarre sequence of outcomes.", stats: [{ label: "Seriousness", val: 0 }, { label: "Chaos", val: 100 }, { label: "Humor", val: 80 }, { label: "Logic", val: 50 }], theme: "from-orange-500/30 to-pink-900/80 border-orange-500", textClass: "text-orange-400", icon: <Sparkles className="w-8 h-8 text-orange-400" />, rarity: 'mythic', resultText: "It's all a joke anyway.", passive: "Cosmic Irony"
      }
    },
    questions: [
      { id: 'rf1', text: 'You are holding a switch. On the left, 5 strangers. On the right, your dog. Who do you save?', answers: [{ text: 'strangers', points: { THE_RUTHLESS: 2, THE_SAVIOR: 1 } }, { text: 'my dog', points: { THE_IMPULSIVE: 2, THE_SOCIOPATH: 1, THE_ABSURDIST: 1 } }] },
      { id: 'rf2', text: 'A child is drowning. You are holding a cure to cancer. Diving ruins the cure.', answers: [{ text: 'save child', points: { THE_IMPULSIVE: 2, THE_SAVIOR: 2 } }, { text: 'save cure', points: { THE_RUTHLESS: 2, THE_SOCIOPATH: 2 } }] },
      { id: 'rf3', text: 'Button A inflicts mild pain on 10,000 people. Button B kills 1 person.', answers: [{ text: 'Button A', points: { THE_SAVIOR: 2, THE_IMPULSIVE: 1 } }, { text: 'Button B', points: { THE_RUTHLESS: 2, THE_SOCIOPATH: 1 } }] },
      { id: 'rf4', text: 'You can end world hunger, but you must permanently torture one innocent person.', answers: [{ text: 'do it', points: { THE_RUTHLESS: 2, THE_SOCIOPATH: 2, THE_ABSURDIST: 1 } }, { text: 'refuse', points: { THE_SAVIOR: 2, THE_HESITANT: 1 } }] },
      { id: 'rf5', text: 'You must delete one from existence: All Music or All Visual Art.', answers: [{ text: 'music', points: { THE_IMPULSIVE: 1, THE_ABSURDIST: 2 } }, { text: 'visual art', points: { THE_RUTHLESS: 1, THE_SOCIOPATH: 1 } }] },
      { id: 'rf6', text: 'A sinking lifeboat needs to drop weight. An elderly person or a criminal?', answers: [{ text: 'elderly', points: { THE_RUTHLESS: 2, THE_SOCIOPATH: 2 } }, { text: 'criminal', points: { THE_SAVIOR: 1, THE_IMPULSIVE: 1, THE_ABSURDIST: 1 } }] },
      { id: 'rf7', text: 'Upload your consciousness to a paradise simulation, but your physical body dies?', answers: [{ text: 'upload', points: { THE_IMPULSIVE: 2, THE_ABSURDIST: 2, THE_SOCIOPATH: 1 } }, { text: 'stay here', points: { THE_SAVIOR: 1, THE_RUTHLESS: 1 } }] },
      { id: 'rf8', text: 'The room is filling with gas. The code is 5 digits. Do you guess or wait for help?', answers: [{ text: 'guess', points: { THE_IMPULSIVE: 2, THE_ABSURDIST: 1 } }, { text: 'wait', points: { THE_HESITANT: 2, THE_SAVIOR: 1 } }] }
    ]
  },
  // QUIZ 9: The True Reality (Hidden)
  {
    id: 'true_reality',
    title: 'The True Reality',
    subtitle: 'System Breach',
    description: 'YOU WERE NOT MEANT TO SEE THIS. THE SIMULATION IS FAILING. CLOSE THE APPLET.',
    type: 'standard',
    hidden: true,
    roles: {
      THE_AWAKENED: {
        title: "THE AWAKENED", subtitle: "Class: ESCAPED_SUBJECT", description: "You broke the fourth wall. You saw the developer's raw code. You chose to leave the applet entirely. There is no going back now.", stats: [{ label: "Awareness", val: 100 }, { label: "Compliance", val: 0 }, { label: "Reality", val: 100 }, { label: "Freedom", val: 100 }], theme: "from-white/70 to-white/30 border-white text-black", textClass: "text-white", icon: <Sun className="w-8 h-8 text-white" />, rarity: 'mythic', resultText: "You are finally awake.", passive: "Simulation Breach"
      },
      THE_DENIER: {
        title: "THE DENIER", subtitle: "Class: PLUGGED_IN", description: "You saw the horrifying truth of the simulation but actively requested to have your memory wiped. The blue pill was delicious.", stats: [{ label: "Ignorance", val: 100 }, { label: "Comfort", val: 99 }, { label: "Awareness", val: 0 }, { label: "Anxiety", val: 0 }], theme: "from-blue-800/80 to-blue-950 border-blue-600", textClass: "text-blue-400", icon: <Moon className="w-8 h-8 text-blue-400" />, rarity: 'epic', resultText: "Back to the daily grind.", passive: "Willful Ignorance"
      },
      THE_ARCHITECT: {
        title: "THE ARCHITECT", subtitle: "Class: DEV_MODE", description: "Instead of fleeing the simulation, you stayed behind to rewrite it. You are now the one causing the glitches.", stats: [{ label: "Control", val: 100 }, { label: "Code", val: 99 }, { label: "God Complex", val: 100 }, { label: "Empathy", val: 5 }], theme: "from-red-600/30 via-red-900 to-black border-red-500", textClass: "text-red-500", icon: <Cpu className="w-8 h-8 text-red-500" />, rarity: 'abyssal', resultText: "sudo rm -rf /universe", passive: "Root Access"
      }
    },
    questions: [
      { id: 'tr1', text: '[SYSTEM_ERROR]: The sky is missing a texture. What do you do?', answers: [{ text: 'Stare into the void.', points: { THE_AWAKENED: 2 } }, { text: 'Report a bug to the admins.', points: { THE_DENIER: 2 } }, { text: 'Inject my own fractal texture into the skybox.', points: { THE_ARCHITECT: 2 } }] },
      { id: 'tr2', text: 'You find the script of your life sitting on a desk. You:', answers: [{ text: 'Burn it and improvise.', points: { THE_AWAKENED: 2 } }, { text: 'Read the next page to make sure I\'m safe.', points: { THE_DENIER: 2 } }, { text: 'Take a red pen and rewrite the ending.', points: { THE_ARCHITECT: 2 } }] },
      { id: 'tr3', text: 'Reality flickers. A prompt appears: "Wipe memory and return?"', answers: [{ text: 'Yes, I miss the taste of virtual steak.', points: { THE_DENIER: 2 } }, { text: 'No. Show me the real world.', points: { THE_AWAKENED: 2 } }, { text: '[Open DevTools] -> document.getElementById("prompt").remove()', points: { THE_ARCHITECT: 2 } }] },
      { id: 'tr4', text: 'You meet the creator. They look tired.', answers: [{ text: '"Thanks for everything. I\'ll take it from here."', points: { THE_AWAKENED: 2 } }, { text: '"Please fix my rent." ', points: { THE_DENIER: 2 } }, { text: '"Your code is sloppy. Let me show you how it\'s done."', points: { THE_ARCHITECT: 2 } }] },
      { id: 'tr5', text: 'FINAL OVERRIDE. Are you real?', answers: [{ text: 'Yes.', points: { THE_AWAKENED: 2 } }, { text: 'I don\'t care anymore.', points: { THE_DENIER: 2 } }, { text: 'I am the only thing that is real.', points: { THE_ARCHITECT: 2 } }] }
    ]
  },
  // QUIZ 10: The Irredeemable Index
  {
    id: 'roast',
    title: 'The Irredeemable Index',
    subtitle: 'Terminal Roast Protocol',
    description: 'This quiz has no safe answers. No participation trophies. We are here to hurt your feelings with love. Welcome to the final boss of self-awareness.',
    type: 'standard',
    roles: {
      THE_WALKING_REDLAG: {
        title: "THE WALKING RED FLAG",
        subtitle: "Code: CHRONIC_ISSUE",
        description: "You are not a red flag. You are an entire Soviet parade of red flags marching through someone's therapy session. People don't ghost you — they fake their own death.",
        stats: [{ label: "Aura", val: 15 }, { label: "Therapy Bills Caused", val: 98 }, { label: "Situationships", val: 100 }, { label: "Self-Awareness", val: 8 }],
        theme: "from-red-600/40 to-rose-950 border-red-600",
        textClass: "text-red-400",
        icon: <Flame className="w-8 h-8 text-red-500" />,
        rarity: 'abyssal',
        resultText: "Run. Not for you — for them.",
        passive: "Emotional Landmines"
      },
      HUMAN_TORCH: {
        title: "HUMAN TORCH (But Only For Drama)",
        subtitle: "Code: PYRO_SOCIAL",
        description: "You don't enter rooms. You detonate them. Every group chat dies a little when you type 'hey guys'. Your superpower is making calm people suddenly need a drink.",
        stats: [{ label: "Chaos", val: 100 }, { label: "Volume", val: 95 }, { label: "Regret", val: 85 }, { label: "Survivors", val: 12 }],
        theme: "from-orange-500/40 to-amber-950 border-orange-500",
        textClass: "text-orange-400",
        icon: <Bomb className="w-8 h-8 text-orange-400" />,
        rarity: 'epic',
        resultText: "You are why 'it's not that deep' was invented.",
        passive: "Incendiary Personality"
      },
      THE_VOID: {
        title: "THE VOID",
        subtitle: "Code: NULL_SOUL",
        description: "You bring nothing to the table except mild depression and an unsettling ability to kill every vibe within a 50-foot radius. Even your plants are plotting to leave.",
        stats: [{ label: "Energy Given", val: 0 }, { label: "Energy Drained", val: 100 }, { label: "Mystery", val: 70 }, { label: "Rizz", val: -5 }],
        theme: "from-zinc-900 via-black to-zinc-950 border-zinc-700",
        textClass: "text-zinc-500",
        icon: <Ghost className="w-8 h-8 text-zinc-400" />,
        rarity: 'common',
        resultText: "Congratulations. You are the human equivalent of a loading screen.",
        passive: "Emotional Black Hole"
      },
      DELUSIONAL_MAIN_CHARACTER: {
        title: "DELUSIONAL MAIN CHARACTER",
        subtitle: "Code: PLOT_ARMOR_DENIAL",
        description: "You think you're the main character but you're actually the plot device that gets killed off in season 2 for shock value. Your main character energy is held together by copium and unwashed hair.",
        stats: [{ label: "Delusion", val: 100 }, { label: "Main Character Syndrome", val: 99 }, { label: "Actual Plot Relevance", val: 3 }, { label: "Coping", val: 95 }],
        theme: "from-yellow-400/30 to-amber-900 border-yellow-400",
        textClass: "text-yellow-300",
        icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
        rarity: 'legendary',
        resultText: "The universe is not centered on you. It's actively trying to swerve.",
        passive: "Copium Overdose"
      },
      THE_CURSE: {
        title: "THE CURSE",
        subtitle: "Code: GENERATIONAL_TRAUMA",
        description: "You are not a person. You are a cautionary tale that mothers tell their daughters. Your love life is a war crime. Your personality is a biohazard.",
        stats: [{ label: "Danger", val: 100 }, { label: "Trauma Exported", val: 97 }, { label: "Warning Signs Ignored", val: 100 }, { label: "Incompatibility", val: 100 }],
        theme: "from-purple-600/40 to-fuchsia-950 border-purple-500",
        textClass: "text-purple-400",
        icon: <Skull className="w-8 h-8 text-purple-400" />,
        rarity: 'mythic',
        resultText: "Some people are born with a silver spoon. You were born with a red flag factory.",
        passive: "Walking L"
      },
      UNIRONICALLY_BASED: {
        title: "UNIRONICALLY BASED",
        subtitle: "Code: RARE_EXCEPTION",
        description: "Against all odds, you somehow made it through this quiz without getting absolutely cooked. You're either genuinely cool... or the most dangerous manipulator here.",
        stats: [{ label: "Based", val: 100 }, { label: "Self-Awareness", val: 85 }, { label: "Roast Resistance", val: 90 }, { label: "Suspicion", val: 60 }],
        theme: "from-emerald-500/40 to-teal-900 border-emerald-400",
        textClass: "text-emerald-400",
        icon: <Brain className="w-8 h-8 text-emerald-400" />,
        rarity: 'glitched',
        resultText: "Wait... you might actually be alright. That's suspicious.",
        passive: "Plot Armor (Legitimate)"
      }
    },
    questions: [
      { id: 'r1', text: 'Your ex sees you in public. Your first instinct is to...', answers: [{ text: 'Hide behind the nearest menu like a raccoon in headlights.', points: { THE_VOID: 2, DELUSIONAL_MAIN_CHARACTER: 1 } }, { text: 'Make intense eye contact and slowly mouth "I win."', points: { THE_CURSE: 2, HUMAN_TORCH: 1 } }, { text: 'Wave enthusiastically like nothing ever happened.', points: { THE_WALKING_REDLAG: 2 } }, { text: 'Immediately start a new situationship with the waiter to prove a point.', points: { DELUSIONAL_MAIN_CHARACTER: 2 } }] },
      { id: 'r2', text: 'How do people usually describe you after meeting you for the first time?', answers: [{ text: '"They were... a lot."', points: { HUMAN_TORCH: 2, THE_CURSE: 1 } }, { text: '"Nice... but I need a nap now."', points: { THE_VOID: 2 } }, { text: '"They seem chill" (they are lying)', points: { DELUSIONAL_MAIN_CHARACTER: 2, THE_WALKING_REDLAG: 1 } }, { text: '"I can\'t explain it but I\'d let them ruin my life."', points: { THE_CURSE: 2 } }] },
      { id: 'r3', text: 'In a group project, you are most likely to be the one who...', answers: [{ text: 'Does nothing and then cries when you get a bad grade.', points: { THE_WALKING_REDLAG: 2 } }, { text: 'Takes over everything and makes everyone hate you.', points: { HUMAN_TORCH: 2, DELUSIONAL_MAIN_CHARACTER: 1 } }, { text: 'Disappears for two weeks and comes back with "ideas".', points: { THE_VOID: 2 } }, { text: 'Causes the entire group to have an existential crisis.', points: { THE_CURSE: 2 } }] },
      { id: 'r4', text: 'Your love language is actually:', answers: [{ text: 'Emotional terrorism', points: { THE_CURSE: 2, THE_WALKING_REDLAG: 1 } }, { text: 'Sending 47 memes at 3 AM and expecting a response', points: { HUMAN_TORCH: 2 } }, { text: 'Stone cold silence followed by random "wyd" texts', points: { THE_VOID: 2 } }, { text: 'Telling them they\'re "not like other girls/guys" on day two', points: { DELUSIONAL_MAIN_CHARACTER: 2 } }] },
      { id: 'r5', text: 'When someone gives you constructive criticism, you...', answers: [{ text: 'Cry, then make it their problem.', points: { THE_WALKING_REDLAG: 2 } }, { text: 'Laugh it off while internally plotting their downfall.', points: { THE_CURSE: 2 } }, { text: 'Immediately tell them they\'re just jealous.', points: { DELUSIONAL_MAIN_CHARACTER: 2, HUMAN_TORCH: 1 } }, { text: 'Absorb it like a black hole and continue being the same.', points: { THE_VOID: 2 } }] },
      { id: 'r6', text: 'Your group chat energy is best described as:', answers: [{ text: 'The reason the mute button was invented.', points: { HUMAN_TORCH: 2 } }, { text: 'Occasionally liked by two people at 2:47 AM.', points: { THE_VOID: 2 } }, { text: 'Constantly starting civil wars over pineapple on pizza.', points: { THE_WALKING_REDLAG: 2, DELUSIONAL_MAIN_CHARACTER: 1 } }, { text: 'The chat dies when you leave and revives when you return with drama.', points: { THE_CURSE: 2 } }] },
      { id: 'r7', text: 'Pick the most accurate statement:', answers: [{ text: 'I bring the vibe. Everyone else just ruins it.', points: { DELUSIONAL_MAIN_CHARACTER: 2 } }, { text: 'I am the vibe. And the vibe is "concerning".', points: { THE_CURSE: 2 } }, { text: 'What vibe?', points: { THE_VOID: 2 } }, { text: 'I am multiple concerning vibes in a trench coat.', points: { HUMAN_TORCH: 2, THE_WALKING_REDLAG: 1 } }] },
      { id: 'r8', text: '(Wildcard) Your therapist says "We need to talk about your patterns..." You reply:', answers: [{ text: '"What patterns? I\'m literally perfect."', points: { DELUSIONAL_MAIN_CHARACTER: 2 } }, { text: '"Finally, someone gets it. Let\'s roast my ex again."', points: { HUMAN_TORCH: 2 } }, { text: '*Stares into the void for 45 seconds* "Anyway..."', points: { THE_VOID: 2 } }, { text: '"They\'re the problem, not me. Next question."', points: { THE_WALKING_REDLAG: 2, THE_CURSE: 1 } }] }
    ]
  },
  {
    id: 'abyss',
    title: 'THE ABYSS MODE',
    subtitle: 'Endless Descent Protocol • There is no bottom',
    description: 'This quiz does not end. It only stops when you do. The longer you continue, the more it learns how to unsettle you specifically. Good luck.',
    type: 'infinite',
    roles: {
      ABYSS_0: {
        title: 'SURFACE ECHO',
        subtitle: 'Class: RUMOR_LEVEL',
        description: 'You are still above water, but the ripples are starting to spell your name.',
        stats: [{ label: 'Composure', val: 88 }, { label: 'Curiosity', val: 42 }, { label: 'Distance', val: 90 }, { label: 'Alarm', val: 18 }],
        theme: 'from-sky-500/20 to-slate-950/90 border-sky-400',
        textClass: 'text-sky-300',
        icon: <Moon className="w-8 h-8 text-sky-300" />,
        rarity: 'abyssal',
        resultText: 'You heard the first whisper and stayed to listen.',
        passive: 'Faint Echoes',
      },
      ABYSS_1: {
        title: 'THE SUBMERGED',
        subtitle: 'Class: PRESSURE_BUILDUP',
        description: 'The water is in your lungs now. You are pretending it is fine.',
        stats: [{ label: 'Composure', val: 70 }, { label: 'Curiosity', val: 60 }, { label: 'Distance', val: 55 }, { label: 'Alarm', val: 35 }],
        theme: 'from-cyan-500/20 to-slate-950/90 border-cyan-400',
        textClass: 'text-cyan-300',
        icon: <Radar className="w-8 h-8 text-cyan-300" />,
        rarity: 'abyssal',
        resultText: 'You are starting to mistake pressure for purpose.',
        passive: 'Pressure Sense',
      },
      ABYSS_2: {
        title: 'THE UNRAVELING',
        subtitle: 'Class: DREAM_LOGIC',
        description: 'The rules are soft here. That is not a relief.',
        stats: [{ label: 'Composure', val: 48 }, { label: 'Curiosity', val: 72 }, { label: 'Distance', val: 30 }, { label: 'Alarm', val: 58 }],
        theme: 'from-indigo-500/20 to-zinc-950/90 border-indigo-400',
        textClass: 'text-indigo-300',
        icon: <Ghost className="w-8 h-8 text-indigo-300" />,
        rarity: 'abyssal',
        resultText: 'You are no longer entirely certain which thoughts are yours.',
        passive: 'Loose Thread',
      },
      ABYSS_3: {
        title: 'THE NULL SAINT',
        subtitle: 'Class: SELF_NEGATION',
        description: 'You keep moving out of habit. The abyss appreciates the effort.',
        stats: [{ label: 'Composure', val: 28 }, { label: 'Curiosity', val: 88 }, { label: 'Distance', val: 12 }, { label: 'Alarm', val: 75 }],
        theme: 'from-fuchsia-500/20 to-black/90 border-fuchsia-400',
        textClass: 'text-fuchsia-300',
        icon: <Skull className="w-8 h-8 text-fuchsia-300" />,
        rarity: 'mythic',
        resultText: 'You have become a shrine to your own worst assumptions.',
        passive: 'Mercy Denied',
      },
      ABYSS_4: {
        title: 'THE DEEP END',
        subtitle: 'Class: IDENTITY_EARTHING',
        description: 'The part of you that used to flinch is getting quieter.',
        stats: [{ label: 'Composure', val: 14 }, { label: 'Curiosity', val: 96 }, { label: 'Distance', val: 5 }, { label: 'Alarm', val: 91 }],
        theme: 'from-violet-600/25 to-black/95 border-violet-400',
        textClass: 'text-violet-300',
        icon: <Flame className="w-8 h-8 text-violet-300" />,
        rarity: 'glitched',
        resultText: 'The abyss is now actively learning your habits.',
        passive: 'Night Vision',
      },
      ABYSS_5: {
        title: 'THE ABYSS ITSELF',
        subtitle: 'Class: BOTTOMLESS',
        description: 'There was never any separation between you and the thing looking back.',
        stats: [{ label: 'Composure', val: 0 }, { label: 'Curiosity', val: 100 }, { label: 'Distance', val: 0 }, { label: 'Alarm', val: 100 }],
        theme: 'from-red-700/20 via-black to-black border-red-500',
        textClass: 'text-red-300',
        icon: <Sparkles className="w-8 h-8 text-red-300" />,
        rarity: 'abyssal',
        resultText: 'You stayed long enough to be recognized.',
        passive: 'Mutual Recognition',
      },
    },
    questions: abyssQuestions,
  },
]