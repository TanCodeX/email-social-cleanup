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
  // Show loading message and hide output
  toggleLoading(true);
  clearOutput();

  if (type === "email") {
    analyzeEmails();
  } else if (type === "social") {
    analyzeSocialMedia();
  }
}

function analyzeEmails() {
  const selectedFolders = getSelectedFolders();

  if (!selectedFolders) {
    document.getElementById("loadingMessage").style.display = "none";
    document.getElementById("output").textContent =
      "No folder selected. Please select a folder.";
    document.getElementById("output").style.display = "block";
    return; // Exit if no folder is selected
  }

  // Get the token inside this function
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (chrome.runtime.lastError || !token) {
      console.error("Error retrieving token:", chrome.runtime.lastError);
      document.getElementById(
        "output"
      ).textContent = `Failed to retrieve Google token: ${
        chrome.runtime.lastError
          ? chrome.runtime.lastError.message
          : "Unknown error"
      }`;
      document.getElementById("loadingMessage").style.display = "none";
      return;
    }

    // Log the token for debugging
    console.log("Retrieved token:", token);

    chrome.identity.removeCachedAuthToken({ token }, function () {
      chrome.identity.getAuthToken({ interactive: true }, function (newToken) {
        if (chrome.runtime.lastError || !newToken) {
          console.error(
            "Error retrieving new token:",
            chrome.runtime.lastError
          );
          document.getElementById(
            "output"
          ).textContent = `Failed to retrieve new token: ${
            chrome.runtime.lastError
              ? chrome.runtime.lastError.message
              : "Unknown error"
          }`;
          document.getElementById("loadingMessage").style.display = "none";
          return;
        }
        console.log("New token:", newToken);
        // Now that the token is available, proceed with your API request
        fetchEmails(newToken, selectedFolders);
      });
    });
  });
}

function fetchEmails(token, selectedFolders) {
  fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=in:${selectedFolders}`,
    {
      headers: new Headers({ Authorization: "Bearer " + token }),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      const messageIds = data.messages
        ? data.messages.map((msg) => msg.id)
        : [];

      if (messageIds.length === 0) {
        document.getElementById("output").textContent =
          "No messages found in the selected folder.";
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("output").style.display = "block";
        return;
      }

      const categories = {
        Newsletters: [],
        Promotions: [],
        "Social Media Notifications": [],
        "Transactional Emails": [],
        Others: [],
      };

      let fetchPromises = messageIds.map((messageId) => {
        return fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
          {
            headers: new Headers({ Authorization: "Bearer " + token }),
          }
        )
          .then((response) => response.json())
          .then((messageData) => {
            // Process message data as before
            processEmailData(messageData, categories);
          })
          .catch((error) =>
            console.error("Error fetching message data:", error)
          );
      });

      // Wait for all fetches to complete
      Promise.all(fetchPromises).then(() => {
        displayCategorizedEmails(categories);
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("output").style.display = "block";
        adjustPopupSize();
      });
    })
    .catch((error) => {
      console.error("Error fetching email list: ", error);
      document.getElementById("loadingMessage").style.display = "none";
    });
}

function processEmailData(messageData, categories) {
  const subject =
    messageData.payload.headers.find((header) => header.name === "Subject")
      ?.value || "No Subject";
  const sender =
    messageData.payload.headers.find((header) => header.name === "From")
      ?.value || "Unknown Sender";
  const date =
    messageData.payload.headers.find((header) => header.name === "Date")
      ?.value || "No Date";
  const snippet = messageData.snippet || "No Snippet Available";

  const emailData = {
    subject,
    sender,
    date,
    snippet,
  };

  let body = "";
  if (messageData.payload.parts && messageData.payload.parts[0].body) {
    body = messageData.payload.parts[0].body.data || "";
  }

  if (body) {
    const decodedBody = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    const unsubscribeLink = decodedBody.match(
      /<a[^>]+href="([^"]+unsubscribe[^"]+)"/i
    );

    if (unsubscribeLink) {
      emailData.unsubscribeLink = unsubscribeLink[1];
    }
  }

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

function decodeEmailBody(parts) {
  if (!parts || !parts[0]?.body?.data) return "";
  return atob(parts[0].body.data.replace(/-/g, "+").replace(/_/g, "/"));
}

function extractUnsubscribeLink(body) {
  const match = body.match(/<a[^>]+href="([^"]+unsubscribe[^"]+)"/i);
  return match ? match[1] : null;
}

function analyzeSocialMedia() {
  setTimeout(() => {
    toggleLoading(false);
    displayOutput("<p>Social Media analysis is not implemented yet.</p>");
  }, 2000);
}

// Helper functions
function getSelectedFolders() {
  const folderSelect = document.getElementById("folderSelect");
  if (!folderSelect) {
    console.error("Folder select element not found");
    return null;
  }
  return folderSelect.value || null;
}

function toggleLoading(isLoading) {
  document.getElementById("loadingMessage").style.display = isLoading
    ? "block"
    : "none";
  document.getElementById("output").style.display = isLoading
    ? "none"
    : "block";
}

function clearOutput() {
  document.getElementById("output").innerHTML = "";
}

function displayError(message) {
  toggleLoading(false);
  document.getElementById("output").textContent = message;
}

function displayOutput(content) {
  document.getElementById("output").innerHTML = content;
}

function displayCategorizedEmails(categories) {
  const outputDiv = document.getElementById("output");

  for (const [category, emails] of Object.entries(categories)) {
    if (emails.length > 0) {
      const categoryHeader = document.createElement("h3");
      categoryHeader.textContent = category;
      outputDiv.appendChild(categoryHeader);

      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Subject</th>
            <th>Sender</th>
            <th>Date</th>
            <th>Snippet</th>
            <th>Unsubscribe</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      emails
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((email) => {
          const row = table.insertRow();
          row.innerHTML = `
          <td>${email.subject}</td>
          <td>${email.sender}</td>
          <td>${email.date}</td>
          <td>${email.snippet}</td>
          <td>${
            email.unsubscribeLink
              ? `<button onclick="window.open('${email.unsubscribeLink}', '_blank')">Unsubscribe</button>`
              : "No link"
          }</td>
        `;
        });

      outputDiv.appendChild(table);
    }
  }
}
