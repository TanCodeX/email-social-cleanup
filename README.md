Email & Social Media Cleanup Assistant
A Chrome extension that helps users organize and clean up their email inboxes and social media notifications. 
It categorizes emails into types like newsletters, promotions, social media notifications, transactional emails, 
and others, making it easier to unsubscribe from unnecessary emails and analyze inactive social media accounts.

Features
Email Analysis & Categorization: Automatically sorts emails into relevant categories, including Newsletters, Promotions, Social Media Notifications, Transactional Emails, and Others.
Social Media Analysis: Examines Facebook and Instagram engagement patterns to identify inactive friends on Facebook and rarely engaged accounts on Instagram.
Unsubscribe Management: Finds unsubscribe links within emails, allowing users to quickly unsubscribe from unwanted newsletters.
Load More Options: Supports dynamic loading of additional emails in various categories, keeping the interface streamlined.

Installation
Clone this repository: git clone https://github.com/yourusername/email-social-media-cleanup.git
Open Chrome and go to chrome://extensions/.
Enable Developer mode (top right corner).
Click Load unpacked and select the extension folder.

Usage
Open the extension by clicking on the Chrome extension icon.
Select the folder you want to analyze (e.g., Inbox, Sent, Drafts).
Click Analyze Emails to categorize your emails.
Click Analyze Social Media to analyze Facebook and Instagram engagement (Meta Developer API access is required).

Setup
Gmail API Setup
Go to the Google Cloud Console.
Create a new project and enable the Gmail API.
Set up OAuth2 credentials, and add the extension’s OAuth consent screen.
Update popup.js to include OAuth2 token management and fetch Gmail data.


Certainly! Here’s a template for a GitHub README file for your Email & Social Media Cleanup Assistant Chrome extension:

Email & Social Media Cleanup Assistant
A Chrome extension that helps users organize and clean up their email inboxes and social media notifications. It categorizes emails into types like newsletters, promotions, social media notifications, transactional emails, and others, making it easier to unsubscribe from unnecessary emails and analyze inactive social media accounts.

Features
Email Analysis & Categorization: Automatically sorts emails into relevant categories, including Newsletters, Promotions, Social Media Notifications, Transactional Emails, and Others.
Social Media Analysis: Examines Facebook and Instagram engagement patterns to identify inactive friends on Facebook and rarely engaged accounts on Instagram.
Unsubscribe Management: Finds unsubscribe links within emails, allowing users to quickly unsubscribe from unwanted newsletters.
Load More Options: Supports dynamic loading of additional emails in various categories, keeping the interface streamlined.
Installation
Clone this repository:
bash
Copy code
git clone https://github.com/yourusername/email-social-media-cleanup.git
Open Chrome and go to chrome://extensions/.
Enable Developer mode (top right corner).
Click Load unpacked and select the extension folder.
Usage
Open the extension by clicking on the Chrome extension icon.
Select the folder you want to analyze (e.g., Inbox, Sent, Drafts).
Click Analyze Emails to categorize your emails.
Click Analyze Social Media to analyze Facebook and Instagram engagement (Meta Developer API access is required).
Prerequisites
Gmail API:

Enable the Gmail API in Google Cloud Console.
Obtain OAuth2 credentials and integrate them with the extension to access email data.
Meta Developer API (Facebook & Instagram):

Access to the Meta Developer API is required for analyzing social media activity.
To get started, create a new application in the Meta Developer Console.
Postman API Alternative:

If you're facing issues accessing Meta Developer, you can test API endpoints and verify token generation through Postman.
Setup
Gmail API Setup
Go to the Google Cloud Console.
Create a new project and enable the Gmail API.
Set up OAuth2 credentials, and add the extension’s OAuth consent screen.
Update popup.js to include OAuth2 token management and fetch Gmail data.
Meta Developer API Setup
Register at Meta for Developers.
Create a new application and enable Facebook Login for retrieving user information.
Add permissions such as user_friends, instagram_basic, and pages_show_list.
Use the token generated to call the API for user engagement data.
Note: If you're unable to register at Meta Developer, you can try using Postman for testing Meta’s APIs.

File Structure
popup.html: The user interface of the extension.
styles.css: Custom styling for the extension's popup.
popup.js: Handles the extension’s main logic, including:
Fetching emails from Gmail.
Categorizing emails by type.
Finding unsubscribe links.
Accessing social media data from Meta APIs.

Contributing
We welcome contributions! Please fork this repository, make your changes, and submit a pull request.
