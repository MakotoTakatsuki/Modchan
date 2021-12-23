##### 0.1.1
  - Added changelog
  - Version now changes with some kind of meaning
  - Animated gif thumbnails no longer generate static image for images < thumbnail dimensions
  - Boards management "Banners" page is now "Assets"
  - Boards can have custom flags

##### 0.1.2
  - Merge webring and local board list and improve webring search and filter functionality
  - New stat section of homepage
  - Replaced and removed some fatchan-specific media
  - Fixed undefined hcaptcha site key bug
  - Updated README with info about nginx CSP for 3rd party captcha providers
  - Update socket-io 2.x to 4.x

##### 0.1.3
  - Script optimizations, improves page load speed especially on longer threads
  - Extra (u) download link for no reason
  - favicon, webmanifest, browserconfig, etc for browsers made into gulp task
  - Webring now sends and checks for ppd stat
  - Board search improved (prefix matches)
  - Update code for form submission and data validation, faster and easier to maintain
  - Make it more obvious to users with a blacklisted IP if block bypass dnsbl is enabled
  - Add new themes
  - Improved README
  - Many bugfixes

##### 0.1.4
  - Banner uploading bugfix

##### 0.1.5
  - Try to fallback thumbnail generation for video with horribly broken encoding
  - Country blocklist now can actually fit all countries
  - Make "auth level" text box into "account type" dropdown in accounts page, easier to understand
  - Board owners can now edit custom pages
  - Board owners can now manage custom assets
  - Show a little message and disable reply form on full threads (hit reply limit)
  - Allow longer language names for code blocks
  - User settings import and export option

##### 0.1.6
  - Mongodb v5 and node driver v4 update
  - IP rangebans use more reasonable range for ipv6
  - Fix ip randomising schedule
  - Global announcements now show on overboard (both views)
  - Overboard upgrade, now users can set to add and remove any boards, global setting to enable/disable. Form is collapsible
  - Add an extra "new reply" button to the end of threads for convenience
  - Users with scripts will now see proper video thumbnails (depending on browser supported codecs) in the upload list
  - Make fuzzy image hash option and hashes visible to globals, for filtering
  - Add board option to enable reverse image search link next to filenames
  - Add board option to enable an external "archive" link with the other nav links
  - Add global option to configure the URL for archive/reverse image serach links
  - Improved API for some global moderation interfaces, to allow more custom integration to reports and more
  - Staff who hide their name from public logs will also be hidden in the ban when shown to banned user
  - Image previews now shown in notifications
  - Strict filtering improvements
  - Many bugfixes

### 0.1.7
  - Update inconsistent wording of custom overboard subtitle from 0.1.6
  - Dont show "local first" checkbox in boardlist when webring isn't even enabled
  - Bugfix to code markup, remove only leading blank lines, keeping leading whitespace on first non-empty line
  - Make overboard settings save somewhat in localstorage to help stupid zoomers who dont know what a BOOKMARK is
