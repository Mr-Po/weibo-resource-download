/*jshint esversion: 8 */

/**
 * 图片处理器(含：LivePhoto)
 */
class PictureHandler {

    /**
     * 处理图片，如果需要
     */
    static async handlePictureIfNeed($ul) {

        const $button = Core.putButton($ul, "图片解析中...", null);

        try {

            const resolver = Core.getWeiBoResolver();

            const photo_9_ids = resolver.get9PhotoImgs($ul).map(function(i, it) {

                const parts = $(it).attr("src").split("/");

                return parts[parts.length - 1];
            }).get();

            Core.log("九宫格图片：");
            Core.log(photo_9_ids);

            const photo_9_over_ids = await resolver.get9PhotoOver($ul).catch(e => {

                Tip.error(e);

                return [];
            });

            Core.log("未展示图片：");
            Core.log(photo_9_over_ids);

            const photo_ids = photo_9_ids.concat(photo_9_over_ids);

            Core.log("总图片：");
            Core.log(photo_ids);

            // 得到大图片
            let $links = await PictureHandler.convertLargePhoto($ul, photo_ids);

            Core.log(`此Item有图：${$links.length}`);

            // 判断图片是否存在
            if ($links.length > 0) {

                // 得到LivePhoto的链接
                const lp_links = PictureHandler.getLivePhoto($ul, $links.length);

                // 存在LivePhoto
                if (lp_links) {

                    $links = $($links.get().concat(lp_links));
                }

                Core.handleCopy($ul, $links);

                PictureHandler.handleDownload($ul, $links);

                PictureHandler.handleDownloadZip($ul, $links);
            }
        } catch (e) {

            console.error(e);

            Tip.error(e.message);

            Core.putButton($ul, "图片解析失败", null);

        } finally {

            Core.removeButton($ul, $button);
        }
    }


    /**
     * 提取LivePhoto的地址
     * @param  {$标签对象} $owner ul或li
     * @return {字符串数组}       LivePhoto地址集，可能为null
     */
    static extractLivePhotoSrc($owner) {

        const action_data = $owner.attr("action-data");

        if (action_data) {

            const urlsRegex = action_data.match(/pic_video=([\w:,]+)/);

            if (urlsRegex) {

                const urls = urlsRegex[1].split(",").map(function(it, i) {
                    return it.split(":")[1];
                });

                return urls;
            }
        }

        return null;
    }

    /**
     * 得到LivePhoto链接集
     * 
     * @param   {$标签对象} $ul     操作列表
     * @param   {整数}      start   下标开始的位置
     * @return  {Link数组}          链接集，可能为null
     */
    static getLivePhoto($ul, start) {

        const $box = Core.getWeiBoResolver().getLivePhotoContainer($ul);

        let srcs;

        // 仅有一张LivePhoto
        if ($box.hasClass('WB_media_a_m1')) {

            srcs = PictureHandler.extractLivePhotoSrc($box.find(".WB_pic"));

        } else {

            srcs = PictureHandler.extractLivePhotoSrc($box);
        }

        // 判断是否存在LivePhoto的链接
        if (srcs) {

            srcs = srcs.map(function(it, i) {

                var src = `https://video.weibo.com/media/play?livephoto=//us.sinaimg.cn/${it}.mov&KID=unistore,videomovSrc`;

                var name = Core.getResourceName($ul, `https://weibo.com/${it}.mp4`, i + start, Config.mediaType.livePhoto);

                return new Link(name, src);
            });
        }

        return srcs;
    }

    // 处理下载
    static handleDownload($ul, $links) {

        Core.putButton($ul, "逐个下载图片", function() {

            $links.each(function(i, it) {

                // console.log("name:" + it.name + ",src=" + it.src);

                GM_download(it.src, it.name);
            });
        });
    }

    /**
     * 处理打包下载
     */
    static handleDownloadZip($ul, $links) {

        Core.putButton($ul, "打包下载图片", function() {

            ZipHandler.startZip($ul, $links);
        });
    }

    /**
     * 转换为大图链接
     *
     * @param  {$控件} $ul        操作列表
     * @param  {数组}  photo_ids  图片id数组（可能无后缀）
     * @return {Link数组}       链接集，可能为null
     */
    static async convertLargePhoto($ul, photo_ids) {

        const photo_ids_fix = await Promise.all($(photo_ids).map(function(i, it) {

            return new Promise((resolve, reject) => {

                // 判断是否存在后缀
                if (it.indexOf(".") != -1) { // 存在

                    resolve(it);

                } else { // 不存在

                    // 请求，不打开流，只需要头信息
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `http://wx2.sinaimg.cn/thumb150/${it}`,
                        timeout: Config.maxRequestTime,
                        responseType: "blob",
                        onload: function(res) {

                            const postfix_regex = res.responseHeaders.match(/content-type: image\/(\w+)/);

                            // 找到，且图片类型为git
                            if (postfix_regex && postfix_regex[1] == "gif") {

                                resolve(`${it}.gif`);

                            } else { // 未找到，或图片类型为：jpeg

                                resolve(`${it}.jpg`);
                            }
                        },
                        onerror: function(e) {

                            console.error(e);

                            reject("请求图片格式发生错误！");
                        },
                        ontimeout: function() {

                            reject("请求图片格式超时！");
                        }
                    });
                }
            }).catch(e => {

                Tip.error(e);

                return `${it}.jpg`;
            });
        }).get());

        Core.log("总图片(fix)：");
        Core.log(photo_ids_fix);

        return $(photo_ids_fix).map((i, it) => {

            // 替换为大图链接
            const src = `http://wx2.sinaimg.cn/large/${it}`;

            Core.log(src);

            const name = Core.getResourceName($ul, src, i, Config.mediaType.picture);

            return new Link(name, src);
        });
    }
}