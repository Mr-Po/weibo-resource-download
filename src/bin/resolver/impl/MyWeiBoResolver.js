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
    getWeiBoCard: $ul => {

        const $box = $ul.parents("div.WB_feed_detail");

        const $box_expand = $box.find(".WB_feed_expand");

        let $box_node;

        // 这不是一条转发微博
        if ($box_expand.length == 0) {

            $box_node = $box;

        } else { // 这是一条转发微博

            $box_node = $box_expand;
        }

        return $box_node;
    },
    getWeiBoInfo: $ul => {

        return MyWeiBoResolver.getWeiBoCard($ul).find("div.WB_info a").first();
    },
    getWeiBoId: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const id_regex = $info.attr("suda-uatrack").match(/value=\w+:(\d+)/);

        let id;

        if (id_regex) { // 我的微博、他人微博（转发）、我的收藏、热门微博

            id = id_regex[1].trim();

        } else { // 他人微博

            id = $ul.parents(".WB_feed_detail").parents(".WB_cardwrap").attr("mid").trim();
        }

        Core.log(`得到的微博ID为：${id}`);

        return id;
    },
    getWeiBoUserId: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const user_id = $info.attr("usercard").match(/id=(\d+)/)[1].trim();

        Core.log(`得到的用户微博ID为：${user_id}`);

        return user_id;
    },
    getWeiBoUserName: $ul => {

        const $info = MyWeiBoResolver.getWeiBoInfo($ul);

        const name = $info.text().trim();

        Core.log(`得到的名称为：${name}`);

        return name;
    },
    getWeiBoUrl: $ul => {

        const $li_forward = $ul.parents(".WB_feed_detail").parents("div.WB_cardwrap")
            .find(".WB_feed_handle .WB_row_line li:eq(1) a");

        const action_data = $li_forward.attr("action-data");

        const rooturl_regex = action_data.match(/rooturl=https:\/\/weibo\.com\/(\d+\/\w+)&/);

        let url;

        if (rooturl_regex) { // 这是转发微博

            url = rooturl_regex[1].trim();

        } else {

            url = action_data.match(/url=https:\/\/weibo\.com\/(\d+\/\w+)&/)[1].trim();
        }

        Core.log(`得到的此条微博地址为：${url}`);

        return url.replace("\/", "_");
    },
    getProgressContainer: $sub => $sub.parents("div.WB_feed_detail").find("div.WB_info").first(),
    getVideoBox: $ul => $ul.parents(".WB_feed_detail").find(".WB_video,.WB_video_a,.li_story"),
    geiVideoSrc: $box => {

        const video_sources = $box.attr("video-sources");

        // 多清晰度源
        const sources = video_sources.split("&");

        Core.log(sources);

        let src;

        // 逐步下调清晰度
        for (var i = sources.length - 2; i >= 0; i -= 1) {

            if (sources[i].trim().split("=")[1].trim().length > 0) {

                // 解码
                var source = decodeURIComponent(decodeURIComponent(sources[i].trim()));

                Core.log(source);

                src = source.substring(source.indexOf("=") + 1);
            }
        }

        return src;
    }
});