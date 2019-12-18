/*jshint esversion: 6 */

/**
 * 搜索微博解析器
 */
const SearchWeiBoResolver = {};

Interface.impl(SearchWeiBoResolver, WeiBoResolver, {
    getOperationButton:()=> "未支持",
    getOperationList: () => $(`div .menu ul:not([class='${Config.handledWeiBoCardClass}'])`),
    getPhoto: $ul => $ul.parents(".card-wrap").find(".media.media-piclist img"),
    getPhotoOver:$ul =>"未支持",
    getLivePhotoContainer: $ul => $(null),
    getWeiBoId: $ul => $ul.parents(".card-wrap").attr("mid").trim(),
    getWeiBoUserId: $ul => {
        const $a = $ul.parents(".card-wrap").find("a.name").first();

        const id = $a.attr("href").match(/weibo\.com\/(\d+)/)[1].trim();

        if (Config.isDebug) {
            console.log(`得到的微博ID为：${id}`);
        }

        return id;
    },
    getWeiBoUserName: $ul => {
        const name = $ul.parents(".card-wrap").find("a.name").first().text().trim();

        if (Config.isDebug) {
            console.log(`得到的名称为：${name}`);
        }

        return name;
    },
    getProgressContainer: $sub => $sub.parents(".card-wrap").find("a.name").first().parent(),
    getVideoBox: $ul => $ul.parents(".card-wrap").find(".WB_video_h5").first(),
    geiVideoSrc: $box => {

        let src = $box.attr("action-data").match(/video_src=([\w\/\.%]+)/)[1];

        src = decodeURIComponent(decodeURIComponent(src));

        if (src.indexOf("http") != 0) {
            src = `https:${src}`;
        }

        return src;
    }
});