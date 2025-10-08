## Supplier Product Scraper (GitHub Pages Ready)

Runs 100% client-side in the browser. Import a CSV with columns `SKU,URL`, attach or paste HTML for each row, parse via supplier-specific selectors (default includes `Scorpion`), and export a final CSV with columns `SKU,Supplier,URL,Title,Product Code,Price,Description,Stock Level`.

### Quick Start
- Open `index.html` locally, or deploy to GitHub Pages (see below).
- Click "Download Template" to get a sample CSV. Fill rows with `SKU` and `URL`.
- Import your CSV.
- For Scorpion, the app will auto-fetch each URL client-side and parse it. If a request is blocked by CORS, the row will show an error in the Status column.
- Click "Parse All" then "Download CSV".

### Saved Suppliers Config
- Choose the active supplier via the dropdown (global for all rows). Default includes `Scorpion`.
- Optional: Set a CORS proxy template (e.g. `https://api.allorigins.win/raw?url={url}`) if direct fetch fails. The `{url}` placeholder will be replaced automatically.
- Internal config shape (for reference only):

```json
{
  "suppliers": {
    "Scorpion": {
      "description": "Default test supplier",
      "selectors": {
        "title": "h1.product-title, h1",
        "productCode": "[data-product-code], .sku, .product-code",
        "price": "[data-price], .price .amount, .price",
        "description": ".product-description, #description, .desc",
        "stockLevel": "[data-stock], .stock-level, .stock"
      }
    }
  }
}
```

Adjust selectors per supplier as needed.

### Deploy to GitHub Pages
1. Create a new GitHub repo and push these files.
2. In repo settings → Pages → set Source to `main` branch, root (`/`).
3. Wait for the Pages site to build; open the URL provided.

No backend required.


