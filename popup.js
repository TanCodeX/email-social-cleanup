// Attach event listeners when DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);

function init() {
  document
    .getElementById("analyzeEmail")
    .addEventListener("click", () => handleAnalyzeClick("email"));
  document
    .getElementById("analyzeSocial")
    .addEventListener("click", () => handleAnalyzeClick("social"));
}

// Handle analyze button clicks
function handleAnalyzeClick(type) {
  toggleLoading(true); // Show loading message
  clearOutput(); // Clear previous results

  if (type === "email") {
    analyzeEmails();
  } else if (type === "social") {
    analyzeSocialMedia(); // Assume `analyzeSocialMedia()` is implemented elsewhere
  }
}

// Analyze selected email folder
function analyzeEmails() {
  const selectedFolder = getSelectedFolder();

  if (!selectedFolder) {
    displayError("No folder selected. Please select a folder.");
    return;
  }

  // Retrieve Google OAuth Token
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      displayError(
        `Failed to retrieve Google token: ${
          chrome.runtime.lastError?.message || "Unknown error"
        }`
      );
      return;
    }

    console.log("Token retrieved:", token);
    fetchEmails(token, selectedFolder);
  });
}

// Fetch emails using Gmail API
function fetchEmails(token, selectedFolder) {
  const apiURL = `https://www.googleapis.com/gmail/v1/users/me/messages?q=in:${selectedFolder}`;

  fetch(apiURL, {
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  })
    .then((response) => response.json())
    .then((data) => {
      const messageIds = data.messages?.map((msg) => msg.id) || [];

      if (!messageIds.length) {
        displayError("No emails found in the selected folder.");
        return;
      }

      const categories = initializeCategories();

      // Fetch email details and categorize
      const fetchPromises = messageIds.map((id) =>
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${id}`, {
          headers: new Headers({ Authorization: `Bearer ${token}` }),
        })
          .then((response) => response.json())
          .then((emailData) => processEmailData(emailData, categories))
          .catch((error) => console.error("Error fetching email:", error))
      );

      Promise.all(fetchPromises).then(() => {
        displayCategorizedEmails(categories);
        toggleLoading(false); // Hide loading message
      });
    })
    .catch((error) => {
      console.error("Error fetching email list:", error);
      displayError("Unable to fetch emails. Please try again.");
    });
}

// Initialize email categories
function initializeCategories() {
  return {
    Newsletters: [],
    Promotions: [],
    "Social Media Notifications": [],
    "Transactional Emails": [],
    Others: [],
  };
}

// Process and categorize email data
function processEmailData(emailData, categories) {
  const headers = emailData.payload.headers;
  const subject =
    headers.find((header) => header.name === "Subject")?.value || "No Subject";
  const sender =
    headers.find((header) => header.name === "From")?.value || "Unknown Sender";
  let date =
    headers.find((header) => header.name === "Date")?.value || "No Date";

  const formattedDate = formatDate(date);

  const emailInfo = { subject, sender, date: formattedDate };

  // Look for unsubscribe links
  const body = emailData.payload.parts?.[0]?.body?.data || "";
  if (body) {
    const decodedBody = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    const unsubscribeLink = decodedBody.match(
      /<a[^>]+href="([^"]+unsubscribe[^"]+)"/i
    );
    if (unsubscribeLink) {
      emailInfo.unsubscribeLink = unsubscribeLink[1];
    }
  }

  // Categorize based on subject
  if (/newsletter/i.test(subject)) {
    categories.Newsletters.push(emailInfo);
  } else if (/deal|offer|promo/i.test(subject)) {
    categories.Promotions.push(emailInfo);
  } else if (/facebook|twitter|linkedin/i.test(subject)) {
    categories["Social Media Notifications"].push(emailInfo);
  } else if (/receipt|invoice|payment/i.test(subject)) {
    categories["Transactional Emails"].push(emailInfo);
  } else {
    categories.Others.push(emailInfo);
  }
}

// Display categorized emails
function displayCategorizedEmails(categories) {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear any existing content

  Object.entries(categories).forEach(([category, emails]) => {
    if (!emails.length) return;

    // Create category title
    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent = category;
    outputDiv.appendChild(categoryTitle);

    // Create email table
    const table = createEmailTable(emails);
    outputDiv.appendChild(table);
  });

  outputDiv.style.display = "block";
}

// Create and render a table for emails
function createEmailTable(emails) {
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Subject</th>
        <th>Sender</th>
        <th>Date</th>
        <th>Unsubscribe</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  let displayedCount = 5;

  function renderEmails() {
    tbody.innerHTML = ""; // Clear previous rows
    emails.slice(0, displayedCount).forEach((email) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${email.subject}</td>
        <td>${email.sender}</td>
        <td>${email.date}</td>
        <td>${
          email.unsubscribeLink
            ? `<button onclick="window.open('${email.unsubscribeLink}', '_blank')">Unsubscribe</button>`
            : "No link"
        }</td>
      `;
    });
  }

  renderEmails();

  // Add "See More" button if there are more than 5 emails
  if (emails.length > 5) {
    const seeMoreBtn = document.createElement("button");
    seeMoreBtn.textContent = "See More";
    seeMoreBtn.onclick = () => {
      displayedCount += 5;
      renderEmails();
      if (displayedCount >= emails.length) seeMoreBtn.style.display = "none";
    };
    table.appendChild(seeMoreBtn);
  }

  return table;
}

// Utility Functions
function toggleLoading(isLoading) {
  document.getElementById("loadingMessage").style.display = isLoading
    ? "block"
    : "none";
}

function clearOutput() {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";
  outputDiv.style.display = "none";
}

function displayError(message) {
  toggleLoading(false);
  const outputDiv = document.getElementById("output");
  outputDiv.textContent = message;
  outputDiv.style.display = "block";
}

function getSelectedFolder() {
  return document.getElementById("folderSelect").value || null;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}
