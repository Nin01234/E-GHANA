import type { IncidentType, Language } from '@/contexts/EmergencyContext';

export type FirstAidAdvice = {
  id: string;
  title: string;
  bullets: string[];
};

type Rule = {
  id: string;
  types?: IncidentType[]; // if omitted, applies to any
  keywords: string[];
  advice: Omit<FirstAidAdvice, 'id'>;
};

const RULES: Rule[] = [
  {
    id: 'bleeding',
    types: ['medical'],
    keywords: ['bleed', 'blood', 'cut', 'wound', 'knife', 'glass'],
    advice: {
      title: 'Bleeding / Open Wound – First Aid',
      bullets: [
        'Apply firm, direct pressure with a clean cloth, clean clothing, or bandage.',
        'If possible, raise the bleeding area above heart level unless this causes more pain.',
        'Do NOT remove objects stuck in the wound; pad around them carefully.',
        'If bleeding soaks through, add more cloth on top – do not remove the first layer.',
        'If blood is heavy, spurting, or will not stop, call emergency services immediately.',
      ],
    },
  },
  {
    id: 'choking',
    types: ['medical'],
    keywords: ['choking', 'choked', 'cannot breathe', "can't breathe", 'food stuck', 'blocked throat'],
    advice: {
      title: 'Choking – First Aid',
      bullets: [
        'Ask the person if they are choking and encourage them to cough forcefully if they can still speak or make sounds.',
        'If they cannot cough, speak, or breathe, stand behind them and give up to 5 firm back blows between the shoulder blades with the heel of your hand.',
        'If back blows do not relieve the blockage, give up to 5 quick abdominal thrusts (if you are trained) or chest thrusts.',
        'Alternate back blows and thrusts until the object comes out or the person becomes unconscious.',
        'If they become unresponsive, start CPR if you are trained and call emergency services immediately.',
      ],
    },
  },
  {
    id: 'burns',
    types: ['medical'],
    keywords: ['burn', 'scald', 'hot water', 'flame', 'fire'],
    advice: {
      title: 'Burns / Scalds – First Aid',
      bullets: [
        'Cool the burned area under cool running water for at least 10 minutes.',
        'Remove tight clothing or jewellery near the burn (not stuck to skin).',
        'Do NOT apply ice, toothpaste, oil, butter, or home creams.',
        'Cover loosely with a clean, non‑fluffy cloth or sterile dressing.',
        'If the face, hands, joints, genitals, or a large area is burned, treat as an emergency and go to a facility quickly.',
      ],
    },
  },
  {
    id: 'asthma',
    types: ['medical'],
    keywords: ['asthma', 'wheez', 'inhaler'],
    advice: {
      title: 'Asthma Attack / Wheezing – First Aid',
      bullets: [
        'Sit the person upright and stay calm with them; do not let them lie flat.',
        'Help them use their reliever inhaler (usually blue) exactly as prescribed.',
        'Loosen tight clothing around the neck and chest.',
        'If breathing is not improving or they cannot speak in full sentences, call emergency services.',
        'If they become very drowsy, confused, or silent, treat this as life‑threatening and get urgent help.',
      ],
    },
  },
  {
    id: 'anaphylaxis',
    types: ['medical'],
    keywords: ['allergic', 'allergy', 'anaphylaxis', 'swollen', 'swelling', 'rash', 'hives'],
    advice: {
      title: 'Severe Allergy / Anaphylaxis – First Aid',
      bullets: [
        'If they have an adrenaline pen (EpiPen), help them use it immediately.',
        'Call emergency services even if they start to feel better afterwards.',
        'Lay them flat with legs raised, or sit them up if breathing is very difficult.',
        'Loosen tight clothing and remove the trigger if it is safe to do so (for example food they are still eating).',
        'Be prepared to give a second adrenaline dose if advised by health workers.',
      ],
    },
  },
  {
    id: 'chest_pain',
    types: ['medical'],
    keywords: ['chest pain', 'heart', 'breath', 'breathing', 'tight chest'],
    advice: {
      title: 'Chest Pain / Breathing Difficulty – First Aid',
      bullets: [
        'Keep the person sitting upright and calm; loosen tight clothing.',
        'Encourage slow, steady breathing; avoid lying them flat unless they faint.',
        'If they use inhalers or heart medication, help them access and take it as prescribed.',
        'Do NOT give food or drink if they are very breathless, in pain, or confused.',
        'Call emergency services immediately – this can be life‑threatening.',
      ],
    },
  },
  {
    id: 'stroke',
    types: ['medical'],
    keywords: ['stroke', 'face droop', 'slurred', 'weak arm', 'cannot speak', "can't speak"],
    advice: {
      title: 'Possible Stroke – F.A.S.T. First Aid',
      bullets: [
        'Face: ask them to smile – one side of the face may droop.',
        'Arms: ask them to raise both arms – one arm may drift down or feel weak.',
        'Speech: listen for slurred, strange, or absent speech.',
        'Time: if you notice any of these signs, call emergency services immediately.',
        'Do not give food, drink, or medication unless told by a health worker.',
      ],
    },
  },
  {
    id: 'seizure',
    types: ['medical'],
    keywords: ['seizure', 'convulsion', 'fit', 'epilepsy'],
    advice: {
      title: 'Seizure / Convulsion – First Aid',
      bullets: [
        'Protect the person from injury – move hard objects away and cushion the head if possible.',
        'Do NOT hold them down and do NOT put anything in their mouth.',
        'Loosen tight clothing around the neck.',
        'When the shaking stops, place them in the recovery position and check breathing.',
        'If the seizure lasts more than 5 minutes, repeats, or they do not wake, call emergency services.',
      ],
    },
  },
  {
    id: 'unconscious',
    types: ['medical'],
    keywords: ['unconscious', 'no response', 'won’t wake', "won't wake", 'faint'],
    advice: {
      title: 'Unconscious / Unresponsive Person – First Aid',
      bullets: [
        'Check for normal breathing – look for chest movement and feel for breath.',
        'If breathing, place them in the recovery position on their side.',
        'If not breathing and you are trained, begin CPR and ask for help.',
        'Keep the airway clear by gently tilting the head back and lifting the chin.',
        'Call emergency services immediately and stay with the person.',
      ],
    },
  },
  {
    id: 'fracture',
    types: ['medical'],
    keywords: ['fracture', 'broken', 'bone', 'sprain', 'twisted ankle'],
    advice: {
      title: 'Broken Bone / Serious Sprain – First Aid',
      bullets: [
        'Keep the injured limb still and supported in the position found.',
        'Do NOT try to straighten bent limbs or push bones back in.',
        'Apply a cold pack wrapped in cloth to reduce swelling (not directly on bare skin).',
        'Control any bleeding with direct pressure away from the broken area.',
        'Seek urgent medical care, especially if there is deformity, open wound, or severe pain.',
      ],
    },
  },
  {
    id: 'poisoning',
    types: ['medical'],
    keywords: ['poison', 'chemical', 'ingested', 'swallowed', 'inhaled fumes'],
    advice: {
      title: 'Poisoning / Harmful Substance – First Aid',
      bullets: [
        'Move the person away from the source (gas, fumes, chemicals) if it is safe.',
        'Do NOT make them vomit unless a medical professional tells you.',
        'If the substance is on skin or in eyes, rinse with clean running water for at least 15 minutes.',
        'Keep any containers, labels, or medicine packets to show health workers.',
        'Call emergency services or a poison centre immediately for advice.',
      ],
    },
  },
  {
    id: 'diabetes',
    types: ['medical'],
    keywords: ['diabetes', 'diabetic', 'low sugar', 'low blood sugar', 'high sugar', 'high blood sugar', 'glucose'],
    advice: {
      title: 'Diabetes / Blood Sugar Problem – First Aid',
      bullets: [
        'If the person is awake and able to swallow and you suspect low blood sugar, give a fast sugar source such as sweet drink, fruit juice, or glucose tablets.',
        'If they improve within 10–15 minutes, offer a snack with longer‑acting carbohydrate like bread or biscuits.',
        'If they are drowsy, confused, or cannot swallow safely, do NOT give food or drink by mouth.',
        'If there is severe confusion, seizure, or they do not improve quickly, call emergency services.',
        'Always advise them to see a health worker to review their diabetes treatment as soon as possible.',
      ],
    },
  },
  {
    id: 'heat',
    types: ['medical'],
    keywords: ['heat', 'heat stroke', 'heat exhaustion', 'very hot', 'overheated', 'sun stroke'],
    advice: {
      title: 'Heat Exhaustion / Heat Stroke – First Aid',
      bullets: [
        'Move the person to a cool, shaded place and remove excess clothing.',
        'Cool them with fans, cool wet cloths, or a cool shower if available.',
        'Give small sips of cool water if they are fully awake and can swallow safely.',
        'If they are confused, vomiting, very hot and dry, or stop sweating, treat as an emergency and call for medical help.',
        'Keep cooling them until help arrives or they feel clearly better, but do not over‑cool to shivering.',
      ],
    },
  },
  {
    id: 'hypothermia',
    types: ['medical'],
    keywords: ['hypothermia', 'very cold', 'freezing', 'shivering a lot', 'exposed to cold'],
    advice: {
      title: 'Cold Exposure / Hypothermia – First Aid',
      bullets: [
        'Move the person to a warm, dry place and remove any wet clothing.',
        'Warm them gradually with blankets, dry clothing, and body heat if needed.',
        'Give warm sweet drinks if they are fully awake and can swallow safely (no alcohol).',
        'Do NOT rub cold skin or place them directly in hot water, as this can be dangerous.',
        'If they are very drowsy, confused, or not improving, call emergency services immediately.',
      ],
    },
  },
  {
    id: 'drowning',
    types: ['medical'],
    keywords: ['drowning', 'near drowning', 'pulled from water', 'almost drowned'],
    advice: {
      title: 'Drowning / Near‑Drowning – First Aid',
      bullets: [
        'Ensure your own safety first before attempting a water rescue.',
        'Once the person is out of the water, check for normal breathing and responsiveness.',
        'If they are not breathing and you are trained, begin CPR and ask someone to call emergency services.',
        'If they are breathing, place them in the recovery position and keep them warm.',
        'Even if they seem to recover, advise urgent medical assessment because breathing problems can appear later.',
      ],
    },
  },
  {
    id: 'head_injury',
    types: ['medical'],
    keywords: ['head injury', 'hit head', 'knocked out', 'concussion'],
    advice: {
      title: 'Head Injury – First Aid',
      bullets: [
        'If there is any loss of consciousness, repeated vomiting, seizure, or confusion, call emergency services immediately.',
        'Keep the person still with their head and neck supported; do not let them walk if badly injured.',
        'Apply a cold pack wrapped in cloth to any swelling, avoiding direct pressure on open wounds.',
        'Do NOT give alcohol or strong pain medicines and do not let them drive.',
        'Watch closely for worsening headache, confusion, or drowsiness and seek urgent care if these appear.',
      ],
    },
  },
  {
    id: 'eye_injury',
    types: ['medical'],
    keywords: ['eye injury', 'chemical in eye', 'something in eye', 'object in eye'],
    advice: {
      title: 'Eye Injury – First Aid',
      bullets: [
        'If a chemical has splashed in the eye, rinse immediately with clean running water for at least 15 minutes.',
        'Do NOT rub the eye and do NOT try to remove objects stuck in the eyeball.',
        'Cover the injured eye loosely with a clean pad or cloth.',
        'If there is severe pain, vision changes, or an object is stuck, seek emergency eye care immediately.',
        'Avoid putting any drops or ointments in the eye unless prescribed by a health worker.',
      ],
    },
  },
];

