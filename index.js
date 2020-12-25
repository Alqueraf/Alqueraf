const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');

const README_LOCATION = './README.md'

let DATA = {
    refresh_date: new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
        timeZone: 'Europe/Stockholm',
    }),
};
let instagramPostsArray = [];
async function setInstagramPosts() {
    // TODO: Pass image count as parameters
    instagramPostsArray = await puppeteerService.getLatestInstagramPostsFromAccount('alqueraf', 6);
}

/**
 * Builds the new readme by replacing the readme's <!-- INSTAGRAM-POST-LIST:START --><!-- INSTAGRAM-POST-LIST:END --> tags
 * @param previousContent {string}: actual readme content
 * @param newContent {string}: content to add
 * @return {string}: content after combining previousContent and newContent
 */
async function generateReadMe() {
    await fs.readFile(README_LOCATION, (err, data) => {
        if (err) throw err;
        const tagToLookFor = `<!-- INSTAGRAM-POST-LIST:`;
        const closingTag = '-->';
        const tagNewlineFlag = core.getInput('tag_post_pre_newline');
        const startOfOpeningTagIndex = data.indexOf(
          `${tagToLookFor}START`,
        );
        const endOfOpeningTagIndex = data.indexOf(
          closingTag,
          startOfOpeningTagIndex,
        );
        const startOfClosingTagIndex = data.indexOf(
          `${tagToLookFor}END`,
          endOfOpeningTagIndex,
        );
        if (
          startOfOpeningTagIndex === -1 ||
          endOfOpeningTagIndex === -1 ||
          startOfClosingTagIndex === -1
        ) {
          // Exit with error if comment is not found on the readme
          core.error(
            `Cannot find the comment tag on the readme:\n${tagToLookFor}:START -->\n${tagToLookFor}:END -->`
          );
          process.exit(1);
        }
        // Prepare HTML block
        const htmlRowStartElement = `<p align="center" width="100%">`;
        const htmlRowEndElement = `</p>`;
        const imagePlaceholder = "{{image}}"
        const messagePlaceholder = "{{image}}"
        const htmlPostElement = `<div align="center" style="width:33%; display:inline-block">
        <img src="${imagePlaceholder}"> 
        <p align="center">${messagePlaceholder}</p>
        </div>`;
        const newContent = instagramPostsArray.map((element) => {
            return htmlRowStartElement
                    + htmlPostElement
                        .replace(imagePlaceholder, element[IMAGE_KEY])
                        .replace(messagePlaceholder, element[MESSAGE_KEY])
                    + htmlRowEndElement;
        });
        const newContent = [
          data.slice(0, endOfOpeningTagIndex + closingTag.length),
          tagNewlineFlag ? '\n' : '',
          newContent,
          tagNewlineFlag ? '\n' : '',
          data.slice(startOfClosingTagIndex),
        ].join('');
        fs.writeFileSync('README.md', output);
    });
}

async function action() {

    /**
     * Get pictures
     */
    await setInstagramPosts();

    /**
     * Generate README
     */
    await generateReadMe();

    /**
     * Fermeture de la boutique 👋
     */
    await puppeteerService.close();
}

action();