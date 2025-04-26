document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('invoiceDate').valueAsDate = new Date();
    
    // Add event listeners with improved error handling
    document.getElementById('generateInvoiceBtn').addEventListener('click', function() {
        try {
            console.log("Generate Invoice button clicked");
            generateInvoice();
        } catch (error) {
            console.error("Error generating invoice:", error);
            alert("Error generating invoice. Please check the console for details.");
        }
    });
    
    document.getElementById('downloadPdfBtn').addEventListener('click', downloadPdf);
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    
    // Add event listener to calculate line totals when inputs change
    document.getElementById('itemsList').addEventListener('input', function(e) {
        if (e.target.classList.contains('itemQty') || e.target.classList.contains('itemPrice')) {
            calculateLineTotals();
        }
    });
    
    // Initialize with one item
    calculateLineTotals();
    
    console.log("Invoice generator initialized");
});

// Add a new item row
function addItem() {
    console.log("Adding new item");
    const itemsList = document.getElementById('itemsList');
    const itemCount = itemsList.children.length + 1;
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    
    itemRow.innerHTML = `
        <div class="form-group">
            <label for="itemName${itemCount}">Item Description</label>
            <input type="text" id="itemName${itemCount}" class="itemName" required>
        </div>
        <div class="form-group">
            <label for="itemQty${itemCount}">Qty</label>
            <input type="number" id="itemQty${itemCount}" class="itemQty" min="1" required>
        </div>
        <div class="form-group">
            <label for="itemPrice${itemCount}">Unit Price (₹)</label>
            <input type="number" id="itemPrice${itemCount}" class="itemPrice" min="0" step="0.01" required>
        </div>
        <div class="form-group item-total">
            <label>Amount (₹)</label>
            <span class="lineTotal">0.00</span>
        </div>
    `;
    
    itemsList.appendChild(itemRow);
}

// Calculate line totals for each item
function calculateLineTotals() {
    const itemRows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    
    itemRows.forEach(row => {
        const qty = parseFloat(row.querySelector('.itemQty').value) || 0;
        const price = parseFloat(row.querySelector('.itemPrice').value) || 0;
        const total = qty * price;
        
        row.querySelector('.lineTotal').textContent = total.toFixed(2);
        subtotal += total;
    });
    
    return subtotal;
}

// Generate invoice
function generateInvoice() {
    console.log("Starting invoice generation process");
    
    // Validate the form
    const form = document.getElementById('invoiceForm');
    if (!isFormValid(form)) {
        alert('Please fill all required fields');
        return;
    }
    
    // Calculate totals
    const subtotal = calculateLineTotals();
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;
    const advancePayment = parseFloat(document.getElementById('advancePayment').value) || 0;
    const balanceDue = Math.max(0, grandTotal - advancePayment);
    
    // Get all invoice data
    const invoiceData = {
        company: {
            name: document.getElementById('companyName').value,
            address: document.getElementById('companyAddress').value,
            phone: document.getElementById('companyPhone').value,
            gst: document.getElementById('companyGST').value
        },
        client: {
            name: document.getElementById('clientName').value,
            address: document.getElementById('clientAddress').value,
            gst: document.getElementById('clientGST').value
        },
        invoice: {
            number: document.getElementById('invoiceNumber').value,
            date: formatDate(document.getElementById('invoiceDate').value),
            subtotal: subtotal.toFixed(2),
            taxRate: taxRate,
            taxAmount: taxAmount.toFixed(2),
            total: grandTotal.toFixed(2),
            advancePayment: advancePayment.toFixed(2),
            balanceDue: balanceDue.toFixed(2)
        },
        items: getInvoiceItems(),
        notes: document.getElementById('notes').value,
        bankDetails: document.getElementById('bankDetails').value
    };
    
    console.log("Invoice data prepared:", invoiceData);
    
    // Generate HTML for invoice
    renderInvoice(invoiceData);
    
    // Enable download button
    document.getElementById('downloadPdfBtn').disabled = false;
    
    console.log("Invoice generated successfully");
}

