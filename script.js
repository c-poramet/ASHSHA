(function() {
    // Include the crypto-js library inline for SHA256
    // This is a simplified version - in production, you'd include the full crypto-js library

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

        // Step 4: Process each part with a better distribution algorithm
        const partData = hashParts.map((part, partIndex) => {
            // Calculate sum and average as before (for display purposes)
            let sum = 0;
            for (let char of part) {
                const hexValue = parseInt(char, 16);
                // If not a valid hex character, treat as 0
                sum += isNaN(hexValue) ? 0 : hexValue;
            }
            const exactAverage = sum / part.length;
            const roundedAverage = Math.round(exactAverage);
            
            // Enhanced algorithm to create more varied colors
            // Process characters in chunks for better distribution
            let value = 0;
            const chunkSize = 7; // Process 7 chars at a time
            
            for (let i = 0; i < part.length; i += chunkSize) {
                let chunkValue = 0;
                
                // Process each character in the chunk
                for (let j = 0; j < chunkSize && (i + j) < part.length; j++) {
                    const hexValue = parseInt(part[i + j], 16);
                    if (!isNaN(hexValue)) {
                        // Apply different operations based on position
                        const position = (i + j) % 5;
                        
                        switch(position) {
                            case 0:
                                // XOR with left shift by part index
                                chunkValue ^= (hexValue << (partIndex % 8));
                                break;
                            case 1:
                                // Multiply (with mod to prevent overflow)
                                chunkValue = (chunkValue * (hexValue + 1)) % 256;
                                break;
                            case 2:
                                // Bitwise rotation
                                chunkValue = ((chunkValue << 4) | (chunkValue >>> 4)) ^ hexValue;
                                break;
                            case 3:
                                // Addition with bit mask
                                chunkValue = (chunkValue + hexValue) & 0xFF;
                                break;
                            case 4:
                                // XOR with right shift
                                chunkValue ^= (hexValue >>> (partIndex % 4));
                                break;
                        }
                    }
                }
                
                // Combine chunk value with running total
                value = ((value << 3) | (value >>> 5)) ^ chunkValue;
            }
            
            // Ensure final value is in 0-255 range for full 8-bit color channels
            const finalValue = value & 0xFF;
            
            return {
                sum: sum,
                exactAverage: exactAverage,
                roundedAverage: roundedAverage,
                xorResult: value,
                finalValue: finalValue
            };
        });

        // Display averages and calculations
        averages.innerHTML = '';
        partData.forEach((data, index) => {
            const avgDiv = document.createElement('div');
            avgDiv.className = 'average-value';
            avgDiv.innerHTML = `
                <div class="avg-label">Part ${index + 1}</div>
                <div class="avg-details">
                    <div class="avg-sum">Sum: ${data.sum}</div>
                    <div class="avg-exact">Exact: ${data.exactAverage.toFixed(3)}</div>
                    <div class="avg-rounded">Average: ${data.roundedAverage}</div>
                    <div class="avg-operations">Operations: ${data.xorResult}</div>
                    <div class="avg-final">Final Value: ${data.finalValue} (${data.finalValue.toString(16)})</div>
                </div>
            `;
            averages.appendChild(avgDiv);
        });

        // Step 5: Convert to hex color
        // Use the finalValue (0-255) for each color channel
        const hexColor = '#' + partData.slice(0, 3).map(data => {
            return data.finalValue.toString(16).padStart(2, '0');
        }).join('');

        // Update the main color box in the top panel
        colorPreview.style.backgroundColor = hexColor;
        
        // Update overlay content
        overlayText.textContent = inputText.length > 20 ? inputText.substring(0, 20) + '...' : inputText;
        overlayHex.textContent = hexColor.toUpperCase();

        // Save to history
        saveToHistory(inputText, hexColor.toUpperCase());
        
        // Save current state
        saveCurrentState(inputText, {
            originalHash: hash,
            prefixedHash: prefixed,
            hashParts: hashParts,
            partData: partData,
            hexColor: hexColor.toUpperCase()
        });

        // Display final result
        finalHex.innerHTML = `
            <div class="final-hex">${hexColor.toUpperCase()}</div>
            <div class="color-preview" style="background-color: ${hexColor};"></div>
        `;

        // Show results
        results.style.display = 'block';
    }

    // State management functions
    function saveCurrentState(inputText, data) {
        const state = {
            inputText: inputText,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        try {
            localStorage.setItem('ashsha-current-state', JSON.stringify(state));
        } catch (e) {
            console.error('Error saving current state:', e);
        }
    }
    
    function loadCurrentState() {
        try {
            const stored = localStorage.getItem('ashsha-current-state');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('Error loading current state:', e);
            return null;
        }
    }
    
    function restoreState(state) {
        if (!state || !state.data) return;
        
        const textInput = document.getElementById('textInput');
        const colorPreview = document.getElementById('colorPreview');
        const overlayText = document.getElementById('overlayText');
        const overlayHex = document.getElementById('overlayHex');
        const originalHash = document.getElementById('originalHash');
        const prefixedHash = document.getElementById('prefixedHash');
        const hashPartsContainer = document.getElementById('hashParts');
        const averages = document.getElementById('averages');
        const finalHex = document.getElementById('finalHex');
        const results = document.getElementById('results');
        
        // Restore input
        textInput.value = state.inputText;
        
        // Restore color preview
        colorPreview.style.backgroundColor = state.data.hexColor;
        overlayText.textContent = state.inputText.length > 20 ? state.inputText.substring(0, 20) + '...' : state.inputText;
        overlayHex.textContent = state.data.hexColor;
        
        // Restore hash displays
        originalHash.textContent = state.data.originalHash;
        prefixedHash.textContent = state.data.prefixedHash;
        
        // Restore parts
        hashPartsContainer.innerHTML = '';
        state.data.hashParts.forEach((part, index) => {
            const partDiv = document.createElement('div');
            partDiv.className = 'hash-part';
            partDiv.innerHTML = `
                <div class="part-label">Part ${index + 1}</div>
                <div class="part-content">${part}</div>
            `;
            hashPartsContainer.appendChild(partDiv);
        });
        
        // Restore averages
        averages.innerHTML = '';
        state.data.partData.forEach((data, index) => {
            const avgDiv = document.createElement('div');
            avgDiv.className = 'average-value';
            avgDiv.innerHTML = `
                <div class="avg-label">Part ${index + 1}</div>
                <div class="avg-details">
                    <div class="avg-sum">Sum: ${data.sum}</div>
                    <div class="avg-exact">Exact: ${data.exactAverage.toFixed(3)}</div>
                    <div class="avg-rounded">Average: ${data.roundedAverage}</div>
                    <div class="avg-operations">Operations: ${data.xorResult || 0}</div>
                    <div class="avg-final">Final Value: ${data.finalValue || data.roundedAverage} (${(data.finalValue || data.roundedAverage).toString(16)})</div>
                </div>
            `;
            averages.appendChild(avgDiv);
        });
        
        // Restore final result
        finalHex.innerHTML = `
            <div class="final-hex">${state.data.hexColor}</div>
            <div class="color-preview" style="background-color: ${state.data.hexColor};"></div>
        `;
        
        // Show results
        results.style.display = 'block';
    }

    // History management functions
    function saveToHistory(text, hexColor) {
        let history = getHistory();
        
        // Create new entry
        const entry = {
            text: text,
            hexColor: hexColor,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        // Remove duplicate if exists (same text)
        history = history.filter(item => item.text !== text);
        
        // Add to beginning of array
        history.unshift(entry);
        // Keep only last 25
        history = history.slice(0, 25);
        
        // Save to localStorage
        localStorage.setItem('ashhsha-history', JSON.stringify(history));
        
        // Update display
        updateHistoryDisplay();
    }
    
    function getHistory() {
        try {
            const stored = localStorage.getItem('ashhsha-history');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }
    
    function updateHistoryDisplay() {
        const historyContainer = document.getElementById('history');
        const history = getHistory();
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<div class="history-empty">No history yet. Generate some colors!</div>';
            return;
        }
        
        historyContainer.innerHTML = history.map(entry => {
            // Calculate text color based on background brightness
            const hex = entry.hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const textColor = brightness > 128 ? '#000000' : '#ffffff';
            
            return `
                <div class="history-item" style="background-color: ${entry.hexColor}; color: ${textColor};" 
                     onclick="loadFromHistory('${entry.text.replace(/'/g, "\\'")}', '${entry.hexColor}')">
                    <div class="history-color" style="background-color: ${entry.hexColor};"></div>
                    <div class="history-content">
                        <div class="history-text">${entry.text}</div>
                        <div class="history-hex">${entry.hexColor}</div>
                    </div>
                    <div class="history-time">${entry.timestamp}</div>
                </div>
            `;
        }).join('');
    }
    
    function loadFromHistory(text, hexColor) {
        const textInput = document.getElementById('textInput');
        textInput.value = text;
        generateColor();
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
        console.log('handleSubmit called');
        generateColor();
    }

    // Also make generateColor globally accessible for debugging
    window.generateColor = generateColor;

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const generateBtn = document.querySelector('button');
        const textInput = document.getElementById('textInput');
        const colorPreview = document.getElementById('colorPreview');
        const form = document.querySelector('form');
        
        if (generateBtn) {
            generateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleSubmit();
            });
        }
        
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSubmit();
            });
        }
        
        if (textInput) {
            textInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleSubmit();
                }
            });
            
            textInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleSubmit();
                }
            });
            
            // Auto-focus input
            textInput.focus();
            
            // Load history on page load
            updateHistoryDisplay();
            
            // Restore previous state if exists
            const savedState = loadCurrentState();
            if (savedState) {
                restoreState(savedState);
            }
            
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
