/*jshint esversion: 6 */

/**
 * 微博解析器接口
 */
const WeiBoResolver = new Interface("SearchWeiBoResolver",
    [
        "getOperationButton",// 得到操作按钮[↓]
        "getOperationList",// 根据操作按钮，得到操作列表
        "getPhoto",// 返回图片$img数组
        "getPhotoOver",// 得到超过部分的图片
        "getLivePhotoContainer",
        "getWeiBoId",
        "getWeiBoUserId",
        "getWeiBoUserName",
        "getProgressContainer",
        "getVideoBox",
        "geiVideoSrc"
    ]);