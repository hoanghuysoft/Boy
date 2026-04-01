const post = {
    audioPreview: '试听',
    createdOnDevice: '本条动态创建于 {{device}}',

    optionsSheet: {
        title: '动态',
        subtitle: '有什么想说的？',
        share: '分享',
        copyLink: '复制链接',
        report: '举报',
        deletePost: '删除动态',
    },

    dialogs: {
        deletePostTitle: '删除动态',
        deletePostBody: '确定要删除这条动态吗？此操作无法撤销。',
        delete: '删除',
        cancel: '取消',
        successTitle: '成功',
        postDeleted: '动态已删除。',
        errorTitle: '错误',
        deleteFailed: '删除失败，请重试。',
        ok: '确定',
        reportTitle: '举报',
        reportComingSoon: '举报功能即将上线！',
        shareTitle: '分享',
        shareComingSoon: '分享功能即将上线！',
        copyLinkTitle: '复制链接',
        linkCopied: '链接已复制到剪贴板！',
    },

    commentsSheet: {
        title: '评论',
        emptyTitle: '暂无评论',
        emptyBody: '来发表第一条评论吧！',
        editingBanner: '正在编辑评论',
        placeholderAdd: '写一条评论…',
        placeholderEdit: '编辑你的评论…',
        actionEdit: '编辑',
        actionDelete: '删除',
        sendPost: '发布',
        sendSave: '保存',
    },

    likersSheet: {
        title: '点赞',
        subtitle_one: '{{count}} 人赞了这条动态',
        subtitle_other: '{{count}} 人赞了这条动态',
        emptyTitle: '暂无点赞',
        emptyBody: '成为第一个点赞的人！',
    },
} as const;

export default post;
