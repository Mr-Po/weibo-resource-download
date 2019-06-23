/*jshint esversion: 6 */

/**
 * 视频处理器
 */
class VideoHandler {

    /**
     * 处理视频如果需要
     * @param  {$标签对象} $ul 操作列表
     */
    static handleVideoIfNeed($ul) {

        const $box = Core.getWeiBoResolver().getVideoBox($ul);

        // 不存在视频
        if ($box.length === 0) {
            return;
        }

        // 得到视频类型
        const type = VideoHandler.getVideoType($box);


        let $link;

        if (type === "feedvideo") { // 短视屏（秒拍、梨视频、优酷）

            $link = VideoHandler.getBlowVideoLink($box);

        } else if (type === "feedlive") { // 直播回放

            //TODO 暂不支持

        } else if (type === "story") { // 微博故事

            $link = VideoHandler.getWeiboStoryLink($box);

        } else {

            console.warn(`未知的类型：${type}`);
        }

        // 是否存在视频链接
        if ($link) {

            Core.handleCopy($ul, $([$link]));

            const fun = () => VideoHandler.downloadVideo($box, $link);

            Core.putButton($ul, "下载当前视频", fun);
        }
    }

    /**
     * 得到视频类型
     * @param  {$标签对象} $box 视频容器
     * @return {字符串}         视频类型[video、live]
     */
    static getVideoType($box) {

        const typeRegex = $box.attr("action-data").match(/type=(\w+)&/);

        return typeRegex[1];
    }

    /**
     * 得到微博故事视频Link
     * 
     * @param  {$标签对象} $box 视频box
     * 
     * @return {Link}      链接对象
     */
    static getWeiboStoryLink($box) {

        const action_data = $box.attr("action-data");

        const urlRegex = action_data.match(/gif_url=([\w%.]+)&/);

        const url = urlRegex[1];

        let src = decodeURIComponent(decodeURIComponent(url));

        const name = Core.getResourceName($box, src.split("?")[0], 0, Config.mediaType.video);

        if (src.indexOf("//") === 0) {
            src = "https:" + src;
        }

        return new Link(name, src);
    }

    /**
     * 得到酷燃视频Link
     * 
     * @param  {$标签对象} $box 视频box
     * 
     * @return {Link}      链接对象
     */
    static getBlowVideoLink($box){

        let src, name;

        try {

            src = Core.getWeiBoResolver().geiVideoSrc($box);

            if (!src) { // 未找到合适的视频地址

                Tip.error("未能找到视频地址！");

                throw new Error("未能找到视频地址！");
            }

            name = Core.getResourceName($box, src.split("?")[0], 0, Config.mediaType.video);

            if (Config.isDebug) {

                console.log(`download：${name}=${src}`);
            }

        } catch (e) {

            console.error(e);

            Tip.error("提取视频地址失败！");
        }

        return new Link(name,src);
    }

    /**
     * 下载直播回放
     * @param  {$标签对象} $li 视频box
     */
    static downloadLiveVCRVideo($ul, $li) {
        // TODO 暂不支持
    }

    /**
     * 下载视频
     * 
     * @param  {$标签对象} $box  视频box
     * @param  {$对象}    $link  Link对象
     */
    static downloadVideo($box, $link) {

        Tip.info("即将开始下载...");

        const progress = ZipHandler.bornProgress($box);

        GM_download({
            url: $link.src,
            name: $link.name,
            onprogress: function(p) {

                const value = p.loaded / p.total;
                progress.value = value;
            },
            onerror: function(e) {

                console.error(e);

                Tip.error("视频下载出错！");
            }
        });
    }
}