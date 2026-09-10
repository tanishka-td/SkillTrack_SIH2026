/* =========================================================
   SKILLTRACK - TRAINEE FOLLOW-UPS
   =========================================================
   
   Reads:
       public.followup_records

   Follow-ups are generated from:
       trainee_records.completion_date
       employment_records.joining_date

   ========================================================= */


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "===================================="
        );

        console.log(
            "SKILLTRACK FOLLOW-UPS JS STARTED"
        );

        console.log(
            "===================================="
        );


        /* -------------------------------------------------
           CHECK SUPABASE
        ------------------------------------------------- */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient is NOT defined."
            );

            showError(
                "Supabase connection is not available. Check your supabase.js file."
            );

            hideLoading();

            return;
        }


        console.log(
            "Supabase client detected."
        );


        /* -------------------------------------------------
           GET LOGGED-IN USER
        ------------------------------------------------- */

        const {
            data: authData,
            error: authError
        } =
            await supabaseClient.auth.getUser();


        if (authError) {

            console.error(
                "Authentication error:",
                authError
            );

            showError(
                "Unable to verify your login."
            );

            hideLoading();

            return;
        }


        const user =
            authData.user;


        if (!user) {

            console.warn(
                "No logged-in user."
            );

            window.location.href =
                "trainee-login.html";

            return;
        }


        console.log(
            "Logged-in trainee:",
            user.id
        );


        /* -------------------------------------------------
           LOAD FOLLOW-UPS
        ------------------------------------------------- */

        await loadFollowups(
            user.id
        );

    }
);



/* =========================================================
   LOAD FOLLOW-UPS
   ========================================================= */

async function loadFollowups(
    userId
) {

    console.log(
        "Fetching follow-up records..."
    );


    const container =
        document.getElementById(
            "followupsContainer"
        );


    try {

        /* =================================================
           UPDATE OVERDUE RECORDS
           ================================================= */

        await updateOverdueFollowups(
            userId
        );


        /* =================================================
           FETCH FOLLOW-UP TABLE
           ================================================= */

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "followup_records"
                )
                .select("*")
                .eq(
                    "trainee_id",
                    userId
                )
                .order(
                    "scheduled_date",
                    {
                        ascending: true
                    }
                );


        /* =================================================
           DATABASE ERROR
           ================================================= */

        if (error) {

            console.error(
                "FOLLOW-UP DATABASE ERROR:",
                error
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Code:",
                error.code
            );

            showError(
                "Unable to load follow-ups: " +
                error.message
            );

            hideLoading();

            return;
        }


        console.log(
            "Follow-up records received:",
            data
        );


        /* =================================================
           NO RECORDS
           ================================================= */

        if (
            !data ||
            data.length === 0
        ) {

            console.log(
                "No follow-up records found."
            );


            updateSummary(
                []
            );


            showEmptyState();


            hideLoading();


            return;
        }


        /* =================================================
           UPDATE SUMMARY
           ================================================= */

        updateSummary(
            data
        );


        /* =================================================
           RENDER CARDS
           ================================================= */

        renderFollowups(
            data
        );


        /* =================================================
           HIDE LOADING
           ================================================= */

        hideLoading();


    } catch (error) {

        console.error(
            "Follow-up loading failed:",
            error
        );


        showError(
            error.message ||
            "Something went wrong while loading follow-ups."
        );


        hideLoading();

    }

}



/* =========================================================
   UPDATE OVERDUE FOLLOW-UPS
   ========================================================= */

async function updateOverdueFollowups(
    userId
) {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    console.log(
        "Checking overdue follow-ups:",
        today
    );


    const {
        error
    } =
        await supabaseClient
            .from(
                "followup_records"
            )
            .update({
                status: "overdue"
            })
            .eq(
                "trainee_id",
                userId
            )
            .eq(
                "status",
                "pending"
            )
            .lt(
                "scheduled_date",
                today
            );


    if (error) {

        /*
         * Don't stop the entire page if this
         * update fails.
         */

        console.warn(
            "Could not update overdue records:",
            error
        );

    }

}



/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSummary(
    records
) {

    const totalElement =
        document.getElementById(
            "totalFollowups"
        );


    const completedElement =
        document.getElementById(
            "completedFollowups"
        );


    const nextElement =
        document.getElementById(
            "nextFollowup"
        );


    /* -----------------------------------------------------
       TOTAL
       ----------------------------------------------------- */

    if (totalElement) {

        totalElement.textContent =
            records.length;

    }


    /* -----------------------------------------------------
       COMPLETED
       ----------------------------------------------------- */

    const completed =
        records.filter(
            function (record) {

                return (
                    record.status ===
                    "completed"
                );

            }
        ).length;


    if (completedElement) {

        completedElement.textContent =
            completed;

    }


    /* -----------------------------------------------------
       NEXT FOLLOW-UP
       ----------------------------------------------------- */

    const upcoming =
        records
            .filter(
                function (record) {

                    return (
                        record.status ===
                        "pending"
                    );

                }
            )
            .sort(
                function (a, b) {

                    return (
                        new Date(
                            a.scheduled_date
                        ) -
                        new Date(
                            b.scheduled_date
                        )
                    );

                }
            );


    if (
        nextElement
    ) {

        if (
            upcoming.length > 0
        ) {

            nextElement.textContent =
                formatDate(
                    upcoming[0]
                        .scheduled_date
                );

        } else {

            nextElement.textContent =
                "None";

        }

    }

}



