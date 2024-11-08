const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 8000;

// Enable CORS
app.use(
  cors({ origin: '*', methods: 'GET,POST', allowedHeaders: 'Content-Type' })
);

// Parse JSON bodies
app.use(bodyParser.json());

app.post('/generate-pdf', async (req, res) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head><meta charset="UTF-8"><title>Document</title></head>
        <body><h1>كيف حالك</h1></body>
      </html>`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=output.pdf',
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF: h', error);
    res.status(500).send('Error generating PDF y');
  }
});

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
