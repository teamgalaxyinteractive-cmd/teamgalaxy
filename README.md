# Galaxy Designs — Official Web Platform

Galaxy Designs is a premier digital design studio engineering exceptional visual experiences. 
Our web platform serves as an elite portfolio and client gateway, showcasing high-end 3D aesthetics, 
custom graphics, and pixel-perfect visual identities under a sleek, modern environment.

🌐 **Live Platform:** https://teamgalaxy.net/

---

## Platform Capabilities

- Premium 3D Visuals & Digital Art Showcase
- Designer & Team Profile Management (Lead Designers, Assets Specialists)
- High-End UI/UX Design Portfolio
- Agency Blog & Creative Insights
- Centralized Client Contact & Onboarding Gateway
- Professional Legal & Compliance Infrastructure
- SEO-Optimized Architecture with High-Performance Rendering

---

## Publicly Accessible Pages

Only the following pages are intended for public access and search engine
indexing. All internal testing, draft, or administrative pages are restricted by design.

### Core Pages
- `/index.html` (Home / Design Flow)
- `/about_us.html`
- `/team.html` (Designer Profiles)
- `/contact.html`

### Content and Showcase
- `/portfolio.html`
- `/blogs.html`

### System & Utility Pages
- `/offline.html` (Custom Offline PWA Experience)

### Legal Pages
- `/legal_notice.html`
- `/privacy_policy.html`
- `/terms_and_conditions.html`

---

## SEO and Indexing Strategy

Galaxy Designs follows standard-compliant SEO practices to ensure proper indexing
and crawl efficiency across major search engines, maximizing our agency's visibility.

- A single canonical URL is defined per page
- Only public, user-accessible pages are included in the sitemap
- Internal, administrative, and system pages are excluded from indexing
- `robots.txt` is used strictly for crawl control, not security
- Absolute URLs are used consistently

### Canonical URL Rule
Each page must declare itself as the canonical version.

Example:
```html
<link rel="canonical" href="[https://teamgalaxy.net/about_us.html](https://teamgalaxy.net/about_us.html)">
