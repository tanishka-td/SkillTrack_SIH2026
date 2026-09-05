// ============================================================
// SKILLTRACK - TRAINEE FOLLOW-UPS
// ============================================================

// Supabase project details
const SUPABASE_URL =
    "https://vymzncykkdqyhzlnoyoh.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_hyY0G2jydh-_8wxfop9QuA_AkVZa764";

// Create Supabase client directly
const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    loadFollowups
);


// ============================================================
// LOAD FOLLOW-UPS
// ============================================================

async function loadFollowups() {

    const container =
        document.getElementById(
            "followupsContainer"
        );

    const loading =
        document.getElementById(
            "loadingMessage"
        );

    const errorBox =
        document.getElementById(
            "followupError"
        );


    try {

        console.log("Loading SkillTrack follow-ups...");


        // ----------------------------------------------------
        // GET CURRENT USER
        // ----------------------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (sessionError) {

            throw sessionError;

        }


        const session =
            sessionData.session;


        if (!session) {

            throw new Error(
                "You are not logged in. Please login again."
            );

        }


        const user =
            session.user;


        console.log(
            "Logged-in user:",
            user.id
        );


        console.log(
            "User email:",
            user.email
        );


        // ----------------------------------------------------
        // GET FOLLOW-UPS
        // ----------------------------------------------------

        const {
            data: followups,
            error
        } =
            await supabaseClient

                .from("followups")

                .select("*")

                .eq(
                    "trainee_id",
                    user.id
                )

                .order(
                    "scheduled_date",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Follow-up database error:",
                error
            );

            throw error;

        }


        console.log(
            "Follow-ups:",
            followups
        );


        // ----------------------------------------------------
        // HIDE LOADING
        // ----------------------------------------------------

        if (loading) {

            loading.style.display =
                "none";

        }


        // ----------------------------------------------------
        // NO DATA
        // ----------------------------------------------------

        if (
            !followups ||
            followups.length === 0
        ) {

            container.innerHTML = `

                <section class="followup">

                    <div class="followup-marker">
                        —
                    </div>

                    <div class="followup-main">

                        <span>
                            NO FOLLOW-UPS
                        </span>

                        <h2>
                            No check-ins scheduled
                        </h2>

                        <p>
                            Your post-training follow-ups
                            will appear here once they are scheduled.
                        </p>

                    </div>

                </section>

            `;

            return;

        }


        // ----------------------------------------------------
        // DISPLAY DATA
        // ----------------------------------------------------

        container.innerHTML = "";


        followups.forEach(
            followup => {

                container.innerHTML +=
                    createFollowupCard(
                        followup
                    );

            }
        );

    }


    catch (error) {

        console.error(
            "Follow-up loading failed:",
            error
        );


        if (loading) {

            loading.style.display =
                "none";

        }


        if (errorBox) {

            errorBox.style.display =
                "block";

            errorBox.textContent =
                "Unable to load your follow-ups: "
                + error.message;

        }

    }

}


// ============================================================
// CREATE FOLLOW-UP CARD
// ============================================================

function createFollowupCard(
    followup
) {

    const type =
        followup.followup_type ||
        "Follow-up";


    const scheduledDate =
        formatDate(
            followup.scheduled_date
        );


    const responseDate =
        followup.response_date
            ? formatDate(
                followup.response_date
            )
            : null;


    // ========================================================
    // COMPLETED
    // ========================================================

    if (
        followup.completed === true
    ) {

        return `

            <section class="followup">

                <div class="followup-marker complete">
                    ✓
                </div>

                <div class="followup-main">

                    <span>
                        COMPLETED
                    </span>

                    <h2>
                        ${escapeHTML(type)}
                    </h2>

                    <p>
                        Your employment status was
                        successfully recorded.
                    </p>

                </div>

                <div class="followup-date">

                    ${
                        responseDate ||
                        scheduledDate
                    }

                </div>

            </section>

        `;

    }


    // ========================================================
    // UPCOMING
    // ========================================================

    const days =
        calculateDays(
            followup.scheduled_date
        );


    let status =
        "UPCOMING";


    let dueText =
        "";


    if (days < 0) {

        status =
            "OVERDUE";

        dueText =
            `${Math.abs(days)} days overdue`;

    }

    else if (days === 0) {

        status =
            "DUE TODAY";

        dueText =
            "Due today";

    }

    else {

        status =
            "UPCOMING";

        dueText =
            `Due in ${days} days`;

    }


    return `

        <section class="followup upcoming">

            <div class="followup-marker">

                ${getMarker(type)}

            </div>


            <div class="followup-main">

                <span>
                    ${status}
                </span>


                <h2>
                    ${escapeHTML(type)}
                </h2>


                <p>
                    Update your current employment
                    and career status.
                </p>


                <a
                    href="trainee-status.html"
                    class="primary-btn"
                    style="margin-top:12px;"
                >
                    Start Check-in →
                </a>

            </div>


            <div class="followup-date">

                ${scheduledDate}

                <br>

                <small>
                    ${dueText}
                </small>

            </div>

        </section>

    `;

}


// ============================================================
// GET MARKER
// ============================================================

function getMarker(type) {

    const value =
        String(type)
            .toLowerCase();


    if (
        value.includes("3 month") ||
        value.includes("3-month") ||
        value.includes("3m")
    ) {

        return "3M";

    }


    if (
        value.includes("6 month") ||
        value.includes("6-month") ||
        value.includes("6m")
    ) {

        return "6M";

    }


    if (
        value.includes("12 month") ||
        value.includes("12-month") ||
        value.includes("12m")
    ) {

        return "12M";

    }


    return "•";

}


// ============================================================
// CALCULATE DAYS
// ============================================================

function calculateDays(
    dateString
) {

    if (!dateString) {

        return 0;

    }


    const target =
        new Date(
            dateString + "T00:00:00"
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        target.getTime()
        -
        today.getTime();


    return Math.ceil(
        difference /
        (
            1000 *
            60 *
            60 *
            24
        )
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Not available";

    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ============================================================
// SECURITY
// ============================================================

function escapeHTML(
    value
) {

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