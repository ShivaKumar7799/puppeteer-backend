const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 8000;

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins for now; replace with your frontend domain if needed
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(bodyParser.json());

app.post('/generate-pdf', async (req, res) => {
  try {
    // Use the HTML content or generate it
    const fontPath = path.resolve(__dirname, 'Playmaker D.ttf');
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
                                      src: url('${fontDataUrl}'); /* Base64-encoded font */
                                }

                                * {
                                  font-family: 'myFirstFont';
                                }
                              </style>
                            </head>
                            <body>
                              <h1>font-familyasdas كيف حالك </h1>
                            </body>
                          </html>`;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true, // Use headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for some cloud platforms
    });
    const page = await browser.newPage();

    // Set the HTML content to the page
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate the header and footer templates
    const headerTemplate = `
    <div style="font-size:12px; text-align:center; width:100%; padding:10px;">
      Simple Header
    </div>`;

    const footerTemplate = `
    <div style="font-size:12px; text-align:center; width:100%; padding:10px; background-color:#f1f1f1;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>`;

    // Create a temporary file to store the PDF
    const pdfPath = path.join(__dirname, 'output.pdf');

    // Calculate header height dynamically
    const headerHeight = await page.evaluate((headerTemplate) => {
      const header = document.createElement('div');
      header.innerHTML = headerTemplate;
      document.body.appendChild(header);
      const height = header.offsetHeight;
      document.body.removeChild(header);
      return height;
    });

    // Generate the PDF with header, footer, and margins
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: `${headerHeight + 10}px`, // Add buffer for the header
        bottom: '30px', // Adjust bottom margin if needed
        left: '20px',
        right: '20px',
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
    });

    await browser.close();

    // Send the generated PDF as a response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=output.pdf',
    });

    const pdfStream = fs.createReadStream(pdfPath);
    pdfStream.pipe(res);

    pdfStream.on('end', () => {
      fs.unlinkSync(pdfPath); // Delete the PDF file after sending it
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
