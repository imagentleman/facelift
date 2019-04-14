"use strict";

const express = require("express");
const fetch = require("node-fetch");
const urlParser = require("url");
const cheerio = require("cheerio");

const app = express();

app.use(express.static("public"));

function getFinalUrl(url) {
  const targetUrl = urlParser.parse(url);

  const domain = `${targetUrl.protocol || "http:"}//${targetUrl.host || ""}`;
  const path = `${targetUrl.path || ""}`;

  const finalUrl = `${domain}${path}`;

  return finalUrl;
}

function getDomain(url) {
  const finalUrl = getFinalUrl(url);
  const paredUrl = urlParser.parse(finalUrl);

  const domain = `${paredUrl.protocol || "http:"}//${paredUrl.host || ""}`;

  return domain;
}

function getFinalPage(page, url, styles) {
  const finalUrl = getFinalUrl(url);
  const domain = getDomain(url);
  const $ = cheerio.load(page);

  $("head").prepend(`<base href="${domain}">`);

  const internalImgs = $("img, source").not('[src^="http"], [src^="/"]');

  internalImgs.each((index, element) => {
    const src = $(element).attr("src");
    $(element).attr("src", `${finalUrl}/${src}`);
  });

  if (styles) {
    $("head").append($("<style>").text(styles));
  }

  return $.html();
}

async function getUrl(url) {
  const finalUrl = getFinalUrl(url);

  const response = await fetch(finalUrl);
  const body = response.text();
  return body;
}

app.get("/facelift/:url/:styles", async function facelift(req, res) {
  if (req.params.url) {
    const page = await getUrl(req.params.url);
    const result = getFinalPage(page, req.params.url, req.params.styles);

    res.send(result);
  } else {
    res.redirect("/");
  }
});

app.post("/url/:url", async function getUrlHtml(req, res) {
  const page = await getUrl(req.params.url);
  const result = getFinalPage(page, req.params.url);

  res.send(result);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});
