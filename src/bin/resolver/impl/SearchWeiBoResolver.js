/*jshint esversion: 6 */

/**
 * 搜索微博 - 解析器
 */
const SearchWeiBoResolver = {};

Interface.impl(SearchWeiBoResolver, WeiBoResolver, {
    getOperationButton: () => $(`div .menu a:not(.${Config.handledWeiBoCardClass})`),
    getOperationList: $operationButton => $operationButton.parents(".menu").find("ul"),
    get9PhotoImgs: $ul => $ul.parents(".card-wrap").find(".media.media-piclist img"),
    get9PhotoOver: $ul => new Promise((resolve, reject) => {resolve([]);}), //搜索微博不会展示9+图片
    getLivePhotoContainer: $ul => $(null),
    getWeiBoCard: $ul => {

        const $content = $ul.parents(".content");

        const $card_content = $content.find(".card-comment");

        let $content_node;

        if ($card_content.length == 0) { // 这不是转发微博

            $content_node = $content;

        } else {

            $content_node = $card_content;
        }

        return $content_node;
    },
    getWeiBoInfo: $ul => {

        return SearchWeiBoResolver.getWeiBoCard($ul).find("a.name").first();
    },
    getWeiBoId: $ul => {

        const action_data = $ul.parents(".card-wrap").find(".card-act li:eq(1) a").attr("action-data");

        const rootmid_regex = action_data.match(/rootmid=(\d+)&/);

        let mid;

        if (rootmid_regex) { // 这是转发微博

            mid = rootmid_regex[1];

        } else {

            mid = action_data.match(/mid=(\d+)&/)[1];
        }

        return mid;
    },
    getWeiBoUserId: $ul => {

        const $info = SearchWeiBoResolver.getWeiBoInfo($ul);

        const user_id = $info.attr("href").match(/weibo\.com\/[u\/]{0,2}(\d+)/)[1].trim();

        Core.log(`得到的微博ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: $ul => {

        const $info = SearchWeiBoResolver.getWeiBoInfo($ul);

        const name = $info.text().trim();

        Core.log(`得到的名称为：${name}`);

        return name;
    },
    getWeiBoUrl: $ul => {

        const $card = SearchWeiBoResolver.getWeiBoCard($ul);

        const url = $card.find(".from a").attr("href").match(/weibo\.com\/(\d+\/\w+)\?/)[1].trim();

        Core.log(`得到的地址为：${url}`);

        return url.replace("\/", "_");
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