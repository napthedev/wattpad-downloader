import { getHTMLParts, getHTMLPartsWithLocalImage } from "../services/index.js";
import { htmlTemplate, pdfTemplate } from "../templates/index.js";

import chalk from "chalk";
import { execSync } from "child_process";
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
    path.resolve(__dirname, "..", "output", `${info.title}.html`),
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
        { format: "A4", quality: "100", timeout: 999999999 }
      )
      .toFile(`.output/${info.title}.pdf`, (err, response) => {
        if (err) {
          console.log(err);
          console.log(`\n${chalk.red("✖")} Failed to generate PDF file`);
          process.exit(1);
        }

        generatePDFSpinner.succeed("Generated PDF file successfully");

        res(response);
      });
  });
};

export const convertEpubFile = async (info) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${info.title}</title>
</head>
<body>
  ${(await getHTMLPartsWithLocalImage(info))
    .map((item) => `<h1>${item.title}</h1>\n${item.data}`)
    .join("\n")}
</body>
</html>
    `;

  const htmlFilePath = path.resolve(
    __dirname,
    "..",
    `output/${info.title}-temp.html`
  );
  const outputFilePath = path.resolve(
    __dirname,
    "..",
    `output/${info.title}.epub`
  );

  fs.writeFileSync(htmlFilePath, html, { encoding: "utf-8" });

  const epubConversionSpinner = ora({
    text: "Generating Epub file...",
    hideCursor: false,
  }).start();

  try {
    execSync(
      `ebook-convert "${htmlFilePath}" "${outputFilePath}" --authors "Wattpad" --output-profile kindle_pw3 --disable-font-rescaling --cover "${info.cover}" --title "${info.title}"`,
      {
        cwd: path.resolve(__dirname, ".."),
      }
    );

    epubConversionSpinner.succeed("Epub conversion succeeded...");
  } catch (error) {
    console.log(error);
    epubConversionSpinner.fail("Epub conversion failed...");
  }
};

export const convertMobiFile = async (info) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${info.title}</title>
</head>
<body>
  ${(await getHTMLPartsWithLocalImage(info))
    .map((item) => `<h1>${item.title}</h1>\n${item.data}`)
    .join("\n")}
</body>
</html>
    `;

  const htmlFilePath = path.resolve(
    __dirname,
    "..",
    `output/${info.title}-temp.html`
  );
  const outputFilePath = path.resolve(
    __dirname,
    "..",
    `output/${info.title}.mobi`
  );

  fs.writeFileSync(htmlFilePath, html, { encoding: "utf-8" });

  const mobiConversionSpinner = ora({
    text: "Generating Mobi file...",
    hideCursor: false,
  }).start();

  try {
    execSync(
      `ebook-convert "${htmlFilePath}" "${outputFilePath}" --authors "Wattpad" --output-profile kindle_pw3 --disable-font-rescaling --cover "${info.cover}" --title "${info.title}"`,
      {
        cwd: path.resolve(__dirname, ".."),
      }
    );

    mobiConversionSpinner.succeed("Mobi conversion succeeded...");
  } catch (error) {
    console.log(error);
    mobiConversionSpinner.fail("Mobi conversion failed...");
  }
};
