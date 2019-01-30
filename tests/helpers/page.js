const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

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

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    // set the cookie
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto('localhost:3000');    // need to reload the page to "activate" the cookies
    await this.page.waitFor('a[href="/auth/logout"]');   // need to tell puppeteer to wait for the given element appears on screen
  }
}

module.exports = CustomPage;