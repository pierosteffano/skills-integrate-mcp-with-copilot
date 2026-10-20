document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    element.textContent = text;
    return element;
  }

  function createActivityCard(name, details, index) {
    const card = document.createElement("article");
    card.className = "activity-card";
    card.dataset.activity = name;

    card.appendChild(createTextElement("h4", "", name));
    card.appendChild(createTextElement("p", "", details.description));

    const schedule = document.createElement("p");
    const scheduleLabel = document.createElement("strong");
    scheduleLabel.textContent = "Schedule: ";
    schedule.append(scheduleLabel, document.createTextNode(details.schedule));
    card.appendChild(schedule);

    const spotsLeft = details.max_participants - details.participants.length;
    const availability = document.createElement("p");
    const availabilityLabel = document.createElement("strong");
    availabilityLabel.textContent = "Availability: ";
    availability.append(
      availabilityLabel,
      document.createTextNode(`${spotsLeft} spots left`)
    );
    card.appendChild(availability);

    const participantsContainer = document.createElement("div");
    participantsContainer.className = "participants-container";
    const participantsHeading = createTextElement(
      "h5",
      "",
      "Participants:"
    );
    participantsContainer.appendChild(participantsHeading);

    if (details.participants.length > 0) {
      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      details.participants.forEach((email) => {
        const participant = document.createElement("li");
        participant.appendChild(
          createTextElement("span", "participant-email", email)
        );

        const unregisterButton = createTextElement("button", "delete-btn", "×");
        unregisterButton.type = "button";
        unregisterButton.dataset.activity = name;
        unregisterButton.dataset.email = email;
        unregisterButton.setAttribute(
          "aria-label",
          `Unregister ${email} from ${name}`
        );
        participant.appendChild(unregisterButton);
        participantsList.appendChild(participant);
      });

      participantsContainer.appendChild(participantsList);
    } else {
      participantsContainer.appendChild(
        createTextElement("p", "", "No participants yet")
      );
    }
    card.appendChild(participantsContainer);

    const registerButton = createTextElement(
      "button",
      "register-btn",
      "Register student"
    );
    registerButton.type = "button";
    registerButton.setAttribute("aria-expanded", "false");
    registerButton.setAttribute("aria-controls", `signup-form-${index}`);
    card.appendChild(registerButton);

    const signupForm = document.createElement("form");
    signupForm.id = `signup-form-${index}`;
    signupForm.className = "activity-signup-form hidden";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";
    const emailId = `student-email-${index}`;
    const emailLabel = createTextElement("label", "", "Student email:");
    emailLabel.htmlFor = emailId;
    const emailInput = document.createElement("input");
    emailInput.id = emailId;
    emailInput.name = "email";
    emailInput.type = "email";
    emailInput.required = true;
    emailInput.placeholder = "your-email@mergington.edu";
    formGroup.append(emailLabel, emailInput);
    signupForm.appendChild(formGroup);

    const submitButton = createTextElement("button", "", "Sign up");
    submitButton.type = "submit";
    signupForm.appendChild(submitButton);
    card.appendChild(signupForm);

    return card;
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      const activities = await response.json();

      activitiesList.replaceChildren();
      Object.entries(activities).forEach(([name, details], index) => {
        activitiesList.appendChild(createActivityCard(name, details, index));
      });
    } catch (error) {
      activitiesList.replaceChildren(
        createTextElement(
          "p",
          "",
          "Failed to load activities. Please try again later."
        )
      );
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(button) {
    const activity = button.dataset.activity;
    const email = button.dataset.email;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  activitiesList.addEventListener("click", (event) => {
    const unregisterButton = event.target.closest(".delete-btn");
    if (unregisterButton) {
      handleUnregister(unregisterButton);
      return;
    }

    const registerButton = event.target.closest(".register-btn");
    if (registerButton) {
      const signupForm = document.getElementById(
        registerButton.getAttribute("aria-controls")
      );
      signupForm.classList.toggle("hidden");
      const isExpanded = !signupForm.classList.contains("hidden");
      registerButton.setAttribute("aria-expanded", String(isExpanded));
      if (isExpanded) {
        signupForm.querySelector("input").focus();
      }
    }
  });

  activitiesList.addEventListener("submit", async (event) => {
    if (!event.target.matches(".activity-signup-form")) {
      return;
    }
    event.preventDefault();

    const signupForm = event.target;
    const activity = signupForm.closest(".activity-card").dataset.activity;
    const email = new FormData(signupForm).get("email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
