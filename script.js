document.addEventListener('DOMContentLoaded', function() {
    // Set current date as default
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById('invoiceDate').value = formattedDate;
    
    // Add Item Button
    document.getElementById('addItemBtn').addEventListener('click', function() {
        const itemsList = document.getElementById('itemsList');
        const newItem = document.createElement('div');
        newItem.className = 'item-row';
        newItem.innerHTML = `
            <div class="form-group">
                <label>Item Description</label>
                <input type="text" class="item-description" required>
            </div>
            <div class="form-group">
                <label>Price (₹)</label>
                <input type="number" class="item-price" required>
            </div>
            <div class="form-group">
                <label>Qty</label>
                <input type="number" class="item-qty" value="1" required>
            </div>
            <button type="button" class="remove-item">✕</button>
        `;
        itemsList.appendChild(newItem);
        
        // Add event listener to new remove button
        newItem.querySelector('.remove-item').addEventListener('click', function() {
            itemsList.removeChild(newItem);
        });
    });
    
    // Add event listener to existing remove button
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const itemRow = this.parentElement;
            document.getElementById('itemsList').removeChild(itemRow);
        });
    });
    
    // Generate Invoice Button
    document.getElementById('generateInvoice').addEventListener('click', function() {
        if (!validateForm()) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Update preview with form data
        updatePreview();
        
        // Show preview, hide form
        document.querySelector('.form-container').style.display = 'none';
        document.querySelector('.preview-container').style.display = 'block';
        
        // Scroll to top
        window.scrollTo(0, 0);
    });
    
    // Back to Form Button
    document.getElementById('backToForm').addEventListener('click', function() {
        document.querySelector('.form-container').style.display = 'block';
        document.querySelector('.preview-container').style.display = 'none';
    });
    
    // Simple, reliable PDF generation function
    document.getElementById('downloadPDF').addEventListener('click', function() {
        const downloadBtn = document.getElementById('downloadPDF');
        const originalText = downloadBtn.textContent;
        
        // Show loading state
        downloadBtn.textContent = 'Generating PDF...';
        downloadBtn.disabled = true;
        
        // Get the element directly - no cloning
        const element = document.getElementById('invoice');
        
        // Make sure images are loaded before generating the PDF
        const images = element.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
            });
        });
        
        // Wait for all images to load, then generate PDF
        Promise.all(imagePromises)
            .then(() => {
                // Simple, reliable PDF options
                const opt = {
                    margin: [10, 10, 10, 10],
                    filename: 'Yara_Services_Invoice.pdf',
                    image: { type: 'jpeg', quality: 1 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        logging: false
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait' 
                    }
                };

                // Generate PDF and open in new tab (for iPhone compatibility)
                return html2pdf().from(element).set(opt).outputPdf('blob');
            })
            .then(blob => {
                // Open PDF in a new tab
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            })
            .catch(error => {
                console.error('PDF generation failed:', error);
                alert('There was an error generating your PDF. Please try again.');
            })
            .finally(() => {
                // Reset button regardless of success/failure
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            });
    });
    });
    
    // Form validation
    function validateForm() {
        const requiredFields = document.querySelectorAll('#invoiceForm [required]');
        let valid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#ff4d4d';
                valid = false;
            } else {
                field.style.borderColor = '#ddd';
            }
        });
        
        // Check if we have at least one item
        if (document.querySelectorAll('.item-row').length === 0) {
            alert('Please add at least one invoice item.');
            valid = false;
        }
        
        return valid;
    }
    
    // Update preview with form data
    function updatePreview() {
        // Company details
        document.getElementById('preview-companyName').textContent = document.getElementById('companyName').value;
        document.getElementById('preview-companyAddress').textContent = document.getElementById('companyAddress').value;
        document.getElementById('preview-companyPhone').textContent = document.getElementById('companyPhone').value;
        document.getElementById('preview-companyEmail').textContent = document.getElementById('companyEmail').value;
        document.getElementById('preview-companyGST').textContent = document.getElementById('companyGST').value;
        document.getElementById('preview-companyPhone2').textContent = document.getElementById('companyPhone').value;
        document.getElementById('preview-companyEmail2').textContent = document.getElementById('companyEmail').value;
        
        // Client details
        document.getElementById('preview-clientName').textContent = document.getElementById('clientName').value;
        document.getElementById('preview-clientAddress').textContent = document.getElementById('clientAddress').value;
        
        const clientGST = document.getElementById('clientGST').value;
        if (clientGST) {
            document.getElementById('preview-clientGST').textContent = clientGST;
            document.getElementById('preview-clientGSTLabel').style.display = 'block';
            document.getElementById('preview-clientGSTLabel').innerHTML = '<strong>GSTIN:</strong> <span id="preview-clientGST">' + clientGST + '</span>';
        } else {
            document.getElementById('preview-clientGSTLabel').style.display = 'none';
        }
        
        // Invoice details
        document.getElementById('preview-invoiceNumber').textContent = document.getElementById('invoiceNumber').value;
        
        const invoiceDate = new Date(document.getElementById('invoiceDate').value);
        const formattedDate = invoiceDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        document.getElementById('preview-invoiceDate').textContent = formattedDate;
        
        // Items
        const itemsContainer = document.getElementById('preview-items');
        itemsContainer.innerHTML = '';
        
        const itemRows = document.querySelectorAll('.item-row');
        let subtotal = 0;
        
        itemRows.forEach((row, index) => {
            const description = row.querySelector('.item-description').value;
            const price = parseFloat(row.querySelector('.item-price').value);
            const qty = parseInt(row.querySelector('.item-qty').value);
            const total = price * qty;
            
            subtotal += total;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}.</td>
                <td>${description}</td>
                <td>₹${price.toFixed(2)}</td>
                <td>${qty}</td>
                <td>₹${total.toFixed(2)}</td>
            `;
            itemsContainer.appendChild(tr);
        });
        
        // Totals
        document.getElementById('preview-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        document.getElementById('preview-taxRate').textContent = taxRate;
        
        const tax = subtotal * (taxRate / 100);
        document.getElementById('preview-tax').textContent = `₹${tax.toFixed(2)}`;
        
        // Handle discount
        const discountAmount = parseFloat(document.getElementById('discountAmount').value) || 0;
        if (discountAmount > 0) {
            document.getElementById('discount-row').style.display = 'flex';
            document.getElementById('preview-discount').textContent = `₹${discountAmount.toFixed(2)}`;
        } else {
            document.getElementById('discount-row').style.display = 'none';
        }
        
        // Calculate total with discount
        const total = subtotal + tax - discountAmount;
        document.getElementById('preview-total').textContent = `₹${total.toFixed(2)}`;
        
        // Handle advance payment
        const advancePayment = parseFloat(document.getElementById('advancePayment').value) || 0;
        if (advancePayment > 0) {
            document.getElementById('advance-row').style.display = 'flex';
            document.getElementById('preview-advance').textContent = `₹${advancePayment.toFixed(2)}`;
            
            // Show balance due
            const balance = total - advancePayment;
            document.getElementById('balance-row').style.display = 'flex';
            document.getElementById('preview-balance').textContent = `₹${balance.toFixed(2)}`;
        } else {
            document.getElementById('advance-row').style.display = 'none';
            document.getElementById('balance-row').style.display = 'none';
        }
        
        // Payment & terms
        document.getElementById('preview-bankName').textContent = document.getElementById('bankName').value;
        document.getElementById('preview-accountNumber').textContent = document.getElementById('accountNumber').value;
        document.getElementById('preview-ifscCode').textContent = document.getElementById('ifscCode').value;
        document.getElementById('preview-termsConditions').textContent = document.getElementById('termsConditions').value;
    }

