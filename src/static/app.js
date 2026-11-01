document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => {
        option.remove();
      });

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, document.createTextNode(details.schedule));

        const availability = document.createElement("p");
        availability.className = "availability";
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        const spotsCount = document.createElement("span");
        spotsCount.className = "spots-count";
        spotsCount.textContent = spotsLeft;
        availability.append(availabilityLabel, spotsCount, document.createTextNode(" spots left"));

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length > 0) {
          const participantList = document.createElement("ul");
          participantList.className = "participant-list";
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.setAttribute(
              "aria-label",
              `Unregister ${email} from ${name}`
            );
            removeButton.title = "Unregister participant";
            removeButton.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" />
              </svg>
            `;

            participant.append(participantEmail, removeButton);
            participantList.appendChild(participant);
          });
          participantsSection.appendChild(participantList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "no-participants";
          emptyMessage.textContent = "No participants yet.";
          participantsSection.appendChild(emptyMessage);
        }

        activityCard.append(
          title,
          description,
          schedule,
          availability,
          participantsSection
        );

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

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    const participant = removeButton.closest("li");
    const activityCard = removeButton.closest(".activity-card");
    const activity = activityCard.querySelector("h4").textContent;
    const email = participant.querySelector("span").textContent;
    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      participant.remove();

      const participantList = activityCard.querySelector(".participant-list");
      if (participantList.children.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "no-participants";
        emptyMessage.textContent = "No participants yet.";
        participantList.replaceWith(emptyMessage);
      }

      const spotsCount = activityCard.querySelector(".spots-count");
      spotsCount.textContent = Number(spotsCount.textContent) + 1;

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
    } catch (error) {
      messageDiv.textContent = error.message;
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
      removeButton.disabled = false;
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Initialize app
  fetchActivities();
});
