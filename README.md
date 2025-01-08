# Email & Social Media Cleanup Assistant

A Chrome extension that helps users organize and clean up their email inboxes and social media notifications. It categorizes emails into types like newsletters, promotions, social media notifications, transactional emails, and others, making it easier to unsubscribe from unnecessary emails and analyze inactive social media accounts.

## Features

- **Email Analysis & Categorization**: Automatically sorts emails into relevant categories, including:
  - Newsletters
  - Promotions
  - Social Media Notifications
  - Transactional Emails
  - Others

- **Social Media Analysis**: Examines Facebook and Instagram engagement patterns to identify inactive friends on Facebook and rarely engaged accounts on Instagram.

- **Unsubscribe Management**: Finds unsubscribe links within emails, allowing users to quickly unsubscribe from unwanted newsletters.

- **Load More Options**: Supports dynamic loading of additional emails in various categories, keeping the interface streamlined.

## How It Works

1. **Email Analysis**: The extension connects with your Gmail account through OAuth2 and fetches your emails. It uses algorithms to categorize emails into types such as newsletters, promotions, and transactional emails. 
   
2. **Social Media Analysis**: The extension connects to Facebook and Instagram via the Meta Developer API. It tracks your interaction with friends and followed accounts and analyzes your engagement to identify inactive accounts.

3. **Unsubscribe Management**: The extension scans the emails for unsubscribe links, highlighting them for users to quickly opt out of unwanted subscriptions.

4. **Dynamic Loading**: The extension allows the dynamic loading of additional emails within each category, ensuring your inbox remains clean and uncluttered while also offering full control over your email organization.

## Installation

### Prerequisites

Before using the extension, ensure you have the following:

- **Gmail API**: You must enable the Gmail API on Google Cloud Console and authenticate the extension to access Gmail data.
- **Meta Developer API (Facebook & Instagram)**: Access to the Meta Developer API is required for analyzing social media activity.

### Steps to Install

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/email-social-media-cleanup.git
