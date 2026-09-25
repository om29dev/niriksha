"""
API Documentation Generator for NIRIKSHA Fast-API backend.
Exports openapi.json and downloads offline Swagger UI assets into a target directory.
"""
import json
import os
import sys
import urllib.request

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app  # noqa: E402

SWAGGER_VERSION = "5.11.0"
CDN_BASE = f"https://cdn.jsdelivr.net/npm/swagger-ui-dist@{SWAGGER_VERSION}"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NIRIKSHA API Documentation</title>
  <link rel="icon" type="image/svg+xml" href="./favicon.svg">
  <link rel="stylesheet" type="text/css" href="./swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar-wrapper {
      background: #0f172a;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-weight: 700;
      font-size: 1.15rem;
      text-decoration: none;
    }
    .brand-title img {
      width: 24px;
      height: 24px;
    }
    .badge {
      background: #2563eb;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .topbar-links {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .topbar-link {
      color: #94a3b8;
      font-size: 0.88rem;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .topbar-link:hover {
      color: #ffffff;
    }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 24px 0 16px 0; }
    .swagger-ui .info .title { font-family: inherit; color: #0f172a; }
  </style>
</head>
<body>
  <div class="topbar-wrapper">
    <a href="https://om29dev.github.io/niriksha/" class="brand-title">
      <img src="./favicon.svg" alt="NIRIKSHA">
      <span>NIRIKSHA</span>
      <span class="badge">API Reference</span>
    </a>
    <div class="topbar-links">
      <a href="https://om29dev.github.io/niriksha/" class="topbar-link">Interactive Live Demo</a>
      <a href="https://github.com/om29dev/niriksha" class="topbar-link" target="_blank" rel="noopener">GitHub Repo</a>
      <a href="./openapi.json" class="topbar-link" download>Download OpenAPI JSON</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="./swagger-ui-bundle.js"></script>
  <script src="./swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "./openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
"""


def generate_docs(out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    print(f"Target directory: {out_dir}")

    # 1. Export openapi.json
    spec = app.openapi()
    spec_path = os.path.join(out_dir, "openapi.json")
    with open(spec_path, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2)
    print(f"[OK] Exported OpenAPI specification: {spec_path}")

    # 2. Write index.html
    html_path = os.path.join(out_dir, "index.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_TEMPLATE)
    print(f"[OK] Generated Swagger UI HTML: {html_path}")

    # 3. Create .nojekyll
    nojekyll_path = os.path.join(out_dir, ".nojekyll")
    with open(nojekyll_path, "w", encoding="utf-8") as f:
        f.write("")
    print(f"[OK] Created .nojekyll: {nojekyll_path}")

    # 4. Copy favicon
    favicon_src = os.path.join(ROOT_DIR, "frontend", "public", "favicon.svg")
    favicon_dest = os.path.join(out_dir, "favicon.svg")
    if os.path.exists(favicon_src):
        with open(favicon_src, "rb") as rf, open(favicon_dest, "wb") as wf:
            wf.write(rf.read())
        print(f"[OK] Copied favicon: {favicon_dest}")

    # 5. Download offline Swagger UI distribution assets
    assets = [
        "swagger-ui.css",
        "swagger-ui-bundle.js",
        "swagger-ui-standalone-preset.js",
    ]
    for asset in assets:
        target_file = os.path.join(out_dir, asset)
        url = f"{CDN_BASE}/{asset}"
        print(f"Downloading {asset} from {url}...")
        urllib.request.urlretrieve(url, target_file)
        print(f"[OK] Saved {asset} ({os.path.getsize(target_file)} bytes)")


if __name__ == "__main__":
    output_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT_DIR, "api_docs_dist")
    generate_docs(output_path)
