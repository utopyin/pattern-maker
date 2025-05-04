let sourceImage;
let gridImage;
let gridHeight = 10; // Height of each cell
let gridWidth = 24; // Width of each cell (2.4 * height)
let scaleFactor = 7;
let imageWidth = 640 * scaleFactor,
	imageHeight = 480 * scaleFactor;
let downloadButton;

function preload() {
	// Replace these with your own image paths
	greyscaleSourceImage = loadImage("/image.png");
	patternImage = loadImage("/Vector.png");
}

function setup() {
	createCanvas(imageWidth, imageHeight);

	// Create download button
	downloadButton = createButton("Download PNG");
	downloadButton.position(10, 10);
	downloadButton.mousePressed(downloadCanvas);

	// Enable high-quality image smoothing
	// imageSmoothingEnabled(true);
	// imageSmoothingQuality("high");

	// Ensure images are loaded
	if (!greyscaleSourceImage || !patternImage) {
		console.error("Images not loaded correctly");
		return;
	}

	// Resize source image to match canvas dimensions
	greyscaleSourceImage.resize(width, height);

	// Resize pattern image to a higher resolution before scaling
	patternImage.resize(gridWidth * 4, gridHeight * 4);

	noLoop(); // We'll draw once
}

function draw() {
	// background(255); // White background

	// Calculate number of cells in the grid
	let cols = width / gridWidth;
	let rows = height / gridHeight;

	// Load pixels of the source image to access brightness values
	greyscaleSourceImage.loadPixels();

	// Draw the grid
	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			// Get the corresponding pixel from the source image
			let sourceX = i * gridWidth;
			let sourceY = j * gridHeight;
			let pixelIndex = (sourceY * width + sourceX) * 4;

			// Calculate brightness (average of RGB values)
			let brightness =
				(greyscaleSourceImage.pixels[pixelIndex] +
					greyscaleSourceImage.pixels[pixelIndex + 1] +
					greyscaleSourceImage.pixels[pixelIndex + 2]) /
				3;

			// Map brightness to a scale (0.1 to 1.0)
			let scaleFactor = map(brightness, 0, 255, 0.1, 1.0) + 0.5;

			// Save the current transformation state
			push();

			// Move to the position where we want to draw
			translate(i * gridWidth, j * gridHeight);

			// Scale the pattern image
			scale(scaleFactor);

			// Draw the pattern image at higher resolution
			image(patternImage, 0, 0, gridWidth, gridHeight);

			// Restore the transformation state
			pop();
		}
	}
}

function downloadCanvas() {
	// Create a temporary link element
	let link = document.createElement("a");
	link.download = "pattern.png";

	// Get the canvas data with alpha channel
	let canvas = document.getElementById("defaultCanvas0");
	let dataURL = canvas.toDataURL("image/png");

	// Set the link's href to the data URL
	link.href = dataURL;

	// Trigger the download
	link.click();
}

// Optional: Add mouse interaction to redraw
function mousePressed() {
	redraw();
}
