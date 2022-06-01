import {
  convertEpubFile,
  convertHTMLFile,
  convertMobiFile,
  convertPDFFile,
} from "./utils/converter.js";

import chalk from "chalk";
import fs from "fs";
import { getStoryInfo } from "./services/index.js";
import inquirer from "inquirer";
import { isCalibreAvailable } from "./utils/index.js";
import ora from "ora";
import sanitizeHtml from "sanitize-html";

sanitizeHtml.defaults.allowedTags.push("img");

fs.mkdirSync("output", { recursive: true });
fs.mkdirSync("output/images", { recursive: true });

let { storyId } = await inquirer.prompt({
  type: "input",
  name: "storyId",
  message: "Enter Wattpad Story ID: ",
  validate: (input) => !!input,
});

storyId = storyId.split("-")[0];

const { format } = await inquirer.prompt({
  type: "list",
  name: "format",
  message: "Which format do you want to export?",
  choices: [
    { name: "HTML", value: "html" },
    { name: "PDF", value: "pdf" },
    { name: "Epub", value: "epub" },
    { name: "Mobi", value: "mobi" },
  ],
});

const fetchingStoryInfoSpinner = ora({
  text: "Fetching story info",
  hideCursor: false,
}).start();

fetchingStoryInfoSpinner.succeed();

console.time("🎉 Story download took");

const info = await getStoryInfo(storyId);

console.log(`\nDownload story: ${chalk.cyan(info.title)}\n`);

switch (format) {
  case "html": {
    await convertHTMLFile(info);
    break;
  }

  case "pdf": {
    await convertPDFFile(info);
    break;
  }

  case "epub": {
    await isCalibreAvailable();
    await convertEpubFile(info);
    break;
  }

  case "mobi": {
    await isCalibreAvailable();
    await convertMobiFile(info);
    break;
  }

  default:
    break;
}

console.timeEnd("🎉 Story download took");
