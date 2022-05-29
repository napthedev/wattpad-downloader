import { getHTMLParts, getHTMLPartsForEpub } from "../services/index.js";
import { htmlTemplate, pdfTemplate } from "../templates/index.js";

import Epub from "epub-gen";
import chalk from "chalk";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import ora from "ora";
import path from "path";
import pdf from "html-pdf";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export const convertHTMLFile = async (info) => {
  const htmlParts = await getHTMLParts(info);

  fs.writeFileSync(
    "./output.html",
    htmlTemplate
      .replace("{{title}}", info.title)
      .replace("{{content}}", htmlParts.join("\n"))
  );

  console.log(`${chalk.green("✔")} Generated HTML file successfully`);
};

export const convertPDFFile = async (info) => {
  const htmlParts = await getHTMLParts(info);

  await new Promise((res, rej) => {
    const generatePDFSpinner = ora({
      text: "Generating PDF...",
      hideCursor: false,
    }).start();

    pdf
      .create(
        pdfTemplate
          .replace("{{title}}", info.title)
          .replace("{{content}}", htmlParts.join("\n")),
        { format: "A4", quality: "100" }
      )
      .toFile("./output.pdf", (err, response) => {
        if (err) {
          console.log(`\n${chalk.red("✖")} Failed to generate PDF file`);
          process.exit(1);
        }

        generatePDFSpinner.succeed("Generated PDF file successfully");

        res(response);
      });
  });
};

export const convertEpubFile = async (info) => {
  const htmlParts = await getHTMLPartsForEpub(info);

  const consoleLog = console.log;
  console.log = () => {};

  const generateEpubSpinner = ora({
    text: "Generating Epub...",
    hideCursor: false,
  }).start();

  await new Promise((resolve, reject) => {
    new Epub(
      {
        title: info.title,
        author: "Wattpad",
        cover: info.cover,
        version: 2,
        content: htmlParts,
      },
      "./output.epub"
    ).promise.then(
      () => {
        console.log = consoleLog;
        generateEpubSpinner.succeed("Generated Epub file successfully");
        resolve();
      },
      (err) => {
        console.error("Failed to generate Ebook because of ", err);

        console.log(`\n${chalk.red("✖")} Failed to generate Epub file`);
        process.exit(1);
      }
    );
  });
};

export const convertMobiFile = async (info) => {
  if (!["darwin", "linux", "win32"].includes(process.platform)) {
    console.log(
      `\n${chalk.red(
        "✖"
      )} Unsupported operating system for converting Mobi file`
    );

    process.exit(1);
  }

  await convertEpubFile(info);

  const binaryPath = path.resolve(
    __dirname,
    "..",
    "binaries",
    process.platform,
    process.platform === "win32" ? "kindlegen.exe" : "kindlegen"
  );

  execFileSync(binaryPath, [path.resolve(__dirname, "..", "output.epub")], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    input: "",
  });
};
