const create = {
    validation: {
        contentTooLong: '內容過長（最多 2000 字）',
        locationTooLong: '位置過長（最多 200 字）',
        linkLabelRequired: '填寫連結時須填寫標籤',
        urlRequired: '填寫標籤時須填寫連結',
        urlInvalid: '請輸入有效的網址',
        contentOrMediaRequired: '請新增文字或媒體後再發佈',
    },
    dialog: {
        screenTitle: '發佈動態',
        errorTitle: '錯誤',
        successTitle: '成功',
        permissionTitle: '需要權限',
        profileNotLoaded: '個人資料未載入，請重試。',
        postCreated: '動態已發佈！',
        createFailed: '發佈失敗，請重試。',
        mediaPermissionRequired: '請授予相簿權限以選擇圖片。',
        mediaPickerFailed: '無法開啟選擇器，請重試。',
        ok: '確定',
    },
} as const;

export default create;
