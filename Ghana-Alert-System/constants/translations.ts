export type Language = 'en' | 'tw' | 'ga' | 'ewe';

export type TranslationKey =
  | 'emergency'
  | 'panicAlert'
  | 'reportIncident'
  | 'history'
  | 'contacts'
  | 'notifications'
  | 'responders'
  | 'settings'
  | 'police'
  | 'fire'
  | 'medical'
  | 'other'
  | 'selectIncidentType'
  | 'tapToReport'
  | 'silentMode'
  | 'loudMode'
  | 'holdToTrigger'
  | 'panicActive'
  | 'cancelPanic'
  | 'emergencyNumbers'
  | 'language'
  | 'yourLocation'
  | 'gpsAccuracy'
  | 'addDescription'
  | 'describeEmergency'
  | 'attachEvidence'
  | 'takePhoto'
  | 'fromGallery'
  | 'submitReport'
  | 'submitting'
  | 'reportSubmitted'
  | 'noHistory'
  | 'incidentId'
  | 'status'
  | 'submitted'
  | 'received'
  | 'verified'
  | 'dispatched'
  | 'enroute'
  | 'onscene'
  | 'resolved'
  | 'quickDial'
  | 'national'
  | 'nationalDesc'
  | 'policeDesc'
  | 'fireDesc'
  | 'ambulanceDesc'
  | 'callNow'
  | 'identity'
  | 'ghanaCard'
  | 'verifyIdentity'
  | 'anonymous'
  | 'darkMode'
  | 'about'
  | 'privacyPolicy'
  | 'version'
  | 'locationPermission'
  | 'grantPermission'
  | 'tapAndHold'
  | 'releaseToTrigger'
  | 'activating'
  | 'sendingAlert'
  | 'alertSent'
  | 'locationShared'
  | 'responderNotified'
  | 'stayCalm'
  | 'helpIsOnTheWay'
  | 'offlineNoInternetBanner'
  | 'offlineSlowBanner'
  | 'tooManyReportsTitle'
  | 'tooManyReportsBody'
  | 'queuedOfflineMessage';

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  emergency: 'Emergency',
  panicAlert: 'PANIC ALERT',
  reportIncident: 'Report Incident',
  history: 'History',
  contacts: 'Contacts',
  notifications: 'Notifications',
  responders: 'Responders',
  settings: 'Settings',
  police: 'Police',
  fire: 'Fire',
  medical: 'Medical',
  other: 'Other',
  selectIncidentType: 'Select Incident Type',
  tapToReport: 'Tap to Report Emergency',
  silentMode: 'Silent Mode',
  loudMode: 'Loud Mode',
  holdToTrigger: 'HOLD TO TRIGGER',
  panicActive: 'PANIC ACTIVE',
  cancelPanic: 'Cancel Alert',
  emergencyNumbers: 'Emergency Numbers',
  language: 'Language',
  yourLocation: 'Your Location',
  gpsAccuracy: 'GPS Accuracy',
  addDescription: 'Add Description',
  describeEmergency: 'Describe the emergency...',
  attachEvidence: 'Attach Evidence',
  takePhoto: 'Take Photo',
  fromGallery: 'From Gallery',
  submitReport: 'Submit Report',
  submitting: 'Submitting...',
  reportSubmitted: 'Report Submitted',
  noHistory: 'No incidents reported yet',
  incidentId: 'Incident ID',
  status: 'Status',
  submitted: 'Submitted',
  received: 'Received',
  verified: 'Verified',
  dispatched: 'Dispatched',
  enroute: 'En Route',
  onscene: 'On Scene',
  resolved: 'Resolved',
  quickDial: 'Quick Dial',
  national: 'National Emergency',
  nationalDesc: 'All emergencies — 24/7 response',
  policeDesc: 'Ghana Police Service',
  fireDesc: 'Ghana National Fire Service',
  ambulanceDesc: 'National Ambulance Service',
  callNow: 'Call Now',
  identity: 'Identity',
  ghanaCard: 'Ghana Card (NIA)',
  verifyIdentity: 'Verify Identity',
  anonymous: 'Anonymous',
  darkMode: 'Dark Mode',
  about: 'About E-GHANA',
  privacyPolicy: 'Privacy & Data Protection',
  version: 'Version',
  locationPermission: 'Location Permission Required',
  grantPermission: 'Grant Permission',
  tapAndHold: 'TAP & HOLD',
  releaseToTrigger: 'RELEASE TO TRIGGER',
  activating: 'ACTIVATING...',
  sendingAlert: 'Sending Alert...',
  alertSent: 'Alert Sent!',
  locationShared: 'Location Shared',
  responderNotified: 'Responders Notified',
  stayCalm: 'Stay Calm',
  helpIsOnTheWay: 'Help Is On The Way',
  offlineNoInternetBanner: 'No internet. Reports will be queued and sent when you are back online.',
  offlineSlowBanner: 'Slow connection. Reports may be delayed.',
  tooManyReportsTitle: 'Too many reports',
  tooManyReportsBody: 'You have sent many reports in a short time. Misuse of this emergency system may lead to your account being blocked.',
  queuedOfflineMessage: 'No internet connection. Your report was saved and will be sent automatically when you are back online.',
};

