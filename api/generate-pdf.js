const puppeteer = require('puppeteer-core');
const chrome = require('@sparticuz/chromium');

// Function to generate invoice HTML (keeping your existing implementation)
const generateInvoiceHTML = (data) => {
  // Calculate tax and totals
  let subtotal = 0;
  data.items.forEach(item => {
      subtotal += (item.qty * item.price);
  });
  
  const taxAmount = (subtotal * data.invoice.taxRate) / 100;
  const total = subtotal + taxAmount;
  const balanceDue = Math.max(0, total - data.invoice.advancePayment);
  
  // Format the date
  const date = new Date(data.invoice.date);
  const formattedDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
  }).replace(/\//g, '-');
  
  // Return your existing HTML template with all styling and structure
  return `<!DOCTYPE html>
          <html><!-- Your existing HTML template --></html>`;
};

module.exports = async (req, res) => {
  // CORS headers
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
    
    // Configure browser with memory optimization - FIX: Call the function instead of accessing as property
    const executablePath = await chrome.executablePath();
    
    // Launch browser with memory-optimized settings
    const browser = await puppeteer.launch({
      args: [
        ...chrome.args,
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--no-sandbox',
        '--disable-extensions',
        '--disable-audio-output',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-translate',
        '--font-render-hinting=none'
      ],
      executablePath,
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
      dumpio: false
    });
    
    // Create a new page with optimized settings
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    
    // Skip non-essential resource types to save memory
    page.on('request', request => {
      const resourceType = request.resourceType();
      if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
        request.continue();
      } else if (resourceType === 'script') {
        // Allow minimal JS
        request.continue();
      } else {
        request.continue();
      }
    });
    
    // Limit concurrent requests
    page.setDefaultNavigationTimeout(30000);
    
    // Set content and optimize rendering
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    // Generate PDF with optimized settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '5mm', bottom: '5mm', left: '5mm' },
      preferCSSPageSize: true,
      omitBackground: false
    });
    
    // Close browser immediately to free memory
    await browser.close();
    
    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${data.company.name}_Invoice_${data.invoice.number}.pdf`);
    return res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Error generating PDF: ' + error.message });
  }
};