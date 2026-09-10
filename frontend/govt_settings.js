/* ============================================================
   SKILLTRACK GOVERNMENT PORTAL
   govt_settings.js
   ============================================================ */


/* ============================================================
   GLOBAL STATE
   ============================================================ */

let currentUser = null;
let currentOfficial = null;
let currentSettings = null;
let originalSettings = null;
let refreshTimer = null;


/* ============================================================
   DEFAULT SETTINGS
   ============================================================ */

const DEFAULT_SETTINGS = {

    automatic_background_refresh: true,

    default_fiscal_year: "FY 2025-26",

    interface_animations: false,

    retention_threshold: 70,

    email_digest: false,

    unverified_placement_flagging: true,

    display_predictive_analytics: true,

    anomaly_sensitivity: "Balanced",

    outcome_webhooks: false

};


/* ============================================================
   SUPABASE
   ============================================================ */

function getSupabaseClient() {

    /*
     * First check if supabaseClient was declared
     * globally in supabase.js.
     */

    if (
        typeof supabaseClient !== "undefined"
    ) {

        return supabaseClient;

    }


    /*
     * Also support window.supabaseClient.
     */

    if (
        typeof window.supabaseClient !== "undefined"
    ) {

        return window.supabaseClient;

    }


    /*
     * Direct Supabase object fallback.
     */

    if (
        typeof window.supabase !== "undefined" &&
        typeof window.supabase.from === "function"
    ) {

        return window.supabase;

    }


    console.error(
        "Supabase client not found."
    );


    return null;

}

/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);


async function initializePage() {

    initializeTabs();

    initializeMobileMenu();

    initializeLogout();

    initializeSettingsEvents();

    initializeSaveButton();

    initializeDiscardButton();

    initializeCopyButton();

    initializeRetentionInput();


    const supabase =
        getSupabaseClient();


    if (!supabase) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {

            console.error(
                "Authentication error:",
                error
            );

            return;

        }


        if (!data.user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            data.user;


        /*
         * LOAD BOTH:
         *
         * government_officials
         * government_settings
         */

        await Promise.all([
            loadGovernmentOfficial(),
            loadGovernmentSettings()
        ]);


        /*
         * API key is loaded after authentication.
         */

        loadAPIKey();


    }
    catch (error) {

        console.error(
            "Initialization error:",
            error
        );

    }

}


/* ============================================================
   LOAD GOVERNMENT OFFICIAL
   ============================================================ */

async function loadGovernmentOfficial() {

    const supabase =
        getSupabaseClient();


    if (!supabase) {

        console.error(
            "Supabase client unavailable."
        );

        return;

    }


    if (!currentUser) {

        console.error(
            "No authenticated user."
        );

        return;

    }


    console.log(
        "Fetching government official for user:",
        currentUser.id
    );


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("government_officials")
                .select("*")
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "government_officials fetch error:",
                error
            );

            return;

        }


        if (!data) {

            console.warn(
                "No government_officials record found for:",
                currentUser.id
            );


            /*
             * Don't leave the UI pretending to load forever.
             */

            setSettingsOfficialUI({
                full_name: "Official Not Found",
                designation: "Government Officer",
                district: "Not Assigned"
            });


            return;

        }


        currentOfficial =
            data;


        console.log(
            "Government official fetched successfully:",
            data
        );


        /*
         * Put database values into the Settings UI.
         */

        setSettingsOfficialUI(
            data
        );


    }
    catch (error) {

        console.error(
            "Government official loading failed:",
            error
        );

    }

}
function setSettingsOfficialUI(
    official
) {

    if (!official) {
        return;
    }


    /* ========================================================
       NAME
       ======================================================== */

    const name =
        official.full_name ||
        official.name ||
        official.official_name ||
        "Government Official";


    /* ========================================================
       DESIGNATION
       ======================================================== */

    const designation =
        official.designation ||
        official.official_role ||
        official.role ||
        "Government Officer";


    /* ========================================================
       JURISDICTION
       ======================================================== */

    let jurisdiction =
        official.district ||
        official.district_name ||
        official.jurisdiction ||
        official.office ||
        official.state ||
        "Not Assigned";


    /*
     * If you want:
     *
     * North West Delhi
     *
     * instead of:
     *
     * Delhi • North West Delhi • Office
     *
     * district is intentionally preferred.
     */


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

    const officialName =
        document.getElementById(
            "officialName"
        );


    if (officialName) {

        officialName.textContent =
            name;

    }


    const officialDesignation =
        document.getElementById(
            "officialDesignation"
        );


    if (officialDesignation) {

        officialDesignation.textContent =
            designation;

    }


    const officialAvatar =
        document.getElementById(
            "officialAvatar"
        );


    if (officialAvatar) {

        officialAvatar.textContent =
            initials;

    }


    /* ========================================================
       TOP RIGHT
       ======================================================== */

    const topJurisdiction =
        document.getElementById(
            "topJurisdiction"
        );


    if (topJurisdiction) {

        topJurisdiction.textContent =
            jurisdiction;

    }


    const topOfficialName =
        document.getElementById(
            "topOfficialName"
        );


    if (topOfficialName) {

        topOfficialName.textContent =
            name;

    }


    const topOfficialDesignation =
        document.getElementById(
            "topOfficialDesignation"
        );


    if (topOfficialDesignation) {

        topOfficialDesignation.textContent =
            designation;

    }


    const topAvatar =
        document.getElementById(
            "topAvatar"
        );


    if (topAvatar) {

        topAvatar.textContent =
            initials;

    }


    console.log(
        "Settings header updated:",
        {
            name,
            designation,
            jurisdiction
        }
    );

}