export function getFirstAidAdvice(
  description: string | null | undefined,
  type: IncidentType | string,
): FirstAidAdvice | null {
  if (!description) return null;
  const text = description.toLowerCase();
  const incidentType = type as IncidentType;

  const matches = RULES.filter((rule) => {
    if (rule.types && !rule.types.includes(incidentType)) return false;
    return rule.keywords.some((kw) => text.includes(kw.toLowerCase()));
  });

  if (matches.length > 0) {
    // Prefer the rule with the most keyword hits (more specific)
    const best = matches
      .map((rule) => ({
        rule,
        score: rule.keywords.reduce(
          (acc, kw) => (text.includes(kw.toLowerCase()) ? acc + 1 : acc),
          0,
        ),
      }))
      .sort((a, b) => b.score - a.score)[0].rule;

    return {
      id: best.id,
      title: best.advice.title,
      bullets: best.advice.bullets,
    };
  }

  if (incidentType !== 'medical') return null;

  return {
    id: 'general_medical',
    title: 'General Medical Emergency – First Aid',
    bullets: [
      'Stay calm and reassure the person while you wait for help.',
      'Keep them comfortable and protect them from heat, cold, or further harm.',
      'Do not give food or drink if they are very unwell, drowsy, or may need surgery.',
      'Follow any instructions given by emergency services over the phone.',
      'Seek professional medical care as soon as possible – this guidance is not a substitute.',
    ],
  };
}

