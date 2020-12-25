const puppeteer = require('puppeteer');

const IMAGE_CLASS = "post-image";
const MESSAGE_CLASS = "photo-description";

const IMAGE_KEY = "image";
const MESSAGE_KEY = "message";

class PuppeteerService {
  browser;
  page;

  async init() {
    this.browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--incognito',
        '--proxy-server=http=194.67.37.90:3128',
      ],
    });
  }

  /**
   *
   * @param {string} url
   */
  async goToPage(url) {
    if (!this.browser) {
      await this.init();
    }
    this.page = await this.browser.newPage();

    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US',
    });

    await this.page.goto(url, {
      waitUntil: `networkidle0`,
    });
  }

  async close() {
    await this.page.close();
    await this.browser.close();
  }

  /**
   *
   * @param {string} account Account to crawl
   * @param {number} maxPostsCount Quantity of images to fetch
   */
  async getLatestInstagramPostsFromAccount(account, maxPostsCount) {
    const page = `https://www.picuki.com/profile/${account}`;
    await this.goToPage(page);
    let previousHeight;

    try {
      previousHeight = await this.page.evaluate(`document.body.scrollHeight`);
      await this.page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
      await this.page.waitFor(1000);

      const nodes = await this.page.evaluate(() => {
        const images = document.querySelectorAll(`.${IMAGE_CLASS}`);
        const messages = document.querySelectorAll(`.${MESSAGE_CLASS}`);
        let posts = [];
        images.map((image, index) => {
          posts.push({
            IMAGE_KEY: image.src,
            MESSAGE_KEY: messages[index].innerHTML
          });
        });
        return posts;
        //return [].map.call(images, img => img.src);
      });

      return nodes.slice(0, maxPostsCount);
    } catch (error) {
      console.log('Error', error);
      process.exit();
    }
  }

}

const puppeteerService = new PuppeteerService();

module.exports = puppeteerService;