/* =========================================================
   SKILLTRACK GOVERNMENT DASHBOARD
   BACKEND + ANALYTICS + ML + SETTINGS
   ========================================================= */


/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL =
    "https://skilltrack-sih2026.onrender.com";

const API_KEY =
    "1S5hxZY-SygsprPX-M1__cA0NwFK3THGsSvoE79ygqY";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let coursePlacementData = [];
let districtPlacementData = [];
let providerPlacementData = [];

let wageGrowthData = [];
let relevanceData = [];
let skillGapData = [];

let insightsData = [];
let nonPlacementReasons = [];
let attritionReasons = [];

let impactIndexData = null;
let compositeScoreData = null;
let anomalyData = [];

let placementPredictionData = null;
let attritionPredictionData = null;

let retentionData = {
    3: null,
    6: null,
    12: null
};

let currentEmploymentRate = null;

let autoRefreshTimer = null;

let dashboardSettings = {
    autoRefresh: false,
    showAnalytics: true,
    animations: true
};


/* =========================================================
   API HELPER
   ========================================================= */

async function fetchAPI(endpoint) {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "GET",
            headers: {
                "X-API-Key": API_KEY,
                "Accept": "application/json"
            }
        }
    );

    if (!response.ok) {

        let message =
            `API request failed: ${response.status}`;

        try {

            const errorData =
                await response.json();

            if (errorData.detail) {
                message +=
                    ` - ${errorData.detail}`;
            }

        } catch (error) {

            console.warn(
                "API error response was not JSON."
            );
        }

        throw new Error(message);
    }

    return await response.json();
}


/* =========================================================
   DOM LOADED
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSettings();
        setupSidebar();
        setupNavigation();
        setupModal();
        setupFilters();
        setupButtons();
        setupSettings();

        loadOfficerProfile();
        initializeDashboard();

    }
);


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeDashboard() {

    console.log(
        "SkillTrack Government Dashboard starting..."
    );

    await Promise.allSettled([
        loadCourseData(),
        loadDistrictData(),
        loadProviderData(),
        loadRetention(),
        loadWageGrowth(),
        loadRelevance(),
        loadCompositeScore(),
        loadSkillGap(),
        loadImpactIndex(),
        loadNonPlacementReasons(),
        loadAttritionReasons(),
        loadInsights(),
        loadAnomalies(),
        loadPlacementPrediction(),
        loadAttritionPrediction()
    ]);

    applyDashboardSettings();
    updateLastUpdated();

    console.log(
        "SkillTrack Government Dashboard loaded."
    );
}


/* =========================================================
   SIDEBAR
   ========================================================= */

function setupSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const mobileOverlay =
        document.getElementById("mobileOverlay");

    if (!sidebar || !menuBtn) {
        return;
    }

    menuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

            if (mobileOverlay) {
                mobileOverlay.classList.toggle("show");
            }

        }
    );

    if (mobileOverlay) {
        mobileOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }
}


function closeSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const mobileOverlay =
        document.getElementById("mobileOverlay");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (mobileOverlay) {
        mobileOverlay.classList.remove("show");
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(".nav-link")
                        .forEach(item => {
                            item.classList.remove("active");
                        });

                    link.classList.add("active");

                    closeSidebar();

                    const target =
                        link.getAttribute("href");

                    if (
                        target &&
                        target.startsWith("#")
                    ) {

                        const section =
                            document.querySelector(target);

                        if (section) {

                            section.scrollIntoView({
                                behavior: "smooth"
                            });

                        }
                    }

                }
            );

        });
}


/* =========================================================
   MODAL
   ========================================================= */

function setupModal() {

    const modal =
        document.getElementById("infoModal");

    if (!modal) {
        return;
    }

    document
        .querySelectorAll("[data-close]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    modal.classList.remove("show");
                }
            );

        });

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                modal.classList.remove("show");
            }

        }
    );
}


function showModal(title, message) {

    const modal =
        document.getElementById("infoModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalText =
        document.getElementById("modalText");

    if (!modal) {
        return;
    }

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalText) {
        modalText.textContent = message;
    }

    modal.classList.add("show");
}


/* =========================================================
   OFFICER PROFILE
   ========================================================= */

async function loadOfficerProfile() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.warn(
            "Supabase client not available."
        );

        return;
    }

    try {

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

        const user =
            data?.user;

        if (!user) {

            window.location.href =
                "government-login.html";

            return;
        }

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("government_users")
                .select(`
                    full_name,
                    designation,
                    employee_id,
                    department,
                    phone,
                    email,
                    state,
                    district,
                    office,
                    is_verified
                `)
                .eq("user_id", user.id)
                .maybeSingle();

        if (profileError) {
            throw profileError;
        }

        if (!profile) {

            console.warn(
                "Government officer profile not found."
            );

            return;
        }

        updateOfficerUI(profile);

    } catch (error) {

        console.error(
            "Officer profile error:",
            error
        );
    }
}


/* =========================================================
   OFFICER UI
   ========================================================= */

function updateOfficerUI(profile) {

    const name =
        profile.full_name ||
        "Government Officer";

    const designation =
        profile.designation ||
        "Government Officer";

    const initials =
        getInitials(name);

    const elements = {

        officialName:
            document.getElementById(
                "officialName"
            ),

        officialDesignation:
            document.getElementById(
                "officialDesignation"
            ),

        officialAvatar:
            document.getElementById(
                "officialAvatar"
            ),

        topOfficialName:
            document.getElementById(
                "topOfficialName"
            ),

        topOfficialDesignation:
            document.getElementById(
                "topOfficialDesignation"
            ),

        topAvatar:
            document.getElementById(
                "topAvatar"
            ),

        jurisdiction:
            document.getElementById(
                "officialJurisdiction"
            )
    };

    if (elements.officialName) {
        elements.officialName.textContent =
            name;
    }

    if (elements.officialDesignation) {
        elements.officialDesignation.textContent =
            designation;
    }

    if (elements.officialAvatar) {
        elements.officialAvatar.textContent =
            initials;
    }

    if (elements.topOfficialName) {
        elements.topOfficialName.textContent =
            name;
    }

    if (elements.topOfficialDesignation) {
        elements.topOfficialDesignation.textContent =
            designation;
    }

    if (elements.topAvatar) {
        elements.topAvatar.textContent =
            initials;
    }

    if (elements.jurisdiction) {
        elements.jurisdiction.textContent =
            profile.district ||
            profile.state ||
            "India";
    }
}


