# Privacy Policy for Content Filter Pro

**Effective Date:** February 4, 2026

## 1. Introduction
Content Filter Pro ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use the Content Filter Pro browser extension.

## 2. Information We Collect
**We do not collect any personal data or browsing history.**

Content Filter Pro is designed to operate entirely locally on your device. Specifically:
- **No Personal Information**: We do not collect names, email addresses, or any other personally identifiable information.
- **No Browsing History**: We do not track the websites you visit or the content you consume, other than applying your defined filters to the specific supported sites (LinkedIn, Facebook, Reddit).
- **No Data Transmission**: No data analyzed by the extension is ever transmitted to us or any third-party servers.

## 3. Data Storage
Any data required for the extension to function is stored locally on your device using the `chrome.storage.local` API. This includes:
- **Filtering Rules**: The keywords and criteria you define to filter content.
- **Extension Settings**: Your preferences, such as whether the extension is enabled.
- **Local Statistics**: Aggregate counts of filtered posts (e.g., "10 posts filtered on LinkedIn"). This data never leaves your machine.

## 4. Use of Permissions
The extension requests specific permissions to function:
- **storage**: To save your custom rules and settings locally.
- **activeTab / tabs**: To identify the current site and apply filtering logic only to supported platforms.
- **Content Scripts**: To analyze and modify the structure of supported pages locally to hide or highlight content.

## 5. Third-Party Services
Content Filter Pro does not share any information with third parties. We do not use third-party analytics, tracking, or advertising services within the extension.

## 6. Changes to This Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the extension's documentation or store listing.

## 7. Contact Us
If you have any questions about this Privacy Policy, please contact the developer via the official support channels on the Chrome Web Store.
