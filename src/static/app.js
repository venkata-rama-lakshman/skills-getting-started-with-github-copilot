document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const unregisterDialog = document.getElementById("unregister-dialog");
  const unregisterForm = document.getElementById("unregister-form");
  const unregisterDialogMessage = document.getElementById("unregister-dialog-message");
  const unregisterConfirmButton = unregisterForm.querySelector('button[type="submit"]');
  const unregisterCancelButton = unregisterForm.querySelector(".dialog-cancel-button");
  let selectedParticipant = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        const participantsList = activityCard.querySelector(".participants-list");
        if (participants.length) {
          participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantDot = document.createElement("span");
            participantDot.className = "participant-dot";
            participantDot.setAttribute("aria-hidden", "true");

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.className = "remove-participant-button";
            removeButton.type = "button";
            removeButton.dataset.activity = name;
            removeButton.dataset.email = participant;
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            removeButton.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
              </svg>
            `;

            participantItem.append(participantDot, participantEmail, removeButton);
            participantsList.appendChild(participantItem);
          });
        } else {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-item empty";
          emptyItem.textContent = "No students signed up yet.";
          participantsList.appendChild(emptyItem);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-participant-button");
    if (!removeButton) {
      return;
    }

    selectedParticipant = {
      activity: removeButton.dataset.activity,
      email: removeButton.dataset.email,
    };
    unregisterDialogMessage.textContent =
      `Are you sure you want to unregister ${selectedParticipant.email} from ${selectedParticipant.activity}?`;
    unregisterDialog.showModal();
  });

  unregisterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedParticipant) {
      return;
    }

    unregisterConfirmButton.disabled = true;
    const { activity, email } = selectedParticipant;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      unregisterDialog.close();
      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    } finally {
      unregisterConfirmButton.disabled = false;
    }

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  unregisterCancelButton.addEventListener("click", () => {
    unregisterDialog.close();
  });

  unregisterDialog.addEventListener("close", () => {
    selectedParticipant = null;
  });

  // Initialize app
  fetchActivities();
});
