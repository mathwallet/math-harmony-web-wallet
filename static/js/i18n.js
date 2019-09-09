import Vue from 'vue'
import vueI18n from 'vue-i18n'
import util from './util'
Vue.use(vueI18n)

/*
设置一下网站支持的语言种类
  */
var webLanguage = ['cn', 'en', 'ko'];

/**
 * 获取浏览器语言类型
 */
var getNavLanguage = function() {
  var navLanguage = (navigator.browserLanguage || navigator.language).toLowerCase();
  switch (navLanguage) {
    case 'zh-cn' || 'zh-tw' || 'zh-hk':
      navLanguage = 'cn';
      break;
    case 'ko':
      navLanguage = 'ko'
      break;
    default:
      navLanguage = 'en';
  }
  return navLanguage;
}

let i18n = new vueI18n({
  locale: 'en', // 语言标识
  //this.$i18n.locale // 通过切换locale的值来实现语言切换
  messages: {
    'cn': require('static/lang/cn'),
    'en': require('static/lang/en'),
    'ko': require('static/lang/ko')
  }
})

function isJSON(str) {
  if (typeof str == 'string') {
    try {
      var obj = JSON.parse(str);
      if (typeof obj == 'object' && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  console.log('It is not a string!')
}

i18n.setUserLanguage = function(lang) {
  if (isJSON(lang)) {
    lang = JSON.parse(lang).language;
  }
  if (!webLanguage.includes(lang)) {
    lang = 'en'
  }
  util.setCookie("userLanguage", lang, {
    expires: 30,
    path: '/'
  });
  i18n.locale = lang;
}

var cookieLang = util.getCookie('userLanguage') ? util.getCookie('userLanguage') : getNavLanguage();
i18n.setUserLanguage(cookieLang);

export default i18n