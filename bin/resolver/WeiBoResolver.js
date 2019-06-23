/*jshint esversion: 6 */

/**
 * 微博解析器接口
 */
const WeiBoResolver = new Interface("SearchWeiBoResolver",
    [
        "getOperationList",
        "getPhoto",
        "getLivePhotoContainer",
        "getWeiBoId",
        "getWeiBoUserId",
        "getWeiBoUserName",
        "getProgressContainer",
        "getVideoBox",
        "geiVideoSrc"
    ]);