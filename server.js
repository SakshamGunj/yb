const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generate PDF endpoint
app.post('/generate-pdf', async (req, res) => {
    try {
        const data = req.body;
        
        // Generate HTML for PDF
        const html = generateInvoiceHTML(data);
        
        // Launch headless browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        res.send(pdf);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

// Function to generate invoice HTML
function generateInvoiceHTML(data) {
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
    
    // Generate HTML with inline styles
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice</title>
            <style>
                body { 
                    font-family: 'Montserrat', 'Poppins', 'Segoe UI', sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #333;
                    line-height: 1.3;
                    font-size: 14px;
                }
                .blueside-invoice { max-width: 800px; margin: 0 auto; }
                .blueside-header { 
                    background-color: #2a4aa1;
                    color: white;
                    padding: 18px;
                    display: flex;
                    justify-content: space-between;
                }
                .blueside-header-left {
                    display: flex;
                    flex-direction: column;
                }
                .company-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 3px 0 1px 0;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .company-tagline {
                    font-size: 0.85rem;
                    margin: 0;
                    color: rgba(255,255,255,0.9);
                }
                .blueside-header-right { text-align: right; }
                .invoice-from {
                    background-color: rgba(255, 255, 255, 0.95);
                    padding: 8px 10px;
                    border-radius: 5px;
                    color: black;
                    margin-bottom: 10px;
                }
                .total-display {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 3px 0 0 0;
                }
                .blueside-body { padding: 15px; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0 15px 0;
                }
                th {
                    background-color: #f8f8f8;
                    padding: 6px 8px;
                    text-align: left;
                    font-size: 0.75rem;
                    color: #444;
                }
                td { padding: 6px 8px; font-size: 0.8rem; }
                tbody { background-color: #212121; color: white; }
                .summary-box {
                    background-color: #f0f4ff;
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 0.85rem;
                }
                .payment-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    align-items: center;
                }
                .payment-method {
                    width: 48%;
                }
                .payment-method h4 {
                    color: #2a4aa1;
                    margin: 0 0 5px 0;
                    font-size: 0.85rem;
                }
                .payment-method p {
                    font-size: 0.8rem;
                    line-height: 1.3;
                    margin: 0;
                }
                .qr-code {
                    width: 48%;
                    text-align: right;
                }
                .qr-code img {
                    width: 220px;
                    height: auto;
                    border-radius: 6px;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                }
                .qr-code p {
                    text-align: center;
                    font-size: 0.8rem;
                    margin: 5px 0 0 0;
                    font-weight: 500;
                }
                .terms {
                    border-top: 1px solid #eee;
                    border-bottom: 1px solid #eee;
                    padding: 8px 0;
                    margin-bottom: 15px;
                    font-size: 0.8rem;
                }
                .terms h4 {
                    color: #2a4aa1;
                    margin: 0 0 5px 0;
                    font-size: 0.85rem;
                }
                .footer {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #555;
                    align-items: center;
                }
                .balance-due {
                    color: #2a4aa1;
                    font-weight: bold;
                }
                h3 {
                    font-size: 0.85rem;
                    margin: 0 0 3px 0;
                }
                p {
                    margin: 0 0 2px 0;
                }
            </style>
        </head>
        <body>
            <div class="blueside-invoice">
                <div class="blueside-header">
                    <div class="blueside-header-left">
                        <img src="https://i.ibb.co/d0PF4sQg/Untitled-design-3.png" alt="Company Logo" style="max-width: 180px; height: auto; margin-bottom: 5px;">
                        <div>
                            <p class="company-name">${data.company.name}</p>
                            <p class="company-tagline">Your Premier Travel & Adventure Partner</p>
                        </div>
                    </div>
                    <div class="blueside-header-right">
                        <div class="invoice-from">
                            <h3 style="font-size: 0.75rem; margin: 0; color: #333;">Invoice From</h3>
                            <p style="font-size: 0.7rem; line-height: 1.2; margin: 2px 0;">${data.company.address.replace(/\n/g, '<br>')}</p>
                            <p style="font-size: 0.7rem; margin: 2px 0 0 0; color: #555;">Phone: ${data.company.phone}</p>
                        </div>
                        <p style="margin: 0; font-size: 0.7rem; color: rgba(255,255,255,0.9);">Total Amount</p>
                        <p class="total-display">₹${total.toFixed(2)}</p>
                    </div>
                </div>
                
                <div class="blueside-body">
                    <!-- Client info section - more compact -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;">
                        <div style="width: 60%;">
                            <h3 style="font-size: 0.85rem; margin: 0 0 3px 0;">Invoice To:</h3>
                            <p style="font-size: 0.9rem; margin: 0 0 1px 0;"><strong>${data.client.name}</strong></p>
                            <p style="white-space: pre-line; color: #555; font-size: 0.75rem; line-height: 1.2; margin: 0;">${data.client.address}</p>
                            ${data.client.gst ? `<p style="color: #555; font-size: 0.75rem; margin: 1px 0 0 0;">GSTIN: ${data.client.gst}</p>` : ''}
                        </div>
                        <div style="text-align: right; width: 35%;">
                            <p style="font-size: 0.75rem; margin: 0 0 2px 0;">Invoice #: <strong>${data.invoice.number}</strong></p>
                            <p style="font-size: 0.75rem; margin: 0 0 2px 0;">Date: <strong>${formattedDate}</strong></p>
                            <p style="font-size: 0.75rem; margin: 0;">GSTIN: <strong>${data.company.gst}</strong></p>
                        </div>
                    </div>
                    
                    <!-- Items table - more compact -->
                    <table style="margin-top: 5px; margin-bottom: 10px;">
                        <thead>
                            <tr>
                                <th style="width: 25px; padding: 4px 6px;">#</th>
                                <th style="padding: 4px 6px;">Description</th>
                                <th style="width: 40px; padding: 4px 6px;">Qty</th>
                                <th style="width: 65px; padding: 4px 6px;">Price</th>
                                <th style="width: 70px; padding: 4px 6px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.items.map((item, index) => `
                                <tr>
                                    <td style="padding: 4px 6px;">${(index + 1).toString().padStart(2, '0')}</td>
                                    <td style="padding: 4px 6px;">${item.name}</td>
                                    <td style="padding: 4px 6px;">${item.qty}</td>
                                    <td style="padding: 4px 6px;">₹${parseFloat(item.price).toFixed(2)}</td>
                                    <td style="padding: 4px 6px; text-align: right;">₹${(item.qty * item.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <!-- Summary box - more compact -->
                    <div class="summary-box" style="padding: 8px 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Sub Total:</span>
                            <span>₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                            <span>GST (${data.invoice.taxRate}%):</span>
                            <span>₹${taxAmount.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(0,0,0,0.1); font-weight: bold; font-size: 0.9rem;">
                            <span>Total:</span>
                            <span>₹${total.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #4b5563;">
                            <span>Advance Payment:</span>
                            <span>₹${data.invoice.advancePayment.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(0,0,0,0.1); font-weight: bold; font-size: 0.9rem;" class="balance-due">
                            <span>Balance Due:</span>
                            <span>₹${balanceDue.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- Payment method and QR code -->
                    <div class="payment-section" style="margin-bottom: 10px;">
                        <div class="payment-method">
                            <h4>Payment Method</h4>
                            <p>${data.bankDetails.replace(/\n/g, '<br>')}</p>
                        </div>
                        
                        <div class="qr-code">
                            <img src="https://i.ibb.co/r2WyrJkV/Whats-App-Image-2025-04-25-at-13-33-27.jpg" alt="UPI QR Code">
                            <p>Scan to Pay</p>
                        </div>
                    </div>
                    
                    <!-- Terms and conditions - more compact -->
                    <div class="terms" style="padding: 6px 0; margin-bottom: 10px;">
                        <h4>Terms and Conditions</h4>
                        <p>${data.notes}</p>
                    </div>
                    
                    <!-- Footer with contact info - more compact -->
                    <div class="footer">
                        <div style="display: flex; gap: 15px;">
                            <div>
                                <div style="background-color: #2a4aa1; color: white; width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 4px; font-size: 0.6rem;">@</div>
                                <span>${data.company.name.toLowerCase().replace(/\s+/g, '')}@gmail.com</span>
                            </div>
                            <div>
                                <div style="background-color: #2a4aa1; color: white; width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 4px; font-size: 0.6rem;">☏</div>
                                <span>${data.company.phone}</span>
                            </div>
                        </div>
                        
                        <div>
                            <span style="margin-right: 6px; font-size: 0.75rem;">Authorized Signature</span>
                            <img src="https://i.ibb.co/Y40ck28f/Whats-App-Image-2025-04-25-at-13-34-44.jpg" alt="Signature" style="width: 75px; height: auto; vertical-align: middle;">
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
