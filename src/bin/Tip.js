/*jshint esversion: 6 */

/**
 * 提示
 */
class Tip {

    static tip(text, iconName) {
        GM_notification({
            text: text,
            image: GM_getResourceURL(iconName)
        });
    }

    static info(text) {
        Tip.tip(text, "iconInfo");
    }

    static error(text) {
        Tip.tip(text, "iconError");
    }

    static success(text) {
        Tip.tip(text, "iconSuccess");
    }
}