/* ============================================================
   UPDATE OFFICIAL UI
   ============================================================ */

function updateOfficialUI(
    official
) {

    if (!official) {

        return;

    }


    /*
     * Backend field:
     * full_name
     */

    const name =
        official.full_name ||
        official.name ||
        official.official_name ||
        "Government Official";


    /*
     * Backend field:
     * designation
     */

    const designation =
        official.designation ||
        official.official_role ||
        official.role ||
        "Government Officer";


    /*
     * Backend field:
     * district
     */

    const district =
        official.district ||
        official.district_name ||
        official.jurisdiction ||
        official.office ||
        official.state ||
        "Government Jurisdiction";


    /*
     * SIDEBAR
     */

    const officialName =
        document.getElementById(
            "officialName"
        );


    if (officialName) {

        officialName.textContent =
            name;

    }


    const officialDesignation =
        document.getElementById(
            "officialDesignation"
        );


    if (officialDesignation) {

        officialDesignation.textContent =
            designation;

    }


    const officialAvatar =
        document.getElementById(
            "officialAvatar"
        );


    if (officialAvatar) {

        officialAvatar.textContent =
            getInitials(name);

    }


    /*
     * TOP RIGHT
     */

    const topName =
        document.getElementById(
            "topOfficialName"
        );


    if (topName) {

        topName.textContent =
            name;

    }


    const topDesignation =
        document.getElementById(
            "topOfficialDesignation"
        );


    if (topDesignation) {

        topDesignation.textContent =
            designation;

    }


    const topAvatar =
        document.getElementById(
            "topAvatar"
        );


    if (topAvatar) {

        topAvatar.textContent =
            getInitials(name);

    }


    /*
     * JURISDICTION
     */

    const topJurisdiction =
        document.getElementById(
            "topJurisdiction"
        );


    if (topJurisdiction) {

        topJurisdiction.textContent =
            district;

    }

}


/* ============================================================
   LOAD SETTINGS
   ============================================================ */

