const report = {
  title: 'Báo cáo {{target}}',
  subtitle: 'Chọn danh mục mô tả đúng nhất vấn đề. Báo cáo của bạn được bảo mật.',
  subReasonTitle: 'Chọn vi phạm cụ thể:',
  target: {
    post: 'Bài viết',
    comment: 'Bình luận',
    profile: 'Trang cá nhân',
    message: 'Tin nhắn',
    media: 'Phương tiện',
    content: 'Nội dung',
  },
  severity: {
    urgent: 'Khẩn cấp',
    high: 'Cao',
  },
  details: {
    title: 'Chi tiết bổ sung',
    subtitle: 'Giúp chúng tôi hiểu rõ vấn đề',
    inputRequired: 'Cung cấp chi tiết (bắt buộc):',
    inputOptional: 'Thêm thông tin bổ sung (không bắt buộc):',
    placeholder: 'Vui lòng chia sẻ bất kỳ thông tin liên quan nào giúp đội ngũ an toàn điều tra...',
    minCharError: 'Vui lòng cung cấp giải thích ngắn gọn (tối thiểu 5 ký tự).',
    submit: 'Gửi báo cáo',
  },
  success: {
    title: 'Cảm ơn bạn đã báo cáo',
    defaultMessage: 'Báo cáo của bạn đã được gửi. Đội ngũ an toàn của chúng tôi sẽ xem xét để đảm bảo cộng đồng luôn an toàn.',
    alreadyReportedMessage: 'Bạn đã báo cáo nội dung này trước đó. Đang được xem xét.',
    submitFailed: 'Gửi báo cáo thất bại. Vui lòng thử lại.',
    done: 'Xong',
  },
  categories: {
    harassment_hate: {
      title: 'Quấy rối & Ngôn từ thù ghét',
      description: 'Bắt nạt, lăng mạ, phân biệt đối xử hoặc tấn công cá nhân.',
    },
    violence_threats: {
      title: 'Bạo lực & Đe dọa thể chất',
      description: 'Đe dọa bạo lực, gây hại thể chất, hình ảnh máu me hoặc cực đoan.',
    },
    nudity_sexual: {
      title: 'Khỏa thân & Nội dung tình dục',
      description: 'Nội dung khiêu dâm, hành vi tình dục rõ ràng hoặc hình ảnh không đồng thuận.',
    },
    illegal_harmful: {
      title: 'Tổn hại nghiêm trọng & Nội dung bất hợp pháp',
      description: 'Lạm dụng trẻ em, xúi giục tự tử hoặc buôn bán bất hợp pháp.',
    },
    severe_harm: {
      title: 'Tổn hại nghiêm trọng & Nội dung bất hợp pháp',
      description: 'Lạm dụng trẻ em, xúi giục tự tử hoặc buôn bán bất hợp pháp.',
    },
    impersonation_fraud: {
      title: 'Mạo danh & Lừa đảo',
      description: 'Đánh cắp danh tính, tài khoản lừa đảo, gian lận hoặc giả mạo.',
    },
    spam_deception: {
      title: 'Spam & Thao túng',
      description: 'Hoạt động bot tự động, bình luận lặp đi lặp lại hoặc tương tác giả tạo.',
    },
    spam_manipulation: {
      title: 'Spam & Thao túng',
      description: 'Hoạt động bot tự động, bình luận lặp đi lặp lại hoặc tương tác giả tạo.',
    },
    copyright_ip: {
      title: 'Bản quyền & Sở hữu trí tuệ',
      description: 'Đăng tải trái phép video, âm nhạc, nghệ thuật hoặc nhãn hiệu có bản quyền.',
    },
    other: {
      title: 'Lý do khác',
      description: 'Vi phạm an toàn cộng đồng không thuộc các danh mục trên.',
    },
  },
  subReasons: {
    'harassment.targeted': {
      title: 'Bắt nạt hoặc đe dọa có chủ đích',
      description: 'Liên tục tấn công, đe dọa, theo dõi hoặc xúc phạm có chủ đích.',
    },
    'harassment.hate_speech': {
      title: 'Ngôn từ thù ghét & Phân biệt đối xử',
      description: 'Tấn công dựa trên chủng tộc, tôn giáo, giới tính, khuyết tật hoặc bản dạng.',
    },
    'harassment.doxxing': {
      title: 'Tiết lộ thông tin cá nhân (Doxxing)',
      description: 'Công khai số điện thoại, địa chỉ, giấy tờ tùy thân hoặc ảnh riêng tư khi chưa được phép.',
    },
    'violence.physical_threats': {
      title: 'Đe dọa bạo lực trực tiếp',
      description: 'Đe dọa giết, gây thương tích, hành hung hoặc gây tổn hại thể chất.',
    },
    'violence.threats': {
      title: 'Đe dọa bạo lực trực tiếp',
      description: 'Đe dọa giết, gây thương tích, hành hung hoặc gây tổn hại thể chất.',
    },
    'violence.gore_graphic': {
      title: 'Bạo lực đẫm máu & Ngược đãi động vật',
      description: 'Mô tả cực kỳ man rợ về cái chết, thương tích nghiêm trọng hoặc bạo hành động vật.',
    },
    'violence.graphic_gore': {
      title: 'Bạo lực đẫm máu & Ngược đãi động vật',
      description: 'Mô tả cực kỳ man rợ về cái chết, thương tích nghiêm trọng hoặc bạo hành động vật.',
    },
    'violence.terrorism_extremism': {
      title: 'Khủng bố & Chủ nghĩa cực đoan bạo lực',
      description: 'Tuyên truyền các nhóm khủng bố, bạo lực hàng loạt hoặc văn kiện cực đoan.',
    },
    'violence.terrorism': {
      title: 'Khủng bố & Chủ nghĩa cực đoan bạo lực',
      description: 'Tuyên truyền các nhóm khủng bố, bạo lực hàng loạt hoặc văn kiện cực đoan.',
    },
    'sexual.explicit_nudity': {
      title: 'Khỏa thân hoặc hành vi tình dục rõ ràng',
      description: 'Nội dung khiêu dâm, hành vi tình dục rõ ràng hoặc hình ảnh nhạy cảm không mong muốn.',
    },
    'nudity.explicit': {
      title: 'Khỏa thân hoặc hành vi tình dục rõ ràng',
      description: 'Nội dung khiêu dâm, hành vi tình dục rõ ràng hoặc hình ảnh nhạy cảm không mong muốn.',
    },
    'sexual.non_consensual': {
      title: 'Hình ảnh nhạy cảm không đồng thuận (NCII)',
      description: 'Ảnh riêng tư thân mật hoặc tống tiền tình dục bị chia sẻ mà không có sự đồng ý.',
    },
    'nudity.non_consensual': {
      title: 'Hình ảnh nhạy cảm không đồng thuận (NCII)',
      description: 'Ảnh riêng tư thân mật hoặc tống tiền tình dục bị chia sẻ mà không có sự đồng ý.',
    },
    'sexual.solicitation': {
      title: 'Môi giới / Gạ gẫm mại dâm',
      description: 'Quảng cáo, chào mời dịch vụ tình dục thương mại hoặc mại dâm.',
    },
    'nudity.solicitation': {
      title: 'Môi giới / Gạ gẫm mại dâm',
      description: 'Quảng cáo, chào mời dịch vụ tình dục thương mại hoặc mại dâm.',
    },
    'illegal.csam': {
      title: 'Lạm dụng và bóc lột tình dục trẻ em (CSAM)',
      description: 'Nội dung mô tả, cổ súy hoặc tiếp tay cho hành vi bóc lột trẻ vị thành niên.',
    },
    'severe.csam': {
      title: 'Lạm dụng và bóc lột tình dục trẻ em (CSAM)',
      description: 'Nội dung mô tả, cổ súy hoặc tiếp tay cho hành vi bóc lột trẻ vị thành niên.',
    },
    'illegal.self_harm': {
      title: 'Xúi giục tự tử hoặc tự hại',
      description: 'Khuyến khích, hướng dẫn hoặc cổ súy hành vi tự tử hoặc tự gây thương tích.',
    },
    'severe.self_harm': {
      title: 'Xúi giục tự tử hoặc tự hại',
      description: 'Khuyến khích, hướng dẫn hoặc cổ súy hành vi tự tử hoặc tự gây thương tích.',
    },
    'illegal.illicit_trade': {
      title: 'Buôn bán hàng cấm, vũ khí hoặc hàng hóa phi pháp',
      description: 'Mua bán chất cấm, vũ khí, tài khoản bị đánh cắp hoặc thuốc giả.',
    },
    'severe.illegal_goods': {
      title: 'Buôn bán hàng cấm, vũ khí hoặc hàng hóa phi pháp',
      description: 'Mua bán chất cấm, vũ khí, tài khoản bị đánh cắp hoặc thuốc giả.',
    },
    'impersonation.user_or_entity': {
      title: 'Mạo danh tôi hoặc người khác',
      description: 'Giả mạo tôi, một người nổi tiếng hoặc một thương hiệu chính thức.',
    },
    'fraud.impersonation': {
      title: 'Mạo danh tôi hoặc người khác',
      description: 'Giả mạo tôi, một người nổi tiếng hoặc một thương hiệu chính thức.',
    },
    'fraud.scams_phishing': {
      title: 'Lừa đảo, Giả mạo hoặc Gian lận tài chính',
      description: 'Lừa đảo tiền mã hóa, tặng quà giả, đánh cắp mật khẩu hoặc đa cấp trái phép.',
    },
    'fraud.fake_account': {
      title: 'Tài khoản giả mạo hoặc lừa dối',
      description: 'Tài khoản được tạo ra nhằm mục đích lừa dối, thao túng người dùng.',
    },
    'spam.automated_commercial': {
      title: 'Spam, Bot hoặc Quảng cáo không mong muốn',
      description: 'Bài viết spam lặp đi lặp lại, bot tự động, trả lời hàng loạt hoặc tiếp thị rác.',
    },
    'spam.commercial': {
      title: 'Spam, Bot hoặc Quảng cáo không mong muốn',
      description: 'Bài viết spam lặp đi lặp lại, bot tự động, trả lời hàng loạt hoặc tiếp thị rác.',
    },
    'spam.fake_engagement': {
      title: 'Thao túng xu hướng & Mồi tương tác',
      description: 'Lạm dụng hashtag, buff tương tác ảo hoặc liên kết gây hiểu lầm.',
    },
    'spam.engagement': {
      title: 'Thao túng xu hướng & Mồi tương tác',
      description: 'Lạm dụng hashtag, buff tương tác ảo hoặc liên kết gây hiểu lầm.',
    },
    'ip.copyright_infringement': {
      title: 'Vi phạm bản quyền hoặc nhãn hiệu',
      description: 'Sử dụng âm thanh, video, hình ảnh hoặc nhãn hiệu có bản quyền khi chưa được phép.',
    },
    'ip.infringement': {
      title: 'Vi phạm bản quyền hoặc nhãn hiệu',
      description: 'Sử dụng âm thanh, video, hình ảnh hoặc nhãn hiệu có bản quyền khi chưa được phép.',
    },
    'other.general_violation': {
      title: 'Vi phạm Tiêu chuẩn cộng đồng',
      description: 'Hành vi hoặc nội dung khác vi phạm quy tắc và làm mất an toàn nền tảng.',
    },
    'other.general': {
      title: 'Vi phạm Tiêu chuẩn cộng đồng',
      description: 'Hành vi hoặc nội dung khác vi phạm quy tắc và làm mất an toàn nền tảng.',
    },
  },
} as const;

export default report;