const tw: Translations = {
  emergency: 'Ɔhaw',
  panicAlert: 'ƆHAW NHYEHYƐE',
  reportIncident: 'Ka Asem Bio',
  history: 'Nhoma',
  contacts: 'Nkrataa',
  notifications: 'Nkae',
  responders: 'Responders',
  settings: 'Nhyehyɛe',
  police: 'Apolisi',
  fire: 'Ogya',
  medical: 'Ayaresa',
  other: 'Biribi Foforɔ',
  selectIncidentType: 'Yi Asem Nhwehwɛmu',
  tapToReport: 'Bɔ Ka Ɔhaw',
  silentMode: 'Emu Kɔ Dinn',
  loudMode: 'Mu Hyerɛn',
  holdToTrigger: 'TIE NA KƆKƆ',
  panicActive: 'ƆHAW WƆ HƆ',
  cancelPanic: 'Gyae Nhyehyɛe',
  emergencyNumbers: 'Ɔhaw Nɔmba',
  language: 'Kasa',
  yourLocation: 'Wo Beae',
  gpsAccuracy: 'GPS Tenenee',
  addDescription: 'Ka Asem',
  describeEmergency: 'Ka ɔhaw ho asem...',
  attachEvidence: 'De Adanse Bra',
  takePhoto: 'Fa Foto',
  fromGallery: 'Fi Gallery',
  submitReport: 'Fa Ka Nhoma',
  submitting: 'Rekɔ...',
  reportSubmitted: 'Asem Akɔ',
  noHistory: 'Asem biara nni hɔ',
  incidentId: 'Asem ID',
  status: 'Tebea',
  submitted: 'Aka',
  received: 'Anya',
  verified: 'Adwene',
  dispatched: 'Akɔ',
  enroute: 'Kwan So',
  onscene: 'Beae No',
  resolved: 'Asɔre',
  quickDial: 'Ntɛm Frɛ',
  national: 'Oman Ɔhaw',
  nationalDesc: 'Ɔhaw nyinaa — Daa nnansa',
  policeDesc: 'Ghana Apolisi Asafo',
  fireDesc: 'Ghana Ogya Tenten',
  ambulanceDesc: 'Oman Ambulance Asafo',
  callNow: 'Frɛ Seesei',
  identity: 'Wo Ho',
  ghanaCard: 'Ghana Kaad (NIA)',
  verifyIdentity: 'Hwɛ Wo Ho',
  anonymous: 'Din Nni Ho',
  darkMode: 'Sum Tebea',
  about: 'E-GHANA Ho',
  privacyPolicy: 'Honam & Data',
  version: 'Nhyehyɛe',
  locationPermission: 'Beae Tumi Hia',
  grantPermission: 'Ma Tumi',
  tapAndHold: 'BƆ NA TIE',
  releaseToTrigger: 'GYA MA ƐKƆ',
  activating: 'REKAN...',
  sendingAlert: 'Resoma Nhyehyɛe...',
  alertSent: 'Nhyehyɛe Akɔ!',
  locationShared: 'Beae Aka',
  responderNotified: 'Afrawofoɔ Hwɛ',
  stayCalm: 'Gyina Dinn',
  helpIsOnTheWay: 'Mmoa Reba',
  offlineNoInternetBanner: 'Intanɛt nni hɔ. Woka no bɛkɔ so da a ɔbɛsan aba.',
  offlineSlowBanner: 'Intanɛt no yɛ mmerɛw. Asemmisa no betumi afa bere.',
  tooManyReportsTitle: 'Nsɛm dɔɔso',
  tooManyReportsBody: 'Wato amanneɛ bebree ntɛm. Sɛ wode ɔhaw dwumadi yɛ agorɔ a, wobetumi abu wo akonta so.',
  queuedOfflineMessage: 'Intanɛt nni hɔ. Yɛasie wo amanneɛ na ɛbɛkɔ so hyɛ afie sɛ intanɛt san ba.',
};

