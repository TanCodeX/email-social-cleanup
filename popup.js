// Attach event listeners
function init() {
  document
    .getElementById("analyzeEmail")
    .addEventListener("click", () => handleAnalyzeClick("email"));
  document
    .getElementById("analyzeSocial")
    .addEventListener("click", () => handleAnalyzeClick("social"));
}

document.addEventListener("DOMContentLoaded", init);

// Handle analyze button clicks
function handleAnalyzeClick(type) {
  toggleLoading(true); // Show loading message
  clearOutput(); // Clear previous output

  if (type === "email") {
    analyzeEmails();
  } else if (type === "social") {
    analyzeSocialMedia(); // Assume `analyzeSocialMedia()` is implemented elsewhere
  }
}

// Analyze selected email folder
function analyzeEmails() {
  const selectedFolders = getSelectedFolders();

  if (!selectedFolders) {
    displayError("No folder selected. Please select a folder.");
    return;
  }

  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      displayError(
        `Failed to retrieve Google token: ${
          chrome.runtime.lastError?.message || "Unknown error"
        }`
      );
      return;
    }

    console.log("Retrieved token:", token);

    // Remove cached token and get a new one
    chrome.identity.removeCachedAuthToken({ token }, () => {
      chrome.identity.getAuthToken({ interactive: true }, (newToken) => {
        if (chrome.runtime.lastError || !newToken) {
          displayError(
            `Failed to retrieve new token: ${
              chrome.runtime.lastError?.message || "Unknown error"
            }`
          );
          return;
        }

        console.log("New token:", newToken);
        fetchEmails(newToken, selectedFolders); // Fetch emails with the new token
      });
    });
  });
}

// Fetch emails from Gmail API
function fetchEmails(token, selectedFolders) {
  const apiURL = `https://www.googleapis.com/gmail/v1/users/me/messages?q=in:${selectedFolders}`;

  fetch(apiURL, {
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  })
    .then((response) => response.json())
    .then((data) => {
      const messageIds = data.messages
        ? data.messages.map((msg) => msg.id)
        : [];

      if (messageIds.length === 0) {
        displayError("No messages found in the selected folder.");
        return;
      }

      const categories = {
        Newsletters: [],
        Promotions: [],
        "Social Media Notifications": [],
        "Transactional Emails": [],
        Others: [],
      };

      // Fetch details for each message
      const fetchPromises = messageIds.map((messageId) =>
        fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
          { headers: new Headers({ Authorization: `Bearer ${token}` }) }
        )
          .then((response) => response.json())
          .then((messageData) => processEmailData(messageData, categories))
          .catch((error) =>
            console.error("Error fetching message data:", error)
          )
      );

      // Process and display results once all fetches are complete
      Promise.all(fetchPromises).then(() => {
        displayCategorizedEmails(categories);
        toggleLoading(false); // Hide loading message
      });
    })
    .catch((error) => {
      console.error("Error fetching email list:", error);
      displayError("Failed to fetch emails. Please try again.");
    });
}

// Process email data and categorize
// Process email data and categorize
function processEmailData(messageData, categories) {
  const headers = messageData.payload.headers;
  const subject =
    headers.find((header) => header.name === "Subject")?.value || "No Subject";
  const sender =
    headers.find((header) => header.name === "From")?.value || "Unknown Sender";
  let date =
    headers.find((header) => header.name === "Date")?.value || "No Date";

  // Convert the Gmail date format to a JavaScript Date object
  const emailDate = new Date(date);

  // Adjust the time zone for the email's timestamp (show the full date/time like Gmail)
  const formattedDate = emailDate.toLocaleString("en-US", {
    weekday: "short", // e.g., "Thu"
    year: "numeric",  // e.g., "2024"
    month: "short",   // e.g., "Dec"
    day: "numeric",   // e.g., "20"
    hour: "numeric",  // e.g., "3"
    minute: "numeric",// e.g., "00"
    second: "numeric",// e.g., "00"
    hour12: true,     // 12-hour format with AM/PM
  });

  const emailData = { subject, sender, date: formattedDate };

  // Decode email body for unsubscribe links
  const body = messageData.payload.parts?.[0].body.data || "";
  if (body) {
    const decodedBody = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    const unsubscribeLink = decodedBody.match(
      /<a[^>]+href="([^"]+unsubscribe[^"]+)"/i
    );

    if (unsubscribeLink) {
      emailData.unsubscribeLink = unsubscribeLink[1];
    }
  }

  // Categorize email
  if (/newsletter/i.test(subject)) {
    categories.Newsletters.push(emailData);
  } else if (/deal|offer|promo/i.test(subject)) {
    categories.Promotions.push(emailData);
  } else if (/facebook|twitter|linkedin/i.test(subject)) {
    categories["Social Media Notifications"].push(emailData);
  } else if (/receipt|invoice|payment/i.test(subject)) {
    categories["Transactional Emails"].push(emailData);
  } else {
    categories.Others.push(emailData);
  }
}


