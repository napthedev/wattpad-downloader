import chalk from "chalk";
import fetch from "node-fetch";
import ora from "ora";
import sanitizeHtml from "sanitize-html";
import { splitArray } from "../utils/index.js";

sanitizeHtml.defaults.allowedTags.push("img");

export const getStoryInfo = async (storyId) => {
  // Full api URL: https://www.wattpad.com/api/v3/stories/292169908?fields=id,title,description,url,cover,isPaywalled,user(name,username,avatar),lastPublishedPart,parts(id,title,text_url),tags
  try {
    const info = await fetch(
      `https://www.wattpad.com/api/v3/stories/${storyId}?fields=id,title,description,url,cover,isPaywalled,user(name,username,avatar),lastPublishedPart,parts(id,title,text_url),tags`
    ).then((res) => res.json());
    return info;
  } catch (error) {
    console.log(`\n${chalk.red("✖")} Cannot find the story you entered`);
    process.exit(1);
  }
};

export const getHTMLParts = async (info) => {
  let partsSpinner = ora({
    text: "Getting all the parts",
    hideCursor: false,
  }).start();

  let htmlParts = [];
  for (const [index, group] of splitArray(info.parts, 10).entries()) {
    partsSpinner.text = `Fetching parts ${chalk.green(
      `${index * 10 + 1}-${index * 10 + 10}`
    )}...`;
    htmlParts.push(
      ...(await Promise.all(
        group.map(async (part) => {
          const htmlSource = await fetch(part.text_url.text).then((res) =>
            res.text()
          );
          return sanitizeHtml(`<h2>${part.title}</h2>\n${htmlSource}`);
        })
      ))
    );
  }

  partsSpinner.succeed("Fetched all the parts successfully");

  return htmlParts;
};

export const getHTMLPartsForEpub = async (info) => {
  let partsSpinner = ora({
    text: "Getting all the parts",
    hideCursor: false,
  }).start();

  let htmlParts = [];
  for (const [index, group] of splitArray(info.parts, 10).entries()) {
    partsSpinner.text = `Fetching parts ${chalk.green(
      `${index * 10 + 1}-${index * 10 + 10}`
    )}...`;
    htmlParts.push(
      ...(await Promise.all(
        group.map(async (part) => {
          const htmlSource = await fetch(part.text_url.text).then((res) =>
            res.text()
          );
          return {
            title: part.title,
            data: sanitizeHtml(`<h2>${part.title}</h2>\n${htmlSource}`),
          };
        })
      ))
    );
  }

  partsSpinner.succeed("Fetched all the parts successfully");

  return htmlParts;
};