// Check if the form is valid
function isFormValid(form) {
    const required = form.querySelectorAll('[required]');
    let allFilled = true;
    
    required.forEach(input => {
        if (input.value.trim() === '') {
            console.log("Missing required field:", input.id);
            input.classList.add('error');
            allFilled = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return allFilled;
}

// Get all invoice items from the form
function getInvoiceItems() {
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach((row, index) => {
        const name = row.querySelector('.itemName').value;
        const qty = parseFloat(row.querySelector('.itemQty').value) || 0;
        const price = parseFloat(row.querySelector('.itemPrice').value) || 0;
        const total = qty * price;
        
        if (name && qty && price) {
            items.push({
                no: (index + 1).toString().padStart(2, '0'), // Format: 01, 02, etc.
                name: name,
                qty: qty,
                price: price.toFixed(2),
                total: total.toFixed(2)
            });
        }
    });
    
    return items;
}

// Format date to DD-MM-YYYY
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');
}

// Render the invoice HTML using the optimized design
function renderInvoice(data) {
    console.log("Rendering invoice to HTML");
    const invoice = document.getElementById('invoice');
    
    // Format the address with proper line breaks
    const addressLines = data.company.address.split('\n');
    const formattedAddress = addressLines.map(line => 
        `<p style="font-size: 0.7rem; margin: 0; color: #666;">${line}</p>`
    ).join('');
    
    // Create invoice HTML with optimized layout
    invoice.innerHTML = `
        <div class="blueside-invoice">
            <div class="blueside-header" style="padding: 10px 20px 15px; min-height: 85px; display: flex; justify-content: space-between; align-items: center;">
                <div class="blueside-header-left" style="display: flex; flex-direction: column; align-items: flex-start;">
                    <img src="https://i.ibb.co/d0PF4sQg/Untitled-design-3.png" alt="Company Logo" style="max-width: 180px; height: auto; margin-bottom: 5px;">
                    <div style="margin-left: 5px;">
                        <h1 style="font-size: 1.4rem; margin: 0; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${data.company.name}</h1>
                        <p style="font-size: 0.8rem; margin: 0; color: rgba(255,255,255,0.8);">Your Premier Travel & Adventure Partner</p>
                    </div>
                </div>
                <div class="blueside-header-right" style="text-align: right;">
                    <div class="invoice-from" style="padding: 0.3rem 0.5rem; margin-bottom: 0.2rem; border-radius: 5px; background-color: rgba(255, 255, 255, 0.95); min-width: 200px;">
                        <h3 style="font-size: 0.75rem; margin: 0; color: #333;">Invoice From</h3>
                        <div style="line-height: 1.2; margin-top: 2px;">${formattedAddress}</div>
                        <p style="font-size: 0.7rem; margin: 2px 0 0 0; color: #666;">Phone: ${data.company.phone}</p>
                    </div>
                    <div style="margin-top: 5px;">
                        <p style="margin: 0; font-size: 0.7rem; color: rgba(255,255,255,0.9);">Total Amount</p>
                        <p class="total-amount" style="margin: 0; font-size: 1.4rem; color: white; font-weight: 600;">₹${data.invoice.total}</p>
                    </div>
                </div>
            </div>
            
            <div class="blueside-body" style="padding: 12px 15px 8px;">
                <div class="client-info" style="display: flex; justify-content: space-between; margin: 0 0 5px 0; padding-bottom: 3px; border-bottom: 1px solid #eee;">
                    <div class="client-details" style="width: 60%;">
                        <h3 style="font-size: 0.8rem; margin: 0 0 1px 0;">Invoice To:</h3>
                        <p style="font-size: 0.85rem; margin: 0 0 0 0;"><strong>${data.client.name}</strong></p>
                        <p style="white-space: pre-line; color: #666; font-size: 0.7rem; line-height: 1.1; margin: 0;">${data.client.address}</p>
                        ${data.client.gst ? `<p style="color: #666; font-size: 0.7rem; margin: 0;">GSTIN: ${data.client.gst}</p>` : ''}
                    </div>
                    <div class="invoice-meta" style="text-align: right; width: 35%;">
                        <p style="font-size: 0.75rem; margin: 0;">Invoice #: <strong>${data.invoice.number}</strong></p>
                        <p style="font-size: 0.75rem; margin: 0;">Date: <strong>${data.invoice.date}</strong></p>
                        <p style="font-size: 0.75rem; margin: 0;">GSTIN: <strong>${data.company.gst}</strong></p>
                    </div>
                </div>
                
                <div style="margin: 0 0 5px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="width: 30px; padding: 4px 6px; font-size: 0.7rem; background-color: #f8f8f8; text-align: left;">#</th>
                                <th style="padding: 4px 6px; font-size: 0.7rem; background-color: #f8f8f8; text-align: left;">Description</th>
                                <th style="width: 45px; padding: 4px 6px; font-size: 0.7rem; background-color: #f8f8f8; text-align: left;">Qty</th>
                                <th style="width: 70px; padding: 4px 6px; font-size: 0.7rem; background-color: #f8f8f8; text-align: left;">Price</th>
                                <th style="width: 80px; padding: 4px 6px; font-size: 0.7rem; background-color: #f8f8f8; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody style="background-color: #212121; color: white;">
                            ${data.items.map(item => `
                                <tr>
                                    <td style="padding: 4px 6px; font-size: 0.7rem;">${item.no}</td>
                                    <td style="padding: 4px 6px; font-size: 0.7rem;">${item.name}</td>
                                    <td style="padding: 4px 6px; font-size: 0.7rem;">${item.qty}</td>
                                    <td style="padding: 4px 6px; font-size: 0.7rem;">₹${item.price}</td>
                                    <td style="padding: 4px 6px; font-size: 0.7rem; text-align: right;">₹${item.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Summary section - moved above payment method -->
                <div style="margin: 8px 0;">
                    <div style="width: 100%; background-color: var(--light-blue); padding: 8px 12px; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>Sub Total:</span>
                            <span>₹${data.invoice.subtotal}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 2px;">
                            <span>GST (${data.invoice.taxRate}%):</span>
                            <span>₹${data.invoice.taxAmount}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold; margin-top: 3px; padding-top: 2px; border-top: 1px solid rgba(0,0,0,0.1);">
                            <span>Total:</span>
                            <span>₹${data.invoice.total}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-top: 3px; color: #4b5563;">
                            <span>Advance Payment:</span>
                            <span>₹${data.invoice.advancePayment}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold; margin-top: 3px; padding-top: 2px; border-top: 1px solid rgba(0,0,0,0.1); color: #2a4aa1;">
                            <span>Balance Due:</span>
                            <span>₹${data.invoice.balanceDue}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Payment method - now after summary box -->
                <div style="display: flex; justify-content: space-between; margin: 5px 0 12px 0;">
                    <div style="width: 55%;">
                        <h4 style="font-size: 0.75rem; margin: 0 0 3px 0; color: var(--primary-blue);">Payment Method</h4>
                        <p style="font-size: 0.7rem; line-height: 1.25; margin: 0;">${data.bankDetails.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="width: 40%; text-align: right;">
                        <img src="https://i.ibb.co/r2WyrJkV/Whats-App-Image-2025-04-25-at-13-33-27.jpg" alt="UPI QR Code" style="width: 180px; height: auto; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <p style="text-align: center; font-size: 0.7rem; margin: 3px 0 0 0;">Scan to Pay</p>
                    </div>
                </div>
                
                <div style="margin: 10px 0 5px; padding: 5px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
                    <h4 style="font-size: 0.75rem; margin: 0 0 3px 0; color: var(--primary-blue);">Terms and Conditions</h4>
                    <p style="font-size: 0.65rem; line-height: 1.2; margin: 0;">${data.notes}</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    <div style="display: flex; gap: 8px;">
                        <div style="display: flex; align-items: center; font-size: 0.7rem; color: #666;">
                            <div style="background-color: var(--primary-blue); color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 4px; font-size: 0.55rem;">@</div>
                            <span>${data.company.name.toLowerCase().replace(/\s+/g, '')}@gmail.com</span>
                        </div>
                        <div style="display: flex; align-items: center; font-size: 0.7rem; color: #666;">
                            <div style="background-color: var(--primary-blue); color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 4px; font-size: 0.55rem;">☏</div>
                            <span>${data.company.phone}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <p style="font-size: 0.65rem; color: #666; margin: 0;">Authorized Signature</p>
                        <img src="https://i.ibb.co/Y40ck28f/Whats-App-Image-2025-04-25-at-13-34-44.jpg" alt="Signature" style="width: 75px; height: auto;">
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Make the invoice visible
    invoice.style.display = 'block';
    
    // Scroll to the invoice preview
    document.getElementById('invoicePreview').scrollIntoView({ behavior: 'smooth' });
    
    console.log("Invoice rendered successfully");
}

// Download invoice as PDF - using Vercel API
function downloadPdf() {
    try {
        console.log("Starting PDF download process");
        const downloadBtn = document.getElementById('downloadPdfBtn');
        const originalText = downloadBtn.textContent;
        
        // Show loading indicator
        downloadBtn.innerHTML = "Generating PDF<span class='loading-text'></span>";
        downloadBtn.disabled = true;
        
        // Collect all the invoice data
        const invoiceData = {
            company: {
                name: document.getElementById('companyName').value,
                address: document.getElementById('companyAddress').value,
                phone: document.getElementById('companyPhone').value,
                gst: document.getElementById('companyGST').value
            },
            client: {
                name: document.getElementById('clientName').value,
                address: document.getElementById('clientAddress').value,
                gst: document.getElementById('clientGST').value
            },
            invoice: {
                number: document.getElementById('invoiceNumber').value,
                date: document.getElementById('invoiceDate').value,
                advancePayment: parseFloat(document.getElementById('advancePayment').value) || 0,
                taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
            },
            items: getInvoiceItems(),
            notes: document.getElementById('notes').value,
            bankDetails: document.getElementById('bankDetails').value
        };
        
        // Once deployed, use your Vercel URL here
        fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link to download the file
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${invoiceData.company.name}_Invoice_${invoiceData.invoice.number}.pdf`;
            
            // Append to the document and trigger download
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Reset button state
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
            
            console.log("PDF downloaded successfully");
        })
        .catch(error => {
            console.error("Error downloading PDF:", error);
            alert(`Could not generate PDF: ${error.message}`);
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        });
        
    } catch (error) {
        console.error("Error initiating PDF download:", error);
        alert("An error occurred while preparing the PDF. Please try again.");
        document.getElementById('downloadPdfBtn').innerHTML = "Download PDF";
        document.getElementById('downloadPdfBtn').disabled = false;
    }
}