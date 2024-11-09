document.getElementById("analyzeEmail").addEventListener("click", function () {
  handleAnalyzeClick("email");
});

document.getElementById("analyzeSocial").addEventListener("click", function () {
  handleAnalyzeClick("social");
});

function handleAnalyzeClick(type) {
  // Show loading message and hide output
  document.getElementById("loadingMessage").style.display = "block";
  document.getElementById("output").style.display = "none";
  document.getElementById("output").innerHTML = ""; // Clear previous output

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
      document.getElementById("output").textContent =
        "Failed to retrieve Google token.";
      document.getElementById("loadingMessage").style.display = "none";
      return;
    }

    // Now that the token is available, proceed with your API request
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
              const subject =
                messageData.payload.headers.find(
                  (header) => header.name === "Subject"
                )?.value || "No Subject";
              const sender =
                messageData.payload.headers.find(
                  (header) => header.name === "From"
                )?.value || "Unknown Sender";
              const date =
                messageData.payload.headers.find(
                  (header) => header.name === "Date"
                )?.value || "No Date";
              const snippet = messageData.snippet || "No Snippet Available";

              const emailData = {
                subject,
                sender,
                date,
                snippet,
              };

              // Check for Unsubscribe Link (added check for undefined body)
              let body = "";
              if (
                messageData.payload.parts &&
                messageData.payload.parts[0].body
              ) {
                body = messageData.payload.parts[0].body.data || "";
              }

              if (body) {
                const decodedBody = atob(
                  body.replace(/-/g, "+").replace(/_/g, "/")
                );
                const unsubscribeLink = decodedBody.match(
                  /<a[^>]+href="([^"]+unsubscribe[^"]+)"/i
                );

                if (unsubscribeLink) {
                  emailData.unsubscribeLink = unsubscribeLink[1];
                }
              }

              // Categorize emails based on subject keywords
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
  });
}

function analyzeSocialMedia() {
  // Placeholder function for social media analysis
  setTimeout(() => {
    document.getElementById("loadingMessage").style.display = "none";
    document.getElementById("output").innerHTML =
      "<p>Social Media analysis is not implemented yet.</p>";
    document.getElementById("output").style.display = "block";
    adjustPopupSize();
  }, 2000); // Simulate a 2-second delay
}

function getSelectedFolders() {
  const folderSelect = document.getElementById("folderSelect");
  if (!folderSelect) {
    console.error("Folder select element not found");
    return null;
  }

  const selectedFolder = folderSelect.value;

  if (!selectedFolder) {
    console.error("No folder selected.");
    return null;
  }

  return selectedFolder;
}

function displayCategorizedEmails(categories) {
  const outputDiv = document.getElementById("output");

  for (const category in categories) {
    if (categories[category].length > 0) {
      // Create category header
      const categoryHeader = document.createElement("h3");
      categoryHeader.textContent = category;
      outputDiv.appendChild(categoryHeader);

      // Create table for the category
      const table = document.createElement("table");
      table.id = `${category.replace(/\s+/g, "")}Table`;

      // Insert header row
      const headerRow = table.insertRow();
      headerRow.insertCell(0).textContent = "Subject";
      headerRow.insertCell(1).textContent = "Sender";
      headerRow.insertCell(2).textContent = "Date";
      headerRow.insertCell(3).textContent = "Snippet";
      headerRow.insertCell(4).textContent = "Promotion";
      headerRow.insertCell(5).textContent = "Inactive";
      headerRow.insertCell(6).textContent = "Unsubscribe";  // Unsubscribe heading inside the table

      // Sort emails by date (newest first)
      categories[category].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Insert data rows
      categories[category].forEach((email) => {
        const row = table.insertRow();
        row.insertCell(0).textContent = email.subject;
        row.insertCell(1).textContent = email.sender;
        row.insertCell(2).textContent = email.date;
        row.insertCell(3).textContent = email.snippet;
        row.insertCell(4).textContent = isPromotion(email.subject) ? "Yes" : "No";
        row.insertCell(5).textContent = isInactive(email.labelIds) ? "Yes" : "No";

        // Unsubscribe Button
        const unsubscribeCell = row.insertCell(6);  // Correct column index
        if (email.unsubscribeLink) {
          const unsubscribeButton = document.createElement("button");
          unsubscribeButton.textContent = "Unsubscribe";
          unsubscribeButton.onclick = function () {
            window.open(email.unsubscribeLink, "_blank");
          };
          unsubscribeCell.appendChild(unsubscribeButton);
        } else {
          unsubscribeCell.textContent = "No link";
        }
      });

      outputDiv.appendChild(table);  // Add table to the output div
    }
  }
}


function isPromotion(subject) {
  return /deal|newsletter|offer/i.test(subject);
}

function isInactive(labelIds) {
  return !labelIds || labelIds.includes("SENT");
}

function adjustPopupSize() {
  const output = document.getElementById("output");
  const contentHeight = output.scrollHeight + 200; // Added padding for header and button
  const contentWidth = 800; // Increased width to avoid horizontal scrolling

  const minHeight = 300; // Increased height for larger content area
  const minWidth = 600; // Increased minimum width to accommodate larger tables

  const finalHeight = Math.max(contentHeight, minHeight);
  const finalWidth = Math.max(contentWidth, minWidth);

  chrome.windows.getCurrent((window) => {
    const windowHeight = Math.max(window.height, finalHeight);
    const windowWidth = Math.max(window.width, finalWidth);

    const newLeft = Math.max(window.left, 0);
    const newTop = Math.max(window.top, 0);

    chrome.windows.update(window.id, {
      width: windowWidth,
      height: windowHeight,
      left: newLeft,
      top: newTop,
    });
  });
}
