/*jshint esversion: 8 */

/**
 * 我的微博（含：我的微博、他人微博、我的收藏、热门微博） - 解析器
 */
const MyWeiBoResolver = {};

Interface.impl(MyWeiBoResolver, WeiBoResolver, {
    getOperationButton: () => $(`div .screen_box i.ficon_arrow_down:not(.${Config.handledWeiBoCardClass})`),
    getOperationList: $operationButton => $operationButton.parents(".screen_box").find("ul"),
    get9PhotoImgs: $ul => $ul.parents(".WB_feed_detail").find("li.WB_pic img"),
    get9PhotoOver: ($ul) => {

        return new Promise((resolve, reject) => {

            const $box = $ul.parents(".WB_feed_detail").find(".WB_media_a");

            const action_data = $box.attr("action-data");

            const over9pic = action_data.match(/over9pic=1&/);

            if (over9pic) { // 存在超9图

                const ids_regex = action_data.match(/pic_ids=([\w,]+)&/);

                if (ids_regex) { // 得到图片ids_regex

                    const ids = ids_regex[1].split(",");

                    // 已知所有图片
                    if (ids.length > 9) { // 用户已手动触发加载over

                        resolve(ids.splice(9));

                    } else { // 只知前面9张，用户未手动触发加载over

                        Core.log("未知超过部分图片！");

                        const mid_regex = action_data.match(/mid=([\d,]+)&/);

                        if (mid_regex) { // 找到mid

                            const mid = mid_regex[1];

                            // 请求未显示的图片id
                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: `https://weibo.com/aj/mblog/getover9pic?ajwvr=6&mid=${mid}&__rnd=${Date.now()}`,
                                timeout: Config.maxRequestTime,
                                responseType: "json",
                                onload: function(res) {

                                    resolve(res.response.data.pids);
                                },
                                onerror: function(e) {

                                    console.error(e);

                                    reject("请求未展示图片发生错误");
                                },
                                ontimeout: function() {

                                    reject("请求未展示图片超时！");
                                }
                            });

                        } else { // 未找到mid

                            reject("未能找到此条微博的mid！");
                        }
                    }

                } else {

                    reject("获取图片ids失败！");
                }

            } else { // 图片数量未超9张

                resolve([]);
            }
        });
    },
    getLivePhotoContainer: $ul => $ul.parents(".WB_feed_detail").find(".WB_media_a"),
    getWeiBoCard: ($ul, isRoot) => {

        // 此条微博
        const $box = $ul.parents("div.WB_feed_detail");

        // 根微博
        const $box_expand = $box.find(".WB_feed_expand");

        let $box_node = $box;

        // 这是一条转发微博 && 并且需要取根
        if ($box_expand.length == 1 && isRoot) {

            $box_node = $box_expand;
        }

        return $box_node;
    },
    getWeiBoInfo: $ul => {

        return MyWeiBoResolver.getWeiBoCard($ul, false).find("div.WB_detail div.WB_info a").first();
    },
    getRootWeiBoInfo: $ul => {

        return MyWeiBoResolver.getWeiBoCard($ul, true).find("div.WB_info a").first();
    },
    getWeiBoId: ($ul, $info, isRoot) => {

        const id_regex = $info.attr("suda-uatrack").match(/value=\w+:(\d+)/);

        let id;

        if (id_regex) { // 我的微博、他人微博（转发）、我的收藏、热门微博

            id = id_regex[1].trim();

        } else { // 他人微博

            id = $ul.parents(".WB_feed_detail").parents(".WB_cardwrap").attr("mid").trim();
        }

        Core.log(`得到根【${isRoot}】的微博ID为：${id}`);

        return id;
    },
    getWeiBoUserId: ($ul, $info, isRoot) => {

        const user_id = $info.attr("usercard").match(/id=(\d+)/)[1].trim();

        Core.log(`得到根【${isRoot}】的微博用户ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: ($ul, $info, isRoot) => {

        // 适用于根微博
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

        const $li_forward = $ul
            .parents(".WB_feed_detail")
            .parents("div.WB_cardwrap")
            .find(".WB_feed_handle .WB_row_line li:eq(1) a");

        const action_data = $li_forward.attr("action-data");

        const rooturl_regex = action_data.match(/rooturl=https:\/\/weibo\.com\/(\d+\/\w+)&/);

        let url;

        if (rooturl_regex && isRoot) { // 这是转发微博 && 需要根

            url = rooturl_regex[1].trim();

        } else {

            url = action_data.match(/&url=https:\/\/weibo\.com\/(\d+\/\w+)&/)[1].trim();
        }

        Core.log(`得到根【${isRoot}】微博的地址为：${url}`);

        return url.replace("\/", "_");
    },
    getProgressContainer: $sub => $sub.parents("div.WB_feed_detail").find("div.WB_info").first(),
    getVideoBox: $ul => $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story,.WB_video_h5_v2 .WB_feed_spec_pic"),
    geiVideoSrc: $box => {

        const video_sources = $box.attr("video-sources");

        // 多清晰度源
        const sources = video_sources.split("&");

        Core.log(sources);

        // 尝试从 quality_label_list 中，获取视频地址
        const sources_filter =
            sources.filter(it => it.trim().indexOf("quality_label_list") == 0);

        if (sources_filter != null && sources_filter.length > 0) {

            Core.log("尝试使用：quality_label_list，进行视频地址解析...");

            const quality_label_list = sources_filter[0].trim();

            // 解码
            const source = decodeURIComponent(quality_label_list);

            const json = source.substring(source.indexOf("=") + 1).trim();

            // 存在质量列表的值
            if (json.length > 0) {

                const $urls = JSON.parse(json);

                Core.log($urls);

                // 逐步下调清晰度，当前用户为未登录或非vip时，1080P+的地址为空
                for (let i = 0; i < $urls.length; i++) {

                    const $url = $urls[i];

                    const src = $url.url.trim();

                    // 是一个链接
                    if (src.indexOf("http") == 0) {

                        Core.log(`得到一个有效链接，${$url.quality_label}：${src}`);

                        return src;
                    }
                }

            } else Core.log("仅存在quality_label_list的key，却无value！");

        } else console.log("无法找到quality_label_list！");

        Core.log("即将使用缺省方式，进行视频地址解析...");

        // 逐步下调清晰度【兼容旧版，防止 quality_label_list API变动，或quality_label_list的值不存在】
        for (let i = sources.length - 2; i >= 0; i--) {

            const source = sources[i].trim();
            const index = source.indexOf("=");

            const key = source.substring(0, index).trim();
            const value = source.substring(index + 1).trim();

            if (value.length > 0) {

                // 解码
                const src = decodeURIComponent(decodeURIComponent(value));

                // 是一个链接
                if (src.indexOf("http") == 0) {

                    Core.log(`得到一个有效链接，${key}：${src}`);

                    return src;
                }
            }
        }

        return null;
    }
});