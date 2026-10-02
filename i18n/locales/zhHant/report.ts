const report = {
  title: '檢舉{{target}}',
  subtitle: '選擇最能描述該問題的類別。您的檢舉將嚴格保密。',
  subReasonTitle: '選擇具體違規行為：',
  target: {
    post: '貼文',
    comment: '評論',
    profile: '個人檔案',
    message: '訊息',
    media: '媒體',
    content: '內容',
  },
  severity: {
    urgent: '緊急',
    high: '高',
  },
  details: {
    title: '補充詳細資訊',
    subtitle: '幫助我們了解問題',
    inputRequired: '提供詳細資訊（必填）：',
    inputOptional: '添加補充說明（可選）：',
    placeholder: '請分享有助於我們安全團隊調查的相關背景資訊...',
    minCharError: '請提供簡要說明（至少5個字符）。',
    submit: '提交檢舉',
  },
  success: {
    title: '感謝您的檢舉',
    defaultMessage: '您的檢舉已提交。我們的安全團隊將對其進行審核，以確保社群安全。',
    alreadyReportedMessage: '您之前已檢舉過此內容。正在審核中。',
    submitFailed: '提交檢舉失敗，請重試。',
    done: '完成',
  },
  categories: {
    harassment_hate: {
      title: '騷擾與仇恨言論',
      description: '霸凌、侮辱、歧視或人身攻擊。',
    },
    violence_threats: {
      title: '暴力與人身威脅',
      description: '暴力威脅、人身傷害、血腥畫面或極端主義。',
    },
    nudity_sexual: {
      title: '裸露與色情內容',
      description: '色情、露骨性行為或未經同意傳播的私密圖像。',
    },
    illegal_harmful: {
      title: '嚴重危害與非法內容',
      description: '兒童安全剝削、宣揚自殺或非法交易。',
    },
    severe_harm: {
      title: '嚴重危害與非法內容',
      description: '兒童安全剝削、宣揚自殺或非法交易。',
    },
    impersonation_fraud: {
      title: '冒充與欺詐',
      description: '身分盜用、欺詐性帳戶、騙局或釣魚。',
    },
    spam_deception: {
      title: '垃圾訊息與操縱',
      description: '自動化機器人活動、重複評論或虛假互動。',
    },
    spam_manipulation: {
      title: '垃圾訊息與操縱',
      description: '自動化機器人活動、重複評論或虛假互動。',
    },
    copyright_ip: {
      title: '版權與智慧財產權',
      description: '未經授權發布受版權保護的影片、音樂、藝術或商標。',
    },
    other: {
      title: '其他原因',
      description: '上述類別中未涵蓋的社群安全違規行為。',
    },
  },
  subReasons: {
    'harassment.targeted': {
      title: '有針對性的騷擾或霸凌',
      description: '持續攻擊、恐嚇、跟蹤或針對個人的惡意侮辱。',
    },
    'harassment.hate_speech': {
      title: '仇恨言論或歧視',
      description: '根據種族、宗教、性別、殘疾或身分等特徵攻擊特定群體。',
    },
    'harassment.doxxing': {
      title: '肉搜與洩漏個人隱私 (Doxxing)',
      description: '未經許可公開他人電話號碼、住址、身分證件或私密照片。',
    },
    'violence.physical_threats': {
      title: '直接暴力威脅',
      description: '威脅殺害、傷害、襲擊或對他人造成人身傷害。',
    },
    'violence.threats': {
      title: '直接暴力威脅',
      description: '威脅殺害、傷害、襲擊或對他人造成人身傷害。',
    },
    'violence.gore_graphic': {
      title: '血腥暴力或虐待動物',
      description: '極其寫實地描繪死亡、嚴重肢體傷害或虐待動物。',
    },
    'violence.graphic_gore': {
      title: '血腥暴力或虐待動物',
      description: '極其寫實地描繪死亡、嚴重肢體傷害或虐待動物。',
    },
    'violence.terrorism_extremism': {
      title: '恐怖主義或暴力極端主義',
      description: '宣傳恐怖組織、大規模暴力事件或極端主義宣言。',
    },
    'violence.terrorism': {
      title: '恐怖主義或暴力極端主義',
      description: '宣傳恐怖組織、大規模暴力事件或極端主義宣言。',
    },
    'sexual.explicit_nudity': {
      title: '露骨裸露或性行為',
      description: '色情內容、露骨性行為或未經請求發送的露骨媒體。',
    },
    'nudity.explicit': {
      title: '露骨裸露或性行為',
      description: '色情內容、露骨性行為或未經請求發送的露骨媒體。',
    },
    'sexual.non_consensual': {
      title: '非自願私密圖像 (NCII)',
      description: '未經同意傳播的私密照片或性勒索材料。',
    },
    'nudity.non_consensual': {
      title: '非自願私密圖像 (NCII)',
      description: '未經同意傳播的私密照片或性勒索材料。',
    },
    'sexual.solicitation': {
      title: '商業性引誘與招嫖',
      description: '推廣商業性服務、性交易或招嫖。',
    },
    'nudity.solicitation': {
      title: '商業性引誘與招嫖',
      description: '推廣商業性服務、性交易或招嫖。',
    },
    'illegal.csam': {
      title: '兒童性虐待與剝削材料 (CSAM)',
      description: '任何描繪、宣揚或助長針對未成年人虐待的內容。',
    },
    'severe.csam': {
      title: '兒童性虐待與剝削材料 (CSAM)',
      description: '任何描繪、宣揚或助長針對未成年人虐待的內容。',
    },
    'illegal.self_harm': {
      title: '自殺或自殘傾向/誘導',
      description: '鼓勵、指導或宣揚自殺、自殘及嚴重自我傷害行為。',
    },
    'severe.self_harm': {
      title: '自殺或自殘傾向/誘導',
      description: '鼓勵、指導或宣揚自殺、自殘及嚴重自我傷害行為。',
    },
    'illegal.illicit_trade': {
      title: '銷售違禁品、毒品、武器或非法物品',
      description: '推廣非法藥物、槍枝武器、被盜帳戶或假冒偽劣藥品。',
    },
    'severe.illegal_goods': {
      title: '銷售違禁品、毒品、武器或非法物品',
      description: '推廣非法藥物、槍枝武器、被盜帳戶或假冒偽劣藥品。',
    },
    'impersonation.user_or_entity': {
      title: '冒充我或他人/機構',
      description: '冒充本人、公眾人物、名企或官方品牌。',
    },
    'fraud.impersonation': {
      title: '冒充我或他人/機構',
      description: '冒充本人、公眾人物、名企或官方品牌。',
    },
    'fraud.scams_phishing': {
      title: '詐騙、釣魚或金融欺詐',
      description: '加密貨幣騙局、虛假抽獎、帳號密碼盜取或傳銷騙局。',
    },
    'fraud.fake_account': {
      title: '虛假或欺騙性帳戶',
      description: '僅用於欺騙、操縱或誤導使用者的傀儡或虛假帳戶。',
    },
    'spam.automated_commercial': {
      title: '垃圾訊息、機器人或未經請求的廣告',
      description: '重複的垃圾內容、機器人洗版、自動回覆或騷擾性行銷。',
    },
    'spam.commercial': {
      title: '垃圾訊息、機器人或未經請求的廣告',
      description: '重複的垃圾內容、機器人洗版、自動回覆或騷擾性行銷。',
    },
    'spam.fake_engagement': {
      title: '操縱趨勢與洗量互動',
      description: '堆砌話題標籤、刷虛假按讚量或使用誤導性連結。',
    },
    'spam.engagement': {
      title: '操縱趨勢與洗量互動',
      description: '堆砌話題標籤、刷虛假按讚量或使用誤導性連結。',
    },
    'ip.copyright_infringement': {
      title: '侵犯版權或商標權',
      description: '未經許可使用受版權保護的音訊、影片、圖像素材或註冊商標。',
    },
    'ip.infringement': {
      title: '侵犯版權或商標權',
      description: '未經許可使用受版權保護的音訊、影片、圖像素材或註冊商標。',
    },
    'other.general_violation': {
      title: '違反社群準則',
      description: '其他破壞平台安全、違反準則的內容或行為。',
    },
    'other.general': {
      title: '違反社群準則',
      description: '其他破壞平台安全、違反準則的內容或行為。',
    },
  },
} as const;

export default report;