async function loadGovernmentSettings() {

    const supabase =
        getSupabaseClient();


    if (
        !supabase ||
        !currentUser
    ) {

        return;

    }


    try {

        let result =
            await supabase
                .from("government_settings")
                .select("*")
                .eq(
                    "official_id",
                    currentUser.id
                )
                .maybeSingle();


        /*
         * Fallback if database uses user_id.
         */

        if (
            result.error &&
            isMissingColumnError(
                result.error
            )
        ) {

            result =
                await supabase
                    .from("government_settings")
                    .select("*")
                    .eq(
                        "user_id",
                        currentUser.id
                    )
                    .maybeSingle();

        }


        if (result.error) {

            console.error(
                "Settings fetch error:",
                result.error
            );


            currentSettings =
                {
                    ...DEFAULT_SETTINGS
                };


            originalSettings =
                {
                    ...DEFAULT_SETTINGS
                };


            populateSettings(
                currentSettings
            );


            return;

        }


        /*
         * No record yet.
         */

        if (!result.data) {

            currentSettings =
                {
                    ...DEFAULT_SETTINGS
                };


            originalSettings =
                {
                    ...DEFAULT_SETTINGS
                };


            populateSettings(
                currentSettings
            );


            return;

        }


        currentSettings =
            normalizeSettings(
                result.data
            );


        originalSettings =
            JSON.parse(
                JSON.stringify(
                    currentSettings
                )
            );


        populateSettings(
            currentSettings
        );


        startAutomaticRefresh(
            currentSettings
                .automatic_background_refresh
        );


    }
    catch (error) {

        console.error(
            "Settings loading error:",
            error
        );

    }

}


/* ============================================================
   NORMALIZE SETTINGS
   ============================================================ */

function normalizeSettings(
    data
) {

    return {

        automatic_background_refresh:
            data.automatic_background_refresh
            ?? true,


        default_fiscal_year:
            data.default_fiscal_year
            ?? "FY 2025-26",


        interface_animations:
            Boolean(
                data.interface_animations
                ?? false
            ),


        retention_threshold:
            Number(
                data.retention_threshold
                ?? 70
            ),


        email_digest:
            Boolean(
                data.email_digest
                ?? false
            ),


        unverified_placement_flagging:
            Boolean(
                data.unverified_placement_flagging
                ?? true
            ),


        display_predictive_analytics:
            Boolean(
                data.display_predictive_analytics
                ?? true
            ),


        anomaly_sensitivity:
            data.anomaly_sensitivity
            ?? "Balanced",


        outcome_webhooks:
            Boolean(
                data.outcome_webhooks
                ?? false
            )

    };

}


/* ============================================================
   POPULATE SETTINGS
   ============================================================ */

function populateSettings(
    settings
) {

    if (!settings) {

        return;

    }


    const refresh =
        document.getElementById(
            "automaticBackgroundRefresh"
        );


    if (refresh) {

        refresh.checked =
            Boolean(
                settings
                    .automatic_background_refresh
            );

    }


    const fiscalYear =
        document.getElementById(
            "defaultFiscalYear"
        );


    if (fiscalYear) {

        fiscalYear.value =
            settings
                .default_fiscal_year;

    }


    const animations =
        document.getElementById(
            "interfaceAnimations"
        );


    if (animations) {

        animations.checked =
            Boolean(
                settings
                    .interface_animations
            );

    }


    const retention =
        document.getElementById(
            "retentionThreshold"
        );


    if (retention) {

        retention.value =
            settings
                .retention_threshold;

    }


    const email =
        document.getElementById(
            "emailDigest"
        );


    if (email) {

        email.checked =
            Boolean(
                settings
                    .email_digest
            );

    }


    const flagging =
        document.getElementById(
            "unverifiedPlacementFlagging"
        );


    if (flagging) {

        flagging.checked =
            Boolean(
                settings
                    .unverified_placement_flagging
            );

    }


    const predictive =
        document.getElementById(
            "displayPredictiveAnalytics"
        );


    if (predictive) {

        predictive.checked =
            Boolean(
                settings
                    .display_predictive_analytics
            );

    }


    const anomaly =
        document.getElementById(
            "anomalySensitivity"
        );


    if (anomaly) {

        anomaly.value =
            settings
                .anomaly_sensitivity;

    }


    const webhooks =
        document.getElementById(
            "outcomeWebhooks"
        );


    if (webhooks) {

        webhooks.checked =
            Boolean(
                settings
                    .outcome_webhooks
            );

    }

}


/* ============================================================
   GET SETTINGS FROM UI
   ============================================================ */

