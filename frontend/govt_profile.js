/* ============================================================
   SKILLTRACK
   GOVERNMENT OFFICIAL PROFILE
   DYNAMIC SUPABASE GOVERNMENT TABLE
   ============================================================ */

let currentUser = null;
let currentOfficial = null;
let originalOfficial = null;
let editMode = false;


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log("SkillTrack Official Profile loaded");

        if (typeof supabaseClient === "undefined") {

            console.error("supabaseClient is undefined");

            showNotification(
                "Supabase connection is not available.",
                "error"
            );

            return;
        }


        setupNavigation();
        setupLogout();
        setupEditProfile();
        setupAvatarButton();
        setupSecurityButton();


        try {

            /* =================================================
               GET AUTHENTICATED USER
               ================================================= */

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getUser();


            if (error) {
                throw error;
            }


            currentUser = data.user;


            if (!currentUser) {

                window.location.href =
                    "govt_login.html";

                return;
            }


            console.log(
                "Logged-in user:",
                currentUser.id
            );


            /* =================================================
               FETCH GOVERNMENT OFFICIAL
               ================================================= */

            await fetchGovernmentOfficial();


        }
        catch (error) {

            console.error(
                "Profile initialization failed:",
                error
            );

            showNotification(
                error.message ||
                "Unable to load government official profile.",
                "error"
            );

        }

    }
);


/* ============================================================
   FETCH GOVERNMENT OFFICIAL
   ============================================================ */

