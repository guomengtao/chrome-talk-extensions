# Talk-H Plugin Development Guide

## Overview
Talk-H is a Chrome extension designed to provide real-time article alerts with comprehensive tracking and notification features. The plugin offers both visual and audio notifications, along with detailed statistics tracking.

## Key Features
- Real-time article monitoring
- Customizable alert system (sound and notifications)
- Comprehensive alert statistics tracking
- Detailed alert history logging
- Multi-language support (English/Chinese)

## Technical Architecture

### Core Components
1. **Background Service (background.js)**
   - Manages article monitoring
   - Handles alert generation and tracking
   - Maintains alert statistics and history
   - Manages Chrome local storage

2. **Popup Interface (popup.html/js)**
   - Displays article list and controls
   - Shows alert statistics dashboard
   - Provides alert history viewing
   - Offers filtering and management tools

### Data Management
- Uses Chrome's local storage for persistence
- Tracks alert statistics including:
  * Total alerts count
  * Sound alerts count
  * Notification alerts count
  * Detailed alert logs (last 100 entries)

## Alert System

### Alert Types
1. **Sound Alerts**
   - Custom audio notifications
   - Volume control
   - Configurable sound file

2. **Visual Notifications**
   - Chrome native notifications
   - Badge updates
   - In-popup alerts

### Statistics Tracking
- Real-time alert counting
- Historical alert logging
- Filterable alert history
- Clear alert history option

## Development Setup

### Prerequisites
- Chrome browser
- Basic understanding of Chrome extension development
- Node.js and npm (for development tools)

### Installation
1. Clone the repository
2. Navigate to the talk-h directory
3. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the talk-h directory

### Project Structure
```
talk-h/
├── manifest.json         # Extension manifest
├── popup.html           # Main popup interface
├── background.js        # Background service worker
├── assets/             # Static assets
│   └── complete.mp3    # Alert sound
├── css/               # Stylesheets
│   └── popup.css      # Popup styles
└── js/                # JavaScript files
    ├── background.js  # Background logic
    └── popup.js       # Popup interface logic
```

## API Integration

### Chrome APIs Used
- `chrome.storage.local`
- `chrome.notifications`
- `chrome.runtime`
- `chrome.action`

### Storage Schema
```javascript
{
  alertStats: {
    notifications: number,
    sounds: number,
    totalAlerts: number,
    alertLogs: Array<{
      type: string,
      message: string,
      timestamp: string
    }>,
    alertTimes: string[]
  }
}
```

## Testing
1. Manual testing of alert triggers
2. Verification of statistics tracking
3. Notification system testing
4. Storage persistence testing

## Build and Deploy
1. Update version in manifest.json
2. Test all features
3. Package extension
4. Submit to Chrome Web Store

## Maintenance
- Regular testing of alert system
- Monitoring storage usage
- Updating sound assets as needed
- Maintaining compatibility with Chrome updates