const ga: Translations = {
  emergency: 'Shishiemi',
  panicAlert: 'SHISHIEMI NAAWO',
  reportIncident: 'Ye Naa Shishi',
  history: 'Lɛ Nyɛmɔ',
  contacts: 'Bii Lɛ',
  notifications: 'Nkae',
  responders: 'Responders',
  settings: 'Wɔɔ Gbɛ',
  police: 'Polisi',
  fire: 'Gɔŋ',
  medical: 'Healer',
  other: 'Amɛ Gbɛ',
  selectIncidentType: 'Tio Shishi Nyɛmɔ',
  tapToReport: 'Bu Shishiemi Naa',
  silentMode: 'Yiri Gbɛ',
  loudMode: 'Ko Ko Gbɛ',
  holdToTrigger: 'KEI NA NEMI',
  panicActive: 'SHISHIEMI WƆ',
  cancelPanic: 'Saa Naawo',
  emergencyNumbers: 'Shishiemi Nɔŋ',
  language: 'Kɔ',
  yourLocation: 'Mi Shi',
  gpsAccuracy: 'GPS Tɔɔ',
  addDescription: 'Bɔ Naa',
  describeEmergency: 'Bɔ shishiemi naa...',
  attachEvidence: 'He Adanse',
  takePhoto: 'Fa Foto',
  fromGallery: 'Fi Gallery',
  submitReport: 'He Naa Gbɛ',
  submitting: 'Kɛ...',
  reportSubmitted: 'Naa Kɛe',
  noHistory: 'Shishi mli wɔ',
  incidentId: 'Shishi ID',
  status: 'Nyɛmɔ',
  submitted: 'Kɛe',
  received: 'Nyɛ',
  verified: 'Hwɛ',
  dispatched: 'Kɛɛ',
  enroute: 'Shi',
  onscene: 'Shi Wɔ',
  resolved: 'Saa',
  quickDial: 'Fii Nemi',
  national: 'Oman Shishiemi',
  nationalDesc: 'Shishi naa — 24/7',
  policeDesc: 'Ghana Polisi Hejii',
  fireDesc: 'Ghana Gɔŋ Hejii',
  ambulanceDesc: 'Oman Ambulance',
  callNow: 'Nemi Seesei',
  identity: 'Mi Ho',
  ghanaCard: 'Ghana Kaad (NIA)',
  verifyIdentity: 'Hwɛ Mi Ho',
  anonymous: 'Din Mli',
  darkMode: 'Sum Nyɛmɔ',
  about: 'E-GHANA Ho',
  privacyPolicy: 'Privacy & Data',
  version: 'Nyɛmɔ',
  locationPermission: 'Shi Tumi Hia',
  grantPermission: 'He Tumi',
  tapAndHold: 'BU NA KEI',
  releaseToTrigger: 'SAA MA KƐ',
  activating: 'KAN...',
  sendingAlert: 'Kɛ Naawo...',
  alertSent: 'Naawo Kɛe!',
  locationShared: 'Shi Kɛe',
  responderNotified: 'Bii Hwɛ',
  stayCalm: 'Ni Yiri',
  helpIsOnTheWay: 'Nudɔŋ Reba',
  offlineNoInternetBanner: 'Internet mli nɔ. Naa nii bɛhyɛ mli kɛ kɔ shishi kɛ nɛ internet baa.',
  offlineSlowBanner: 'Internet lɛ yɛ mɔnhu. Naa nii shishi lɛ tɛɛ.',
  tooManyReportsTitle: 'Naa lɛ dɔɔso',
  tooManyReportsBody: 'Kɛ ye naa shishi lɛ dɔɔso jwee. Sɛ ni ye di shishiemi lɛ gbo lε, wɔtsɔɔ lɛ kaa wo akontaa.',
  queuedOfflineMessage: 'Internet mli nɔ. Yehei naa shishi lɛ kɛ ɔbɛkɔ shishiemi kɛ nɛ internet baa.',
};

