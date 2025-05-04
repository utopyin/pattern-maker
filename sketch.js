let sourceImage;
let patternImage;
let gridHeight = 10; // Height of each cell
let gridWidth = 24; // Width of each cell (2.4 * height)
let downloadButton;
let offscreenCanvas; // For full resolution rendering

// Default dimensions
let defaultWidth = 4480;
let defaultHeight = 3360;

// Preview dimensions
let previewWidth;
let previewHeight;
let fullWidth;
let fullHeight;

// Load saved images from localStorage
function loadSavedImages() {
	const savedSourceImage = localStorage.getItem('sourceImage');
	const savedPatternImage = localStorage.getItem('patternImage');
	
	let imagesLoaded = 0;
	const totalImages = (savedSourceImage ? 1 : 0) + (savedPatternImage ? 1 : 0);
	
	function checkAllImagesLoaded() {
		imagesLoaded++;
		if (imagesLoaded === totalImages) {
			// Both images are loaded, resize them
			if (sourceImage) sourceImage.resize(fullWidth, fullHeight);
			if (patternImage) patternImage.resize(gridWidth * 4, gridHeight * 4);
			redraw();
		}
	}
	
	if (savedSourceImage) {
		loadImage(savedSourceImage, img => {
			sourceImage = img;
			document.getElementById('sourcePreview').src = savedSourceImage;
			checkAllImagesLoaded();
		});
	}
	
	if (savedPatternImage) {
		loadImage(savedPatternImage, img => {
			patternImage = img;
			document.getElementById('patternPreview').src = savedPatternImage;
			checkAllImagesLoaded();
		});
	}
}

// File input handlers
function setupFileInputs() {
	const sourceInput = document.getElementById('sourceImage');
	const patternInput = document.getElementById('patternImage');
	
	sourceInput.addEventListener('change', function(e) {
		handleImageUpload(e, 'sourcePreview', (img, dataUrl) => {
			sourceImage = img;
			localStorage.setItem('sourceImage', dataUrl);
			
			// Resize source image to match full dimensions
			sourceImage.resize(fullWidth, fullHeight);
			redraw();
		});
	});
	
	patternInput.addEventListener('change', function(e) {
		handleImageUpload(e, 'patternPreview', (img, dataUrl) => {
			patternImage = img;
			localStorage.setItem('patternImage', dataUrl);
			
			// Resize pattern image
			patternImage.resize(gridWidth * 4, gridHeight * 4);
			redraw();
		});
	});

	// Add input event listeners for dimensions
	document.getElementById('outputWidth').addEventListener('input', (e) => {
		const newWidth = parseInt(e.target.value, 10) || defaultWidth;
		localStorage.setItem('outputWidth', newWidth);
		updateDimensions(newWidth, fullHeight);
	});

	document.getElementById('outputHeight').addEventListener('input', (e) => {
		const newHeight = parseInt(e.target.value, 10) || defaultHeight;
		localStorage.setItem('outputHeight', newHeight);
		updateDimensions(fullWidth, newHeight);
	});
}

function updateDimensions(width, height) {
	fullWidth = width;
	fullHeight = height;

	// Recalculate preview dimensions
	const containerWidth = 800;
	const containerHeight = 600;
	const aspectRatio = fullWidth / fullHeight;
	
	if (aspectRatio > containerWidth / containerHeight) {
		previewWidth = containerWidth;
		previewHeight = containerWidth / aspectRatio;
	} else {
		previewHeight = containerHeight;
		previewWidth = containerHeight * aspectRatio;
	}

	// Resize the preview canvas
	resizeCanvas(previewWidth, previewHeight);
	
	// Resize the offscreen canvas
	offscreenCanvas = createGraphics(fullWidth, fullHeight);
	
	// Resize source image if it exists
	if (sourceImage) {
		sourceImage.resize(fullWidth, fullHeight);
	}
	
	redraw();
}

function handleImageUpload(event, previewId, callback) {
	const file = event.target.files[0];
	if (!file) return;
	
	const reader = new FileReader();
	reader.onload = function(e) {
		const dataUrl = e.target.result;
		// Update preview
		const preview = document.getElementById(previewId);
		preview.src = dataUrl;
		
		// Load image for p5.js
		loadImage(dataUrl, img => {
			callback(img, dataUrl);
		});
	};
	reader.readAsDataURL(file);
}

