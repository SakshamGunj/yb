const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium');

// PDF HTML generator function
const generateInvoiceHTML = (data) => {
  // Use your existing HTML generation code
  // This is the same function you already have in server.js
  // ...existing code...
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, please use POST' });
  }

  try {
    const data = req.body;
    
    // Generate HTML for PDF
    const html = generateInvoiceHTML(data);
    
    // Configure browser
    const executablePath = await chrome.executablePath;
    
    // Launch browser
    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath,
      headless: chrome.headless,
    });
    
    const page = await browser.newPage();
    
    // Set content and wait until network is idle
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '5mm', bottom: '5mm', left: '5mm' }
    });
    
    await browser.close();
    
    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${data.company.name}_Invoice_${data.invoice.number}.pdf`);
    return res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Error generating PDF' });
  }
};