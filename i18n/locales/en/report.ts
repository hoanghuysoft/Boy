const report = {
  title: 'Report {{target}}',
  subtitle: 'Select a category that best describes the issue. Your report is confidential.',
  subReasonTitle: 'Choose the specific violation:',
  target: {
    post: 'Post',
    comment: 'Comment',
    profile: 'Profile',
    message: 'Message',
    media: 'Media',
    content: 'Content',
  },
  severity: {
    urgent: 'Urgent',
    high: 'High',
  },
  details: {
    title: 'Additional Details',
    subtitle: 'Help us understand the issue',
    inputRequired: 'Provide details (required):',
    inputOptional: 'Add additional context (optional):',
    placeholder: 'Please share any relevant context that will help our safety team investigate...',
    minCharError: 'Please provide a brief explanation (minimum 5 characters).',
    submit: 'Submit Report',
  },
  success: {
    title: 'Thank You for Reporting',
    defaultMessage: 'Your report has been submitted. Our safety team will review it to ensure our community remains safe.',
    alreadyReportedMessage: 'You have already reported this content. It is under review.',
    submitFailed: 'Failed to submit report. Please try again.',
    done: 'Done',
  },
  categories: {
    harassment_hate: {
      title: 'Harassment & Hate Speech',
      description: 'Bullying, insults, discrimination, or personal attacks.',
    },
    violence_threats: {
      title: 'Violence & Physical Threats',
      description: 'Violent threats, physical harm, graphic gore, or dangerous organizations.',
    },
    nudity_sexual: {
      title: 'Nudity & Sexual Content',
      description: 'Pornography, explicit sexual acts, or non-consensual imagery.',
    },
    illegal_harmful: {
      title: 'Severe Harm & Illegal Content',
      description: 'Child safety exploitation, suicide promotion, or illicit substance sales.',
    },
    severe_harm: {
      title: 'Severe Harm & Illegal Content',
      description: 'Child safety exploitation, suicide promotion, or illicit trade.',
    },
    impersonation_fraud: {
      title: 'Impersonation & Fraud',
      description: 'Identity theft, deceptive accounts, crypto scams, or phishing links.',
    },
    spam_deception: {
      title: 'Spam & Manipulation',
      description: 'Automated bot activity, repetitive comments, or artificial engagement.',
    },
    spam_manipulation: {
      title: 'Spam & Manipulation',
      description: 'Automated bot activity, repetitive comments, or artificial engagement.',
    },
    copyright_ip: {
      title: 'Copyright & Intellectual Property',
      description: 'Unauthorized publication of copyrighted video, music, art, or trademarks.',
    },
    other: {
      title: 'Something Else',
      description: 'A community safety violation not covered in the categories above.',
    },
  },
  subReasons: {
    'harassment.targeted': {
      title: 'Targeted Harassment or Bullying',
      description: 'Persistent attacks, intimidation, stalking, or targeted insults.',
    },
    'harassment.hate_speech': {
      title: 'Hate Speech or Discrimination',
      description: 'Attacking protected groups based on race, religion, gender, disability, or identity.',
    },
    'harassment.doxxing': {
      title: 'Doxxing / Sharing Private Personal Data',
      description: 'Publishing phone numbers, addresses, private IDs, or private photos without consent.',
    },
    'violence.physical_threats': {
      title: 'Direct Violent Threats',
      description: 'Threats to kill, injure, assault, or physically harm someone.',
    },
    'violence.threats': {
      title: 'Direct Violent Threats',
      description: 'Threats to kill, injure, assault, or physically harm someone.',
    },
    'violence.gore_graphic': {
      title: 'Graphic Violence, Blood or Animal Cruelty',
      description: 'Extremely graphic depictions of death, severe injury, or animal abuse.',
    },
    'violence.graphic_gore': {
      title: 'Graphic Violence, Blood or Animal Cruelty',
      description: 'Extremely graphic depictions of death, severe injury, or animal abuse.',
    },
    'violence.terrorism_extremism': {
      title: 'Terrorism or Violent Extremism',
      description: 'Promoting terrorist groups, mass violence, or extremist manifestos.',
    },
    'violence.terrorism': {
      title: 'Terrorism or Violent Extremism',
      description: 'Promoting terrorist groups, mass violence, or extremist manifestos.',
    },
    'sexual.explicit_nudity': {
      title: 'Explicit Nudity or Sexual Acts',
      description: 'Pornography, explicit sexual acts, or unsolicited sexual media.',
    },
    'nudity.explicit': {
      title: 'Explicit Nudity or Sexual Acts',
      description: 'Pornography, explicit sexual acts, or unsolicited sexual media.',
    },
    'sexual.non_consensual': {
      title: 'Non-Consensual Sexual Imagery (NCII)',
      description: 'Private intimate photos or sextortion material shared without consent.',
    },
    'nudity.non_consensual': {
      title: 'Non-Consensual Sexual Imagery (NCII)',
      description: 'Private intimate photos or sextortion material shared without consent.',
    },
    'sexual.solicitation': {
      title: 'Commercial Sexual Solicitation',
      description: 'Promoting commercial sexual services or prostitution.',
    },
    'nudity.solicitation': {
      title: 'Commercial Sexual Solicitation',
      description: 'Promoting commercial sexual services or prostitution.',
    },
    'illegal.csam': {
      title: 'Child Sexual Exploitation & Abuse (CSAM)',
      description: 'Content depicting, promoting, or facilitating abuse involving minors.',
    },
    'severe.csam': {
      title: 'Child Sexual Exploitation & Abuse (CSAM)',
      description: 'Content depicting, promoting, or facilitating abuse involving minors.',
    },
    'illegal.self_harm': {
      title: 'Suicide or Self-Harm Encouragement',
      description: 'Encouraging, instructing, or glorifying suicide or severe self-injury.',
    },
    'severe.self_harm': {
      title: 'Suicide or Self-Harm Encouragement',
      description: 'Encouraging, instructing, or glorifying suicide or severe self-injury.',
    },
    'illegal.illicit_trade': {
      title: 'Selling Regulated, Stolen or Illegal Goods',
      description: 'Promoting illegal drugs, firearms, stolen accounts, or counterfeit medicine.',
    },
    'severe.illegal_goods': {
      title: 'Selling Regulated, Stolen or Illegal Goods',
      description: 'Promoting illegal drugs, firearms, stolen accounts, or counterfeit medicine.',
    },
    'impersonation.user_or_entity': {
      title: 'Impersonating Me or Someone Else',
      description: 'Pretending to be me, a celebrity, or an official brand.',
    },
    'fraud.impersonation': {
      title: 'Impersonating Me or Someone Else',
      description: 'Pretending to be me, a celebrity, or an official brand.',
    },
    'fraud.scams_phishing': {
      title: 'Scams, Phishing or Financial Fraud',
      description: 'Crypto scams, fake giveaways, credential theft, or pyramid schemes.',
    },
    'fraud.fake_account': {
      title: 'Fake or Deceptive Account',
      description: 'Account created solely to deceive, manipulate, or mislead users.',
    },
    'spam.automated_commercial': {
      title: 'Spam, Bots or Unsolicited Ads',
      description: 'Repetitive spam posts, bot traffic, automated replies, or unsolicited marketing.',
    },
    'spam.commercial': {
      title: 'Spam, Bots or Unsolicited Ads',
      description: 'Repetitive spam posts, bot traffic, automated replies, or unsolicited marketing.',
    },
    'spam.fake_engagement': {
      title: 'Trend Manipulation & Engagement Farming',
      description: 'Hashtag stuffing, artificial like loops, or misleading links.',
    },
    'spam.engagement': {
      title: 'Trend Manipulation & Engagement Farming',
      description: 'Hashtag stuffing, artificial like loops, or misleading links.',
    },
    'ip.copyright_infringement': {
      title: 'Copyright or Trademark Infringement',
      description: 'Using your copyrighted audio, video, photos, or registered trademark without permission.',
    },
    'ip.infringement': {
      title: 'Copyright or Trademark Infringement',
      description: 'Using your copyrighted audio, video, photos, or registered trademark without permission.',
    },
    'other.general_violation': {
      title: 'Community Guidelines Violation',
      description: 'Other behavior or content that makes the platform unsafe.',
    },
    'other.general': {
      title: 'Community Guidelines Violation',
      description: 'Other behavior or content that makes the platform unsafe.',
    },
  },
} as const;

export default report;
