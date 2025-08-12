document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const results = document.getElementById('results');
    const colorDisplay = document.getElementById('colorDisplay');
    const originalHash = document.getElementById('originalHash');
    const prefixedHash = document.getElementById('prefixedHash');
    const parts = document.getElementById('parts');
    const averages = document.getElementById('averages');
    const finalHex = document.getElementById('finalHex');

    function generateColor() {
        const inputText = document.getElementById('textInput').value.trim();
        
        if (!inputText) {
            alert('Please enter some text!');
            return;
        }

        // Get DOM elements
        const colorPreview = document.getElementById('colorPreview');
        const overlayText = document.getElementById('overlayText');
        const overlayHex = document.getElementById('overlayHex');
        const originalHash = document.getElementById('originalHash');
        const prefixedHash = document.getElementById('prefixedHash');
        const hashPartsContainer = document.getElementById('hashParts');
        const averages = document.getElementById('averages');
        const finalHex = document.getElementById('finalHex');
        const results = document.getElementById('results');

        // Step 1: Generate SHA256 hash
        const hash = CryptoJS.SHA256(inputText).toString();
        originalHash.textContent = hash;

        // Step 2: Append one zero at front and one at back (258 characters total)
        const prefixed = '0' + hash + '0';
        prefixedHash.textContent = prefixed;

        // Step 3: Divide into 6 equal parts (43 characters each)
        const partLength = Math.floor(prefixed.length / 6);
        const hashParts = [];
        
        for (let i = 0; i < 6; i++) {
            const start = i * partLength;
            const end = (i === 5) ? prefixed.length : start + partLength;
            hashParts.push(prefixed.substring(start, end));
        }

        // Display parts
        hashPartsContainer.innerHTML = '';
        hashParts.forEach((part, index) => {
            const partDiv = document.createElement('div');
            partDiv.className = 'part';
            partDiv.innerHTML = `
                <div class="part-label">Part ${index + 1}</div>
                <div class="part-content">${part}</div>
            `;
            hashPartsContainer.appendChild(partDiv);
        });

        // Step 4: Calculate averages for each part
        const partData = hashParts.map(part => {
            let sum = 0;
            for (let char of part) {
                const hexValue = parseInt(char, 16);
                // If not a valid hex character, treat as 0
                sum += isNaN(hexValue) ? 0 : hexValue;
            }
            const exactAverage = sum / part.length;
            const roundedAverage = Math.round(exactAverage);
            
            return {
                sum: sum,
                exactAverage: exactAverage,
                roundedAverage: roundedAverage
            };
        });

        // Display averages
        averages.innerHTML = '';
        partData.forEach((data, index) => {
            const avgDiv = document.createElement('div');
            avgDiv.className = 'average-value';
            avgDiv.innerHTML = `
                <div class="avg-label">Part ${index + 1}</div>
                <div class="avg-details">
                    <div class="avg-sum">Sum: ${data.sum}</div>
                    <div class="avg-exact">Exact: ${data.exactAverage.toFixed(3)}</div>
                    <div class="avg-rounded">Rounded: ${data.roundedAverage}</div>
                </div>
            `;
            averages.appendChild(avgDiv);
        });

        // Step 5: Convert to hex color
        // Convert each averaged value (0-15) directly to hex digit
        const avgValues = partData.map(data => data.roundedAverage);
        const hexColor = '#' + avgValues.map(value => {
            // Ensure value is in range 0-15, then convert to hex
            const clampedValue = Math.min(15, Math.max(0, value));
            return clampedValue.toString(16);
        }).join('');

        // Update the main color box in the top panel
        colorPreview.style.backgroundColor = hexColor;
        
        // Update overlay content
        overlayText.textContent = inputText.length > 20 ? inputText.substring(0, 20) + '...' : inputText;
        overlayHex.textContent = hexColor.toUpperCase();

        // Display final result
        finalHex.innerHTML = `
            <div class="final-hex">${hexColor.toUpperCase()}</div>
            <div class="color-preview" style="background-color: ${hexColor};"></div>
        `;

        // Show results
        results.style.display = 'block';
    }

    // Copy hex code to clipboard
    function copyHexToClipboard(hexCode) {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(hexCode).then(function() {
                showCopyFeedback();
            }).catch(function(err) {
                console.error('Clipboard API failed: ', err);
                fallbackCopy(hexCode);
            });
        } else {
            // Fallback for older browsers or non-HTTPS
            fallbackCopy(hexCode);
        }
    }

    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyFeedback();
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            alert('Copy failed. The hex code is: ' + text);
        }
        
        document.body.removeChild(textArea);
    }

    function showCopyFeedback() {
        const overlay = document.querySelector('.color-overlay');
        const overlayHex = document.getElementById('overlayHex');
        
        if (overlay && overlayHex) {
            const originalText = overlayHex.textContent;
            const originalBackground = overlay.style.background;
            
            // Show feedback
            overlay.style.opacity = '1';
            overlay.style.background = 'rgba(0, 150, 0, 0.9)';
            overlayHex.textContent = 'COPIED!';
            
            setTimeout(() => {
                overlay.style.background = originalBackground || 'rgba(0, 0, 0, 0.85)';
                overlayHex.textContent = originalText;
                overlay.style.opacity = '';
            }, 1000);
        }
    }

    // Make handleSubmit globally accessible
    window.handleSubmit = function() {
        generateColor();
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const generateBtn = document.querySelector('button');
        const textInput = document.getElementById('textInput');
        const colorPreview = document.getElementById('colorPreview');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', handleSubmit);
        }
        
        if (textInput) {
            textInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });
            
            // Auto-focus input
            textInput.focus();
            
            // Demo with placeholder text
            textInput.addEventListener('input', function() {
                const results = document.getElementById('results');
                if (results.style.display === 'block' && textInput.value.trim()) {
                    // Auto-generate on input change if results are visible
                    clearTimeout(textInput.debounceTimer);
                    textInput.debounceTimer = setTimeout(handleSubmit, 500);
                }
            });
        }
        
        // Add click event to color box for copying (with multiple approaches for reliability)
        if (colorPreview) {
            // Method 1: Standard event listener
            colorPreview.addEventListener('click', function(e) {
                e.preventDefault();
                const overlayHex = document.getElementById('overlayHex');
                if (overlayHex && overlayHex.textContent && overlayHex.textContent !== '#000000') {
                    console.log('Copying hex code:', overlayHex.textContent);
                    copyHexToClipboard(overlayHex.textContent);
                }
            });
            
            // Method 2: Also add to overlay itself
            const colorOverlay = colorPreview.querySelector('.color-overlay');
            if (colorOverlay) {
                colorOverlay.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const overlayHex = document.getElementById('overlayHex');
                    if (overlayHex && overlayHex.textContent && overlayHex.textContent !== '#000000') {
                        console.log('Copying hex code from overlay:', overlayHex.textContent);
                        copyHexToClipboard(overlayHex.textContent);
                    }
                });
            }
        }
    });

})();
