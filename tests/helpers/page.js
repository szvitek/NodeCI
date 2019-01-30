const puppeteer = require('puppeteer');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: function(target, property) {
        return customPage[property] || page[property] || browser[property]
      }
    })
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }

  // browser.close() not being calld because page has a close method too which has a higher priority in the proxy function
  // insted of this method we could have changed the order of page <=> browser
  close() {
    this.browser.close();
  }
}

module.exports = CustomPage;