function getSettingsFromUI() {

    return {

        automatic_background_refresh:
            document.getElementById(
                "automaticBackgroundRefresh"
            )?.checked ?? true,


        default_fiscal_year:
            document.getElementById(
                "defaultFiscalYear"
            )?.value ||
            "FY 2025-26",


        interface_animations:
            document.getElementById(
                "interfaceAnimations"
            )?.checked ?? false,


        retention_threshold:
            Number(
                document.getElementById(
                    "retentionThreshold"
                )?.value || 70
            ),


        email_digest:
            document.getElementById(
                "emailDigest"
            )?.checked ?? false,


        unverified_placement_flagging:
            document.getElementById(
                "unverifiedPlacementFlagging"
            )?.checked ?? true,


        display_predictive_analytics:
            document.getElementById(
                "displayPredictiveAnalytics"
            )?.checked ?? true,


        anomaly_sensitivity:
            document.getElementById(
                "anomalySensitivity"
            )?.value ||
            "Balanced",


        outcome_webhooks:
            document.getElementById(
                "outcomeWebhooks"
            )?.checked ?? false

    };

}


/* ============================================================
   SAVE SETTINGS
   ============================================================ */

async function saveSettings() {

    const supabase =
        getSupabaseClient();


    if (
        !supabase ||
        !currentUser
    ) {

        showMessage(
            "You are not authenticated.",
            "error"
        );

        return;

    }


    const settings =
        getSettingsFromUI();


    if (
        settings.retention_threshold < 0 ||
        settings.retention_threshold > 100
    ) {

        showMessage(
            "Retention threshold must be between 0 and 100.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveSettingsBtn"
        );


    const originalHTML =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    }


    try {

        let payload = {

            official_id:
                currentUser.id,

            automatic_background_refresh:
                settings
                    .automatic_background_refresh,

            default_fiscal_year:
                settings
                    .default_fiscal_year,

            interface_animations:
                settings
                    .interface_animations,

            retention_threshold:
                settings
                    .retention_threshold,

            email_digest:
                settings
                    .email_digest,

            unverified_placement_flagging:
                settings
                    .unverified_placement_flagging,

            display_predictive_analytics:
                settings
                    .display_predictive_analytics,

            anomaly_sensitivity:
                settings
                    .anomaly_sensitivity,

            outcome_webhooks:
                settings
                    .outcome_webhooks,

            updated_at:
                new Date().toISOString()

        };


        let result =
            await supabase
                .from("government_settings")
                .upsert(
                    payload,
                    {
                        onConflict:
                            "official_id"
                    }
                );


        /*
         * Support a government_settings table
         * using user_id.
         */

        if (
            result.error &&
            isMissingColumnError(
                result.error
            )
        ) {

            payload =
                {
                    ...payload
                };


            delete payload.official_id;


            payload.user_id =
                currentUser.id;


            result =
                await supabase
                    .from("government_settings")
                    .upsert(
                        payload,
                        {
                            onConflict:
                                "user_id"
                        }
                    );

        }


        if (result.error) {

            throw result.error;

        }


        currentSettings =
            {
                ...settings
            };


        originalSettings =
            JSON.parse(
                JSON.stringify(
                    settings
                )
            );


        clearDirtyState();


        startAutomaticRefresh(
            settings
                .automatic_background_refresh
        );


        showMessage(
            "Settings saved successfully.",
            "success"
        );


    }
    catch (error) {

        console.error(
            "Settings save error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to save settings.",
            "error"
        );

    }
    finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                originalHTML;

        }

    }

}


/* ============================================================
   SAVE BUTTON
   ============================================================ */

function initializeSaveButton() {

    const button =
        document.getElementById(
            "saveSettingsBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            saveSettings();

        }
    );

}


/* ============================================================
   DISCARD BUTTON
   ============================================================ */

function initializeDiscardButton() {

    const button =
        document.getElementById(
            "discardSettingsBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();


            if (
                !originalSettings
            ) {

                return;

            }


            populateSettings(
                originalSettings
            );


            currentSettings =
                JSON.parse(
                    JSON.stringify(
                        originalSettings
                    )
                );


            clearDirtyState();


            showMessage(
                "Changes discarded.",
                "success"
            );

        }
    );

}


