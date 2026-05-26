const post = {
    audioPreview: 'Nghe thử',
    createdOnDevice: 'Bài viết này được tạo trên {{device}}',

    optionsSheet: {
        title: 'Bài viết',
        subtitle: 'Bạn đang nghĩ gì?',
        share: 'Chia sẻ',
        copyLink: 'Sao chép liên kết',
        report: 'Báo cáo',
        deletePost: 'Xóa bài viết',
    },

    dialogs: {
        deletePostTitle: 'Xóa bài viết',
        deletePostBody: 'Bạn có chắc muốn xóa bài viết này không? Hành động này không thể hoàn tác.',
        delete: 'Xóa',
        cancel: 'Hủy',
        successTitle: 'Thành công',
        postDeleted: 'Đã xóa bài viết.',
        errorTitle: 'Lỗi',
        deleteFailed: 'Không thể xóa bài viết. Vui lòng thử lại.',
        ok: 'OK',
        reportTitle: 'Báo cáo',
        reportComingSoon: 'Tính năng báo cáo sắp ra mắt!',
        shareTitle: 'Chia sẻ lại',
        repostInstant: 'Đăng lại ngay',
        repostQuote: 'Trích dẫn',
        repostSuccess: 'Đã chia sẻ lại thành công!',
        repostFailed: 'Không thể chia sẻ lại bài viết.',
        copyLinkTitle: 'Sao chép liên kết',
        linkCopied: 'Đã sao chép liên kết!',

    },

    commentsSheet: {
        title: 'Bình luận',
        emptyTitle: 'Chưa có bình luận',
        emptyBody: 'Hãy bắt đầu cuộc trò chuyện và là người bình luận đầu tiên!',
        editingBanner: 'Đang sửa bình luận',
        placeholderAdd: 'Thêm bình luận...',
        placeholderEdit: 'Sửa bình luận...',
        actionEdit: 'Sửa',
        actionDelete: 'Xóa',
        sendPost: 'Đăng',
        sendSave: 'Lưu',
    },

    likersSheet: {
        title: 'Lượt thích',
        subtitle_one: '{{count}} người đã thích bài viết này',
        subtitle_other: '{{count}} người đã thích bài viết này',
        emptyTitle: 'Chưa có lượt thích',
        emptyBody: 'Hãy là người đầu tiên thích bài viết này!',
    },
} as const;

export default post;
