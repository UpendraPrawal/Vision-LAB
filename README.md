# Vision LAB

OpenCV.js browser toolkit for interactive image processing and computer vision experiments.

## Links
- Repository: https://github.com/UpendraPrawal/Vision-LAB
- Live Demo: https://upendraprawal.github.io/Vision-LAB/

## What is New
- Real-time webcam streaming in Module 01.
- Live OpenCV frame processing preview (BGR to RGB).
- One-click webcam frame capture into the shared global pipeline.
- Captured webcam frame is applied across all 9 modules.

## Core Features
- One global image upload used across all modules.
- Real-time webcam stream with capture support.
- 9 computer vision learning modules.
- Interactive sliders, controls, and visual outputs.
- Grayscale and RGB histogram charts.
- Haar Cascade face detection with cropped face previews.
- Responsive UI for desktop and mobile.

## Modules
1. Image Reading and Display
2. Image Properties
3. Color and Intensity Analysis
4. Histogram Analysis and Comparison
5. Image Transformations
6. Thresholding
7. Geometric Operations
8. Interpolation Comparison
9. Face Detection and Face Cropping

## Webcam and Security Notes
- Webcam access works in secure contexts:
  - `https://` origins
  - `http://localhost` (local development)
- If you open the app on plain `http://` (non-localhost), browsers may block camera access.
- If you see a "connection is not secure" warning, do not enter sensitive data there.

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES6)
- OpenCV.js 4.8.0
- Chart.js 4.4.0
- GitHub Pages

## Quick Start (Local)
```bash
git clone https://github.com/UpendraPrawal/Vision-LAB.git
cd Vision-LAB
python -m http.server 5500
```

Open:
```text
http://localhost:5500
```

## Deployment
This repository is deployed with GitHub Actions to GitHub Pages.

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main`
- Live URL: https://upendraprawal.github.io/Vision-LAB/

## Project Structure
```text
Vision-LAB/
|- index.html
|- styles.css
|- app.js
|- README.md
|- .github/workflows/deploy-pages.yml
```

## Runtime Requirements
- Internet is required for OpenCV.js CDN.
- Internet is required for Chart.js CDN.
- Internet is required on first face detection load for Haar Cascade XML download.

## Troubleshooting
- Webcam does not start:
  - Make sure you are using HTTPS or localhost.
  - Check browser camera permission settings.
- Live site looks outdated:
  - Hard refresh with `Ctrl+F5`.
  - Check latest GitHub Actions run status.

## Credits
- OpenCV: https://opencv.org/
- OpenCV.js Docs: https://docs.opencv.org/
- Chart.js: https://www.chartjs.org/
