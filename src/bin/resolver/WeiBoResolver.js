/*jshint esversion: 6 */

/**
 * 微博解析器接口
 */
const WeiBoResolver = new Interface("SearchWeiBoResolver",
    [
        "getOperationButton",// 得到操作按钮[↓]
        "getOperationList",// 根据操作按钮，得到操作列表
        "get9PhotoImgs",// 返回九宫格图片的img$控件数组（自带后缀）
        "get9PhotoOver",// 得到超过部分的图片的id数组(无后缀)
        "getLivePhotoContainer",
        "getWeiBoCard",// 这条微博（若为转发微博，则取根微博）
        "getWeiBoInfo",// 这条微博(发布者)信息
        "getWeiBoId",// 此条微博的ID
        "getWeiBoUserId",
        "getWeiBoUserName",
        "getWeiBoUrl",// 此条微博的地址
        "getProgressContainer",
        "getVideoBox",
        "geiVideoSrc"
    ]);