async function fetchGovernmentOfficial() {

    console.log(
        "Fetching government official from Supabase..."
    );


    setLoading();


    /*
     * IMPORTANT:
     *
     * This uses the SAME relationship as the
     * government dashboard:
     *
     * auth.users.id
     *       ↓
     * government_officials.user_id
     */

    const {
        data,
        error
    } =
        await supabaseClient
            .from("government_officials")
            .select(`
                id,
                user_id,
                full_name,
                designation,
                official_id,
                department,
                government_level,
                official_role,
                state,
                district,
                office,
                official_email,
                mobile,
                office_address,
                verification_status,
                created_at,
                updated_at
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "government_officials error:",
            error
        );

        throw error;
    }


    if (!data) {

        console.error(
            "No government official record found for:",
            currentUser.id
        );


        showNotification(
            "No government official profile is linked to this account.",
            "error"
        );

        return;
    }


    currentOfficial =
        data;


    originalOfficial =
        JSON.parse(
            JSON.stringify(data)
        );


    console.log(
        "Government table data:",
        currentOfficial
    );


    renderOfficial();


    /*
     * Load jurisdiction data after official
     * information has been loaded.
     */

    await loadJurisdictionData();

}


/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderOfficial() {

    if (!currentOfficial) {
        return;
    }


    const official =
        currentOfficial;


    /* ========================================================
       NAME
       ======================================================== */

    const name =
        official.full_name ||
        "Government Official";


    /* ========================================================
       DESIGNATION
       ======================================================== */

    const designation =
        official.designation ||
        official.official_role ||
        "Government Official";


    /* ========================================================
       DEPARTMENT
       ======================================================== */

    const department =
        official.department ||
        "Not Available";


    /* ========================================================
       OFFICIAL ID
       ======================================================== */

    const officialId =
        official.official_id ||
        "Not Available";


    /* ========================================================
       EMAIL
       ======================================================== */

    const email =
        official.official_email ||
        currentUser.email ||
        "Not Available";


    /* ========================================================
       MOBILE
       ======================================================== */

    const mobile =
        official.mobile ||
        "Not Available";


    /* ========================================================
       JURISDICTION
       ======================================================== */

    const jurisdiction =
        buildJurisdiction(
            official
        );


    /* ========================================================
       ACCESS LEVEL
       ======================================================== */

    const accessLevel =
        official.official_role ||
        official.government_level ||
        "Government Official";


    /* ========================================================
       INITIALS
       ======================================================== */

    const initials =
        getInitials(
            name
        );


    /* ========================================================
       SIDEBAR
       ======================================================== */

    setText(
        "officialName",
        name
    );


    setText(
        "officialDesignation",
        designation
    );


    setText(
        "officialAvatar",
        initials
    );


    /* ========================================================
       TOP RIGHT
       ======================================================== */

    setText(
        "topOfficialName",
        name
    );


    setText(
        "topOfficialDesignation",
        designation
    );


    setText(
        "topAvatar",
        initials
    );


    setText(
        "officialJurisdiction",
        jurisdiction
    );


    /* ========================================================
       PROFILE HERO
       ======================================================== */

    setText(
        "profileName",
        name
    );


    setText(
        "profileDesignation",
        designation
    );


    setText(
        "profileDepartment",
        department
    );


    setText(
        "profileAvatar",
        initials
    );


    /* ========================================================
       ADMINISTRATIVE DETAILS
       ======================================================== */

    setText(
        "profileEmployeeId",
        officialId
    );


    setText(
        "profileEmail",
        email
    );


    setText(
        "profilePhone",
        mobile
    );


    setText(
        "profileAssignedJurisdiction",
        jurisdiction
    );


    setText(
        "profileAccessLevel",
        accessLevel
    );


    /* ========================================================
       VERIFICATION
       ======================================================== */

    renderVerification(
        official.verification_status
    );


    /* ========================================================
       SECURITY
       ======================================================== */

    renderSecurity(
        official
    );


    console.log(
        "Official profile rendered from government_officials."
    );

}


/* ============================================================
   BUILD JURISDICTION
   ============================================================ */

function buildJurisdiction(
    official
) {

    const parts = [];


    if (official.state) {

        parts.push(
            official.state
        );

    }


    if (official.district) {

        parts.push(
            official.district
        );

    }


    if (official.office) {

        parts.push(
            official.office
        );

    }


    if (!parts.length) {

        return "Not Assigned";

    }


    return parts.join(
        " • "
    );

}


/* ============================================================
   VERIFICATION STATUS
   ============================================================ */

function renderVerification(
    status
) {

    const badge =
        document.getElementById(
            "verificationBadge"
        );


    if (!badge) {
        return;
    }


    if (
        status === true ||
        status === "true"
    ) {

        badge.innerHTML =
            '<i class="fa-solid fa-circle-check"></i> Verified Official';

        badge.classList.remove(
            "pending"
        );

    }
    else {

        badge.innerHTML =
            '<i class="fa-solid fa-circle-exclamation"></i> Verification Pending';

        badge.classList.add(
            "pending"
        );

    }

}


/* ============================================================
   SECURITY INFORMATION
   ============================================================ */

function renderSecurity(
    official
) {

    const twoFA =
        document.getElementById(
            "profileTwoFA"
        );


    if (twoFA) {

        if (
            typeof official.two_factor_enabled ===
            "boolean"
        ) {

            twoFA.textContent =
                official.two_factor_enabled
                    ? "Enabled"
                    : "Disabled";

        }
        else {

            twoFA.textContent =
                "Managed by Government Authentication";

        }

    }


    const passwordReset =
        document.getElementById(
            "profilePasswordReset"
        );


    if (passwordReset) {

        /*
         * government_officials currently exposes
         * updated_at, not password_reset_at.
         *
         * Do not invent a password reset date.
         */

        passwordReset.textContent =
            official.updated_at
                ? formatDate(
                    official.updated_at
                )
                : "Not Available";

    }

}


/* ============================================================
   JURISDICTION DATA
   ============================================================ */

async function loadJurisdictionData() {

    if (!currentOfficial) {
        return;
    }


    const district =
        currentOfficial.district;


    if (!district) {
        return;
    }


    console.log(
        "Loading jurisdiction data for:",
        district
    );


    /* ========================================================
       TOTAL TRAINEES
       ======================================================== */

    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from("profile")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "district",
                    district
                );


        if (!error) {

            setText(
                "totalJurisdictionTrainees",
                Number(
                    count || 0
                ).toLocaleString("en-IN")
            );

        }

    }
    catch (error) {

        console.warn(
            "Could not load trainee count:",
            error
        );

    }


    /* ========================================================
       TRAINING CENTERS
       ======================================================== */

    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from("training_centers")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "district",
                    district
                );


        if (!error) {

            setText(
                "monitoredCenters",
                Number(
                    count || 0
                ).toLocaleString("en-IN")
            );

        }

    }
    catch (error) {

        console.warn(
            "Could not load training center count."
        );

    }


    /* ========================================================
       COHORTS
       ======================================================== */

    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from("cohorts")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "district",
                    district
                );


        if (!error) {

            setText(
                "activeCohorts",
                Number(
                    count || 0
                ).toLocaleString("en-IN")
            );

        }

    }
    catch (error) {

        console.warn(
            "Could not load cohort count."
        );

    }


    /* ========================================================
       PLACEMENT RATE
       ======================================================== */

    await calculatePlacementRate(
        district
    );

}


/* ============================================================
   PLACEMENT RATE
   ============================================================ */

async function calculatePlacementRate(
    district
) {

    try {

        const {
            data: trainees,
            error: traineeError
        } =
            await supabaseClient
                .from("profile")
                .select("user_id")
                .eq(
                    "district",
                    district
                );


        if (traineeError) {

            console.warn(
                traineeError
            );

            return;
        }


        if (
            !trainees ||
            !trainees.length
        ) {

            setText(
                "averagePlacement",
                "0%"
            );

            return;
        }


        const traineeIds =
            trainees.map(
                trainee =>
                    trainee.user_id
            );


        const {
            data: employment,
            error: employmentError
        } =
            await supabaseClient
                .from("employment_records")
                .select(
                    "trainee_id,status,recorded_at"
                )
                .in(
                    "trainee_id",
                    traineeIds
                )
                .order(
                    "recorded_at",
                    {
                        ascending: false
                    }
                );


        if (employmentError) {

            console.warn(
                employmentError
            );

            return;
        }


        /*
         * Keep only the latest employment
         * record for each trainee.
         */

        const latest =
            new Map();


        (employment || []).forEach(
            record => {

                if (
                    !latest.has(
                        record.trainee_id
                    )
                ) {

                    latest.set(
                        record.trainee_id,
                        record
                    );

                }

            }
        );


        let placed = 0;


        latest.forEach(
            record => {

                if (
                    isPlaced(
                        record.status
                    )
                ) {

                    placed++;

                }

            }
        );


        const percentage =
            trainees.length
                ? (
                    placed /
                    trainees.length
                ) * 100
                : 0;


        setText(
            "averagePlacement",
            percentage.toFixed(1) + "%"
        );


    }
    catch (error) {

        console.warn(
            "Placement calculation failed:",
            error
        );

    }

}


/* ============================================================
   PLACEMENT STATUS
   ============================================================ */

function isPlaced(
    status
) {

    if (!status) {
        return false;
    }


    const value =
        String(
            status
        )
        .trim()
        .toLowerCase();


    return [
        "employed",
        "placed",
        "working",
        "employed/placed",
        "employed / placed",
        "joined",
        "active"
    ].includes(
        value
    );

}


/* ============================================================
   EDIT PROFILE
   ============================================================ */

function setupEditProfile() {

    const button =
        document.getElementById(
            "editProfileBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            if (!currentOfficial) {

                showNotification(
                    "Profile is still loading.",
                    "error"
                );

                return;
            }


            if (!editMode) {

                enterEditMode(
                    button
                );

            }
            else {

                await saveProfile(
                    button
                );

            }

        }
    );

}


/* ============================================================
   ENTER EDIT MODE
   ============================================================ */

function enterEditMode(
    button
) {

    editMode =
        true;


    button.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Profile';


    makeInput(
        "profileName",
        "full_name",
        currentOfficial.full_name
    );


    makeInput(
        "profileDesignation",
        "designation",
        currentOfficial.designation
    );


    makeInput(
        "profileDepartment",
        "department",
        currentOfficial.department
    );


    makeInput(
        "profileEmail",
        "official_email",
        currentOfficial.official_email
    );


    makeInput(
        "profilePhone",
        "mobile",
        currentOfficial.mobile
    );


    showNotification(
        "Edit mode enabled.",
        "success"
    );

}


/* ============================================================
   CREATE INPUT
   ============================================================ */

function makeInput(
    id,
    field,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    const input =
        document.createElement(
            "input"
        );


    input.type =
        field === "official_email"
            ? "email"
            : "text";


    input.value =
        value || "";


    input.dataset.field =
        field;


    input.className =
        "profile-edit-input";


    input.style.width =
        "100%";


    input.style.padding =
        "8px 10px";


    input.style.border =
        "1px solid #cbd5e1";


    input.style.borderRadius =
        "7px";


    input.style.fontFamily =
        "inherit";


    input.style.fontSize =
        "inherit";


    input.style.boxSizing =
        "border-box";


    element.replaceWith(
        input
    );

}


/* ============================================================
   SAVE PROFILE TO GOVERNMENT TABLE
   ============================================================ */

async function saveProfile(
    button
) {

    const inputs =
        document.querySelectorAll(
            "[data-field]"
        );


    const updates = {};


    inputs.forEach(
        input => {

            const field =
                input.dataset.field;


            const value =
                input.value.trim();


            if (value) {

                updates[field] =
                    value;

            }

        }
    );


    if (
        !Object.keys(
            updates
        ).length
    ) {

        exitEditMode(
            button
        );

        return;
    }


    button.disabled =
        true;


    button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


    try {

        console.log(
            "Updating government_officials:",
            updates
        );


        /*
         * Update ONLY the logged-in official.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("government_officials")
                .update({
                    ...updates,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "user_id",
                    currentUser.id
                )
                .select()
                .single();


        if (error) {

            throw error;
        }


        /*
         * Use the actual response from Supabase.
         */

        currentOfficial =
            data;


        originalOfficial =
            JSON.parse(
                JSON.stringify(data)
            );


        editMode =
            false;


        renderOfficial();


        await loadJurisdictionData();


        button.disabled =
            false;


        button.innerHTML =
            '<i class="fa-solid fa-pen-to-square"></i> Edit Profile';


        showNotification(
            "Government official profile updated successfully.",
            "success"
        );


    }
    catch (error) {

        console.error(
            "Government profile update failed:",
            error
        );


        button.disabled =
            false;


        button.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Profile';


        showNotification(
            error.message ||
            "Unable to update government profile.",
            "error"
        );

    }

}


/* ============================================================
   EXIT EDIT MODE
   ============================================================ */

function exitEditMode(
    button
) {

    editMode =
        false;


    renderOfficial();


    button.innerHTML =
        '<i class="fa-solid fa-pen-to-square"></i> Edit Profile';

}


/* ============================================================
   AVATAR BUTTON
   ============================================================ */

function setupAvatarButton() {

    const button =
        document.querySelector(
            ".avatar-edit-btn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            showNotification(
                "Avatar upload is not connected to storage yet.",
                "success"
            );

        }
    );

}


/* ============================================================
   SECURITY BUTTON
   ============================================================ */

function setupSecurityButton() {

    const button =
        document.getElementById(
            "securityBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            if (!currentUser) {
                return;
            }


            const {
                error
            } =
                await supabaseClient
                    .auth
                    .resetPasswordForEmail(
                        currentUser.email,
                        {
                            redirectTo:
                                window.location.origin +
                                "/reset-password.html"
                        }
                    );


            if (error) {

                showNotification(
                    error.message,
                    "error"
                );

                return;
            }


            showNotification(
                "Password reset instructions have been sent to the official email.",
                "success"
            );

        }
    );

}


/* ============================================================
   LOGOUT
   ============================================================ */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            button.disabled =
                true;


            try {

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (error) {
                    throw error;
                }


                window.location.href =
                    "govt_login.html";

            }
            catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );


                button.disabled =
                    false;


                showNotification(
                    "Unable to sign out.",
                    "error"
                );

            }

        }
    );

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    const menuButton =
        document.getElementById(
            "menuBtn"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const overlay =
        document.getElementById(
            "mobileOverlay"
        );


    if (
        menuButton &&
        sidebar
    ) {

        menuButton.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "open"
                );


                if (overlay) {

                    overlay.classList.toggle(
                        "active"
                    );

                }

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "open"
                );


                overlay.classList.remove(
                    "active"
                );

            }
        );

    }

}


/* ============================================================
   LOADING
   ============================================================ */

function setLoading() {

    const ids = [

        "officialName",
        "officialDesignation",
        "officialJurisdiction",
        "topOfficialName",
        "topOfficialDesignation",
        "profileName",
        "profileDesignation",
        "profileDepartment",
        "profileEmployeeId",
        "profileEmail",
        "profilePhone",
        "profileAssignedJurisdiction",
        "profileAccessLevel"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    "Loading...";

            }

        }
    );

}


/* ============================================================
   SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "Not Available"
                : value;

    }

}


/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(
    name
) {

    if (!name) {
        return "--";
    }


    const parts =
        name
            .trim()
            .split(
                /\s+/
            );


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();

}


/* ============================================================
   DATE
   ============================================================ */

function formatDate(
    value
) {

    if (!value) {
        return "Not Available";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Not Available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


/* ============================================================
   NOTIFICATION
   ============================================================ */

function showNotification(
    message,
    type = "success"
) {

    let notification =
        document.getElementById(
            "profileNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );


        notification.id =
            "profileNotification";


        notification.style.position =
            "fixed";


        notification.style.top =
            "20px";


        notification.style.right =
            "20px";


        notification.style.zIndex =
            "99999";


        notification.style.padding =
            "14px 20px";


        notification.style.borderRadius =
            "8px";


        notification.style.color =
            "#fff";


        notification.style.fontSize =
            "14px";


        notification.style.fontWeight =
            "600";


        notification.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.2)";


        notification.style.transition =
            "opacity .3s ease";


        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        message;


    notification.style.background =
        type === "error"
            ? "#dc3545"
            : "#078dcc";


    notification.style.opacity =
        "1";


    clearTimeout(
        notification._timer
    );


    notification._timer =
        setTimeout(
            function () {

                notification.style.opacity =
                    "0";

            },
            3500
        );

}


/* ============================================================
   GLOBAL ACCESS
   ============================================================ */

window.SkillTrackProfile = {

    getOfficial:
        function () {
            return currentOfficial;
        },

    reload:
        fetchGovernmentOfficial

};