/* =========================================================
   RENDER FOLLOW-UP CARDS
   ========================================================= */

function renderFollowups(
    records
) {

    const container =
        document.getElementById(
            "followupsContainer"
        );


    if (!container) {

        console.error(
            "#followupsContainer not found."
        );

        return;
    }


    container.innerHTML =
        "";


    records.forEach(
        function (
            record,
            index
        ) {

            const card =
                createFollowupCard(
                    record,
                    index
                );


            container.appendChild(
                card
            );

        }
    );

}



/* =========================================================
   CREATE FOLLOW-UP CARD
   ========================================================= */

function createFollowupCard(
    record,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "followup-card";


    /* -----------------------------------------------------
       STATUS
       ----------------------------------------------------- */

    const status =
        record.status ||
        "pending";


    const statusLabel =
        getStatusLabel(
            status
        );


    const statusClass =
        status;


    /* -----------------------------------------------------
       SOURCE
       ----------------------------------------------------- */

    const source =
        record.source_type ||
        "Training";


    const followupType =
        record.followup_type ||
        "Follow-up";


    /* -----------------------------------------------------
       TITLE
       ----------------------------------------------------- */

    let title =
        followupType +
        " Follow-up";


    if (
        source ===
        "Training"
    ) {

        title =
            followupType +
            " Post-Training Follow-up";

    }


    if (
        source ===
        "Employment"
    ) {

        title =
            followupType +
            " Employment Follow-up";

    }


    /* -----------------------------------------------------
       DESCRIPTION
       ----------------------------------------------------- */

    let description =
        "SkillTrack check-in to understand your progress after training.";


    if (
        source ===
        "Employment"
    ) {

        description =
            "SkillTrack check-in to understand your employment progress and career sustainability.";

    }


    /* -----------------------------------------------------
       BUILD CARD
       ----------------------------------------------------- */

    card.innerHTML = `

        <div class="followup-card-header">

            <div class="followup-title-area">

                <div class="followup-number">
                    ${index + 1}
                </div>

                <div>

                    <h3>
                        ${escapeHTML(title)}
                    </h3>

                    <span>
                        ${escapeHTML(source)} checkpoint
                    </span>

                </div>

            </div>


            <div class="followup-status ${statusClass}">

                <i class="fa-solid ${getStatusIcon(status)}"></i>

                ${escapeHTML(statusLabel)}

            </div>

        </div>


        <div class="followup-body">

            <p class="followup-description">
                ${escapeHTML(description)}
            </p>


            <div class="followup-details">


                <div class="followup-detail">

                    <span>
                        Scheduled Date
                    </span>

                    <strong>
                        ${formatDate(
                            record.scheduled_date
                        )}
                    </strong>

                </div>


                <div class="followup-detail">

                    <span>
                        Based On
                    </span>

                    <strong>
                        ${formatDate(
                            record.base_date
                        )}
                    </strong>

                </div>


                <div class="followup-detail">

                    <span>
                        Checkpoint
                    </span>

                    <strong>
                        ${escapeHTML(
                            followupType
                        )}
                    </strong>

                </div>


            </div>

        </div>

    `;


    return card;

}



/* =========================================================
   EMPTY STATE
   ========================================================= */

function showEmptyState() {

    const container =
        document.getElementById(
            "followupsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-followups">

            <div class="empty-icon">

                <i class="fa-solid fa-calendar-days"></i>

            </div>


            <h3>
                No follow-ups scheduled yet
            </h3>


            <p>
                Your follow-up schedule will appear here
                once your training completion or employment
                joining date is recorded.
            </p>

        </div>

    `;

}



/* =========================================================
   HIDE LOADING
   ========================================================= */

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }

}



/* =========================================================
   SHOW ERROR
   ========================================================= */

function showError(
    message
) {

    const errorElement =
        document.getElementById(
            "followupError"
        );


    if (!errorElement) {

        console.error(
            message
        );

        return;
    }


    errorElement.textContent =
        message;


    errorElement.style.display =
        "block";

}



/* =========================================================
   STATUS LABEL
   ========================================================= */

function getStatusLabel(
    status
) {

    switch (
        status
    ) {

        case "completed":
            return "Completed";

        case "overdue":
            return "Overdue";

        case "skipped":
            return "Skipped";

        case "pending":
        default:
            return "Upcoming";

    }

}



/* =========================================================
   STATUS ICON
   ========================================================= */

function getStatusIcon(
    status
) {

    switch (
        status
    ) {

        case "completed":
            return "fa-circle-check";

        case "overdue":
            return "fa-triangle-exclamation";

        case "skipped":
            return "fa-circle-minus";

        case "pending":
        default:
            return "fa-clock";

    }

}



/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    date
) {

    if (!date) {

        return "Not available";

    }


    const parsed =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return date;

    }


    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}



/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}