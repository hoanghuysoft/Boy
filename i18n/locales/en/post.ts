const post = {
    audioPreview: 'Preview',
    createdOnDevice: 'This post was created on {{device}}',

    optionsSheet: {
        title: 'Post',
        subtitle: 'Got something on your mind?',
        share: 'Share',
        copyLink: 'Copy Link',
        report: 'Report',
        deletePost: 'Delete Post',
    },

    dialogs: {
        deletePostTitle: 'Delete Post',
        deletePostBody: 'Are you sure you want to delete this post? This action cannot be undone.',
        delete: 'Delete',
        cancel: 'Cancel',
        successTitle: 'Success',
        postDeleted: 'Post deleted successfully.',
        errorTitle: 'Error',
        deleteFailed: 'Failed to delete post. Please try again.',
        ok: 'OK',
        reportTitle: 'Report',
        reportComingSoon: 'Report feature coming soon!',
        shareTitle: 'Share',
        shareComingSoon: 'Share feature coming soon!',
        copyLinkTitle: 'Copy Link',
        linkCopied: 'Link copied to clipboard!',
    },

    commentsSheet: {
        title: 'Comments',
        emptyTitle: 'No comments yet',
        emptyBody: 'Start the conversation and be the first to comment!',
        editingBanner: 'Editing comment',
        placeholderAdd: 'Add a comment...',
        placeholderEdit: 'Edit your comment...',
        actionEdit: 'Edit',
        actionDelete: 'Delete',
        sendPost: 'Post',
        sendSave: 'Save',
    },

    likersSheet: {
        title: 'Likes',
        subtitle_one: '{{count}} person liked this post',
        subtitle_other: '{{count}} people liked this post',
        emptyTitle: 'No likes yet',
        emptyBody: 'Be the first to like this post!',
    },
} as const;

export default post;
