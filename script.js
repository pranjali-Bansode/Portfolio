document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. PROJECT MODAL LOGIC
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

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.getAttribute("data-title");
      const subtitle = card.getAttribute("data-subtitle");
      const imgSrc = card.getAttribute("data-img");
      const desc = card.getAttribute("data-desc");
      const link = card.getAttribute("data-link");

      modalTitle.textContent = title;
      modalSubtitle.textContent = subtitle;
      modalImage.src = imgSrc;
      modalDescription.textContent = desc;
      modalLiveLink.href = link;

      modal.classList.add("active");
    });
  });

  const closeModal = () => {
    modal.classList.remove("active");
  };

  if (closeIcon) closeIcon.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // ==========================================
  // 2. CONTACT FORM BACKEND SUBMISSION LOGIC
  // ==========================================
  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector(".btn-send-message");
      const originalBtnText = submitBtn.innerHTML;

      // Get values from form inputs
      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (!fullname || !email || !message) {
        alert("Please fill in all fields.");
        return;
      }

      try {
        // UI Feedback: Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Sending...`;

        // Send request to your backend server
        const response = await fetch("http://localhost:5000/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fullname, email, message }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert("Message sent successfully! Check your inbox for confirmation.");
          contactForm.reset();
        } else {
          alert("Failed to send message: " + (data.error || "Unknown error occurred"));
        }
      } catch (error) {
        console.error("Error submitting contact form:", error);
        alert("Unable to reach the server. Please make sure your backend is running!");
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});