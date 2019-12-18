/*jshint esversion: 6 */

/**
 * 图片处理器(含：LivePhoto)
 */
class PictureHandler {

    /**
     * 处理图片，如果需要
     */
    static handlePictureIfNeed($ul) {

        // 得到大图片
        let $links = PictureHandler.getLargePhoto($ul);

        if (Config.isDebug) {
            console.log(`此Item有图：${$links.length}`);
        }

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
     * 得到大图链接
     * 
     * @param  {$标签对象} $ul      操作列表
     * @return {Link数组}           链接集，可能为null
     */
    static getLargePhoto($ul) {

        const resolver= Core.getWeiBoResolver();

        // 得到九宫格图片
        const links = resolver.getPhoto($ul).map(function(i, it) {

            const parts = $(it).attr("src").split("/");

            // 替换为大图链接
            const src = `http://wx2.sinaimg.cn/large/${parts[parts.length - 1]}`;

            Core.log(src);

            const name = Core.getResourceName($ul, src, i,Config.mediaType.picture);

            return new Link(name, src);
        });

        resolver.getPhotoOver($ul);

        return links;
    }
}