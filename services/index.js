import chalk from "chalk";
import crypto from "crypto";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs";
import ora from "ora";
import { parse } from "node-html-parser";
import path from "path";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";
import { splitArray } from "../utils/index.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

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

export const getHTMLPartsWithLocalImage = async (info) => {
  let partsSpinner = ora({
    text: "Getting all the parts",
    hideCursor: false,
  }).start();

  let htmlParts = [];
  let images = [];

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
          const sanitized = sanitizeHtml(htmlSource);

          const dom = parse(sanitized);

          images = images.concat(
            dom.querySelectorAll("img").map((image) => {
              const src = image.getAttribute("src");
              const hash = crypto.createHash("md5").update(src).digest("hex");

              const filePath = path.resolve(
                __dirname,
                "..",
                "output",
                "images",
                `${hash}.jpg`
              );

              image.setAttribute("src", filePath);

              return {
                url: src,
                hash,
                filePath,
              };
            })
          );

          return {
            title: part.title,
            data: dom.outerHTML,
          };
        })
      ))
    );
  }
  partsSpinner.succeed("Fetched all the parts successfully");

  let imagesSpinner = ora({
    text: "Fetching images...",
    hideCursor: false,
  }).start();
  for (const [index, group] of splitArray(images, 10).entries()) {
    imagesSpinner.text = `Fetching images ${chalk.green(
      `${index * 10 + 1}-${index * 10 + 10}`
    )}...`;
    await Promise.all(
      group.map(async (image) => {
        const response = await fetch(image.url);

        const buffer = Buffer.from(await response.arrayBuffer());

        const contentType = response.headers.get("Content-Type");

        if (contentType === "image/jpeg") {
          fs.writeFileSync(image.filePath, buffer);
        } else {
          await sharp(buffer).jpeg().toFile(image.filePath);
        }
      })
    );
  }
  imagesSpinner.succeed("Fetched all the images successfully");

  return htmlParts;
};
