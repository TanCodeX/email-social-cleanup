chrome.identity.getAuthToken({ interactive: true }, function (token) {
  fetch("https://www.googleapis.com/gmail/v1/users/me/messages", {
    headers: new Headers({ Authorization: "Bearer " + token }),
  })
    .then((response) => response.json())
    .then((data) => console.log("Fetched emails: ", data))
    .catch((error) => console.error("Error fetching emails: ", error));
});
