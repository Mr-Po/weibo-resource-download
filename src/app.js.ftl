// ==UserScript==
// @name         微博 [ 图片 | 视频 ] 下载
// @namespace    http://tampermonkey.net/
// @version      2.4.3
// @description  下载微博(weibo.com)的图片和视频。（支持LivePhoto、短视频、动/静图(9+)，可以打包下载）
// @author       Mr.Po
// @match        https://weibo.com/*
// @match        https://www.weibo.com/*
// @match        https://d.weibo.com/*
// @match        https://s.weibo.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.0/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.2.0/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require      https://cdn.staticfile.org/mustache.js/3.1.0/mustache.min.js
// @resource iconError https://cdn.jsdelivr.net/gh/Mr-Po/weibo-resource-download/out/media/error.png
// @resource iconSuccess https://cdn.jsdelivr.net/gh/Mr-Po/weibo-resource-download/out/media/success.png
// @resource iconInfo https://cdn.jsdelivr.net/gh/Mr-Po/weibo-resource-download/out/media/info.png
// @resource iconExtract https://cdn.jsdelivr.net/gh/Mr-Po/weibo-resource-download/out/media/extract.png
// @resource iconZip https://cdn.jsdelivr.net/gh/Mr-Po/weibo-resource-download/out/media/zip.png
// @connect      sinaimg.cn
// @connect      miaopai.com
// @connect      youku.com
// @connect      weibo.com
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// @更新日志
// v2.4.3   2020-09-18      1、更新视频链接解析方式，支持1080P+(需自身是微博会员)。
// v2.4.2   2020-08-11      1、新增“操作提示”开关；2、更新jquery来源。
// v2.4.1   2020-06-28      1、修复使用“resource_id”命名时，出现重复后缀的bug。
// v2.4     2020-05-06      1、新增wb_root_*命名参数。
// v2.3.1   2020-04-27      1、优化图标资源加载。
// v2.3     2020-04-27      1、修复视频下载未默认最高清晰度的bug；2、修复逐个下载最多10张的bug；3、修复部分情况下，图片重复的bug。
// v2.2     2020-01-12      1、更新9+图片解析策略。
// v2.1     2019-12-19      1、支持9+图片下载。
// v2.0     2019-06-23      1、重构代码逻辑；2、优化自定义命名方式。
// v1.1     2019-05-24      1、新增支持热门微博、微博搜索；2、新增可选文件命名方式。
// v1.0     2019-05-23      1、支持LivePhoto、短视频、动/静图，可以打包下载。

(function() {
    'use strict';

    <#include "/bin/Config.js" parse=false>

    <#include "/lib/Interface.js" parse=false>

    <#include "/bin/Link.js" parse=false>

    <#include "/bin/resolver/WeiBoResolver.js" parse=false>

    <#include "/bin/resolver/impl/SearchWeiBoResolver.js" parse=false>

    <#include "/bin/resolver/impl/MyWeiBoResolver.js" parse=false>

    <#include "/bin/handler/PictureHandler.js" parse=false>

    <#include "/bin/handler/VideoHandler.js" parse=false>

    <#include "/bin/handler/ZipHandler.js" parse=false>

    <#include "/bin/Tip.js" parse=false>

    <#include "/bin/Core.js" parse=false>

    setInterval(Core.handleWeiBoCard, Config.space);
})();