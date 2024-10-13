// api/generate-pdf.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const fontPath = path.resolve(__dirname, 'Playmaker D.ttf'); // Make sure this font is available
    const fontFile = fs.readFileSync(fontPath);
    const base64Font = fontFile.toString('base64');
    const fontDataUrl = `data:font/ttf;base64,${base64Font}`;

    const htmlContent = `<!DOCTYPE html>
                          <html lang="en">
                            <head>
                              <meta charset="UTF-8" />
                              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                              <title>Document</title>
                              <style>
                                @font-face {
                                      font-family: 'myFirstFont';
                                      src: url('${fontDataUrl}');
                                    }

                                    * {
                                      font-family: 'myFirstFont';
                                    }
                              </style>
                            </head>
                            <body>
                              <h1>font-familyasdas كيف حالك</h1>
                            </body>
                          </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const headerTemplate = `
      <div style="font-size:12px; text-align:center; width:100%; padding:10px;">
        Simple Header
      </div>`;

    const footerTemplate = `
      <div style="font-size:12px; text-align:center; width:100%; padding:10px; background-color:#f1f1f1;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '60px', // Adjust based on header size
        bottom: '30px',
        left: '20px',
        right: '20px',
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=output.pdf',
    });

    res.send(pdfBuffer); // Send the PDF as the response
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};
