const usernameSetup = document.getElementById("usernameSetup");
const chatApp = document.getElementById("chatApp");

const usernameInput = document.getElementById("usernameInput");
const displayNameInput = document.getElementById("displayNameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const usernameMessage = document.getElementById("usernameMessage");

const currentUsername = document.getElementById("currentUsername");
const logoutBtn = document.getElementById("logoutBtn");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

const selectedUserName = document.getElementById("selectedUserName");
const messagesBox = document.getElementById("messagesBox");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

const token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user"));

let selectedUser = null;
let currentConversation = null;
let socket = null;

if (!token || !user) {
  window.location.href = "./login.html";
}

function showChatApp() {
  usernameSetup.classList.add("hidden");
  chatApp.classList.remove("hidden");

  currentUsername.textContent = "@" + user.username;

  connectSocket();
  loadMyConversations();
}

function showUsernameSetup() {
  usernameSetup.classList.remove("hidden");
  chatApp.classList.add("hidden");
}

function connectSocket() {
  if (socket) return;

  socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log("Connected to socket:", socket.id);
    socket.emit("join_user_room", user._id);
  });

  socket.on("receive_message", (message) => {
    if (
      currentConversation &&
      message.conversationId === currentConversation._id
    ) {
      addMessageToBox(message);
    }

    loadMyConversations();
  });
}

function addMessageToBox(message) {
  const emptyChat = document.querySelector(".empty-chat");
  if (emptyChat) {
    emptyChat.remove();
  }

  const div = document.createElement("div");

  if (message.senderId === user._id) {
    div.className = "message-bubble my-message";
  } else {
    div.className = "message-bubble other-message";
  }

  div.textContent = message.text;

  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function clearMessagesBox() {
  messagesBox.innerHTML = "";
}

async function loadMessages(conversationId) {
  try {
    clearMessagesBox();

    const response = await fetch(API_URL + "/api/messages/" + conversationId, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const messages = await response.json();

    if (!response.ok) {
      messagesBox.innerHTML = `<p class="empty-chat">${messages.message || "Could not load messages."}</p>`;
      return;
    }

    if (messages.length === 0) {
      messagesBox.innerHTML = `<p class="empty-chat">No messages yet. Say hello.</p>`;
      return;
    }

    messages.forEach((message) => {
      addMessageToBox(message);
    });
  } catch (error) {
    messagesBox.innerHTML = `<p class="empty-chat">Error: ${error.message}</p>`;
  }
}

async function openConversation(foundUser) {
  try {
    selectedUser = foundUser;
    selectedUserName.textContent = "@" + foundUser.username;

    const response = await fetch(API_URL + "/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        receiverId: foundUser._id
      })
    });

    const conversation = await response.json();

    if (!response.ok) {
      messagesBox.innerHTML = `<p class="empty-chat">${conversation.message || "Could not open conversation."}</p>`;
      return;
    }

    currentConversation = conversation;

    await loadMessages(currentConversation._id);
    await loadMyConversations();
  } catch (error) {
    messagesBox.innerHTML = `<p class="empty-chat">Error: ${error.message}</p>`;
  }
}

async function loadMyConversations() {
  try {
    const response = await fetch(API_URL + "/api/conversations", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const conversations = await response.json();

    if (!response.ok) {
      return;
    }

    const oldList = document.getElementById("conversationList");
    if (oldList) {
      oldList.remove();
    }

    const list = document.createElement("div");
    list.id = "conversationList";
    list.className = "conversation-list";

    const title = document.createElement("h3");
    title.textContent = "Chats";
    list.appendChild(title);

    conversations.forEach((conversation) => {
      const otherMember = conversation.members.find(
        (member) => member._id !== user._id
      );

      if (!otherMember) return;

      const div = document.createElement("div");
      div.className = "user-result";
      div.innerHTML = `
        <strong>@${otherMember.username}</strong>
        <span>${conversation.lastMessage || "No messages yet"}</span>
      `;

      div.addEventListener("click", () => {
        openConversation(otherMember);
      });

      list.appendChild(div);
    });

    searchResults.parentNode.insertBefore(list, searchResults);
  } catch (error) {
    console.log("Conversation loading failed:", error.message);
  }
}

if (user.username) {
  showChatApp();
} else {
  showUsernameSetup();
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("firebaseToken");
    localStorage.removeItem("user");

    window.location.href = "./login.html";
  });
}

saveUsernameBtn.addEventListener("click", async () => {
  try {
    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!username) {
      usernameMessage.textContent = "Username is required.";
      return;
    }

    const response = await fetch(API_URL + "/api/users/set-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        username,
        displayName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      usernameMessage.textContent = data.message || "Could not save username.";
      return;
    }

    user = data.user;
    localStorage.setItem("user", JSON.stringify(user));

    usernameMessage.textContent = "Username saved.";

    setTimeout(() => {
      showChatApp();
    }, 500);
  } catch (error) {
    usernameMessage.textContent = "Error: " + error.message;
  }
});

searchBtn.addEventListener("click", async () => {
  try {
    const username = searchInput.value.trim();

    if (!username) {
      searchResults.innerHTML = "<p>Type a username first.</p>";
      return;
    }

    const response = await fetch(
      API_URL + "/api/users/search?username=" + username,
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    const users = await response.json();

    if (!response.ok) {
      searchResults.innerHTML = `<p>${users.message || "Search failed."}</p>`;
      return;
    }

    if (users.length === 0) {
      searchResults.innerHTML = "<p>No users found.</p>";
      return;
    }

    searchResults.innerHTML = "<h3>Search results</h3>";

    users.forEach((foundUser) => {
      const div = document.createElement("div");
      div.className = "user-result";
      div.innerHTML = `
        <strong>@${foundUser.username}</strong>
        <span>${foundUser.displayName || foundUser.username}</span>
      `;

      div.addEventListener("click", () => {
        openConversation(foundUser);
      });

      searchResults.appendChild(div);
    });
  } catch (error) {
    searchResults.innerHTML = `<p>Error: ${error.message}</p>`;
  }
});

sendMessageBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();

  if (!text) return;

  if (!selectedUser || !currentConversation) {
    messagesBox.innerHTML = `<p class="empty-chat">Select a user first.</p>`;
    return;
  }

  socket.emit("send_message", {
    conversationId: currentConversation._id,
    senderId: user._id,
    receiverId: selectedUser._id,
    text
  });

  messageInput.value = "";
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessageBtn.click();
  }
});