const ewe: Translations = {
  emergency: 'Vevienye',
  panicAlert: 'VEVIENYE NUSƆ',
  reportIncident: 'Gblɔ Vevienye',
  history: 'Nutata',
  contacts: 'Nuwɔwɔ',
  notifications: 'Nkae',
  responders: 'Amesiwo',
  settings: 'Wɔwɔ',
  police: 'Polisi',
  fire: 'Dzɔ',
  medical: 'Ame-ŋkuŋku',
  other: 'Bubu',
  selectIncidentType: 'Tia Nane',
  tapToReport: 'Ŋlɔ Vevienye',
  silentMode: 'Ŋutifafa Wɔwɔ',
  loudMode: 'Goglo Wɔwɔ',
  holdToTrigger: 'DZO NA TSƆE',
  panicActive: 'VEVIENYE LE',
  cancelPanic: 'Dzɔ Nusɔ',
  emergencyNumbers: 'Vevienye Nombowo',
  language: 'Gbegbɔgblɔ',
  yourLocation: 'Ŋkeke Gbɔ',
  gpsAccuracy: 'GPS Vovovo',
  addDescription: 'Ŋlɔ Dzɔdzɔe',
  describeEmergency: 'Gblɔ vevienye...',
  attachEvidence: 'Tsɔ Adanse',
  takePhoto: 'Tsɔ Foto',
  fromGallery: 'Ɖo Gallery',
  submitReport: 'Dze Nutata',
  submitting: 'Le ɖe...',
  reportSubmitted: 'Nutata ɖee',
  noHistory: 'Nutata aɖeke mele',
  incidentId: 'Vevienye ID',
  status: 'Tebea',
  submitted: 'Dze',
  received: 'Ɖo',
  verified: 'Wɔ',
  dispatched: 'Dze',
  enroute: 'Le ŋkeke',
  onscene: 'Le gbɔ',
  resolved: 'Vɔ',
  quickDial: 'Xɔ Vevie',
  national: 'Vevienye Ƒe',
  nationalDesc: 'Vevienye katã — 24/7',
  policeDesc: 'Ghana Polisi Ƒe',
  fireDesc: 'Ghana Dzɔ Ŋuŋɔŋlɔ',
  ambulanceDesc: 'Ame-ŋkuŋku Ƒe',
  callNow: 'Xɔ Fifia',
  identity: 'Ame Gbɔ',
  ghanaCard: 'Ghana Kaad (NIA)',
  verifyIdentity: 'Wɔ Ame Gbɔ',
  anonymous: 'Din Mele',
  darkMode: 'Zikpui Wɔwɔ',
  about: 'E-GHANA Dzi',
  privacyPolicy: 'Privacy & Data',
  version: 'Wɔwɔ',
  locationPermission: 'Ŋkeke Tumi Hia',
  grantPermission: 'Na Tumi',
  tapAndHold: 'ŊLƆ NA DZO',
  releaseToTrigger: 'HƐ MA TSƆE',
  activating: 'LE ŊLƆ...',
  sendingAlert: 'Dze Nusɔ...',
  alertSent: 'Nusɔ Ɖee!',
  locationShared: 'Ŋkeke Gblɔ',
  responderNotified: 'Amesiwo Ŋlɔ',
  stayCalm: 'Dzo Ŋutifafa',
  helpIsOnTheWay: 'Kpekpeɖeŋu le bɛ',
  offlineNoInternetBanner: 'Internet mele o. Nutatawo katã nàtsɔtsɔ be wòawɔ internet ɖa.',
  offlineSlowBanner: 'Internet la le mɔna. Nutatawo ate ŋu atɔ̃ hiã gbɔ.',
  tooManyReportsTitle: 'Nutatawo dɔdzikpɔkpɔ',
  tooManyReportsBody: 'Ètu nutata bebree le ɣeyiyi si va ɣe ma. Ne èdi emergency system la ɖe agbãgbe o, wòakpɔ wò account abe gɔme.',
  queuedOfflineMessage: 'Internet mele o. Wò nutata la wɔwɔ tso kplee na wò be woawɔ ɖa nɛ internet va.',
};

export const translations: Record<Language, Translations> = { en, tw, ga, ewe };

export function t(key: TranslationKey, language: Language = 'en'): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