export function buildFirstAidSpeech(
  firstAid: FirstAidAdvice,
  language: Language,
): { text: string; speechLang: string; rate: number } {
  const baseLines = [
    firstAid.title,
    ...firstAid.bullets.map((b, idx) => `Step ${idx + 1}: ${b}`),
  ];

  let prefix = '';
  // Simple Ghana‑focused intros; bullets remain clear, slow English.
  switch (language) {
    case 'tw':
      prefix =
        'Twi guidance: Mesrɛ wo, tie saa akyerɛkyerɛ yi yie, na frɛ awurade adwumayɛfo ntɛm.';
      break;
    case 'ga':
      prefix =
        'Ga guidance: Gbɔmɔ shishi, gbɛi ni lɛ mli, ni hu Ghana emergency service lɛ kɛkɛ.';
      break;
    case 'ewe':
      prefix =
        'Ewe guidance: Medekuku wò, tsi tsitsi kple agbagba, eye frɛ emergency service kple nugbidodo.';
      break;
    default:
      prefix = '';
  }

  const parts = prefix ? [prefix, ...baseLines] : baseLines;
  const speechLang = 'en-US';
  const rate = language === 'en' ? 0.9 : 0.85;

  return {
    text: parts.join('. '),
    speechLang,
    rate,
  };
}

