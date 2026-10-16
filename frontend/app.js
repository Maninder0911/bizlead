
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("message");
    const refreshButton = document.getElementById("refresh-button");
    const enquiryList = document.getElementById("enquiry-list");
    const enquiryCount = document.getElementById("enquiry-count");
    const enquiryDetails = document.getElementById("enquiry-details");

    const newEnquiryButton =
        document.getElementById("new-enquiry-button");

    const newEnquiryPanel =
        document.getElementById("new-enquiry-panel");

    const cancelEnquiryButton =
        document.getElementById("cancel-enquiry-button");

    const newEnquiryForm =
        document.getElementById("new-enquiry-form");

    const submitEnquiryButton =
        document.getElementById("submit-enquiry-button");

    const enquirySearch = document.getElementById("enquiry-search");
    const statusFilter = document.getElementById("status-filter");

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
        // Enquiry status and follow-up management
        const managementSection = document.createElement("section");
        managementSection.className = "reply-section";

        const managementHeading = document.createElement("h4");
        managementHeading.textContent = "Enquiry management";

        const statusField = document.createElement("div");
        statusField.className = "form-field";

        const statusLabel = document.createElement("label");
        statusLabel.textContent = "Status";
        statusLabel.htmlFor = "enquiry-status";

        const statusSelect = document.createElement("select");
        statusSelect.id = "enquiry-status";
        statusSelect.className = "management-input";

        const statuses = [
            ["new", "New"],
            ["contacted", "Contacted"],
            ["qualified", "Qualified"],
            ["converted", "Converted"],
            ["lost", "Lost"]
        ];

        // Preserve an existing status even if it is not in our standard list.
        const currentStatus = enquiry.status || "new";
        if (!statuses.some(([value]) => value === currentStatus)) {
            statuses.push([currentStatus, currentStatus]);
        }

        for (const [value, label] of statuses) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            statusSelect.appendChild(option);
        }

        statusSelect.value = currentStatus;
        statusField.append(statusLabel, statusSelect);

        const followUpField = document.createElement("div");
        followUpField.className = "form-field";

        const followUpLabel = document.createElement("label");
        followUpLabel.textContent = "Follow-up date";
        followUpLabel.htmlFor = "enquiry-follow-up";

        const followUpInput = document.createElement("input");
        followUpInput.id = "enquiry-follow-up";
        followUpInput.type = "date";
        followUpInput.className = "management-input";
        followUpInput.value = enquiry.follow_up_date
            ? enquiry.follow_up_date.slice(0, 10)
            : "";

        const followUpHint = document.createElement("p");
        followUpHint.className = "muted";
        followUpHint.textContent =
            "Leave the date unchanged if you only want to update the status.";

        followUpField.append(followUpLabel, followUpInput, followUpHint);

        const managementActions = document.createElement("div");
        managementActions.className = "reply-actions";

        const saveManagementButton = document.createElement("button");
        saveManagementButton.type = "button";
        saveManagementButton.className = "button button-primary";
        saveManagementButton.textContent = "Save changes";

        const managementStatus = document.createElement("p");
        managementStatus.className = "reply-status";
        managementStatus.hidden = true;
        managementStatus.setAttribute("role", "status");

        saveManagementButton.addEventListener("click", async () => {
            saveManagementButton.disabled = true;
            saveManagementButton.textContent = "Saving...";
            managementStatus.hidden = true;

            const updateData = {
                status: statusSelect.value
            };

            // Omit an empty date so an existing date is not accidentally cleared.
            if (followUpInput.value) {
                updateData.follow_up_date = followUpInput.value;
            }
            try {
                const updatedEnquiry = await sendRequest(
                    `/api/enquiries/${enquiry.id}`,
                    "PATCH",
                    updateData
                );

                Object.assign(enquiry, updatedEnquiry);

                // Refresh the list and details first.
                selectedEnquiryId = enquiry.id;
                await loadEnquiries();

                // Show the message in the page-level message area.
                showMessage("Enquiry details updated successfully.");
            } catch (error) {
                showMessage(error.message, true);
            } finally {
                saveManagementButton.disabled = false;
                saveManagementButton.textContent = "Save changes";
            }

        });

        function showReplyStatusInManagement(text, isError = false) {
            managementStatus.textContent = text;
            managementStatus.className =
                `reply-status ${isError ? "error" : "success"}`;
            managementStatus.hidden = false;
        }

        managementActions.appendChild(saveManagementButton);
        managementSection.append(
            managementHeading,
            statusField,
            followUpField,
            managementActions,
            managementStatus
        );
        enquiryDetails.appendChild(managementSection);


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
        const searchTerm = enquirySearch.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const visibleEnquiries = enquiries.filter(enquiry => {
            const searchableText = [
                enquiry.customer_name,
                enquiry.phone,
                enquiry.email,
                enquiry.raw_message,
                enquiry.requirement,
                enquiry.location,
                enquiry.intent,
                enquiry.budget
            ].filter(Boolean).join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);
            const matchesStatus =
                selectedStatus === "all" ||
                (enquiry.status || "new").toLowerCase() === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        enquiryCount.textContent = String(visibleEnquiries.length);


        if (visibleEnquiries.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "muted";
            emptyMessage.textContent = enquiries.length === 0
                ? "No enquiries yet."
                : "No enquiries match your search or filter.";
            enquiryList.appendChild(emptyMessage);

            enquiryDetails.innerHTML = `
                <div class="empty-state">
                    <h4>No matching enquiry</h4>
                    <p>Select another status or change your search.</p>
                </div>
`;
            selectedEnquiryId = null;
            return;
        }

        const hasVisibleSelection = visibleEnquiries.some(
            enquiry => enquiry.id === selectedEnquiryId
        );

        if (!hasVisibleSelection) {
            selectedEnquiryId = visibleEnquiries[0].id;
        }
        for (const enquiry of visibleEnquiries) {
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

        const selectedEnquiry = visibleEnquiries.find(
            enquiry => enquiry.id === selectedEnquiryId
        );

        if (selectedEnquiry) {
            renderEnquiryDetails(selectedEnquiry);
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

    enquirySearch.addEventListener("input", () => {
        clearMessage();
        renderEnquiryList();
    });

    statusFilter.addEventListener("change", () => {
        clearMessage();
        renderEnquiryList();
    });

    refreshButton.addEventListener("click", loadEnquiries);

    newEnquiryButton.addEventListener("click", () => {
        newEnquiryPanel.hidden = false;
        document.getElementById("customer-name").focus();
    });

    cancelEnquiryButton.addEventListener("click", () => {
        newEnquiryPanel.hidden = true;
        newEnquiryForm.reset();
        clearMessage();
    });

    newEnquiryForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(newEnquiryForm);

        const enquiryData = {
            customer_name: formData.get("customer_name").trim(),
            phone: formData.get("phone").trim() || null,
            email: formData.get("email").trim() || null,
            raw_message: formData.get("raw_message").trim()
        };

        if (!enquiryData.customer_name || !enquiryData.raw_message) {
            showMessage(
                "Customer name and enquiry message are required.",
                true
            );
            return;
        }

        submitEnquiryButton.disabled = true;
        submitEnquiryButton.textContent = "Saving...";
        clearMessage();

        try {
            const response = await fetch("/api/enquiries/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(enquiryData)
            });

            if (!response.ok) {
                let detail = `Failed to create enquiry (HTTP ${response.status}).`;

                try {
                    const errorData = await response.json();
                    detail = errorData.detail || detail;
                } catch {
                    // Retain the default error message.
                }

                throw new Error(
                    typeof detail === "string"
                        ? detail
                        : JSON.stringify(detail)
                );
            }

            const createdEnquiry = await response.json();

            newEnquiryForm.reset();
            newEnquiryPanel.hidden = true;

            // Reload the list while preserving the new enquiry's selection.
            selectedEnquiryId = createdEnquiry.id;
            await loadEnquiries();

            showMessage(
                "Enquiry created successfully. AI extraction may leave some fields empty if the original message doesn't contain that information."
            );
        } catch (error) {
            console.error("Failed to create enquiry:", error);
            showMessage(error.message, true);
        } finally {
            submitEnquiryButton.disabled = false;
            submitEnquiryButton.textContent = "Save enquiry";
        }
    });

    loadEnquiries();
});