// ==========================================
// BACKEND CONFIG
// ==========================================
const BACKEND_URL = "https://portfolio-35qz.onrender.com";

let sendMessage;


  // ==========================================
  // PROJECT MODAL
  // ==========================================
  const cards = document.querySelectorAll(".projectcard");
  const modal = document.getElementById("projectModal");

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalImage = document.getElementById("modalImage");
  const modalDescription = document.getElementById("modalDescription");
  const modalLiveLink = document.getElementById("modalLiveLink");

  const closeIcon = document.getElementById("closeModalIcon");
  const closeBtn = document.getElementById("closeModalBtn");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      modalTitle.textContent = card.dataset.title;
      modalSubtitle.textContent = card.dataset.subtitle;
      modalImage.src = card.dataset.img;
      modalDescription.textContent = card.dataset.desc;
      modalLiveLink.href = card.dataset.link;

      modal.classList.add("active");
    });
  });

  const closeModal = () => modal.classList.remove("active");

  closeIcon?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });


  // ==========================================
  // CONTACT FORM
  // ==========================================
  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = contactForm.querySelector(".btn-send-message");
      const original = btn.innerHTML;

      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (!fullname || !email || !message) return;

      try {
        btn.disabled = true;
        btn.innerHTML = "Sending...";

        const res = await fetch(`${BACKEND_URL}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullname, email, message }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          alert("Message sent successfully!");
          contactForm.reset();
        } else {
          alert(data.error || "Failed to send message");
        }

      } catch (err) {
        console.error(err);
        alert("Server error. Try again later.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  }

// ===============================
// CHATBOT FIX (FINAL)
// ===============================

const chatBtn = document.getElementById("chatbot-btn");
const chatContainer = document.getElementById("chatbot-container");
const chatOverlay = document.getElementById("chatbot-overlay");
const chatMessages = document.getElementById("chatbot-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// ✅ SAFETY CHECK
if (!chatBtn || !chatContainer || !chatOverlay) {
  console.error("❌ Chatbot elements missing");
}

// OPEN
function openChatbot() {
  chatContainer.classList.add("active");
  chatOverlay.classList.add("active");

  setTimeout(() => userInput.focus(), 100);

  if (chatMessages.children.length === 0) {
    addMessage(
      "bot",
      "Hi! I'm Pranjali's AI Assistant 👋 Ask me about skills, projects or experience."
    );
  }
}

// CLOSE
function closeChatbot() {
  chatContainer.classList.remove("active");
  chatOverlay.classList.remove("active");
}

// BUTTON CLICK
chatBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // ✅ IMPORTANT
  openChatbot();
});

// OVERLAY CLICK = CLOSE
chatOverlay.addEventListener("click", closeChatbot);

// 🚫 PREVENT CLOSE WHEN CLICKING INSIDE CHAT
chatContainer.addEventListener("click", (e) => {
  e.stopPropagation(); // ✅ THIS FIXES YOUR ISSUE
});

// ESC KEY
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeChatbot();
});

// SEND MESSAGE
async function sendMessageHandler() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  userInput.value = "";

  const loading = addMessage("bot", "Typing...");

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    loading.innerText = data.reply || "No response.";

  } catch (err) {
    console.error(err);
    loading.innerText = "❌ Server error. Try again later.";
  }
}

// BUTTON
sendBtn.addEventListener("click", sendMessageHandler);

// ENTER KEY
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessageHandler();
});

// GLOBAL ACCESS
window.sendMessage = sendMessageHandler;

// QUICK BUTTONS
window.sendQuick = function (type) {
  let msg = "";

  if (type === "skills") msg = "Tell me about Pranjali's skills";
  if (type === "projects") msg = "Tell me about Pranjali's projects";
  if (type === "contact") msg = "How to contact Pranjali";

  userInput.value = msg;
  sendMessageHandler();
};

// ADD MESSAGE UI
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;

  chatMessages.appendChild(div);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  return div;
}