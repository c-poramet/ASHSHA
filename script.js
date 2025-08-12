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

        // Display parts with character visualization
        hashPartsContainer.innerHTML = '';
        hashParts.forEach((part, index) => {
            const partDiv = document.createElement('div');
            partDiv.className = 'part';
            
            // Create part header
            const partLabel = document.createElement('div');
            partLabel.className = 'part-label';
            partLabel.textContent = `Part ${index + 1}`;
            partDiv.appendChild(partLabel);
            
            // Create text content 
            const partContent = document.createElement('div');
            partContent.className = 'part-content';
            partContent.textContent = part;
            partDiv.appendChild(partContent);
            
            // Create character visualization
            const charGroup = document.createElement('div');
            charGroup.className = 'char-group';
            
            // Add each character with its hex value
            part.split('').forEach(char => {
                const hexValue = parseInt(char, 16);
                const charDiv = document.createElement('div');
                charDiv.className = 'char';
                charDiv.textContent = char;
                charDiv.title = `Hex value: ${isNaN(hexValue) ? 0 : hexValue}`;
                charGroup.appendChild(charDiv);
            });
            
            partDiv.appendChild(charGroup);
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
            
            // Create visualization data for operations
            let operationsLog = [];
            
            for (let i = 0; i < part.length; i += chunkSize) {
                let chunkValue = 0;
                let chunkLog = [];
                
                // Process each character in the chunk
                for (let j = 0; j < chunkSize && (i + j) < part.length; j++) {
                    const hexValue = parseInt(part[i + j], 16);
                    if (!isNaN(hexValue)) {
                        // Apply different operations based on position
                        const position = (i + j) % 5;
                        let opDescription = "";
                        let oldValue = chunkValue;
                        
                        switch(position) {
                            case 0:
                                // XOR with left shift by part index
                                chunkValue ^= (hexValue << (partIndex % 8));
                                opDescription = `${oldValue} ^ (${hexValue} << ${partIndex % 8}) = ${chunkValue}`;
                                break;
                            case 1:
                                // Multiply (with mod to prevent overflow)
                                chunkValue = (chunkValue * (hexValue + 1)) % 256;
                                opDescription = `(${oldValue} * (${hexValue} + 1)) % 256 = ${chunkValue}`;
                                break;
                            case 2:
                                // Bitwise rotation
                                chunkValue = ((chunkValue << 4) | (chunkValue >>> 4)) ^ hexValue;
                                opDescription = `((${oldValue} << 4) | (${oldValue} >>> 4)) ^ ${hexValue} = ${chunkValue}`;
                                break;
                            case 3:
                                // Addition with bit mask
                                chunkValue = (chunkValue + hexValue) & 0xFF;
                                opDescription = `(${oldValue} + ${hexValue}) & 0xFF = ${chunkValue}`;
                                break;
                            case 4:
                                // XOR with right shift
                                chunkValue ^= (hexValue >>> (partIndex % 4));
                                opDescription = `${oldValue} ^ (${hexValue} >>> ${partIndex % 4}) = ${chunkValue}`;
                                break;
                        }
                        
                        chunkLog.push({
                            position: i + j,
                            char: part[i + j],
                            hexValue: hexValue,
                            operation: opDescription
                        });
                    }
                }
                
                // Combine chunk value with running total
                let oldValue = value;
                value = ((value << 3) | (value >>> 5)) ^ chunkValue;
                
                operationsLog.push({
                    chunkStart: i,
                    chunkEnd: Math.min(i + chunkSize - 1, part.length - 1),
                    chunkValue: chunkValue,
                    operations: chunkLog,
                    combination: `((${oldValue} << 3) | (${oldValue} >>> 5)) ^ ${chunkValue} = ${value}`
                });
            }
            
            // Ensure final value is in 0-255 range for full 8-bit color channels
            const finalValue = value & 0xFF;
            
            return {
                sum: sum,
                exactAverage: exactAverage,
                roundedAverage: roundedAverage,
                xorResult: value,
                finalValue: finalValue,
                operationsLog: operationsLog
            };
        });

        // Display averages and calculations
        averages.innerHTML = '';
        partData.forEach((data, index) => {
            const avgDiv = document.createElement('div');
            avgDiv.className = 'average-value';
            
            // Create header
            const avgLabel = document.createElement('div');
            avgLabel.className = 'avg-label';
            avgLabel.textContent = `Part ${index + 1}`;
            avgDiv.appendChild(avgLabel);
            
            // Create details container
            const avgDetails = document.createElement('div');
            avgDetails.className = 'avg-details';
            
            // Add basic information
            const sumDiv = document.createElement('div');
            sumDiv.className = 'avg-sum';
            sumDiv.textContent = `Sum: ${data.sum}`;
            avgDetails.appendChild(sumDiv);
            
            const exactDiv = document.createElement('div');
            exactDiv.className = 'avg-exact';
            exactDiv.textContent = `Exact Average: ${data.exactAverage.toFixed(3)}`;
            avgDetails.appendChild(exactDiv);
            
            const roundedDiv = document.createElement('div');
            roundedDiv.className = 'avg-rounded';
            roundedDiv.textContent = `Rounded Average: ${data.roundedAverage}`;
            avgDetails.appendChild(roundedDiv);
            
            // Add detailed operations log
            if (data.operationsLog && data.operationsLog.length > 0) {
                const opsToggle = document.createElement('button');
                opsToggle.textContent = 'Show Operations Details';
                opsToggle.className = 'ops-toggle';
                opsToggle.style.padding = '5px 10px';
                opsToggle.style.marginTop = '10px';
                opsToggle.style.marginBottom = '10px';
                opsToggle.style.fontSize = '0.8rem';
                avgDetails.appendChild(opsToggle);
                
                const opsDetails = document.createElement('div');
                opsDetails.className = 'ops-details';
                opsDetails.style.display = 'none';
                
                data.operationsLog.forEach((chunk, chunkIndex) => {
                    const chunkDiv = document.createElement('div');
                    chunkDiv.className = 'chunk-ops';
                    chunkDiv.style.marginBottom = '10px';
                    chunkDiv.style.padding = '8px';
                    chunkDiv.style.background = '#1e1e1e';
                    chunkDiv.style.borderRadius = '4px';
                    
                    // Chunk header
                    const chunkHeader = document.createElement('div');
                    chunkHeader.style.fontWeight = 'bold';
                    chunkHeader.style.marginBottom = '5px';
                    chunkHeader.textContent = `Chunk ${chunkIndex + 1} (chars ${chunk.chunkStart}-${chunk.chunkEnd})`;
                    chunkDiv.appendChild(chunkHeader);
                    
                    // Individual operations
                    chunk.operations.forEach(op => {
                        const opDiv = document.createElement('div');
                        opDiv.style.fontFamily = 'monospace';
                        opDiv.style.fontSize = '0.85rem';
                        opDiv.style.padding = '3px';
                        opDiv.textContent = `[${op.position}] ${op.char} (${op.hexValue}): ${op.operation}`;
                        chunkDiv.appendChild(opDiv);
                    });
                    
                    // Chunk combination
                    const combinationDiv = document.createElement('div');
                    combinationDiv.style.marginTop = '5px';
                    combinationDiv.style.fontWeight = 'bold';
                    combinationDiv.style.color = '#4CAF50';
                    combinationDiv.textContent = `Result: ${chunk.combination}`;
                    chunkDiv.appendChild(combinationDiv);
                    
                    opsDetails.appendChild(chunkDiv);
                });
                
                avgDetails.appendChild(opsDetails);
                
                // Toggle operations details
                opsToggle.addEventListener('click', function() {
                    if (opsDetails.style.display === 'none') {
                        opsDetails.style.display = 'block';
                        opsToggle.textContent = 'Hide Operations Details';
                    } else {
                        opsDetails.style.display = 'none';
                        opsToggle.textContent = 'Show Operations Details';
                    }
                });
            }
            
            // Final result
            const xorResultDiv = document.createElement('div');
            xorResultDiv.className = 'avg-operations';
            xorResultDiv.textContent = `Final Operation Result: ${data.xorResult}`;
            avgDetails.appendChild(xorResultDiv);
            
            const finalValueDiv = document.createElement('div');
            finalValueDiv.className = 'avg-final';
            finalValueDiv.textContent = `Final Value: ${data.finalValue} (0x${data.finalValue.toString(16)})`;
            avgDetails.appendChild(finalValueDiv);
            
            avgDiv.appendChild(avgDetails);
            averages.appendChild(avgDiv);
        });

        // Step 5: Convert to hex color
        // Use all six parts to create a more complex color
        const hexColor = '#' + 
            // Use parts 0 and 3 for Red component
            Math.floor((partData[0].finalValue + partData[3].finalValue) / 2).toString(16).padStart(2, '0') +
            // Use parts 1 and 4 for Green component
            Math.floor((partData[1].finalValue + partData[4].finalValue) / 2).toString(16).padStart(2, '0') +
            // Use parts 2 and 5 for Blue component
            Math.floor((partData[2].finalValue + partData[5].finalValue) / 2).toString(16).padStart(2, '0');
            
        // Create an alternate color using the parts in reverse order
        const hexColor2 = '#' +
            Math.floor((partData[3].finalValue + partData[0].finalValue) / 2).toString(16).padStart(2, '0') +
            Math.floor((partData[4].finalValue + partData[1].finalValue) / 2).toString(16).padStart(2, '0') +
            Math.floor((partData[5].finalValue + partData[2].finalValue) / 2).toString(16).padStart(2, '0');

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

        // Final hex display
        finalHex.innerHTML = '';
        
        // Create a visual component showing how each part contributes to the color
        const colorMixingDiv = document.createElement('div');
        colorMixingDiv.className = 'color-mixing';
        colorMixingDiv.style.marginBottom = '20px';
        
        // Create a table to visualize color component creation
        const mixingTable = document.createElement('table');
        mixingTable.className = 'mixing-table';
        mixingTable.style.width = '100%';
        mixingTable.style.borderCollapse = 'collapse';
        mixingTable.style.marginBottom = '20px';
        
        // Create header row
        const headerRow = document.createElement('tr');
        
        ['Component', 'Parts Used', 'Values', 'Average', 'Hex'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '8px';
            th.style.textAlign = 'left';
            th.style.borderBottom = '1px solid #333';
            headerRow.appendChild(th);
        });
        
        mixingTable.appendChild(headerRow);
        
        // Create rows for R, G, B components
        const componentPairs = [
            {name: 'Red', parts: [0, 3], value1: partData[0].finalValue, value2: partData[3].finalValue},
            {name: 'Green', parts: [1, 4], value1: partData[1].finalValue, value2: partData[4].finalValue},
            {name: 'Blue', parts: [2, 5], value1: partData[2].finalValue, value2: partData[5].finalValue}
        ];
        
        componentPairs.forEach(comp => {
            const row = document.createElement('tr');
            
            // Component name
            const nameCell = document.createElement('td');
            nameCell.textContent = comp.name;
            nameCell.style.padding = '8px';
            nameCell.style.fontWeight = 'bold';
            row.appendChild(nameCell);
            
            // Parts used
            const partsCell = document.createElement('td');
            partsCell.textContent = `Part ${comp.parts[0] + 1} + Part ${comp.parts[1] + 1}`;
            partsCell.style.padding = '8px';
            row.appendChild(partsCell);
            
            // Values
            const valuesCell = document.createElement('td');
            valuesCell.textContent = `${comp.value1} + ${comp.value2}`;
            valuesCell.style.padding = '8px';
            valuesCell.style.fontFamily = 'monospace';
            row.appendChild(valuesCell);
            
            // Average
            const avg = Math.floor((comp.value1 + comp.value2) / 2);
            const avgCell = document.createElement('td');
            avgCell.textContent = avg;
            avgCell.style.padding = '8px';
            avgCell.style.fontFamily = 'monospace';
            row.appendChild(avgCell);
            
            // Hex
            const hexCell = document.createElement('td');
            hexCell.textContent = avg.toString(16).padStart(2, '0');
            hexCell.style.padding = '8px';
            hexCell.style.fontFamily = 'monospace';
            hexCell.style.fontWeight = 'bold';
            row.appendChild(hexCell);
            
            mixingTable.appendChild(row);
        });
        
        colorMixingDiv.appendChild(mixingTable);
        finalHex.appendChild(colorMixingDiv);
        
        // Display the final colors
        const finalColorsDiv = document.createElement('div');
        finalColorsDiv.className = 'final-colors';
        finalColorsDiv.style.display = 'flex';
        finalColorsDiv.style.flexDirection = 'column';
        finalColorsDiv.style.gap = '20px';
        
        // Primary color
        const primaryColorDiv = document.createElement('div');
        primaryColorDiv.className = 'final-color-item';
        
        const primaryHex = document.createElement('div');
        primaryHex.className = 'final-hex';
        primaryHex.textContent = hexColor.toUpperCase();
        primaryHex.style.fontFamily = 'monospace';
        primaryHex.style.fontSize = '1.5rem';
        primaryHex.style.marginBottom = '10px';
        primaryColorDiv.appendChild(primaryHex);
        
        const primaryPreview = document.createElement('div');
        primaryPreview.className = 'color-preview';
        primaryPreview.style.height = '60px';
        primaryPreview.style.backgroundColor = hexColor;
        primaryPreview.style.borderRadius = '6px';
        primaryPreview.style.cursor = 'pointer';
        primaryPreview.title = 'Click to copy color code';
        primaryPreview.addEventListener('click', () => copyHexToClipboard(hexColor.toUpperCase()));
        primaryColorDiv.appendChild(primaryPreview);
        
        // Add primary color to final colors
        finalColorsDiv.appendChild(primaryColorDiv);
        
        // Add final colors to the results
        finalHex.appendChild(finalColorsDiv);

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
            
            // Create basic layout and content
            const html = `
                <div class="avg-label">Part ${index + 1}</div>
                <div class="avg-details">
                    <div class="avg-sum">Sum: ${data.sum}</div>
                    <div class="avg-exact">Exact Average: ${data.exactAverage.toFixed(3)}</div>
                    <div class="avg-rounded">Rounded Average: ${data.roundedAverage}</div>
                    <div class="avg-operations">Final Operation Result: ${data.xorResult || 0}</div>
                    <div class="avg-final">Final Value: ${data.finalValue || data.roundedAverage} (0x${(data.finalValue || data.roundedAverage).toString(16)})</div>
                </div>
            `;
            
            avgDiv.innerHTML = html;
            averages.appendChild(avgDiv);
        });
        
        // Restore final result
        finalHex.innerHTML = '';

        // Only create the mixing table if we have partData with finalValue properties
        if (state.data.partData && 
            state.data.partData.length >= 6 && 
            state.data.partData[0].hasOwnProperty('finalValue')) {
            
            // Create color mixing visualization
            const colorMixingDiv = document.createElement('div');
            colorMixingDiv.className = 'color-mixing';
            colorMixingDiv.style.marginBottom = '20px';
            
            // Create table
            const mixingTable = document.createElement('table');
            mixingTable.className = 'mixing-table';
            mixingTable.style.width = '100%';
            mixingTable.style.borderCollapse = 'collapse';
            mixingTable.style.marginBottom = '20px';
            
            // Header row
            const headerRow = document.createElement('tr');
            ['Component', 'Parts Used', 'Values', 'Average', 'Hex'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                th.style.padding = '8px';
                th.style.textAlign = 'left';
                th.style.borderBottom = '1px solid #333';
                headerRow.appendChild(th);
            });
            mixingTable.appendChild(headerRow);
            
            // Component rows
            const componentPairs = [
                {name: 'Red', parts: [0, 3], value1: state.data.partData[0].finalValue, value2: state.data.partData[3].finalValue},
                {name: 'Green', parts: [1, 4], value1: state.data.partData[1].finalValue, value2: state.data.partData[4].finalValue},
                {name: 'Blue', parts: [2, 5], value1: state.data.partData[2].finalValue, value2: state.data.partData[5].finalValue}
            ];
            
            componentPairs.forEach(comp => {
                const row = document.createElement('tr');
                
                // Component name
                const nameCell = document.createElement('td');
                nameCell.textContent = comp.name;
                nameCell.style.padding = '8px';
                nameCell.style.fontWeight = 'bold';
                row.appendChild(nameCell);
                
                // Parts used
                const partsCell = document.createElement('td');
                partsCell.textContent = `Part ${comp.parts[0] + 1} + Part ${comp.parts[1] + 1}`;
                partsCell.style.padding = '8px';
                row.appendChild(partsCell);
                
                // Values
                const valuesCell = document.createElement('td');
                valuesCell.textContent = `${comp.value1} + ${comp.value2}`;
                valuesCell.style.padding = '8px';
                valuesCell.style.fontFamily = 'monospace';
                row.appendChild(valuesCell);
                
                // Average
                const avg = Math.floor((comp.value1 + comp.value2) / 2);
                const avgCell = document.createElement('td');
                avgCell.textContent = avg;
                avgCell.style.padding = '8px';
                avgCell.style.fontFamily = 'monospace';
                row.appendChild(avgCell);
                
                // Hex
                const hexCell = document.createElement('td');
                hexCell.textContent = avg.toString(16).padStart(2, '0');
                hexCell.style.padding = '8px';
                hexCell.style.fontFamily = 'monospace';
                hexCell.style.fontWeight = 'bold';
                row.appendChild(hexCell);
                
                mixingTable.appendChild(row);
            });
            
            colorMixingDiv.appendChild(mixingTable);
            finalHex.appendChild(colorMixingDiv);
        }
        
        // Display final color
        const finalColorsDiv = document.createElement('div');
        finalColorsDiv.className = 'final-colors';
        
        const primaryColorDiv = document.createElement('div');
        primaryColorDiv.className = 'final-color-item';
        
        const primaryHex = document.createElement('div');
        primaryHex.className = 'final-hex';
        primaryHex.textContent = state.data.hexColor;
        primaryHex.style.fontFamily = 'monospace';
        primaryHex.style.fontSize = '1.5rem';
        primaryHex.style.marginBottom = '10px';
        primaryColorDiv.appendChild(primaryHex);
        
        const primaryPreview = document.createElement('div');
        primaryPreview.className = 'color-preview';
        primaryPreview.style.height = '60px';
        primaryPreview.style.backgroundColor = state.data.hexColor;
        primaryPreview.style.borderRadius = '6px';
        primaryPreview.style.cursor = 'pointer';
        primaryPreview.title = 'Click to copy color code';
        primaryPreview.addEventListener('click', () => copyHexToClipboard(state.data.hexColor));
        primaryColorDiv.appendChild(primaryPreview);
        
        finalColorsDiv.appendChild(primaryColorDiv);
        finalHex.appendChild(finalColorsDiv);
        
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
        history = history.slice(0, 15);
        
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
                // Remove auto-generation on input to prevent unexpected submissions
                // Users must press Enter or click the button to generate
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