function getInitials(name) {

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
        return "--";
    }

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   COURSE DATA
   ========================================================= */

async function loadCourseData() {

    try {

        const data =
            await fetchAPI(
                "/api/metrics/placement-rate?group_by=course"
            );

        coursePlacementData =
            Array.isArray(data)
                ? data
                : [];

        updateCourseTable();
        updateEmploymentKPI();
        updateTotalTrainees();

    } catch (error) {

        console.error(
            "Course API error:",
            error
        );

        showDataError(
            "courseTableBody",
            "Unable to load course data."
        );
    }
}


/* =========================================================
   DISTRICT DATA
   ========================================================= */

async function loadDistrictData() {

    try {

        const data =
            await fetchAPI(
                "/api/metrics/placement-rate?group_by=district"
            );

        districtPlacementData =
            Array.isArray(data)
                ? data
                : [];

        updateDistrictTable();

    } catch (error) {

        console.error(
            "District API error:",
            error
        );

        showDistrictError();
    }
}


/* =========================================================
   PROVIDER DATA
   ========================================================= */

async function loadProviderData() {

    try {

        const data =
            await fetchAPI(
                "/api/metrics/placement-rate?group_by=provider"
            );

        providerPlacementData =
            Array.isArray(data)
                ? data
                : [];

        renderGenericAnalytics(
            "providerPlacement",
            providerPlacementData
        );

    } catch (error) {

        console.error(
            "Provider API error:",
            error
        );

        showAnalyticsError(
            "providerPlacement"
        );
    }
}


/* =========================================================
   RETENTION
   ========================================================= */

async function loadRetention() {

    const months = [3, 6, 12];

    // Show loading state first
    document
        .querySelectorAll(".retention-card")
        .forEach(card => {

            const number =
                card.querySelector(".retention-number");

            if (number) {
                number.textContent = "Loading...";
            }

        });

    // Run all three requests together
    const requests = months.map(async month => {

        try {

            const request = fetchAPI(
                `/api/metrics/retention?month=${month}`
            );

            // Prevent one stuck API request from keeping
            // the entire retention section on Loading...
            const timeout = new Promise((_, reject) => {

                setTimeout(() => {
                    reject(
                        new Error(
                            `Retention API timeout for ${month} months`
                        )
                    );
                }, 8000);

            });

            const data =
                await Promise.race([
                    request,
                    timeout
                ]);

            const value =
                extractPercentage(data);

            if (value !== null) {

                retentionData[month] =
                    normalisePercentage(value);

            } else {

                retentionData[month] = null;

            }

        }
        catch (error) {

            console.error(
                `Retention ${month}M error:`,
                error
            );

            retentionData[month] = null;

        }

    });

    await Promise.allSettled(requests);

    updateRetentionCards();

    // Never leave the UI stuck on "Loading..."
    document
        .querySelectorAll(".retention-card")
        .forEach((card, index) => {

            const month =
                months[index];

            const number =
                card.querySelector(
                    ".retention-number"
                );

            const bar =
                card.querySelector(
                    ".mini-bar span"
                );

            const value =
                retentionData[month];

            if (
                value === null ||
                value === undefined
            ) {

                if (number) {
                    number.textContent =
                        "Unavailable";
                }

                if (bar) {
                    bar.style.width = "0%";
                }

            }

        });

    updateRetentionTrend();
}


/* =========================================================
   RETENTION UI
   ========================================================= */

function updateRetentionCards() {

    const cards =
        document.querySelectorAll(
            ".retention-card"
        );

    const months =
        [3, 6, 12];

    cards.forEach(
        (card, index) => {

            const month =
                months[index];

            const value =
                retentionData[month];

            const number =
                card.querySelector(
                    ".retention-number"
                );

            const bar =
                card.querySelector(
                    ".mini-bar span"
                );

            if (
                value === null ||
                value === undefined
            ) {
                return;
            }

            if (number) {

                number.textContent =
                    `${value}%`;

            }

            if (bar) {

                bar.style.width =
                    `${Math.min(
                        Math.max(value, 0),
                        100
                    )}%`;

            }

        }
    );
}


/* =========================================================
   RETENTION TREND
   ========================================================= */

function updateRetentionTrend() {

    const summary =
        document.querySelector(
            ".retention-summary"
        );

    if (!summary) {
        return;
    }

    const trend =
        summary.querySelector(
            "strong"
        );

    const text =
        summary.querySelector(
            "p"
        );

    const r3 =
        retentionData[3];

    const r6 =
        retentionData[6];

    const r12 =
        retentionData[12];

    if (
        r3 === null ||
        r3 === undefined ||
        r6 === null ||
        r6 === undefined ||
        r12 === null ||
        r12 === undefined
    ) {

        if (trend) {
            trend.textContent =
                "Data unavailable";
        }

        if (text) {
            text.textContent =
                "Retention data is not available from the current API.";
        }

        return;
    }

    let trendText =
        "Stable";

    if (
        r12 > r3 &&
        r12 > r6
    ) {

        trendText =
            "Improving";

    }
    else if (
        r12 < r3 &&
        r12 < r6
    ) {

        trendText =
            "Declining";
    }

    if (trend) {
        trend.textContent =
            trendText;
    }

    if (text) {

        if (trendText === "Improving") {

            text.textContent =
                "Long-term employment retention is improving across the reporting period.";

        }
        else if (trendText === "Declining") {

            text.textContent =
                "Long-term employment retention is declining across the reporting period.";

        }
        else {

            text.textContent =
                "Employment retention is relatively stable across the reporting period.";

        }

    }

}


/* =========================================================
   RETENTION UI
   ========================================================= */

