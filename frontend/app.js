
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("message");
    const refreshButton = document.getElementById("refresh-button");
    const enquiryList = document.getElementById("enquiry-list");
    const enquiryCount = document.getElementById("enquiry-count");
    const enquiryDetails = document.getElementById("enquiry-details");

    let enquiries = [];
    let selectedEnquiryId = null;

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.hidden = false;

        message.style.background = isError ? "#fff1f0" : "#edf8ee";
        message.style.color = isError ? "#a32920" : "#246b35";
    }

    function clearMessage() {
        message.hidden = true;
        message.textContent = "";
    }

    function formatDate(value) {
        if (!value) {
            return "Not specified";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    }

    function createDetailRow(label, value) {
        const row = document.createElement("div");
        row.className = "detail-row";

        const labelElement = document.createElement("span");
        labelElement.className = "detail-label";
        labelElement.textContent = label;

        const valueElement = document.createElement("div");
        valueElement.className = "detail-value";
        valueElement.textContent =
            value !== null && value !== undefined && value !== ""
                ? String(value)
                : "Not specified";

        row.append(labelElement, valueElement);

        return row;
    }

    
function renderEnquiryDetails(enquiry) {
    enquiryDetails.replaceChildren();

    const fields = [
        ["Customer", enquiry.customer_name],
        ["Phone", enquiry.phone],
        ["Email", enquiry.email],
        ["Original message", enquiry.raw_message],
        ["Intent", enquiry.intent],
        ["Requested action", enquiry.action],
        ["Location", enquiry.location],
        ["Requirement", enquiry.requirement],
        ["Budget", enquiry.budget],
        ["Date", enquiry.enquiry_date],
        ["Number of people", enquiry.number_of_people],
        ["Additional details", enquiry.additional_details],
        ["Status", enquiry.status],
        ["Follow-up date", enquiry.follow_up_date],
        ["Created at", formatDate(enquiry.created_at)]
    ];

    for (const [label, value] of fields) {
        enquiryDetails.appendChild(createDetailRow(label, value));
    }

    // Reply section
    const replySection = document.createElement("section");
    replySection.className = "reply-section";

    const heading = document.createElement("h4");
    heading.textContent = "Customer reply";

    const description = document.createElement("p");
    description.className = "reply-description";
    description.textContent =
        "Generate a draft, edit it if needed, then copy it for manual sending.";

    const editor = document.createElement("textarea");
    editor.className = "reply-editor";
    editor.placeholder = "Your generated reply will appear here...";
    editor.setAttribute("aria-label", "Customer reply draft");
    editor.value = enquiry.generated_reply || "";

    const actions = document.createElement("div");
    actions.className = "reply-actions";

    const generateButton = document.createElement("button");
    generateButton.type = "button";
    generateButton.className = "button button-primary";
    generateButton.textContent = "Generate reply";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "button button-secondary";
    saveButton.textContent = "Save edits";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "button button-secondary";
    copyButton.textContent = "Copy reply";

    const replyStatus = document.createElement("p");
    replyStatus.className = "reply-status";
    replyStatus.hidden = true;
    replyStatus.setAttribute("role", "status");

    function showReplyStatus(text, isError = false) {
        replyStatus.textContent = text;
        replyStatus.className =
            `reply-status ${isError ? "error" : "success"}`;
        replyStatus.hidden = false;
    }

    async function sendRequest(url, method, body = undefined) {
        const options = { method };

        if (body !== undefined) {
            options.headers = {
                "Content-Type": "application/json"
            };
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            let detail = `Request failed (HTTP ${response.status}).`;

            try {
                const errorData = await response.json();
                detail = errorData.detail || detail;
            } catch {
                // Keep the default error message.
            }

            throw new Error(detail);
        }

        return response.json();
    }

    generateButton.addEventListener("click", async () => {
        generateButton.disabled = true;
        saveButton.disabled = true;
        copyButton.disabled = true;
        generateButton.textContent = "Generating...";
        replyStatus.hidden = true;

        try {
            const result = await sendRequest(
                `/api/enquiries/${enquiry.id}/reply`,
                "POST"
            );

            editor.value = result.reply;
            enquiry.generated_reply = result.reply;

            showReplyStatus("Reply generated and saved successfully.");
        } catch (error) {
            showReplyStatus(error.message, true);
        } finally {
            generateButton.disabled = false;
            saveButton.disabled = false;
            copyButton.disabled = false;
            generateButton.textContent = "Generate reply";
        }
    });

    saveButton.addEventListener("click", async () => {
        if (!editor.value.trim()) {
            showReplyStatus(
                "Enter a reply before saving.",
                true
            );
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
        replyStatus.hidden = true;

        try {
            const result = await sendRequest(
                `/api/enquiries/${enquiry.id}/reply`,
                "PUT",
                { reply: editor.value }
            );

            editor.value = result.reply;
            enquiry.generated_reply = result.reply;

            showReplyStatus("Reply edits saved successfully.");
        } catch (error) {
            showReplyStatus(error.message, true);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save edits";
        }
    });

    copyButton.addEventListener("click", async () => {
        if (!editor.value.trim()) {
            showReplyStatus(
                "There is no reply to copy yet.",
                true
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(editor.value);
            showReplyStatus(
                "Reply copied. You can now paste it into your messaging app."
            );
        } catch (error) {
            console.error("Clipboard copy failed:", error);
            showReplyStatus(
                "Copying was blocked by the browser. Select the text and copy it manually.",
                true
            );
        }
    });

    actions.append(generateButton, saveButton, copyButton);

    replySection.append(
        heading,
        description,
        editor,
        actions,
        replyStatus
    );

    enquiryDetails.appendChild(replySection);
}

    function renderEnquiryList() {
        enquiryList.replaceChildren();
        enquiryCount.textContent = String(enquiries.length);

        if (enquiries.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "muted";
            emptyMessage.textContent = "No enquiries found.";
            enquiryList.appendChild(emptyMessage);

            enquiryDetails.innerHTML = `
                <div class="empty-state">
                    <h4>No enquiries yet</h4>
                    <p>Enquiries will appear here once they have been created.</p>
                </div>
            `;

            selectedEnquiryId = null;
            return;
        }

        for (const enquiry of enquiries) {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "enquiry-item";

            if (enquiry.id === selectedEnquiryId) {
                item.classList.add("selected");
            }

            const heading = document.createElement("h4");
            heading.textContent =
                enquiry.customer_name || "Unknown customer";

            const summary = document.createElement("p");
            summary.textContent =
                enquiry.requirement ||
                enquiry.intent ||
                enquiry.raw_message ||
                "No enquiry details";

            const location = document.createElement("p");
            location.textContent = enquiry.location || "Location not specified";

            const status = document.createElement("span");
            status.className = "status-label";
            status.textContent = enquiry.status || "new";

            item.append(heading, summary, location, status);

            item.addEventListener("click", () => {
                selectedEnquiryId = enquiry.id;
                renderEnquiryList();
                renderEnquiryDetails(enquiry);
            });

            enquiryList.appendChild(item);
        }

        const selectedEnquiry = enquiries.find(
            enquiry => enquiry.id === selectedEnquiryId
        );

        if (selectedEnquiry) {
            renderEnquiryDetails(selectedEnquiry);
        } else {
            selectedEnquiryId = enquiries[0].id;
            renderEnquiryList();
            renderEnquiryDetails(enquiries[0]);
        }
    }

    async function loadEnquiries() {
        clearMessage();
        refreshButton.disabled = true;
        enquiryList.textContent = "Loading enquiries...";

        try {
            const response = await fetch("/api/enquiries/");

            if (!response.ok) {
                throw new Error(
                    `Unable to load enquiries (HTTP ${response.status}).`
                );
            }

            enquiries = await response.json();

            renderEnquiryList();

            showMessage(
                `Loaded ${enquiries.length} ${enquiries.length === 1 ? "enquiry" : "enquiries"}.`
            );
        } catch (error) {
            console.error("Failed to load enquiries:", error);
            enquiryList.textContent = "Could not load enquiries.";
            showMessage(
                error.message || "An unexpected error occurred.",
                true
            );
        } finally {
            refreshButton.disabled = false;
        }
    }

    refreshButton.addEventListener("click", loadEnquiries);

    loadEnquiries();
});