/* ============================================================
   DIRTY TRACKING
   ============================================================ */

function initializeSettingsEvents() {

    const controls =
        document.querySelectorAll(
            ".settings-options-list input, " +
            ".settings-options-list select"
        );


    controls.forEach(
        control => {

            control.addEventListener(
                "change",
                markDirty
            );


            control.addEventListener(
                "input",
                markDirty
            );

        }
    );

}


function markDirty() {

    const button =
        document.getElementById(
            "saveSettingsBtn"
        );


    if (button) {

        button.dataset.dirty =
            "true";

    }

}


function clearDirtyState() {

    const button =
        document.getElementById(
            "saveSettingsBtn"
        );


    if (button) {

        delete button.dataset.dirty;

    }

}


/* ============================================================
   RETENTION VALIDATION
   ============================================================ */

function initializeRetentionInput() {

    const input =
        document.getElementById(
            "retentionThreshold"
        );


    if (!input) {

        return;

    }


    input.addEventListener(
        "input",
        () => {

            let value =
                Number(
                    input.value
                );


            if (
                value > 100
            ) {

                input.value =
                    100;

            }


            if (
                value < 0
            ) {

                input.value =
                    0;

            }

        }
    );

}


/* ============================================================
   TABS
   ============================================================ */

function initializeTabs() {

    const buttons =
        document.querySelectorAll(
            ".settings-tab-btn"
        );


    const panes =
        document.querySelectorAll(
            ".tab-pane"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.tab;


                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    panes.forEach(
                        pane => {

                            pane.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    const pane =
                        document.getElementById(
                            target
                        );


                    if (pane) {

                        pane.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function initializeMobileMenu() {

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
        !menuButton ||
        !sidebar
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        () => {

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


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );


                overlay.classList.remove(
                    "active"
                );

            }
        );

    }


    document.querySelectorAll(
        ".nav-link"
    ).forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 768
                    ) {

                        sidebar.classList.remove(
                            "open"
                        );


                        if (overlay) {

                            overlay.classList.remove(
                                "active"
                            );

                        }

                    }

                }
            );

        }
    );

}


/* ============================================================
   LOGOUT
   ============================================================ */

function initializeLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            const supabase =
                getSupabaseClient();


            try {

                button.disabled =
                    true;


                if (supabase) {

                    const {
                        error
                    } =
                        await supabase.auth.signOut();


                    if (error) {

                        throw error;

                    }

                }


                stopAutomaticRefresh();


                window.location.href =
                    "login.html";

            }
            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                button.disabled =
                    false;


                showMessage(
                    "Unable to sign out.",
                    "error"
                );

            }

        }
    );

}


/* ============================================================
   API KEY
   ============================================================ */

function loadAPIKey() {

    const input =
        document.getElementById(
            "governmentApiKey"
        );


    if (!input) {

        return;

    }


    /*
     * Read the key already stored by the project.
     */

    let key = null;


    try {

        key =
            localStorage.getItem(
                "skilltrack_api_key"
            );

    }
    catch (error) {

        console.warn(
            "Unable to access localStorage."
        );

    }


    if (!key) {

        key =
            window.SKILLTRACK_API_KEY ||
            window.GOVERNMENT_API_KEY ||
            null;

    }


    if (key) {

        input.value =
            key;

    }

}


/* ============================================================
   COPY API KEY
   ============================================================ */

function initializeCopyButton() {

    const button =
        document.getElementById(
            "copyApiKeyBtn"
        );


    const input =
        document.getElementById(
            "governmentApiKey"
        );


    if (
        !button ||
        !input
    ) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            if (!input.value) {

                showMessage(
                    "No API key available.",
                    "error"
                );

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    input.value
                );


                const oldText =
                    button.textContent;


                button.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        button.textContent =
                            oldText;

                    },
                    1500
                );

            }
            catch (error) {

                console.error(
                    "Copy error:",
                    error
                );


                showMessage(
                    "Unable to copy API key.",
                    "error"
                );

            }

        }
    );

}