// Display categorized emails with "See More" functionality
// Updated display function to load emails dynamically
function displayCategorizedEmails(categories) {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear previous content

  Object.entries(categories).forEach(([category, emails]) => {
    if (emails.length > 0) {
      let displayedCount = 5; // Initially show only 5 emails

      // Create category header
      const categoryHeader = document.createElement("h3");
      categoryHeader.textContent = category;
      outputDiv.appendChild(categoryHeader);

      // Create table for emails
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

      const tableBody = table.querySelector("tbody");
      outputDiv.appendChild(table);

      // Function to render emails dynamically
      function renderEmails() {
        const currentBatch = emails.slice(0, displayedCount);
        tableBody.innerHTML = ""; // Clear the table body before re-rendering

        currentBatch
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort emails by date
          .forEach((email) => {
            const row = tableBody.insertRow();
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

        // Check if all emails are displayed
        if (displayedCount >= emails.length) {
          seeMoreButton.style.display = "none"; // Hide the button
        } else {
          seeMoreButton.style.display = "block"; // Ensure it's visible
        }
      }

      // Create the "See More" button
      const seeMoreButton = document.createElement("button");
      seeMoreButton.textContent = "See More";
      seeMoreButton.style.margin = "10px auto"; // Center align button
      seeMoreButton.style.display = "block"; // Block element for centering
      seeMoreButton.style.padding = "8px 12px";
      seeMoreButton.style.backgroundColor = "#8336ff";
      seeMoreButton.style.color = "white";
      seeMoreButton.style.border = "none";
      seeMoreButton.style.cursor = "pointer";
      seeMoreButton.style.borderRadius = "4px";

      // Add click event listener to load more emails
      seeMoreButton.addEventListener("click", () => {
        displayedCount += 5; // Load 5 more emails
        renderEmails(); // Re-render emails
      });

      // Append the "See More" button outside the table
      outputDiv.appendChild(seeMoreButton);

      // Initial rendering of emails
      renderEmails();
    }
  });

  outputDiv.style.display = "block"; // Ensure the output is visible
}

// Utility function to format date nicely
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to render emails into the table
/*function renderEmails(table, emails) {
  const tbody = table.querySelector("tbody");
  emails.forEach((email) => {
    const row = `
      <tr>
        <td>${email.subject}</td>
        <td>${email.sender}</td>
        <td>${email.date}</td>
        <td>${
          email.unsubscribeLink
            ? `<button onclick="window.open('${email.unsubscribeLink}', '_blank')">Unsubscribe</button>`
            : "No link"
        }</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}*/

// Function to handle "See More" functionality
function showMoreEmails(table, emails, button) {
  const tbody = table.querySelector("tbody");
  const currentRowCount = tbody.rows.length;

  // Determine the next batch of emails to display
  const nextBatch = emails.slice(currentRowCount, currentRowCount + 5);
  renderEmails(table, nextBatch);

  // Remove "See More" button if all emails are displayed
  if (currentRowCount + nextBatch.length >= emails.length) {
    button.remove();
  }
}

// Utility functions
function toggleLoading(isLoading) {
  document.getElementById("loadingMessage").style.display = isLoading
    ? "block"
    : "none";
}

function clearOutput() {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear previous content
  outputDiv.style.display = "none";
}

function displayError(message) {
  toggleLoading(false);
  const outputDiv = document.getElementById("output");
  outputDiv.textContent = message;
  outputDiv.style.display = "block";
}

function getSelectedFolders() {
  const folderSelect = document.getElementById("folderSelect");
  return folderSelect.value || null;
}

function adjustPopupSize() {
  // Adjust popup size dynamically (optional)
  console.log("Adjust popup size");
}
