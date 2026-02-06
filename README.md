# Content Filter Pro

![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)
![License](https://img.shields.io/badge/license-AGPL-green.svg)

**Content Filter Pro** is a high-performance Chrome extension designed to give you full control over your social media feeds. It currently supports **LinkedIn**, **Facebook**, and **Reddit**, allowing you to filter out noise, sponsored content, and irrelevant updates using advanced rules.

## 🚀 Features

- **Multi-Platform Support**: Built-in adapters for LinkedIn, Facebook, and Reddit.
- **Sophisticated Rule Engine**: Create rules based on keywords, authors, job titles, and more.
- **Customizable Actions**: Hide filtered posts or highlight them for later review.
- **Privacy Centric**: All filtering happens locally. No data leaves your machine.
- **Stats Dashboard**: Track your productivity gains with detailed filtering statistics.
- **Modern UI**: Sleek, responsive design with dark mode support.

## 🛠 Installation (for Developers)

1. Clone the repository:
   ```bash
   git clone https://github.com/MahmoudMabrok/ContentFilterPro.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory.

## 🧪 Testing

The project uses Jest for unit testing.
```bash
npm test
```

## 📦 Packaging for Release

To create a production-ready zip archive:
```bash
npm run package
```
This will generate a `release.zip` file in the root directory.

## 📄 License

This project is licensed under the AGPL License - see the LICENSE file for details.

## 👨💻 Author

**Mahmoud Mabrok**