/* ============================================================
   AUTOMATIC REFRESH
   ============================================================ */

function startAutomaticRefresh(
    enabled
) {

    stopAutomaticRefresh();


    if (!enabled) {

        return;

    }


    refreshTimer =
        setInterval(
            async () => {

                if (!currentUser) {

                    return;

                }


                /*
                 * Only refresh from backend if the user
                 * hasn't modified settings locally.
                 */

                const saveButton =
                    document.getElementById(
                        "saveSettingsBtn"
                    );


                if (
                    saveButton &&
                    saveButton.dataset.dirty ===
                    "true"
                ) {

                    return;

                }


                await loadGovernmentSettings();

            },
            5 * 60 * 1000
        );

}


function stopAutomaticRefresh() {

    if (refreshTimer) {

        clearInterval(
            refreshTimer
        );


        refreshTimer =
            null;

    }

}


/* ============================================================
   SYSTEM STATUS
   ============================================================ */

async function checkBackendStatus() {

    const status =
        document.getElementById(
            "systemStatus"
        );


    if (!status) {

        return;

    }


    try {

        const response =
            await fetch(
                "https://skilltrack-sih2026.onrender.com/health",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (response.ok) {

            status.innerHTML =
                "<span></span> System Operational";

            status.classList.remove(
                "offline"
            );

        }
        else {

            setBackendOffline(
                status
            );

        }

    }
    catch (error) {

        setBackendOffline(
            status
        );

    }

}


function setBackendOffline(
    status
) {

    status.innerHTML =
        "<span></span> Backend Offline";


    status.classList.add(
        "offline"
    );

}


/* ============================================================
   UTILITIES
   ============================================================ */

function getInitials(name) {

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
        parts[parts.length - 1][0]
    ).toUpperCase();

}


function isMissingColumnError(
    error
) {

    const message =
        (
            error?.message ||
            ""
        ).toLowerCase();


    return (
        message.includes("column") ||
        message.includes("does not exist") ||
        message.includes("schema cache")
    );

}


/* ============================================================
   NOTIFICATION
   ============================================================ */

function showMessage(
    message,
    type = "success"
) {

    let notification =
        document.getElementById(
            "skilltrackNotification"
        );


    if (!notification) {

        notification =
            document.createElement(
                "div"
            );


        notification.id =
            "skilltrackNotification";


        notification.style.position =
            "fixed";


        notification.style.top =
            "20px";


        notification.style.right =
            "20px";


        notification.style.zIndex =
            "99999";


        notification.style.padding =
            "13px 20px";


        notification.style.borderRadius =
            "10px";


        notification.style.color =
            "#fff";


        notification.style.fontSize =
            "14px";


        notification.style.fontWeight =
            "600";


        notification.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.2)";


        notification.style.transition =
            "opacity .25s ease";


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
        notification._timeout
    );


    notification._timeout =
        setTimeout(
            () => {

                notification.style.opacity =
                    "0";

            },
            3000
        );

}


/* ============================================================
   PAGE VISIBILITY
   ============================================================ */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            stopAutomaticRefresh();

        }
        else if (
            currentSettings &&
            currentSettings
                .automatic_background_refresh
        ) {

            startAutomaticRefresh(
                true
            );

        }

    }
);


/* ============================================================
   BEFORE LEAVING PAGE
   ============================================================ */

window.addEventListener(
    "beforeunload",
    event => {

        const button =
            document.getElementById(
                "saveSettingsBtn"
            );


        if (
            button &&
            button.dataset.dirty ===
            "true"
        ) {

            event.preventDefault();

            event.returnValue =
                "";

        }

    }
);


/* ============================================================
   INITIAL BACKEND STATUS CHECK
   ============================================================ */

setTimeout(
    () => {

        checkBackendStatus();

    },
    500
);


/* ============================================================
   GLOBAL ACCESS
   ============================================================ */

window.SkillTrackSettings = {

    save: saveSettings,

    discard: discardChanges,

    reload: loadGovernmentSettings,

    reloadOfficial:
        loadGovernmentOfficial,

    getSettings:
        getSettingsFromUI

};