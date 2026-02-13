# E2E Test Plan — Content Filter Pro

## Overview
End-to-end tests verify that rules created in the Options UI are applied correctly on real social media feeds. These tests require a browser environment with the extension loaded.

## Prerequisites
- Chrome with the extension loaded as unpacked
- A test LinkedIn/Facebook/Reddit account
- DevTools open to Console tab (to verify logging output)

---

## Test Scenarios

### 1. Hide Rule — Author starts_with
| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Options page | Options UI loads |
| 2 | Create rule: author `starts_with` "A", action **Hide** | Rule saved in storage |
| 3 | Navigate to LinkedIn feed | Feed loads |
| 4 | Find a post by an author starting with "A" | Post is hidden, placeholder shown with "Content Filtered" message |
| 5 | Click "Show Content" on placeholder | Post becomes visible again |
| 6 | Scroll/refresh — post should not be re-filtered | Post stays visible (`data-cf-revealed` attribute) |

### 2. See First Rule — Author starts_with
| Step | Action | Expected |
|------|--------|----------|
| 1 | Create rule: author `starts_with` "A", action **See First** | Rule saved |
| 2 | Navigate to LinkedIn feed | Feed loads |
| 3 | Look for the matched post | Post moved to top of feed, "See First" banner visible |
| 4 | Console shows `[applyFilters] Applying SEE FIRST for post by "A..."` | Logging works |

### 3. Rule Update Takes Effect
| Step | Action | Expected |
|------|--------|----------|
| 1 | Create rule: content `contains` "crypto", action **Hide** | Rule saved |
| 2 | Navigate to feed with a crypto post | Post is hidden |
| 3 | Change rule action to **See First** in Options | Rule updated |
| 4 | Refresh feed | Post is now at top with See First banner, not hidden |

### 4. Multiple Rules — Priority Order
| Step | Action | Expected |
|------|--------|----------|
| 1 | Create rule 1: author `starts_with` "A", action **See First** | Saved |
| 2 | Create rule 2: content `contains` "hiring", action **Hide** | Saved |
| 3 | Post by "Ahmed" with "hiring" content | Rule 1 matches first → See First (not hidden) |
| 4 | Post by "Bob" with "hiring" content | Rule 2 matches → Hidden |

### 5. Disabled Rule Is Skipped
| Step | Action | Expected |
|------|--------|----------|
| 1 | Create rule: author `starts_with` "A", action **Hide**, then disable it | Rule disabled |
| 2 | Navigate to feed | Posts by "A" authors remain visible |
| 3 | Console shows `Rule "..." is disabled, skipping` | Logging works |

### 6. No Rules Match — Feed Unchanged
| Step | Action | Expected |
|------|--------|----------|
| 1 | Create rule: author `equals` "NonExistentUser12345", action **Hide** | Rule saved |
| 2 | Navigate to feed | All posts remain visible, no placeholders |
| 3 | Console shows `No rules matched for this post` per post | Logging works |

---

## Console Logging Verification

For each test above, verify these log patterns in DevTools Console:

```
[applyFilters] Processing X posts with Y rules
[RuleEngine] Evaluating Y rules against post by "AuthorName"
[RuleEngine] Rule "RuleName" (id) is disabled, skipping        // if disabled
[RuleEngine] ✅ Rule "RuleName" (id) MATCHED — action: hide    // if matched
[applyFilters] Applying HIDE for post by "AuthorName"           // hide action
[applyFilters] Applying SEE FIRST for post by "AuthorName"      // see_first action
[applyFilters] Summary: X hidden, Y see-first                  // summary
```

---

## Future: Automated E2E with Puppeteer

When ready to automate, use Puppeteer with Chrome extension loading:

```javascript
const browser = await puppeteer.launch({
    headless: false,
    args: [
        `--load-extension=/path/to/extension`,
        `--disable-extensions-except=/path/to/extension`
    ]
});
```

Key automation steps:
1. Load extension, navigate to options page
2. Create rules via DOM manipulation of options form
3. Navigate to a mock feed page (static HTML mimicking LinkedIn structure)
4. Assert DOM state: `.cf-collapsed` for hidden, `.cf-see-first` for see-first
5. Assert placeholder text matches rule name