function updateRetentionCards() {

    const months = [3, 6, 12];

    const cards =
        document.querySelectorAll(
            ".retention-card"
        );

    cards.forEach(
        (card, index) => {

            const month =
                months[index];

            const value =
                retentionData[month];

            if (
                value === null ||
                value === undefined
            ) {
                return;
            }

            const number =
                card.querySelector(
                    ".retention-number"
                );

            const bar =
                card.querySelector(
                    ".mini-bar span"
                );

            if (number) {
                number.textContent =
                    `${value}%`;
            }

            if (bar) {
                bar.style.width =
                    `${value}%`;
            }

            const valueElement =
                document.getElementById(
                    `retention${month}`
                );

            const barElement =
                document.getElementById(
                    `retentionBar${month}`
                );

            if (valueElement) {
                valueElement.textContent =
                    `${value}%`;
            }

            if (barElement) {
                barElement.style.width =
                    `${value}%`;
            }
        }
    );
}


/* =========================================================
   TOTAL TRAINEES
   ========================================================= */

function updateTotalTrainees() {

    let total = 0;

    coursePlacementData.forEach(
        course => {

            total +=
                Number(course.completed) || 0;

        }
    );

    const element =
        document.getElementById(
            "totalTrainees"
        );

    if (element) {

        element.textContent =
            total.toLocaleString("en-IN");
    }
}


/* =========================================================
   EMPLOYMENT RATE
   ========================================================= */

function updateEmploymentKPI() {

    let completed = 0;
    let placed = 0;

    coursePlacementData.forEach(
        course => {

            completed +=
                Number(course.completed) || 0;

            placed +=
                Number(course.placed) || 0;

        }
    );

    if (completed === 0) {
        return;
    }

    currentEmploymentRate =
        Number(
            (
                placed /
                completed *
                100
            ).toFixed(1)
        );

    const element =
        document.getElementById(
            "employmentRate"
        );

    if (element) {

        element.textContent =
            `${currentEmploymentRate}%`;
    }

    const counters =
        document.querySelectorAll(".counter");

    if (counters[2]) {

        counters[2].dataset.value =
            currentEmploymentRate;

        counters[2].dataset.suffix =
            "%";
    }
}


/* =========================================================
   COURSE TABLE
   ========================================================= */

