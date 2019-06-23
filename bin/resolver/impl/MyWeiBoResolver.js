/*jshint esversion: 6 */

/**
 * 我的微博解析器（含：我的微博、他人微博、我的收藏、热门微博）
 */
const MyWeiBoResolver = {};

Interface.impl(MyWeiBoResolver, WeiBoResolver, {
    getOperationList: () => $(`div .screen_box ul:not([class='${Config.handledWeiBoCardClass}'])`),
    getPhoto: $ul => $ul.parents(".WB_feed_detail").find("li.WB_pic img"),
    getLivePhotoContainer: $ul => $ul.parents(".WB_feed_detail").find(".WB_media_a"),
    getWeiBoId: $ul => $ul.parents(".WB_cardwrap").attr("mid").trim(),
    getWeiBoUserId: $ul => {

        const $a = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first();

        const id = $a.attr("usercard").match(/id=(\d+)/)[1].trim();

        if (Config.isDebug) {
            console.log(`得到的微博ID为：${id}`);
        }

        return id;
    },
    getWeiBoUserName: $ul => {
        const name = $ul.parents("div.WB_feed_detail").find("div.WB_info a").first().text().trim();

        if (Config.isDebug) {
            console.log(`得到的名称为：${name}`);
        }

        return name;
    },
    getProgressContainer: $sub => $sub.parents("div.WB_feed_detail").find("div.WB_info").first(),
    getVideoBox: $ul => $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story"),
    geiVideoSrc: $box => {

        const video_sources = $box.attr("video-sources");

        // 多清晰度源
        const sources = video_sources.split("&");

        if (Config.isDebug) {
            console.log(sources);
        }

        let src;

        // 逐步下调清晰度
        for (var i = sources.length - 2; i >= 0; i -= 2) {

            if (sources[i].trim().split("=")[1].trim().length > 0) {

                // 解码
                var source = decodeURIComponent(decodeURIComponent(sources[i].trim()));

                if (Config.isDebug) {
                    console.log(source);
                }

                src = source.substring(source.indexOf("=") + 1);
            }
        }

        return src;
    }
});