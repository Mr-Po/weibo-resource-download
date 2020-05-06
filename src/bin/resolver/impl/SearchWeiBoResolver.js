/*jshint esversion: 6 */

/**
 * 搜索微博 - 解析器
 */
const SearchWeiBoResolver = {};

Interface.impl(SearchWeiBoResolver, WeiBoResolver, {
    getOperationButton: () => $(`div .menu a:not(.${Config.handledWeiBoCardClass})`),
    getOperationList: $operationButton => $operationButton.parents(".menu").find("ul"),
    get9PhotoImgs: $ul => $ul.parents(".card-wrap").find(".media.media-piclist img"),
    get9PhotoOver: $ul => new Promise((resolve, reject) => { resolve([]); }), //搜索微博不会展示9+图片
    getLivePhotoContainer: $ul => $(null),
    getWeiBoCard: ($ul, isRoot) => {

        const $content = $ul.parents(".content");

        const $card_content = $content.find(".card-comment");

        let $content_node;

        if ($card_content.length == 1 && isRoot) { // 这是转发微博 && 需要根

            $content_node = $card_content;

        } else {

            $content_node = $content;
        }

        return $content_node;
    },
    getWeiBoInfo: $ul => {

        return SearchWeiBoResolver.getWeiBoCard($ul, false).find("a.name").first();
    },
    getRootWeiBoInfo: $ul => {

        return SearchWeiBoResolver.getWeiBoCard($ul, true).find("a.name").first();
    },
    getWeiBoId: ($ul, $info, isRoot) => {

        const action_data = $info.parents(".card-wrap")
            .find(".card-act li:eq(1) a").attr("action-data");

        const rootmid_regex = action_data.match(/&rootmid=(\d+)&/);

        let mid;

        if (rootmid_regex && isRoot) { // 这是转发微博 && 需要根

            mid = rootmid_regex[1];

        } else {

            mid = action_data.match(/[&\d]mid=(\d+)&/)[1];
        }

        Core.log(`得到根【${isRoot}】的微博ID为：${mid}`);

        return mid;
    },
    getWeiBoUserId: ($ul, $info, isRoot) => {

        const user_id = $info.attr("href").match(/weibo\.com\/[u\/]{0,2}(\d+)/)[1].trim();

        Core.log(`得到根【${isRoot}】的微博用户ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: ($ul, $info, isRoot) => {

        let name = $info.attr("nick-name");

        // 不存在
        if (!name) {
            name = $info.text();
        }

        name = name.trim();

        Core.log(`得到根【${isRoot}】的名称为：${name}`);

        return name;
    },
    getWeiBoUrl: ($ul, isRoot) => {

        const $card = SearchWeiBoResolver.getWeiBoCard($ul, isRoot);

        const $froms = $card.find(".from");

        let $a;

        if ($froms.length == 2) { // 转发微博

            if (isRoot) { // 需要根

                $a = $($froms[0]).find("a");

            } else {

                $a = $($froms[1]).find("a");
            }

        } else {

            $a = $($froms[0]).find("a");
        }

        const url = $a.attr("href").match(/weibo\.com\/(\d+\/\w+)\?/)[1].trim();

        Core.log(`得到根【${isRoot}】微博的地址为：${url}`);

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