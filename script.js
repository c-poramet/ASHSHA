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
        const avgValues = hashParts.map(part => {
            let sum = 0;
            for (let char of part) {
                const hexValue = parseInt(char, 16);
                // If not a valid hex character, treat as 0
                sum += isNaN(hexValue) ? 0 : hexValue;
            }
            return Math.round(sum / part.length);
        });

        // Display averages
        averages.innerHTML = '';
        avgValues.forEach((avg, index) => {
            const avgDiv = document.createElement('div');
            avgDiv.className = 'average';
            avgDiv.innerHTML = `
                <div class="average-label">Part ${index + 1}</div>
                <div class="average-value">${avg}</div>
            `;
            averages.appendChild(avgDiv);
        });

        // Step 5: Convert to hex color
        // Take first 3 values for RGB, ensure they're in valid range (0-255)
        const r = Math.min(255, Math.max(0, avgValues[0] * 17)); // Scale up from 0-15 to 0-255
        const g = Math.min(255, Math.max(0, avgValues[1] * 17));
        const b = Math.min(255, Math.max(0, avgValues[2] * 17));

        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        // Update the main color box in the top panel
        colorPreview.style.backgroundColor = hexColor;

        // Display final result
        finalHex.innerHTML = `
            <div class="final-hex">${hexColor.toUpperCase()}</div>
            <div class="color-preview" style="background-color: ${hexColor};"></div>
        `;

        // Show results
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Make handleSubmit globally accessible
    window.handleSubmit = function() {
        generateColor();
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        const generateBtn = document.querySelector('button');
        const textInput = document.getElementById('textInput');
        
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
    });
});
