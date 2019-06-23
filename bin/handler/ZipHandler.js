/*jshint esversion: 6 */

class ZipHandler {

    /**
     * 生成一个进度条
     * @param  {$标签对象} $sub card的子节点
     * @param  {int}      max  最大值
     * @return {标签对象}     进度条
     */
    static bornProgress($sub) {

        const $div = Core.getWeiBoResolver().getProgressContainer($sub);

        // 尝试获取进度条
        let $progress = $div.find('progress');

        // 进度条不存在时，生成一个
        if ($progress.length === 0) {

            $progress = $("<progress max='1' style='margin-left:10px;' />");

            $div.append($progress);

        } else { // 已存在时，重置value

            $progress[0].value = 0;
        }

        return $progress[0];
    }

    /**
     * 开始打包
     * @param  {$数组} $links 图片地址集
     */
    static startZip($ul, $links) {

        Tip.tip("正在提取，请稍候...", "iconExtract");

        const progress = ZipHandler.bornProgress($ul);

        const zip = new JSZip();

        const names = [];

        $links.each(function(i, it) {

            const name = it.name;

            GM_xmlhttpRequest({
                method: 'GET',
                url: it.src,
                timeout: Config.maxRequestTime,
                responseType: "blob",
                onload: function(response) {

                    zip.file(name, response.response);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                onerror: function(e) {

                    console.error(e);

                    Tip.error(`第${(i + 1)}个对象，获取失败！`);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                },
                ontimeout: function() {

                    Tip.error(`第${(i + 1)}个对象，请求超时！`);

                    ZipHandler.downloadZipIfComplete($ul, progress, name, zip, names, $links.length);
                }
            });
        });
    }

    /**
     * 下载打包，如果完成
     */
    static downloadZipIfComplete($ul, progress, name, zip, names, length) {

        names.push(name);

        const value = names.length / length;

        progress.value = value;

        if (names.length === length) {

            Tip.tip("正在打包，请稍候...", "iconZip");

            zip.generateAsync({
                type: "blob"
            }, function(metadata) {

                progress.value = metadata.percent / 100;

            }).then(function(content) {

                Tip.success("打包完成，即将开始下载！");

                const zipName = Core.getZipName($ul);

                saveAs(content, `${zipName}.zip`);
            });
        }
    }
}