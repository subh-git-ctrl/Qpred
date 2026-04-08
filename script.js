document.addEventListener('DOMContentLoaded', () => {
    const predictBtn = document.getElementById('predict-btn');
    const smilesInput = document.getElementById('smiles-input');
    const exampleBtns = document.querySelectorAll('.example-btn');
    const resultCard = document.getElementById('result-card');
    const loadingDiv = document.getElementById('loading');
    const errorMsg = document.getElementById('error-msg');

    const molImage = document.getElementById('mol-image');
    const predictionValue = document.getElementById('prediction-value');

    // Expected external API endpoint where FastAPI runs
    const API_URL = 'https://murrey-whorishly-elvera.ngrok-free.dev/predict';

    // Populate input from examples
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            smilesInput.value = btn.innerText;
            // Optionally focus input or trigger automatically
            smilesInput.focus();
        });
    });

    // Enter key listener
    smilesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePredict();
        }
    });

    // Click listener
    predictBtn.addEventListener('click', handlePredict);

    // Main API Logic
    async function handlePredict() {
        const smiles = smilesInput.value.trim();
        if (!smiles) {
            showError("Please enter a SMILES string to analyze.");
            return;
        }

        // Reset App State seamlessly handling pending states
        predictBtn.disabled = true;
        predictBtn.style.opacity = '0.5';
        resultCard.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loadingDiv.classList.remove('hidden');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ smiles })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to predict property.');
            }

            // Update DOM with results
            if(data.image) {
                molImage.src = `data:image/png;base64,${data.image}`;
                molImage.style.display = 'block';
            } else {
                molImage.style.display = 'none';
            }
            
            // Re-trigger visualizer animation
            molImage.style.animation = 'none';
            molImage.offsetHeight; /* trigger reflow */
            molImage.style.animation = null;
            
            // Switch UI Sections
            loadingDiv.classList.add('hidden');
            resultCard.classList.remove('hidden');
            predictBtn.disabled = false;
            predictBtn.style.opacity = '1';
            
            // Animate number dynamically up to the prediction value
            animateValue(predictionValue, 0, data.prediction, 1200);

        } catch (err) {
            loadingDiv.classList.add('hidden');
            predictBtn.disabled = false;
            predictBtn.style.opacity = '1';
            showError(err.message || 'Cannot reach the Prediction Server. Is the backend running?');
        }
    }

    // Number easing animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = start + easeProgress * (end - start);
            
            obj.innerHTML = currentVal.toFixed(2);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toFixed(2);
            }
        };
        window.requestAnimationFrame(step);
    }

    function showError(msg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove('hidden');
    }
});
