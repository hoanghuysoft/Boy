const report = {
  title: '举报{{target}}',
  subtitle: '选择最能描述该问题的类别。您的举报将严格保密。',
  subReasonTitle: '选择具体违规行为：',
  target: {
    post: '帖子',
    comment: '评论',
    profile: '个人资料',
    message: '消息',
    media: '媒体',
    content: '内容',
  },
  severity: {
    urgent: '紧急',
    high: '高',
  },
  details: {
    title: '补充详细信息',
    subtitle: '帮助我们了解问题',
    inputRequired: '提供详细信息（必填）：',
    inputOptional: '添加补充说明（可选）：',
    placeholder: '请分享有助于我们安全团队调查的相关背景信息...',
    minCharError: '请提供简要说明（至少5个字符）。',
    submit: '提交举报',
  },
  success: {
    title: '感谢您的举报',
    defaultMessage: '您的举报已提交。我们的安全团队将对其进行审核，以确保社区安全。',
    alreadyReportedMessage: '您之前已举报过此内容。正在审核中。',
    submitFailed: '提交举报失败，请重试。',
    done: '完成',
  },
  categories: {
    harassment_hate: {
      title: '骚扰与仇恨言论',
      description: '霸凌、侮辱、歧视或人身攻击。',
    },
    violence_threats: {
      title: '暴力与人身威胁',
      description: '暴力威胁、人身伤害、血腥画面或极端主义。',
    },
    nudity_sexual: {
      title: '裸露与色情内容',
      description: '色情、露骨性行为或未经同意传播的私密图像。',
    },
    illegal_harmful: {
      title: '严重危害与非法内容',
      description: '儿童安全剥削、宣扬自杀或非法交易。',
    },
    severe_harm: {
      title: '严重危害与非法内容',
      description: '儿童安全剥削、宣扬自杀或非法交易。',
    },
    impersonation_fraud: {
      title: '冒充与欺诈',
      description: '身份盗用、欺诈性账户、骗局或钓鱼。',
    },
    spam_deception: {
      title: '垃圾信息与操纵',
      description: '自动化机器人活动、重复评论或虚假互动。',
    },
    spam_manipulation: {
      title: '垃圾信息与操纵',
      description: '自动化机器人活动、重复评论或虚假互动。',
    },
    copyright_ip: {
      title: '版权与知识产权',
      description: '未经授权发布受版权保护的视频、音乐、艺术或商标。',
    },
    other: {
      title: '其他原因',
      description: '上述类别中未涵盖的社区安全违规行为。',
    },
  },
  subReasons: {
    'harassment.targeted': {
      title: '有针对性的骚扰或霸凌',
      description: '持续攻击、恐吓、跟踪或针对个人的恶意侮辱。',
    },
    'harassment.hate_speech': {
      title: '仇恨言论或歧视',
      description: '根据种族、宗教、性别、残疾或身份等特征攻击特定群体。',
    },
    'harassment.doxxing': {
      title: '人肉搜索与泄露个人隐私 (Doxxing)',
      description: '未经许可公开他人电话号码、住址、身份证件或私密照片。',
    },
    'violence.physical_threats': {
      title: '直接暴力威胁',
      description: '威胁杀害、伤害、袭击或对他人造成人身伤害。',
    },
    'violence.threats': {
      title: '直接暴力威胁',
      description: '威胁杀害、伤害、袭击或对他人造成人身伤害。',
    },
    'violence.gore_graphic': {
      title: '血腥暴力或虐待动物',
      description: '极其写实地描绘死亡、严重肢体伤害或虐待动物。',
    },
    'violence.graphic_gore': {
      title: '血腥暴力或虐待动物',
      description: '极其写实地描绘死亡、严重肢体伤害或虐待动物。',
    },
    'violence.terrorism_extremism': {
      title: '恐怖主义或暴力极端主义',
      description: '宣传恐怖组织、大规模暴力事件或极端主义宣言。',
    },
    'violence.terrorism': {
      title: '恐怖主义或暴力极端主义',
      description: '宣传恐怖组织、大规模暴力事件或极端主义宣言。',
    },
    'sexual.explicit_nudity': {
      title: '露骨裸露或性行为',
      description: '色情内容、露骨性行为或未经请求发送的露骨媒体。',
    },
    'nudity.explicit': {
      title: '露骨裸露或性行为',
      description: '色情内容、露骨性行为或未经请求发送的露骨媒体。',
    },
    'sexual.non_consensual': {
      title: '非自愿私密图像 (NCII)',
      description: '未经同意传播的私密照片或性勒索材料。',
    },
    'nudity.non_consensual': {
      title: '非自愿私密图像 (NCII)',
      description: '未经同意传播的私密照片或性勒索材料。',
    },
    'sexual.solicitation': {
      title: '商业性引诱与招嫖',
      description: '推广商业性服务、性交易或招嫖。',
    },
    'nudity.solicitation': {
      title: '商业性引诱与招嫖',
      description: '推广商业性服务、性交易或招嫖。',
    },
    'illegal.csam': {
      title: '儿童性虐待与剥削材料 (CSAM)',
      description: '任何描绘、宣扬或助长针对未成年人虐待的内容。',
    },
    'severe.csam': {
      title: '儿童性虐待与剥削材料 (CSAM)',
      description: '任何描绘、宣扬或助长针对未成年人虐待的内容。',
    },
    'illegal.self_harm': {
      title: '自杀或自残倾向/诱导',
      description: '鼓励、指导或宣扬自杀、自残及严重自我伤害行为。',
    },
    'severe.self_harm': {
      title: '自杀或自残倾向/诱导',
      description: '鼓励、指导或宣扬自杀、自残及严重自我伤害行为。',
    },
    'illegal.illicit_trade': {
      title: '销售违禁品、毒品、武器或非法物品',
      description: '推广非法药物、枪支武器、被盗账户或假冒伪劣药品。',
    },
    'severe.illegal_goods': {
      title: '销售违禁品、毒品、武器或非法物品',
      description: '推广非法药物、枪支武器、被盗账户或假冒伪劣药品。',
    },
    'impersonation.user_or_entity': {
      title: '冒充我或他人/机构',
      description: '冒充本人、公众人物、名企或官方品牌。',
    },
    'fraud.impersonation': {
      title: '冒充我或他人/机构',
      description: '冒充本人、公众人物、名企或官方品牌。',
    },
    'fraud.scams_phishing': {
      title: '诈骗、钓鱼或金融欺诈',
      description: '加密货币骗局、虚假抽奖、账号密码盗取或传销骗局。',
    },
    'fraud.fake_account': {
      title: '虚假或欺骗性账户',
      description: '仅用于欺骗、操纵或误导用户的傀儡或虚假账户。',
    },
    'spam.automated_commercial': {
      title: '垃圾信息、机器人或未经请求的广告',
      description: '重复的垃圾内容、机器人刷屏、自动回复或骚扰性营销。',
    },
    'spam.commercial': {
      title: '垃圾信息、机器人或未经请求的广告',
      description: '重复的垃圾内容、机器人刷屏、自动回复或骚扰性营销。',
    },
    'spam.fake_engagement': {
      title: '操纵趋势与刷量互动',
      description: '堆砌话题标签、刷虚假点赞量或使用误导性链接。',
    },
    'spam.engagement': {
      title: '操纵趋势与刷量互动',
      description: '堆砌话题标签、刷虚假点赞量或使用误导性链接。',
    },
    'ip.copyright_infringement': {
      title: '侵犯版权或商标权',
      description: '未经许可使用受版权保护的音视频、图像素材或注册商标。',
    },
    'ip.infringement': {
      title: '侵犯版权或商标权',
      description: '未经许可使用受版权保护的音视频、图像素材或注册商标。',
    },
    'other.general_violation': {
      title: '违反社区准则',
      description: '其他破坏平台安全、违反准则的内容或行为。',
    },
    'other.general': {
      title: '违反社区准则',
      description: '其他破坏平台安全、违反准则的内容或行为。',
    },
  },
} as const;

export default report;
