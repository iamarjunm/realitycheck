import React from 'react';
import { Cpu, Terminal, AlertTriangle, Skull, Flame, Ghost, Sparkles, Zap, HeartCrack, Baby, Coins, Radio, Radar, Shield, Bomb, MessageCircle, Briefcase, Camera, Headphones, Palette, Moon, Sun, Coffee, Glasses } from 'lucide-react';

export type RoleDef = {
  title: string; subtitle: string; description: string;
  stats: { label: string; val: number }[];
  theme: string; textClass: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'glitched';
  resultText: string; passive: string;
};

export interface Answer { text: string; points: Record<string, number>; }
export interface Question { id: string; text: string; answers: Answer[]; }
export interface QuizDef { id: string; title: string; subtitle: string; description: string; roles: Record<string, RoleDef>; questions: Question[]; }

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
      { id: 'q1', text: 'Do you walk slowly in the middle of the hallway?', answers: [{ text: 'Yes, and I stop randomly.', points: { DOOMSCROLLER: 2 } }, { text: 'No, I speedwalk.', points: { MAIN_CHARACTER: 1, GLITCH: 1 } }, { text: 'I just follow whoever is in front.', points: { BACKGROUND_EXTRA: 3 } }] },
      { id: 'q2', text: 'Default response to a meme you\'ve seen?', answers: [{ text: 'Fake a laugh.', points: { BACKGROUND_EXTRA: 2 } }, { text: '"Seen it." walk away.', points: { GLITCH: 2 } }, { text: '*starts monologue*', points: { YAPPER: 3 } }] },
      { id: 'q3', text: 'Phone at 4% in public. Action?', answers: [{ text: 'Stare at wall.', points: { DOOMSCROLLER: 2 } }, { text: 'Ask strangers for charger.', points: { YAPPER: 1 } }, { text: 'Never below 50%.', points: { MAIN_CHARACTER: 2 } }] },
      { id: 'q4', text: 'Someone drops their books in the hallway. You:', answers: [{ text: 'Help them pick it up.', points: { MAIN_CHARACTER: 3 } }, { text: 'Step over them.', points: { DOOMSCROLLER: 2, GLITCH: 1 } }, { text: 'Pretend I didn\'t see it.', points: { BACKGROUND_EXTRA: 3 } }] },
      { id: 'q5', text: 'In a group project, what is your role?', answers: [{ text: 'I do all the work.', points: { MAIN_CHARACTER: 2 } }, { text: 'I just nod and agree.', points: { BACKGROUND_EXTRA: 3 } }, { text: 'I talk the entire time but do 0 work.', points: { YAPPER: 3 } }] },
      { id: 'q6', text: 'How do you respond to "How are you?"', answers: [{ text: '"Good, you?" (robotic)', points: { BACKGROUND_EXTRA: 3 } }, { text: 'Trauma dump immediately.', points: { YAPPER: 3 } }, { text: '"I am living in a simulation."', points: { GLITCH: 3 } }] },
      { id: 'q7', text: 'Your favorite type of weather?', answers: [{ text: 'Sunny, generic.', points: { BACKGROUND_EXTRA: 2 } }, { text: 'Thunderstorms and chaos.', points: { GLITCH: 3 } }, { text: 'I don\'t go outside.', points: { DOOMSCROLLER: 3 } }] },
      { id: 'q8', text: 'When the teacher asks a question, you:', answers: [{ text: 'Raise hand instantly.', points: { MAIN_CHARACTER: 3 } }, { text: 'Avoid eye contact.', points: { BACKGROUND_EXTRA: 3 } }, { text: 'Answer loudly without raising hand.', points: { YAPPER: 3 } }] },
      { id: 'q9', text: 'What is your coffee order?', answers: [{ text: 'Just black. Hot.', points: { MAIN_CHARACTER: 2 } }, { text: 'Vanilla latte. Standard.', points: { BACKGROUND_EXTRA: 3 } }, { text: 'Energy drink. I don\'t sleep.', points: { DOOMSCROLLER: 3, GLITCH: 1 } }] },
      { id: 'q10', text: 'If you won the lottery?', answers: [{ text: 'Pay off debt, buy a house.', points: { BACKGROUND_EXTRA: 2 } }, { text: 'Vanish into the woods.', points: { GLITCH: 3 } }, { text: 'Start a podcast about it.', points: { YAPPER: 3 } }] }
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
      }
    },
    questions: [
      { id: 'l1', text: 'The group is deciding where to eat. It\'s been 30 minutes. You:', answers: [{ text: 'Reject 5 options.', points: { THE_FLAKE: 2 } }, { text: 'Order the Uber to force everyone.', points: { THE_MOM: 3, THE_BANK: 1 } }, { text: 'Suggest we steal food.', points: { THE_INSTIGATOR: 3, THE_CRYPTID: 1 } }] },
      { id: 'l2', text: 'Friend texts "I messed up." Your immediate thought?', answers: [{ text: '"What do I need to fix?"', points: { THE_MOM: 3, THE_BANK: 2 } }, { text: '"Drop the tea immediately."', points: { THE_INSTIGATOR: 3 } }, { text: '"Same." *goes back to sleep*', points: { THE_FLAKE: 3 } }] },
      { id: 'l3', text: 'It\'s 2 AM at a party. Where are you?', answers: [{ text: 'Holding back the Instigator.', points: { THE_MOM: 3 } }, { text: 'Nobody knows. Left at 10 PM.', points: { THE_FLAKE: 3, THE_CRYPTID: 2 } }, { text: 'Causing a massive, violent scene.', points: { THE_INSTIGATOR: 3 } }] },
      { id: 'l4', text: 'A bouncer says "You can\'t come in." You:', answers: [{ text: '"Do you know who I am?"', points: { THE_INSTIGATOR: 3 } }, { text: 'Hand them a $50 bill.', points: { THE_BANK: 3 } }, { text: 'Walk away into the shadows.', points: { THE_CRYPTID: 3 } }] },
      { id: 'l5', text: 'Who booked the Airbnb?', answers: [{ text: 'Me. Months ago. It has a spreadsheet.', points: { THE_MOM: 3 } }, { text: 'I paid for it, but didn\'t book it.', points: { THE_BANK: 3 } }, { text: 'I still don\'t know the address.', points: { THE_FLAKE: 3 } }] },
      { id: 'l6', text: 'Your ex walks into the bar. Action?', answers: [{ text: 'Throw a drink.', points: { THE_INSTIGATOR: 3 } }, { text: 'Pay the tab and extract everyone.', points: { THE_MOM: 2, THE_BANK: 2 } }, { text: 'I am the ex.', points: { THE_CRYPTID: 3 } }] },
      { id: 'l7', text: 'Someone needs to borrow your car. You say:', answers: [{ text: '"Keys are on the counter."', points: { THE_BANK: 3 } }, { text: '"I don\'t drive, I teleport."', points: { THE_CRYPTID: 3 } }, { text: '"Only if I can drive and speed."', points: { THE_INSTIGATOR: 3 } }] },
      { id: 'l8', text: 'Your group chat timezone?', answers: [{ text: 'Active 9AM-5PM.', points: { THE_MOM: 3 } }, { text: 'Muted forever.', points: { THE_FLAKE: 3 } }, { text: '3AM unhinged voice notes.', points: { THE_INSTIGATOR: 3, THE_CRYPTID: 1 } }] },
      { id: 'l9', text: 'How do you handle a hangover?', answers: [{ text: 'Electrolytes, ibuprofen, meditation.', points: { THE_MOM: 3 } }, { text: 'Keep drinking. Hair of the dog.', points: { THE_INSTIGATOR: 3 } }, { text: 'I don\'t get hangovers.', points: { THE_CRYPTID: 3 } }] },
      { id: 'l10', text: 'What is your lock screen?', answers: [{ text: 'The group photo.', points: { THE_MOM: 3 } }, { text: 'A vague abstract blur.', points: { THE_CRYPTID: 3 } }, { text: 'A screenshot of a toxic text message.', points: { THE_INSTIGATOR: 3 } }] }
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
      }
    },
    questions: [
      { id: 'b1', text: 'Primary source of news?', answers: [{ text: 'Random guy pointing at a green screen.', points: { CORECORE_EDITOR: 3, THE_LURKER: 1 } }, { text: 'Twitter/X trending (ragebait).', points: { REPLY_GUY: 3 } }, { text: 'Underground discord servers.', points: { TASTEMAKER: 3 } }] },
      { id: 'b2', text: 'When a new slang word drops:', answers: [{ text: 'Overuse it in the comments.', points: { REPLY_GUY: 3 } }, { text: 'I invented it last month.', points: { TASTEMAKER: 3 } }, { text: 'Refuse to say it.', points: { THE_LURKER: 3 } }] },
      { id: 'b3', text: 'How long could you sit in silence without a screen?', answers: [{ text: 'I literally cannot.', points: { CORECORE_EDITOR: 3 } }, { text: 'Every night while overthinking.', points: { THE_LURKER: 3 } }, { text: 'I would start arguing with the wall.', points: { REPLY_GUY: 3 } }] },
      { id: 'b4', text: 'A wild notification appears: "Someone liked your old post."', answers: [{ text: 'Who? When? Why?', points: { THE_LURKER: 2 } }, { text: 'Check if they are a mutual.', points: { TASTEMAKER: 3 } }, { text: 'Reply immediately.', points: { REPLY_GUY: 3 } }] },
      { id: 'b5', text: 'Your TikTok For You Page is mostly:', answers: [{ text: 'Skibidi toilet lore.', points: { CORECORE_EDITOR: 3 } }, { text: 'Extremely niche micro-trends.', points: { TASTEMAKER: 3 } }, { text: 'Just girls dancing.', points: { THE_LURKER: 3 } }] },
      { id: 'b6', text: 'Do you comment on YouTube videos?', answers: [{ text: '"First!"', points: { REPLY_GUY: 3 } }, { text: 'Never. Not even once.', points: { THE_LURKER: 3 } }, { text: 'Only to correct someone.', points: { TASTEMAKER: 2 } }] },
      { id: 'b7', text: 'What do you do while eating?', answers: [{ text: 'Watch a 4 hour video essay on a game I haven\'t played.', points: { CORECORE_EDITOR: 3 } }, { text: 'Scroll reels endlessly.', points: { THE_LURKER: 2, REPLY_GUY: 1 } }, { text: 'Judge people on my feed.', points: { TASTEMAKER: 3 } }] },
      { id: 'b8', text: 'You see someone filming a TikTok in public.', answers: [{ text: 'Walk through the frame.', points: { CORECORE_EDITOR: 2 } }, { text: 'Avoid them like the plague.', points: { THE_LURKER: 3 } }, { text: 'Ask for their @.', points: { REPLY_GUY: 3 } }] },
      { id: 'b9', text: 'Your sleep schedule?', answers: [{ text: 'Normal, but I sleep with a podcast on.', points: { THE_LURKER: 2 } }, { text: 'Non-existent. I need subway surfers to sleep.', points: { CORECORE_EDITOR: 3 } }, { text: 'Determined by when the algorithm peaks.', points: { TASTEMAKER: 3 } }] },
      { id: 'b10', text: 'Have you ever been "cancelled"?', answers: [{ text: 'No, I don\'t post.', points: { THE_LURKER: 3 } }, { text: 'Yes, for a bad joke in 2018.', points: { REPLY_GUY: 3 } }, { text: 'I am the one who cancels.', points: { TASTEMAKER: 3 } }] }
    ]
  },
  // QUIZ 4: Corporate Matrix
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
      }
    },
    questions: [
      { id: 'c1', text: '5 PM on a Friday. A wild "quick question" email appears:', answers: [{ text: 'Ignore it until Monday 9 AM.', points: { QUIET_QUITTER: 3 } }, { text: 'Reply immediately with 4 paragraphs.', points: { LINKEDIN_LUNATIC: 2, OVERWORKED_INTERN: 1 } }, { text: 'Forward it to the intern.', points: { HR_INFORMANT: 2, ROGUE_DEV: 1 } }] },
      { id: 'c2', text: 'Your camera during Zoom meetings?', answers: [{ text: 'Tape over webcam. Mic muted.', points: { ROGUE_DEV: 3, QUIET_QUITTER: 1 } }, { text: 'Perfect lighting, blurred background.', points: { LINKEDIN_LUNATIC: 3 } }, { text: 'Desperately trying to hide exhaustion.', points: { OVERWORKED_INTERN: 3 } }] },
      { id: 'c3', text: 'How do you handle office gossip?', answers: [{ text: 'File it away in my secret database.', points: { HR_INFORMANT: 3 } }, { text: 'Turn it into a LinkedIn post about leadership.', points: { LINKEDIN_LUNATIC: 3 } }, { text: 'I am too dead inside to care.', points: { OVERWORKED_INTERN: 2, QUIET_QUITTER: 2 } }] },
      { id: 'c4', text: 'Your boss asks for a "quick sync".', answers: [{ text: 'Panic. Start looking for new jobs.', points: { OVERWORKED_INTERN: 3 } }, { text: '"Sure, let\'s circle back and synergize."', points: { LINKEDIN_LUNATIC: 3 } }, { text: '"I am busy migrating the primary database." (A lie.)', points: { ROGUE_DEV: 3 } }] },
      { id: 'c5', text: 'Free pizza in the break room!', answers: [{ text: 'Grab 4 slices and return to the cave.', points: { ROGUE_DEV: 3 } }, { text: 'Post a selfie with it. "Culture!"', points: { LINKEDIN_LUNATIC: 3 } }, { text: 'Too busy to eat.', points: { OVERWORKED_INTERN: 3 } }] },
      { id: 'c6', text: 'How do you structure your emails?', answers: [{ text: 'No greeting. Just the answer.', points: { ROGUE_DEV: 3, QUIET_QUITTER: 1 } }, { text: 'Subject: URGENT. Lots of exclamation points.', points: { OVERWORKED_INTERN: 3 } }, { text: '"Hope this finds you well!"', points: { HR_INFORMANT: 3 } }] },
      { id: 'c7', text: 'Your approach to PTO (Paid Time Off)?', answers: [{ text: 'Take it all, don\'t check email.', points: { QUIET_QUITTER: 3 } }, { text: 'Vacation? What is that?', points: { OVERWORKED_INTERN: 3 } }, { text: '"I\'m taking a break to reflect on B2B sales."', points: { LINKEDIN_LUNATIC: 3 } }] },
      { id: 'c8', text: 'A coworker is crying in the bathroom.', answers: [{ text: 'Pretend you didn\'t hear it.', points: { QUIET_QUITTER: 3 } }, { text: 'Report it to HR as a "wellness concern".', points: { HR_INFORMANT: 3 } }, { text: 'Offer them half of your Red Bull.', points: { OVERWORKED_INTERN: 3 } }] },
      { id: 'c9', text: 'Your computer wallpaper at work?', answers: [{ text: 'Default Windows/Mac background.', points: { QUIET_QUITTER: 3 } }, { text: 'A quote from Elon Musk.', points: { LINKEDIN_LUNATIC: 3 } }, { text: 'Terminal matrix falling code.', points: { ROGUE_DEV: 3 } }] },
      { id: 'c10', text: 'Performance Review time.', answers: [{ text: 'Smile, nod, agree.', points: { QUIET_QUITTER: 3 } }, { text: 'Bring a 50-slide deck of your achievements.', points: { LINKEDIN_LUNATIC: 3 } }, { text: 'Remind them you control the servers.', points: { ROGUE_DEV: 3 } }] }
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
      }
    },
    questions: [
      { id: 'a1', text: 'Pick a weekend activity:', answers: [{ text: 'Thrifting old digital cameras.', points: { Y2K_SURVIVOR: 3 } }, { text: 'Reading Dostoevsky in a dimly lit cafe.', points: { DARK_ACADEMIA: 3 } }, { text: 'Wandering through abandoned malls.', points: { WEIRDCORE_ENTITY: 3 } }] },
      { id: 'a2', text: 'What does your room look like?', answers: [{ text: 'Lots of linen, candles, very clean.', points: { COASTAL_GRANNY: 3 } }, { text: 'Posters overlapping, cables everywhere.', points: { CYBER_GRUNGE: 3 } }, { text: 'Old books, globe, weird skull paperweight.', points: { DARK_ACADEMIA: 3 } }] },
      { id: 'a3', text: 'Choose your soundtrack:', answers: [{ text: 'Distorted noises that sound vaguely like a childhood memory.', points: { WEIRDCORE_ENTITY: 3 } }, { text: 'Britney Spears / NSYNC.', points: { Y2K_SURVIVOR: 3 } }, { text: 'Nancy Meyers movie ambient acoustic guitar.', points: { COASTAL_GRANNY: 3 } }] },
      { id: 'a4', text: 'What is your ideal pet?', answers: [{ text: 'A raven or a black cat.', points: { DARK_ACADEMIA: 3 } }, { text: 'A golden retriever.', points: { COASTAL_GRANNY: 3 } }, { text: 'A tamagotchi or furby.', points: { Y2K_SURVIVOR: 3 } }] },
      { id: 'a5', text: 'Your favorite accessory?', answers: [{ text: 'Wire-rimmed glasses and a pocket watch.', points: { DARK_ACADEMIA: 3 } }, { text: 'Chunky headphones and a flip phone.', points: { Y2K_SURVIVOR: 3 } }, { text: 'Anything with spikes and LEDs.', points: { CYBER_GRUNGE: 3 } }] },
      { id: 'a6', text: 'Pick a movie to watch tonight:', answers: [{ text: 'Dead Poets Society.', points: { DARK_ACADEMIA: 3 } }, { text: 'The Matrix.', points: { CYBER_GRUNGE: 3 } }, { text: 'Under the Tuscan Sun.', points: { COASTAL_GRANNY: 3 } }] },
      { id: 'a7', text: 'What are you drinking?', answers: [{ text: 'Black coffee in a ceramic mug.', points: { DARK_ACADEMIA: 3 } }, { text: 'Monster Energy.', points: { CYBER_GRUNGE: 3 } }, { text: 'Matcha or Chardonnay.', points: { COASTAL_GRANNY: 3 } }] },
      { id: 'a8', text: 'Your preferred lighting?', answers: [{ text: 'Candlelight only.', points: { DARK_ACADEMIA: 3 } }, { text: 'Harsh neon and computer glare.', points: { CYBER_GRUNGE: 3 } }, { text: 'Natural golden hour sunlight.', points: { COASTAL_GRANNY: 3 } }] },
      { id: 'a9', text: 'Where would you rather be right now?', answers: [{ text: 'A damp, old library smelling of dust.', points: { DARK_ACADEMIA: 3 } }, { text: 'A beach house in Nantucket.', points: { COASTAL_GRANNY: 3 } }, { text: 'An abandoned arcade at 3 AM.', points: { WEIRDCORE_ENTITY: 3 } }] },
      { id: 'a10', text: 'Shoes of choice?', answers: [{ text: 'Oxfords or loafers.', points: { DARK_ACADEMIA: 3 } }, { text: 'Massive platform boots.', points: { CYBER_GRUNGE: 3 } }, { text: 'Birkenstocks or boat shoes.', points: { COASTAL_GRANNY: 3 } }] }
    ]
  }
];
