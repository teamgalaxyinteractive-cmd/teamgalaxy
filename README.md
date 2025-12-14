# TeamGalaxy — Official Web Platform

TeamGalaxy is a modern, community-driven web platform designed to provide
a unified digital ecosystem where users can create content, interact with
others, manage profiles, and explore multiple integrated modules under a
single structured environment.

🌐 **Live Platform:** https://www.teamgalaxy.net/

---

## Platform Capabilities

- User account management with public profile previews
- Content publishing system (posts and blogs)
- Community interaction through real-time chat
- Portfolio and card showcase modules
- Content creation tools
- Interactive game module
- Centralized user dashboard
- Structured legal and compliance pages
- User feedback collection system

---

## Publicly Accessible Pages

Only the following pages are intended for public access and search engine
indexing. All other pages are internal and restricted by design.

### Core Pages
- `/`
- `/about_us.html`
- `/dashboard.html`
- `/community_chat.html`
- `/posts.html`
- `/user_feedback.html`

### Content and Showcase
- `/galaxy_blogs.html`
- `/galaxy_portfolio.html`
- `/card_showcase.html`
- `/galaxy_studio.html`

### User Management
- `/user_management/user_profile.html`
- `/user_management/user_posts.html`
- `/user_management/user_settings.html`

### Tools
- `/tools/create_post.html`

### Public Data Manager
- `/public_data_manager/public_user_profile.html`
- `/public_data_manager/public_user_posts.html`

### Game
- `/game/full_game.html`

### Legal Pages
- `/legal/privacy_policy.html`
- `/legal/terms_and_conditions.html`
- `/legal/legal_notice.html`
- `/legal/sign_up.html`

---

## SEO and Indexing Strategy

TeamGalaxy follows standard-compliant SEO practices to ensure proper indexing
and crawl efficiency across major search engines.

- A single canonical URL is defined per page
- Only public, user-accessible pages are included in the sitemap
- Internal, administrative, and system pages are excluded from indexing
- `robots.txt` is used strictly for crawl control, not security
- Absolute URLs are used consistently

### Canonical URL Rule
Each page must declare itself as the canonical version.

Example:
```html
<link rel="canonical" href="https://www.teamgalaxy.net/about_us.html">