function updateCourseTable() {

    const tbody =
        document.getElementById(
            "courseTableBody"
        );

    if (!tbody) {
        return;
    }

    if (!coursePlacementData.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    No course data available.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = "";

    coursePlacementData.forEach(
        (course, index) => {

            const name =
                course.group_key ||
                course.course_name ||
                "Unknown Programme";

            const completed =
                Number(course.completed) || 0;

            const placed =
                Number(course.placed) || 0;

            let rate =
                Number(
                    course.placement_rate_pct
                );

            if (isNaN(rate)) {

                rate =
                    completed > 0
                        ? placed /
                          completed *
                          100
                        : 0;
            }

            rate =
                Number(
                    rate.toFixed(1)
                );

            const status =
                getCourseStatus(rate);

            const initials =
                getCourseInitials(name);

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="course-name">

                        <div class="course-box ${getCourseBoxClass(index)}">
                            ${escapeHTML(initials)}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                Programme
                            </span>
                        </div>

                    </div>
                </td>

                <td>
                    ${completed.toLocaleString("en-IN")}
                </td>

                <td>
                    ${placed.toLocaleString("en-IN")}
                </td>

                <td>
                    <b class="table-positive">
                        ${rate}%
                    </b>
                </td>

                <td>
                    —
                </td>

                <td>
                    <span class="${getStatusClass(rate)}">
                        ${status}
                    </span>
                </td>
            `;

            tbody.appendChild(row);
        }
    );

    applyProgrammeFilter();
}


function getCourseStatus(rate) {

    if (rate >= 75) {
        return "Good";
    }

    if (rate >= 60) {
        return "Watch";
    }

    return "Needs Attention";
}


function getStatusClass(rate) {

    return rate >= 75
        ? "status-good"
        : rate >= 60
            ? "status-watch"
            : "status-alert";
}


function getCourseInitials(name) {

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
        return "--";
    }

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();
}


function getCourseBoxClass(index) {

    const classes = [
        "blue",
        "purple",
        "orange",
        "green"
    ];

    return classes[
        index %
        classes.length
    ];
}


/* =========================================================
   DISTRICT TABLE
   ========================================================= */

function updateDistrictTable() {

    const container =
        document.getElementById(
            "districtList"
        );

    if (!container) {
        return;
    }

    if (!districtPlacementData.length) {

        container.innerHTML = `
            <div class="district-loading">
                No district data available.
            </div>
        `;

        return;
    }

    const sorted =
        [...districtPlacementData]
            .sort(
                (a, b) => {

                    return (
                        Number(
                            b.placement_rate_pct
                        ) || 0
                    ) -
                    (
                        Number(
                            a.placement_rate_pct
                        ) || 0
                    );
                }
            );

    container.innerHTML = "";

    sorted.forEach(
        (item, index) => {

            const name =
                item.group_key ||
                item.district ||
                "Unknown District";

            const completed =
                Number(item.completed) || 0;

            const rate =
                Number(
                    item.placement_rate_pct
                ) || 0;

            const row =
                document.createElement("div");

            row.className =
                "district-row";

            row.innerHTML = `
                <div class="rank">
                    ${String(index + 1).padStart(2, "0")}
                </div>

                <div class="district-info">

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        ${completed.toLocaleString("en-IN")}
                        trainees
                    </span>

                </div>

                <div class="district-value">

                    <strong>
                        ${rate.toFixed(1)}%
                    </strong>

                    <div class="bar">
                        <span
                            style="
                                width:${Math.min(
                                    Math.max(rate, 0),
                                    100
                                )}%
                            "
                        ></span>
                    </div>

                </div>
            `;

            container.appendChild(row);
        }
    );

    applyDistrictFilter();
}


/* =========================================================
   WAGE GROWTH
   ========================================================= */

async function loadWageGrowth() {

    try {

        wageGrowthData =
            await fetchAPI(
                "/api/metrics/wage-growth?group_by=course"
            );

        renderGenericAnalytics(
            "wageGrowth",
            wageGrowthData
        );

    } catch (error) {

        console.error(
            "Wage growth error:",
            error
        );

        showAnalyticsError(
            "wageGrowth"
        );
    }
}


/* =========================================================
   RELEVANCE
   ========================================================= */

async function loadRelevance() {

    try {

        relevanceData =
            await fetchAPI(
                "/api/metrics/relevance?group_by=course"
            );

        renderGenericAnalytics(
            "relevance",
            relevanceData
        );

    } catch (error) {

        console.error(
            "Relevance error:",
            error
        );

        showAnalyticsError(
            "relevance"
        );
    }
}


/* =========================================================
   COMPOSITE SCORE
   ========================================================= */

async function loadCompositeScore() {

    try {

        compositeScoreData =
            await fetchAPI(
                "/api/metrics/composite-score"
            );

        const value =
            extractNumber(
                compositeScoreData,
                [
                    "composite_score",
                    "overall_score",
                    "score",
                    "value"
                ]
            );

        displayValue(
            ["compositeScore"],
            value
        );

    } catch (error) {

        console.error(
            "Composite score error:",
            error
        );

        showAnalyticsError(
            "compositeScore"
        );
    }
}


/* =========================================================
   SKILL GAP
   ========================================================= */

async function loadSkillGap() {

    try {

        skillGapData =
            await fetchAPI(
                "/api/metrics/skill-gap"
            );

        renderGenericAnalytics(
            "skillGap",
            skillGapData
        );

    } catch (error) {

        console.error(
            "Skill gap error:",
            error
        );

        showAnalyticsError(
            "skillGap"
        );
    }
}


/* =========================================================
   IMPACT INDEX
   ========================================================= */

async function loadImpactIndex() {

    try {

        impactIndexData =
            await fetchAPI(
                "/api/metrics/impact-index"
            );

        let value =
            extractNumber(
                impactIndexData,
                [
                    "overall_impact_index",
                    "impact_index",
                    "score",
                    "value"
                ]
            );

        if (
            value !== null &&
            value <= 1
        ) {
            value *= 100;
        }

        displayValue(
            ["impactIndex"],
            value
        );

    } catch (error) {

        console.error(
            "Impact index error:",
            error
        );

        showAnalyticsError(
            "impactIndex"
        );
    }
}


/* =========================================================
   NON-PLACEMENT REASONS
   ========================================================= */

async function loadNonPlacementReasons() {

    try {

        nonPlacementReasons =
            await fetchAPI(
                "/api/reasons/non-placement"
            );

        renderGenericAnalytics(
            "nonPlacementReasons",
            nonPlacementReasons
        );

    } catch (error) {

        console.error(
            "Non-placement error:",
            error
        );

        showAnalyticsError(
            "nonPlacementReasons"
        );
    }
}


/* =========================================================
   ATTRITION REASONS
   ========================================================= */

async function loadAttritionReasons() {

    try {

        attritionReasons =
            await fetchAPI(
                "/api/reasons/attrition"
            );

        renderGenericAnalytics(
            "attritionReasons",
            attritionReasons
        );

    } catch (error) {

        console.error(
            "Attrition reasons error:",
            error
        );

        showAnalyticsError(
            "attritionReasons"
        );
    }
}


/* =========================================================
   INSIGHTS
   ========================================================= */

async function loadInsights() {

    try {

        insightsData =
            await fetchAPI(
                "/api/insights"
            );

        renderInsights(
            insightsData
        );

    } catch (error) {

        console.error(
            "Insights error:",
            error
        );

        showAnalyticsError(
            "insights"
        );
    }
}


/* =========================================================
   ANOMALIES
   ========================================================= */

async function loadAnomalies() {

    try {

        anomalyData =
            await fetchAPI(
                "/api/ml/anomalies?z_threshold=1.0"
            );

        const count =
            Array.isArray(anomalyData)
                ? anomalyData.length
                : 0;

        displayValue(
            ["anomalyCount"],
            count
        );

        renderGenericAnalytics(
            "anomalies",
            anomalyData
        );

    } catch (error) {

        console.error(
            "Anomaly API error:",
            error
        );

        showAnalyticsError(
            "anomalies"
        );
    }
}


/* =========================================================
   PLACEMENT ML
   ========================================================= */

async function loadPlacementPrediction() {

    try {

        placementPredictionData =
            await fetchAPI(
                "/api/ml/placement-prediction-demo"
            );

        renderPrediction(
            "placementPrediction",
            placementPredictionData
        );

        updateMLStatus();

    } catch (error) {

        console.error(
            "Placement prediction error:",
            error
        );

        showAnalyticsError(
            "placementPrediction"
        );
    }
}


/* =========================================================
   ATTRITION ML
   ========================================================= */

async function loadAttritionPrediction() {

    try {

        attritionPredictionData =
            await fetchAPI(
                "/api/ml/attrition-prediction-demo"
            );

        renderPrediction(
            "attritionPrediction",
            attritionPredictionData
        );

        updateMLStatus();

    } catch (error) {

        console.error(
            "Attrition prediction error:",
            error
        );

        showAnalyticsError(
            "attritionPrediction"
        );
    }
}


/* =========================================================
   ML STATUS
   ========================================================= */

function updateMLStatus() {

    const element =
        document.getElementById(
            "mlStatus"
        );

    if (!element) {
        return;
    }

    if (
        placementPredictionData &&
        attritionPredictionData
    ) {

        element.textContent =
            "Available";

    } else {

        element.textContent =
            "Partial";
    }
}


/* =========================================================
   GENERIC ANALYTICS
   ========================================================= */

function renderGenericAnalytics(id, data) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    if (
        data === null ||
        data === undefined
    ) {

        element.innerHTML =
            `<div class="analytics-empty">
                No data available.
            </div>`;

        return;
    }

    if (
        typeof data === "string" ||
        typeof data === "number"
    ) {

        element.textContent =
            data;

        return;
    }

    if (id === "providerPlacement") {

        renderProviderPlacement(
            element,
            Array.isArray(data)
                ? data
                : []
        );

        return;
    }

    if (id === "wageGrowth") {

        renderWageGrowth(
            element,
            Array.isArray(data)
                ? data
                : []
        );

        return;
    }

    if (id === "relevance") {

        renderRelevance(
            element,
            Array.isArray(data)
                ? data
                : []
        );

        return;
    }

    if (id === "skillGap") {

        renderSkillGap(
            element,
            Array.isArray(data)
                ? data
                : []
        );

        return;
    }

    if (id === "nonPlacementReasons") {

        renderReasonList(
            element,
            data,
            "reason_label"
        );

        return;
    }

    if (id === "attritionReasons") {

        renderReasonList(
            element,
            data,
            "reason_label"
        );

        return;
    }

    if (id === "anomalies") {

        renderAnomalies(
            element,
            Array.isArray(data)
                ? data
                : []
        );

        return;
    }

    if (id === "insights") {

        renderInsights(data);

        return;
    }

    renderKeyValueData(
        element,
        data
    );
}


/* =========================================================
   PROVIDER PLACEMENT
   ========================================================= */

function renderProviderPlacement(
    element,
    data
) {

    if (!data.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No provider placement data available.
            </div>`;

        return;
    }

    element.innerHTML =
        data.map(item => {

            const name =
                item.group_key ||
                item.provider_name ||
                item.provider ||
                "Unknown Provider";

            const rate =
                Number(
                    item.placement_rate_pct
                ) || 0;

            const completed =
                Number(item.completed) || 0;

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <small>
                            ${completed.toLocaleString("en-IN")}
                            trainees
                        </small>
                    </div>

                    <strong>
                        ${rate.toFixed(1)}%
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   WAGE GROWTH RENDERER
   ========================================================= */

function renderWageGrowth(
    element,
    data
) {

    if (!data.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No wage growth data available.
            </div>`;

        return;
    }

    element.innerHTML =
        data.map(item => {

            const name =
                item.group_key ||
                item.course_name ||
                "Unknown Course";

            const growth =
                Number(
                    item.wage_growth_pct
                );

            const value =
                Number.isFinite(growth)
                    ? growth
                    : 0;

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(name)}
                        </strong>
                    </div>

                    <strong>
                        ${value.toFixed(1)}%
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   RELEVANCE RENDERER
   ========================================================= */

function renderRelevance(
    element,
    data
) {

    if (!data.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No training relevance data available.
            </div>`;

        return;
    }

    element.innerHTML =
        data.map(item => {

            const name =
                item.course_name ||
                item.group_key ||
                "Unknown Course";

            const score =
                Number(
                    item.relevance_score
                );

            const value =
                Number.isFinite(score)
                    ? score
                    : 0;

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(name)}
                        </strong>
                    </div>

                    <strong>
                        ${value.toFixed(1)}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   SKILL GAP RENDERER
   ========================================================= */

function renderSkillGap(
    element,
    data
) {

    if (!data.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No skill gap data available.
            </div>`;

        return;
    }

    element.innerHTML =
        data.map(item => {

            const skill =
                item.missing_skill ||
                item.skill ||
                "Unknown Skill";

            const demand =
                Number(
                    item.demand_count
                ) || 0;

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(skill)}
                        </strong>
                    </div>

                    <strong>
                        ${demand.toLocaleString("en-IN")}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   REASON LIST
   ========================================================= */

function renderReasonList(
    element,
    data,
    labelKey
) {

    let rows =
        Array.isArray(data)
            ? data
            : Array.isArray(data?.reasons)
                ? data.reasons
                : [];

    if (!rows.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No data available.
            </div>`;

        return;
    }

    element.innerHTML =
        rows.map(item => {

            const label =
                item[labelKey] ||
                item.reason ||
                item.label ||
                "Unknown";

            const count =
                Number(
                    item.n ??
                    item.count ??
                    item.total
                ) || 0;

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(label)}
                        </strong>
                    </div>

                    <strong>
                        ${count.toLocaleString("en-IN")}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   ANOMALIES
   ========================================================= */

function renderAnomalies(
    element,
    data
) {

    if (!data.length) {

        element.innerHTML =
            `<div class="analytics-empty">
                No anomalies detected.
            </div>`;

        return;
    }

    element.innerHTML =
        data.map(item => {

            const group =
                item.group_key ||
                item.course_name ||
                item.district ||
                item.provider ||
                "Anomaly";

            const score =
                item.z_score ??
                item.score ??
                "";

            return `
                <div class="analytics-row">

                    <div>
                        <strong>
                            ${escapeHTML(group)}
                        </strong>
                    </div>

                    <strong>
                        ${escapeHTML(score)}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   INSIGHTS
   ========================================================= */

function renderInsights(data) {

    const element =
        document.getElementById(
            "insights"
        );

    if (!element) {
        return;
    }

    if (
        data === null ||
        data === undefined
    ) {

        element.textContent =
            "No insights available.";

        return;
    }

    let insights = [];

    if (Array.isArray(data)) {

        insights =
            data;

    } else if (
        Array.isArray(data.insights)
    ) {

        insights =
            data.insights;

    } else if (
        typeof data.insights === "string"
    ) {

        insights =
            [data.insights];
    }

    if (!insights.length) {

        element.textContent =
            "No insights available.";

        return;
    }

    element.innerHTML =
        insights
            .map(insight => {

                const text =
                    typeof insight === "string"
                        ? insight
                        : JSON.stringify(insight);

                return `
                    <div class="insight-item">
                        ${escapeHTML(text)}
                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   ML PREDICTION
   ========================================================= */

function renderPrediction(
    id,
    data
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    if (
        data === null ||
        data === undefined
    ) {

        element.innerHTML = `
            <div class="analytics-empty">
                No model evaluation available.
            </div>
        `;

        return;
    }

    const auc =
        data.auc_roc !== null &&
        data.auc_roc !== undefined &&
        Number.isFinite(
            Number(data.auc_roc)
        )
            ? Number(data.auc_roc)
            : null;

    const f1 =
        data.f1_score !== null &&
        data.f1_score !== undefined &&
        Number.isFinite(
            Number(data.f1_score)
        )
            ? Number(data.f1_score)
            : null;

    const hasEvaluation =
        auc !== null ||
        f1 !== null;

    const note =
        data.note ||
        "Illustrative ML pipeline only.";

    if (!hasEvaluation) {

        element.innerHTML = `
            <div class="ml-result ml-result-empty">

                <div class="ml-result-heading">
                    <strong>
                        Demo model
                    </strong>

                    <span class="ml-demo-badge">
                        Illustrative only
                    </span>
                </div>

                <div class="ml-message">
                    Not enough data to evaluate this model.
                </div>

                <p class="ml-note">
                    ${escapeHTML(note)}
                </p>

            </div>
        `;

        return;
    }

    const train =
        Number(data.n_train) || 0;

    const test =
        Number(data.n_test) || 0;

    const topFeatures =
        Array.isArray(data.top_features)
            ? data.top_features
            : [];

    const title =
        id === "placementPrediction"
            ? "Placement model evaluation"
            : "Attrition model evaluation";

    element.innerHTML = `
        <div class="ml-result">

            <div class="ml-result-heading">

                <strong>
                    ${title}
                </strong>

                <span class="ml-demo-badge">
                    Illustrative only
                </span>

            </div>

            <div class="ml-metrics">

                <div class="ml-metric">

                    <span>
                        AUC-ROC
                    </span>

                    <strong>
                        ${
                            auc !== null
                                ? auc.toFixed(3)
                                : "N/A"
                        }
                    </strong>

                </div>

                <div class="ml-metric">

                    <span>
                        F1 Score
                    </span>

                    <strong>
                        ${
                            f1 !== null
                                ? f1.toFixed(3)
                                : "N/A"
                        }
                    </strong>

                </div>

            </div>

            <div class="ml-meta-grid">

                <div>

                    <span>
                        Training samples
                    </span>

                    <strong>
                        ${formatInteger(train)}
                    </strong>

                </div>

                <div>

                    <span>
                        Test samples
                    </span>

                    <strong>
                        ${formatInteger(test)}
                    </strong>

                </div>

            </div>

            ${
                topFeatures.length
                    ? `
                        <div class="ml-features">

                            <span>
                                Top model features
                            </span>

                            <div>
                                ${
                                    topFeatures
                                        .map(
                                            feature => `
                                                <span>
                                                    ${escapeHTML(
                                                        String(feature)
                                                    )}
                                                </span>
                                            `
                                        )
                                        .join("")
                                }
                            </div>

                        </div>
                    `
                    : ""
            }

            <p class="ml-note">
                ${escapeHTML(note)}
            </p>

        </div>
    `;
}


/* =========================================================
   NUMBER EXTRACTOR
   ========================================================= */

function extractNumber(
    data,
    keys
) {

    if (
        data === null ||
        data === undefined
    ) {
        return null;
    }

    if (typeof data === "number") {
        return data;
    }

    if (Array.isArray(data)) {

        for (const item of data) {

            const result =
                extractNumber(
                    item,
                    keys
                );

            if (result !== null) {
                return result;
            }
        }

        return null;
    }

    if (typeof data === "object") {

        for (const key of keys) {

            if (
                data[key] !== undefined &&
                data[key] !== null
            ) {

                const number =
                    Number(data[key]);

                if (!isNaN(number)) {
                    return number;
                }
            }
        }

        for (const key of Object.keys(data)) {

            if (
                typeof data[key] ===
                "object"
            ) {

                const result =
                    extractNumber(
                        data[key],
                        keys
                    );

                if (result !== null) {
                    return result;
                }
            }
        }
    }

    return null;
}


/* =========================================================
   DISPLAY VALUE
   ========================================================= */

function displayValue(
    ids,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return;
    }

    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        if (typeof value === "number") {

            element.textContent =
                value.toFixed(1);

        } else {

            element.textContent =
                value;
        }
    });
}


/* =========================================================
   FILTERS
   ========================================================= */

function setupFilters() {

    const stateFilter =
        document.getElementById(
            "stateFilter"
        );

    const districtFilter =
        document.getElementById(
            "districtFilter"
        );

    const programmeFilter =
        document.getElementById(
            "programmeFilter"
        );

    const districtMetric =
        document.getElementById(
            "districtMetric"
        );

    const resetFilters =
        document.getElementById(
            "resetFilters"
        );

    if (stateFilter) {

        stateFilter.addEventListener(
            "change",
            applyAllFilters
        );
    }

    if (districtFilter) {

        districtFilter.addEventListener(
            "change",
            applyDistrictFilter
        );
    }

    if (programmeFilter) {

        programmeFilter.addEventListener(
            "change",
            applyProgrammeFilter
        );
    }

    if (districtMetric) {

        districtMetric.addEventListener(
            "change",
            updateDistrictTable
        );
    }

    if (resetFilters) {

        resetFilters.addEventListener(
            "click",
            () => {

                if (stateFilter) {
                    stateFilter.selectedIndex = 0;
                }

                if (districtFilter) {
                    districtFilter.selectedIndex = 0;
                }

                if (programmeFilter) {
                    programmeFilter.selectedIndex = 0;
                }

                applyAllFilters();
            }
        );
    }
}


function applyAllFilters() {

    applyDistrictFilter();
    applyProgrammeFilter();
}


function applyDistrictFilter() {

    const filter =
        document.getElementById(
            "districtFilter"
        );

    if (!filter) {
        return;
    }

    const selected =
        filter.value
            .trim()
            .toLowerCase();

    document
        .querySelectorAll(".district-row")
        .forEach(row => {

            const text =
                row.textContent
                    .toLowerCase();

            row.style.display =
                (
                    selected === "" ||
                    selected === "all districts" ||
                    text.includes(selected)
                )
                    ? ""
                    : "none";
        });
}


function applyProgrammeFilter() {

    const filter =
        document.getElementById(
            "programmeFilter"
        );

    if (!filter) {
        return;
    }

    const selected =
        filter.value
            .trim()
            .toLowerCase();

    document
        .querySelectorAll(
            ".course-panel tbody tr"
        )
        .forEach(row => {

            const text =
                row.textContent
                    .toLowerCase();

            row.style.display =
                (
                    selected === "" ||
                    selected === "all programmes" ||
                    text.includes(selected)
                )
                    ? ""
                    : "none";
        });
}


/* =========================================================
   BUTTONS
   ========================================================= */

function setupButtons() {

    const notificationBtn =
        document.getElementById(
            "notificationBtn"
        );

    const outcomeInfo =
        document.getElementById(
            "outcomeInfo"
        );

    const courseDetailsBtn =
        document.getElementById(
            "courseDetailsBtn"
        );

    const exportBtn =
        document.getElementById(
            "exportBtn"
        );

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    const refreshAnalyticsBtn =
        document.getElementById(
            "refreshAnalyticsBtn"
        );

    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            () => {

                showModal(
                    "Dashboard Notifications",
                    "Review the latest programme insights, retention indicators and backend analytics."
                );
            }
        );
    }

    if (outcomeInfo) {

        outcomeInfo.addEventListener(
            "click",
            () => {

                showModal(
                    "Outcome Analytics",
                    "Outcome analytics are calculated from the SkillTrack Analytics API."
                );
            }
        );
    }

    if (courseDetailsBtn) {

        courseDetailsBtn.addEventListener(
            "click",
            () => {

                showModal(
                    "Course Performance",
                    "Course-wise placement performance is loaded directly from the SkillTrack backend."
                );
            }
        );
    }

    if (refreshAnalyticsBtn) {

        refreshAnalyticsBtn.addEventListener(
            "click",
            refreshDashboardData
        );
    }

    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            exportReport
        );
    }

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to sign out?"
        );

    if (!confirmed) {
        return;
    }

    try {

        if (
            typeof supabaseClient !==
            "undefined"
        ) {

            await supabaseClient
                .auth
                .signOut();
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );
    }

    window.location.href =
        "login-selection.html";
}


/* =========================================================
   EXPORT REPORT
   ========================================================= */

function exportReport() {

    const report = `
SKILLTRACK GOVERNMENT DASHBOARD REPORT
======================================

Completed Trainees:
${getTotalCompleted()}

Employment Rate:
${
    currentEmploymentRate !== null
        ? currentEmploymentRate + "%"
        : "Unavailable"
}

RETENTION
---------

3 Month:
${
    retentionData[3] !== null
        ? retentionData[3] + "%"
        : "Unavailable"
}

6 Month:
${
    retentionData[6] !== null
        ? retentionData[6] + "%"
        : "Unavailable"
}

12 Month:
${
    retentionData[12] !== null
        ? retentionData[12] + "%"
        : "Unavailable"
}

IMPACT INDEX
------------
${formatObject(impactIndexData)}

COMPOSITE SCORE
---------------
${formatObject(compositeScoreData)}

INSIGHTS
--------
${formatObject(insightsData)}

DATA SOURCE
-----------
SkillTrack Analytics API

`;

    const blob =
        new Blob(
            [report],
            {
                type: "text/plain"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href =
        url;

    link.download =
        "SkillTrack-Government-Report.txt";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


function getTotalCompleted() {

    let total = 0;

    coursePlacementData.forEach(
        course => {

            total +=
                Number(course.completed) || 0;

        }
    );

    return total.toLocaleString(
        "en-IN"
    );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const settingsLink =
        document.querySelector(
            'a[href="#settings"]'
        );

    if (!settingsLink) {
        return;
    }

    settingsLink.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showSettings();
        }
    );
}


function showSettings() {

    let modal =
        document.getElementById(
            "settingsModal"
        );

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "settingsModal";

        modal.className =
            "settings-modal";

        modal.innerHTML = `
            <div class="settings-box">

                <div class="settings-header">

                    <div>
                        <p>
                            DASHBOARD SETTINGS
                        </p>

                        <h2>
                            Settings
                        </h2>
                    </div>

                    <button
                        type="button"
                        id="closeSettings"
                    >
                        ×
                    </button>

                </div>

                <div class="settings-content">

                    <label class="setting-row">

                        <span>
                            <strong>
                                Automatic Refresh
                            </strong>

                            <small>
                                Refresh dashboard data every 5 minutes.
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            id="autoRefreshSetting"
                        >

                    </label>

                    <label class="setting-row">

                        <span>
                            <strong>
                                Analytics & ML
                            </strong>

                            <small>
                                Show advanced analytics and ML results.
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            id="analyticsSetting"
                        >

                    </label>

                    <label class="setting-row">

                        <span>
                            <strong>
                                Dashboard Animations
                            </strong>

                            <small>
                                Enable dashboard animations.
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            id="animationSetting"
                        >

                    </label>

                    <div class="settings-actions">

                        <button
                            type="button"
                            id="resetSettings"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            id="saveSettings"
                        >
                            Save Settings
                        </button>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("closeSettings")
            .addEventListener(
                "click",
                () => {
                    modal.classList.remove("show");
                }
            );

        document
            .getElementById("saveSettings")
            .addEventListener(
                "click",
                saveSettings
            );

        document
            .getElementById("resetSettings")
            .addEventListener(
                "click",
                resetSettings
            );
    }

    document
        .getElementById(
            "autoRefreshSetting"
        )
        .checked =
        dashboardSettings.autoRefresh;

    document
        .getElementById(
            "analyticsSetting"
        )
        .checked =
        dashboardSettings.showAnalytics;

    document
        .getElementById(
            "animationSetting"
        )
        .checked =
        dashboardSettings.animations;

    modal.classList.add("show");
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    dashboardSettings = {

        autoRefresh:
            document.getElementById(
                "autoRefreshSetting"
            ).checked,

        showAnalytics:
            document.getElementById(
                "analyticsSetting"
            ).checked,

        animations:
            document.getElementById(
                "animationSetting"
            ).checked
    };

    localStorage.setItem(
        "skilltrackGovernmentSettings",
        JSON.stringify(
            dashboardSettings
        )
    );

    applyDashboardSettings();

    const modal =
        document.getElementById(
            "settingsModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }

    showModal(
        "Settings Saved",
        "Your dashboard settings have been saved successfully."
    );
}


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    try {

        const saved =
            localStorage.getItem(
                "skilltrackGovernmentSettings"
            );

        if (saved) {

            dashboardSettings = {
                ...dashboardSettings,
                ...JSON.parse(saved)
            };
        }

    } catch (error) {

        console.error(
            "Settings load error:",
            error
        );
    }
}


/* =========================================================
   RESET SETTINGS
   ========================================================= */

function resetSettings() {

    dashboardSettings = {
        autoRefresh: false,
        showAnalytics: true,
        animations: true
    };

    localStorage.removeItem(
        "skilltrackGovernmentSettings"
    );

    const auto =
        document.getElementById(
            "autoRefreshSetting"
        );

    const analytics =
        document.getElementById(
            "analyticsSetting"
        );

    const animations =
        document.getElementById(
            "animationSetting"
        );

    if (auto) {
        auto.checked = false;
    }

    if (analytics) {
        analytics.checked = true;
    }

    if (animations) {
        animations.checked = true;
    }

    applyDashboardSettings();
}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function applyDashboardSettings() {

    const analytics =
        document.getElementById(
            "advancedAnalytics"
        );

    if (analytics) {

        analytics.style.display =
            dashboardSettings.showAnalytics
                ? ""
                : "none";
    }

    document.body.classList.toggle(
        "no-animations",
        !dashboardSettings.animations
    );

    if (
        dashboardSettings.autoRefresh
    ) {

        startAutoRefresh();

    } else {

        stopAutoRefresh();
    }
}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function startAutoRefresh() {

    stopAutoRefresh();

    autoRefreshTimer =
        setInterval(
            () => {
                refreshDashboardData();
            },
            5 * 60 * 1000
        );
}


function stopAutoRefresh() {

    if (autoRefreshTimer) {

        clearInterval(
            autoRefreshTimer
        );

        autoRefreshTimer = null;
    }
}


/* =========================================================
   REFRESH DASHBOARD
   ========================================================= */

async function refreshDashboardData() {

    console.log(
        "Refreshing dashboard data..."
    );

    const refreshButton =
        document.getElementById(
            "refreshAnalyticsBtn"
        );

    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "Refreshing...";
    }

    await Promise.allSettled([
        loadCourseData(),
        loadDistrictData(),
        loadProviderData(),
        loadRetention(),
        loadWageGrowth(),
        loadRelevance(),
        loadCompositeScore(),
        loadSkillGap(),
        loadImpactIndex(),
        loadNonPlacementReasons(),
        loadAttritionReasons(),
        loadInsights(),
        loadAnomalies(),
        loadPlacementPrediction(),
        loadAttritionPrediction()
    ]);

    updateLastUpdated();

    if (refreshButton) {

        refreshButton.disabled =
            false;

        refreshButton.textContent =
            "Refresh data";
    }

    const status =
        document.getElementById(
            "advancedStatus"
        );

    if (status) {

        status.textContent =
            "Analytics updated successfully.";
    }

    console.log(
        "Dashboard data refreshed."
    );
}


/* =========================================================
   LAST UPDATED
   ========================================================= */

function updateLastUpdated() {

    const element =
        document.getElementById(
            "lastUpdated"
        );

    if (!element) {
        return;
    }

    const now =
        new Date();

    element.textContent =
        `Last updated: ${now.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        )}`;
}


/* =========================================================
   ERROR HELPERS
   ========================================================= */

function showAnalyticsError(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.innerHTML = `
        <span class="analytics-error">
            Unable to load data.
        </span>
    `;
}


function showDataError(
    id,
    message
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.innerHTML = `
        <tr>
            <td colspan="6">
                ${escapeHTML(message)}
            </td>
        </tr>
    `;
}


function showDistrictError() {

    const container =
        document.getElementById(
            "districtList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="district-loading">
            Unable to load district data.
        </div>
    `;
}


/* =========================================================
   FALLBACK KEY VALUE RENDERER
   ========================================================= */

function renderKeyValueData(
    element,
    data
) {

    if (
        data === null ||
        data === undefined
    ) {

        element.innerHTML =
            `<div class="analytics-empty">
                No data available.
            </div>`;

        return;
    }

    if (Array.isArray(data)) {

        if (!data.length) {

            element.innerHTML =
                `<div class="analytics-empty">
                    No data available.
                </div>`;

            return;
        }

        element.innerHTML =
            data.map(
                item => {

                    if (
                        typeof item ===
                        "object"
                    ) {

                        return `
                            <div class="analytics-row">
                                ${Object.entries(item)
                                    .map(
                                        ([key, value]) => `
                                            <span>
                                                <strong>
                                                    ${escapeHTML(key)}:
                                                </strong>
                                                ${escapeHTML(value)}
                                            </span>
                                        `
                                    )
                                    .join("")}
                            </div>
                        `;
                    }

                    return `
                        <div class="analytics-row">
                            ${escapeHTML(item)}
                        </div>
                    `;
                }
            ).join("");

        return;
    }

    if (
        typeof data ===
        "object"
    ) {

        element.innerHTML =
            Object.entries(data)
                .map(
                    ([key, value]) => {

                        const formatted =
                            typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);

                        return `
                            <div class="analytics-row">

                                <span>
                                    <strong>
                                        ${escapeHTML(key)}
                                    </strong>
                                </span>

                                <span>
                                    ${escapeHTML(formatted)}
                                </span>

                            </div>
                        `;
                    }
                )
                .join("");

        return;
    }

    element.textContent =
        String(data);
}


/* =========================================================
   FORMAT INTEGER
   ========================================================= */

function formatInteger(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return Math.round(number)
        .toLocaleString("en-IN");
}


/* =========================================================
   FORMAT OBJECT
   ========================================================= */

function formatObject(data) {

    if (
        data === null ||
        data === undefined
    ) {

        return "No data available.";
    }

    if (typeof data === "string") {
        return data;
    }

    if (typeof data === "number") {
        return String(data);
    }

    try {

        return JSON.stringify(
            data,
            null,
            2
        );

    } catch (error) {

        return String(data);
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

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