# Process Orders App - Web Version

A web-based tool for comparing CSV files to find Linnworks orders that are not in Shopify's unfulfilled list.

## Live Demo

[View the live application](https://yourusername.github.io/beed-process_orders)

## Features

- **Upload CSVs**: Upload Linnworks Open Orders and Shopify Unfulfilled Orders CSV files
- **Column Selection**: Choose matching columns for order comparison
- **Smart Matching**: Case-insensitive and whitespace normalization options
- **Live Preview**: See first 10 rows of each file before processing
- **Output Preview**: View results before downloading
- **Export**: Download processed results as CSV
- **Clear State**: Reset everything without page reload

## How to Use

1. **Upload Files**: Click "Upload Linnworks CSV" and "Upload Shopify CSV" to select your files
2. **Select Columns**: Choose the matching columns (e.g., Order Number) from the dropdowns
3. **Configure Options**: Toggle case-insensitive matching and space normalization as needed
4. **Validate**: Click "Select Matching Column" to verify your selections
5. **Process**: Click "Process" to find Linnworks orders not in Shopify
6. **Export**: Download the results as "output.csv"

## Deployment to GitHub Pages

This app is ready for GitHub Pages deployment:

1. Push these files to a GitHub repository
2. Go to repository Settings > Pages
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy on push to main branch

## Files

- `index.html` - Main HTML structure
- `styles.css` - Responsive CSS styling
- `script.js` - JavaScript functionality with PapaParse for CSV handling
- `.github/workflows/pages.yml` - GitHub Pages deployment workflow

## Technical Details

- **Frontend**: Pure HTML, CSS, JavaScript
- **CSV Parsing**: PapaParse library (loaded via CDN)
- **Responsive**: Works on desktop and mobile devices
- **No Backend**: All processing happens client-side
- **Privacy**: Files never leave your browser

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Or serve with a local server:
   ```bash
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Privacy & Security

- All processing happens locally in your browser
- No data is sent to external servers
- Files remain on your device
- No tracking or analytics

## Original Desktop Version

This web version maintains the same functionality as the original Tkinter desktop application, now accessible from any web browser.