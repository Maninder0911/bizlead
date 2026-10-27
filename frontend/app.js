
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("message");
    const refreshButton = document.getElementById("refresh-button");
    const enquiryList = document.getElementById("enquiry-list");
    const enquiryCount = document.getElementById("enquiry-count");
    const enquiryDetails = document.getElementById("enquiry-details");
    const followUpDueTodayCount = document.getElementById("follow-up-due-today");
    const followUpOverdueCount = document.getElementById("follow-up-overdue");
    const followUpUpcomingCount = document.getElementById("follow-up-upcoming");

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

    const allEnquiriesViewButton = document.getElementById("all-enquiries-view");
    const needsAttentionViewButton = document.getElementById("needs-attention-view");

    let currentEnquiryView = "all";

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

        const followUpStatus = getFollowUpStatus(enquiry);

        const followUpBanner = document.createElement("div");
        followUpBanner.className =
            `follow-up-status ${followUpStatus.className}`;
        followUpBanner.textContent = followUpStatus.label;
        followUpBanner.setAttribute("role", "status");

        enquiryDetails.appendChild(followUpBanner);

        for (const [label, value] of fields) {
            enquiryDetails.appendChild(createDetailRow(label, value));
        }
        // Allow retrying extraction when no extracted details are present.
        const extractedFields = [
            enquiry.intent,
            enquiry.action,
            enquiry.location,
            enquiry.requirement,
            enquiry.budget,
            enquiry.enquiry_date,
            enquiry.number_of_people,
            enquiry.additional_details
        ];

        const hasExtractedDetails = extractedFields.some(
            value => value !== null &&
                value !== undefined &&
                value !== ""
        );

        if (!hasExtractedDetails) {
            const extractionButton = document.createElement("button");
            extractionButton.type = "button";
            extractionButton.className = "button button-secondary";
            extractionButton.textContent = "Retry AI Extraction";

            const extractionStatus = document.createElement("p");
            extractionStatus.className = "reply-status";
            extractionStatus.hidden = true;
            extractionStatus.setAttribute("role", "status");

            extractionButton.addEventListener("click", async () => {
                extractionButton.disabled = true;
                extractionButton.textContent = "Extracting...";
                extractionStatus.hidden = true;

                try {
                    await sendRequest(
                        `/api/enquiries/${enquiry.id}/extract`,
                        "POST"
                    );

                    selectedEnquiryId = enquiry.id;
                    await loadEnquiries();

                    showMessage(
                        "AI extraction completed successfully."
                    );
                } catch (error) {
                    console.error("AI extraction failed:", error);

                    extractionStatus.textContent =
                        "AI extraction failed. Please try again. Your enquiry has been saved.";
                    extractionStatus.className = "reply-status error";
                    extractionStatus.hidden = false;
                } finally {
                    extractionButton.disabled = false;
                    extractionButton.textContent = "Retry AI Extraction";
                }
            });

            const extractionSection = document.createElement("section");
            extractionSection.className = "reply-section";

            const extractionHeading = document.createElement("h4");
            extractionHeading.textContent = "AI extraction";

            const extractionDescription = document.createElement("p");
            extractionDescription.className = "reply-description";
            extractionDescription.textContent =
                "No extracted details are available. Retry if AI extraction failed.";

            extractionSection.append(
                extractionHeading,
                extractionDescription,
                extractionButton,
                extractionStatus
            );

            enquiryDetails.appendChild(extractionSection);
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
        followUpInput.min = getLocalDateKey();
        followUpInput.className = "management-input";
        followUpInput.value = enquiry.follow_up_date
            ? enquiry.follow_up_date.slice(0, 10)
            : "";

        const followUpHint = document.createElement("p");
        followUpHint.className = "muted";
        followUpHint.textContent =
            "Leave the date unchanged if you only want to update the status.";

        const quickDateActions = document.createElement("div");
        quickDateActions.className = "quick-date-actions";

        function getDateOffsetKey(daysFromToday) {
            const date = new Date();
            date.setDate(date.getDate() + daysFromToday);
            return getLocalDateKey(date);
        }

        function createQuickDateButton(label, daysFromToday) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "quick-date-button";
            button.textContent = label;

            button.addEventListener("click", () => {
                followUpInput.value = getDateOffsetKey(daysFromToday);
            });

            return button;
        }

        quickDateActions.append(
            createQuickDateButton("Today", 0),
            createQuickDateButton("Tomorrow", 1),
            createQuickDateButton("In 3 days", 3)
        );

        const clearDateButton = document.createElement("button");
        clearDateButton.type = "button";
        clearDateButton.className = "quick-date-button";
        clearDateButton.textContent = "Clear date";

        clearDateButton.addEventListener("click", () => {
            followUpInput.value = "";
        });

        followUpField.append(
            followUpLabel,
            followUpInput,
            quickDateActions,
            followUpHint
        );

        quickDateActions.appendChild(clearDateButton);

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

            updateData.follow_up_date = followUpInput.value || null;
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
            const replyText = editor.value;

            if (!replyText.trim()) {
                showReplyStatus(
                    "There is no reply to copy yet.",
                    true
                );
                return;
            }

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(replyText);
                } else {
                    throw new Error("Modern clipboard API unavailable");
                }

                showReplyStatus(
                    "Reply copied. You can now paste it into your messaging app."
                );
            } catch (error) {
                console.warn(
                    "Modern clipboard copy failed; trying fallback:",
                    error
                );

                let fallbackSucceeded = false;
                const temporaryTextArea = document.createElement("textarea");

                try {
                    temporaryTextArea.value = replyText;
                    temporaryTextArea.setAttribute("readonly", "");
                    temporaryTextArea.style.position = "fixed";
                    temporaryTextArea.style.left = "-9999px";
                    temporaryTextArea.style.top = "0";

                    document.body.appendChild(temporaryTextArea);
                    temporaryTextArea.focus();
                    temporaryTextArea.select();
                    temporaryTextArea.setSelectionRange(
                        0,
                        temporaryTextArea.value.length
                    );

                    fallbackSucceeded = document.execCommand("copy");
                } catch (fallbackError) {
                    console.warn("Clipboard fallback failed:", fallbackError);
                } finally {
                    temporaryTextArea.remove();
                }

                if (fallbackSucceeded) {
                    showReplyStatus(
                        "Reply copied. You can now paste it into your messaging app."
                    );
                } else {
                    showReplyStatus(
                        "Automatic copying is unavailable. Please select the reply text and copy it manually.",
                        true
                    );
                }
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
    function renderFollowUpSummary() {
        const today = getLocalDateKey();

        const activeEnquiries = enquiries.filter((enquiry) => {
            const status = (enquiry.status || "new").trim().toLowerCase();
            return !["converted", "lost"].includes(status);
        });

        const dueToday = activeEnquiries.filter((enquiry) => {
            return enquiry.follow_up_date === today;
        }).length;

        const overdue = activeEnquiries.filter((enquiry) => {
            return enquiry.follow_up_date && enquiry.follow_up_date < today;
        }).length;

        const upcoming = activeEnquiries.filter((enquiry) => {
            return enquiry.follow_up_date && enquiry.follow_up_date > today;
        }).length;

        followUpDueTodayCount.textContent = String(dueToday);
        followUpOverdueCount.textContent = String(overdue);
        followUpUpcomingCount.textContent = String(upcoming);
    }

    function getLocalDateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getFollowUpStatus(enquiry) {
        const status = (enquiry.status || "new").trim().toLowerCase();

        if (status === "converted" || status === "lost") {
            return {
                label: `No active follow-up - ${status === "converted" ? "Converted" : "Lost"}`,
                className: "follow-up-closed"
            };
        }

        if (!enquiry.follow_up_date) {
            return {
                label: "No follow-up scheduled",
                className: "follow-up-none"
            };
        }

        const followUpDate = enquiry.follow_up_date.slice(0, 10);
        const today = getLocalDateKey();

        if (followUpDate < today) {
            return {
                label: "Overdue",
                className: "follow-up-overdue"
            };
        }

        if (followUpDate === today) {
            return {
                label: "Due today",
                className: "follow-up-due"
            };
        }

        return {
            label: "Upcoming",
            className: "follow-up-upcoming"
        };
    }

    function updateStatusFilterOptions() {
        const currentStatus = statusFilter.value;
        const isAttentionView = currentEnquiryView === "attention";

        const allowedStatuses = isAttentionView
            ? ["all", "new", "contacted", "qualified"]
            : ["all", "new", "contacted", "qualified", "converted", "lost"];

        const statusLabels = {
            all: "All statuses",
            new: "New",
            contacted: "Contacted",
            qualified: "Qualified",
            converted: "Converted",
            lost: "Lost"
        };

        statusFilter.replaceChildren();

        for (const status of allowedStatuses) {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = statusLabels[status];
            statusFilter.appendChild(option);
        }

        statusFilter.value = allowedStatuses.includes(currentStatus)
            ? currentStatus
            : "all";
    }

    function renderEnquiryList() {
        enquiryList.replaceChildren();
        const searchTerm = enquirySearch.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;
        const today = getLocalDateKey();

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

            const status = (enquiry.status || "new").trim().toLowerCase();

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            const matchesAttention =
                currentEnquiryView === "all" ||
                (
                    !["converted", "lost"].includes(status) &&
                    Boolean(enquiry.follow_up_date) &&
                    enquiry.follow_up_date <= today
                );

            return matchesSearch && matchesStatus && matchesAttention;
        });

        enquiryCount.textContent = String(visibleEnquiries.length);


        if (visibleEnquiries.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "muted";
            if (enquiries.length === 0) {
                emptyMessage.textContent = "No enquiries yet.";
            } else if (currentEnquiryView === "attention") {
                emptyMessage.textContent =
                    "No enquiries need attention with the current search and filters.";
            } else {
                emptyMessage.textContent =
                    "No enquiries match your search or filter.";
            }
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
                clearMessage();
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

            renderFollowUpSummary();
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
        selectedEnquiryId = null;
        renderEnquiryList();
    });

    allEnquiriesViewButton.addEventListener("click", () => {
        currentEnquiryView = "all";
        updateStatusFilterOptions();

        allEnquiriesViewButton.classList.add("active");
        needsAttentionViewButton.classList.remove("active");

        selectedEnquiryId = null;
        message.textContent = "";

        renderEnquiryList();
    });

    needsAttentionViewButton.addEventListener("click", () => {
        currentEnquiryView = "attention";
        updateStatusFilterOptions();

        needsAttentionViewButton.classList.add("active");
        allEnquiriesViewButton.classList.remove("active");

        selectedEnquiryId = null;
        message.textContent = "";

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

            if (createdEnquiry.ai_extraction_succeeded === false) {
                showMessage(
                    "Enquiry saved, but AI extraction failed. You can retry AI extraction from the enquiry details.",
                    true
                );
            } else {
                showMessage(
                    "Enquiry created successfully. AI extraction may leave some fields empty if the original message doesn't contain that information."
                );
            }
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