function setup() {
	setupFileInputs();
	
	// Get dimensions from localStorage or use defaults
	const savedWidth = localStorage.getItem('outputWidth');
	const savedHeight = localStorage.getItem('outputHeight');
	
	fullWidth = parseInt(savedWidth, 10) || defaultWidth;
	fullHeight = parseInt(savedHeight, 10) || defaultHeight;

	document.getElementById('outputWidth').value = fullWidth;
	document.getElementById('outputHeight').value = fullHeight;

	// Calculate preview dimensions maintaining aspect ratio
	const containerWidth = 800;
	const containerHeight = 600;
	const aspectRatio = fullWidth / fullHeight;
	
	if (aspectRatio > containerWidth / containerHeight) {
		previewWidth = containerWidth;
		previewHeight = containerWidth / aspectRatio;
	} else {
		previewHeight = containerHeight;
		previewWidth = containerHeight * aspectRatio;
	}

	// Create the preview canvas
	const previewCanvas = createCanvas(previewWidth, previewHeight);
	previewCanvas.parent('canvas-container');

	// Create download button
	downloadButton = createButton("Download Full Resolution PNG");
	downloadButton.parent("download-container");
	downloadButton.mousePressed(downloadFullResolution);

	// Create offscreen canvas for full resolution
	offscreenCanvas = createGraphics(fullWidth, fullHeight);

	// Load any previously saved images
	loadSavedImages();

	// Initial draw will happen when images are loaded
	noLoop();
}

function draw() {
	if (!sourceImage || !patternImage || sourceImage.width <= 1 || patternImage.width <= 1) {
		console.log("Skipping draw due to image load issues.");
		return;
	}

	// Draw at full resolution on offscreen canvas
	drawPattern(offscreenCanvas, fullWidth, fullHeight);
	
	// Draw preview
	drawPattern(this, previewWidth, previewHeight);
	
	console.log("Draw complete.");
}

function drawPattern(targetCanvas, w, h) {
	targetCanvas.background(255);

	// Scale grid dimensions based on the canvas size ratio
	const scaleFactor = w / fullWidth;
	const scaledGridWidth = gridWidth * scaleFactor;
	const scaledGridHeight = gridHeight * scaleFactor;

	// Calculate number of cells in the grid
	let cols = floor(w / scaledGridWidth);
	let rows = floor(h / scaledGridHeight);

	sourceImage.loadPixels();

	if (!sourceImage.pixels || sourceImage.pixels.length === 0) {
		targetCanvas.background(255,0,0);
		targetCanvas.fill(255);
		targetCanvas.textSize(32);
		targetCanvas.textAlign(CENTER, CENTER);
		targetCanvas.text("Error loading source image pixels.", w / 2, h / 2);
		return;
	}

	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			// Calculate source coordinates proportionally
			let sourceX = floor((i * scaledGridWidth + scaledGridWidth / 2) * (sourceImage.width / w));
			let sourceY = floor((j * scaledGridHeight + scaledGridHeight / 2) * (sourceImage.height / h));

			sourceX = constrain(sourceX, 0, sourceImage.width - 1);
			sourceY = constrain(sourceY, 0, sourceImage.height - 1);

			let pixelIndex = (sourceY * sourceImage.width + sourceX) * 4;

			if (pixelIndex < 0 || pixelIndex >= sourceImage.pixels.length - 3) {
				continue;
			}

			let r = sourceImage.pixels[pixelIndex];
			let g = sourceImage.pixels[pixelIndex + 1];
			let b = sourceImage.pixels[pixelIndex + 2];
			let brightness = (r + g + b) / 3;

			let scaleValue = map(brightness, 0, 255, 0.1, 1.0);
			scaleValue = constrain(scaleValue, 0.1, 1.5);

			targetCanvas.push();
			targetCanvas.translate(i * scaledGridWidth, j * scaledGridHeight);
			targetCanvas.scale(scaleValue);
			targetCanvas.image(patternImage, 0, 0, scaledGridWidth, scaledGridHeight);
			targetCanvas.pop();
		}
	}
}

function downloadFullResolution() {
	// Create a temporary link element
	let link = document.createElement("a");
	link.download = "pattern.png";

	// Get the full resolution canvas data
	let dataURL = offscreenCanvas.canvas.toDataURL("image/png");

	// Set the link's href to the data URL
	link.href = dataURL;

	// Trigger the download
	link.click();
}

// Optional: Add mouse interaction to redraw
function mousePressed() {
	redraw();
}
