# Hoco Parts Excel Editor - Web Version

A modern web application for automatically processing Excel files with specific transformations for Hoco Parts inventory management. This version runs entirely in the browser and can be deployed on GitHub Pages.

## 🌐 Live Demo

[View the live application on GitHub Pages](https://your-username.github.io/hoco_editor/)

**Note:** Replace `your-username` with your actual GitHub username in the URL above.

## ✨ Features

- **Modern Web Interface** - Clean, responsive design that works on desktop and mobile
- **Drag & Drop Upload** - Easy file selection with visual feedback
- **Batch Processing** - Process multiple .xlsx files simultaneously
- **Client-Side Processing** - All processing happens in your browser (no server required)
- **Automatic Transformations:**
  - Delete columns A & C
  - Rename new column A to "SKU"
  - Rename new column B to "Stock Level"
  - Add new "Location" column filled with "Hoco Parts"
  - Remove commas from stock level numbers (1,000 → 1000)
- **CSV Export** - Download processed files as CSV format
- **Progress Tracking** - Real-time progress updates during processing

## 🚀 Deployment on GitHub Pages

### Option 1: Deploy from this repository

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages:**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
3. **Your app will be live at:** `https://your-username.github.io/hoco_editor/`

### Option 2: Deploy to your own repository

1. **Create a new repository** on GitHub
2. **Upload these files:**
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. **Enable GitHub Pages** (same steps as Option 1)

## 🛠️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hoco_editor.git
   cd hoco_editor
   ```

2. **Open in browser:**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     ```
   - Then visit `http://localhost:8000`

## 📱 Usage

1. **Open the application** in your web browser
2. **Upload files:**
   - Drag and drop .xlsx files onto the upload area, or
   - Click "Choose Files" to browse and select files
3. **Process files:**
   - Click "🚀 Process Files" to apply transformations
   - Watch the progress bar for real-time updates
4. **Download results:**
   - Click the download buttons to save processed CSV files

## 🔧 Technical Details

- **Frontend:** Pure HTML, CSS, and JavaScript (no frameworks required)
- **Excel Processing:** SheetJS library for client-side Excel file handling
- **Styling:** Modern CSS with custom properties and responsive design
- **Browser Support:** Works in all modern browsers (Chrome, Firefox, Safari, Edge)

## 📋 File Structure

```
hoco_editor/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # Documentation
└── .gitignore          # Git ignore file (optional)
```

## 🔒 Privacy & Security

- **No server required** - All processing happens locally in your browser
- **No data sent anywhere** - Your files never leave your device
- **No registration required** - Use immediately without any setup
- **Open source** - Full source code available for review

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Note:** This web version provides the same functionality as the Python desktop application but runs entirely in your browser, making it perfect for deployment on GitHub Pages or any static hosting service.