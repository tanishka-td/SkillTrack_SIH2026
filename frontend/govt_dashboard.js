/* =========================================================
   SKILLTRACK
   GOVERNMENT DASHBOARD BACKEND
   ========================================================= */


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let currentOfficial = null;

let allProfiles = [];
let allTrainingRecords = [];
let allEmploymentRecords = [];

let filteredProfiles = [];
let filteredTrainingRecords = [];
let filteredEmploymentRecords = [];

let retentionChart = null;
let outcomeDonutChart = null;
let courseComparisonChart = null;

let currentFilters = {
    state: "",
    district: "",
    programme: ""
};


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "SkillTrack Government Dashboard starting..."
        );


        /* =================================================
           CHECK SUPABASE
           ================================================= */

        if (
            typeof supabaseClient === "undefined"
        ) {

            console.error(
                "supabaseClient is not available."
            );

            showDashboardError(
                "Supabase connection is not available."
            );

            return;
        }


        /* =================================================
           INITIAL UI
           ================================================= */

        setupNavigation();
        setupMobileMenu();
        setupLogout();
        setupFilters();
        setupSettings();
        setupModals();
        setupExport();
        setupAnalyticsRefresh();
        setupMlTools();


        /* =================================================
           LOAD DASHBOARD
           ================================================= */

        await initializeDashboard();
        loadAdvancedAnalytics();

    }
);


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeDashboard() {

    try {

        setAdvancedStatus(
            "Loading government dashboard data..."
        );


        /* =================================================
           GET AUTH USER
           ================================================= */

        const {
            data: authData,
            error: authError
        } = await supabaseClient.auth.getUser();


        if (authError) {
            throw authError;
        }


        currentUser = authData.user;


        if (!currentUser) {

            window.location.href =
                "govt_login.html";

            return;
        }


        console.log(
            "Government user:",
            currentUser.id
        );


        /* =================================================
           FETCH OFFICIAL PROFILE
           ================================================= */

        await loadOfficialProfile();


        /* =================================================
           VERIFY GOVERNMENT ACCESS
           ================================================= */

        if (
            currentOfficial.verification_status !== true
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "govt_login.html";

            return;
        }


        /* =================================================
           LOAD PROGRAMME DATA
           
           IMPORTANT:
           This now comes from our LOCAL DEMO DATABASE,
           NOT Supabase.
           ================================================= */

        await loadProgrammeData();


        /* =================================================
           FIND AVAILABLE DEMO STATES
           ================================================= */

        const availableStates = [
            ...new Set(
                allProfiles
                    .map(profile => profile.state)
                    .filter(Boolean)
            )
        ].sort();


        /* =================================================
           GOVERNMENT OFFICIAL'S JURISDICTION
           ================================================= */

        const officialState =
            currentOfficial.state || "";

        const officialDistrict =
            currentOfficial.district || "";


        /* =================================================
           SELECT INITIAL STATE
           
           If the official's state exists in the demo
           data, use it.

           Otherwise, automatically select the first
           state available in the demo dataset.
           ================================================= */

        if (
            availableStates.includes(
                officialState
            )
        ) {

            currentFilters.state =
                officialState;

        } else {

            currentFilters.state =
                availableStates[0] || "";

        }


        /* =================================================
           SET STATE DROPDOWN
           ================================================= */

        const stateFilter =
            document.getElementById(
                "stateFilter"
            );


        if (stateFilter) {

            const stateOption =
                Array.from(
                    stateFilter.options
                ).find(
                    option =>
                        option.value ===
                        currentFilters.state
                );


            if (stateOption) {

                stateFilter.value =
                    currentFilters.state;

            }

        }


        /* =================================================
           LOAD DISTRICTS FOR SELECTED STATE
           ================================================= */

        populateDistrictFilter(
            currentFilters.state
        );


        /* =================================================
           GET AVAILABLE DISTRICTS
           ================================================= */

        const availableDistricts = [
            ...new Set(
                allProfiles
                    .filter(
                        profile =>
                            !currentFilters.state ||
                            profile.state ===
                                currentFilters.state
                    )
                    .map(
                        profile =>
                            profile.district
                    )
                    .filter(Boolean)
            )
        ].sort();


        /* =================================================
           SELECT INITIAL DISTRICT
           
           Keep the government official's district only
           if that district actually exists in the demo
           dataset.

           Otherwise leave district as "All".
           ================================================= */

        if (
            officialState ===
                currentFilters.state &&
            availableDistricts.includes(
                officialDistrict
            )
        ) {

            currentFilters.district =
                officialDistrict;

        } else {

            currentFilters.district =
                "";

        }


        /* =================================================
           SET DISTRICT DROPDOWN
           ================================================= */

        const districtFilter =
            document.getElementById(
                "districtFilter"
            );


        if (
            districtFilter &&
            currentFilters.district
        ) {

            districtFilter.value =
                currentFilters.district;

        }


        /* =================================================
           APPLY FILTERS
           ================================================= */

        applyFilters();


        /* =================================================
           UPDATE LAST UPDATED TIME
           ================================================= */

        updateLastUpdated();


        /* =================================================
           UPDATE STATUS
           ================================================= */

        setAdvancedStatus(
            "Demo programme data loaded successfully."
        );


        console.log(
            "Government dashboard ready."
        );


    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );


        showDashboardError(
            error.message ||
            "Unable to load government dashboard."
        );


        setAdvancedStatus(
            "Unable to load dashboard data."
        );

    }

}

/* =========================================================
   LOAD OFFICIAL PROFILE
   ========================================================= */

async function loadOfficialProfile() {

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
                verification_status
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Official profile error:",
            error
        );

        throw error;

    }


    if (!data) {

        throw new Error(
            "Government official profile not found."
        );

    }


    currentOfficial =
        data;


    console.log(
        "Official profile loaded:",
        currentOfficial
    );


    updateOfficialUI();

}


/* =========================================================
   UPDATE OFFICIAL UI
   ========================================================= */

function updateOfficialUI() {

    const fullName =
        currentOfficial.full_name ||
        "Government Official";


    const designation =
        currentOfficial.designation ||
        currentOfficial.official_role ||
        "Authorized Official";


    const state =
        currentOfficial.state ||
        "Unknown State";


    const district =
        currentOfficial.district ||
        "All Districts";


    const initials =
        getInitials(fullName);


    /* =====================================================
       SIDEBAR
       ===================================================== */

    setText(
        "officialName",
        fullName
    );


    setText(
        "officialDesignation",
        designation
    );


    setText(
        "officialAvatar",
        initials
    );


    /* =====================================================
       TOPBAR
       ===================================================== */

    setText(
        "topOfficialName",
        fullName
    );


    setText(
        "topOfficialDesignation",
        designation
    );


    setText(
        "topAvatar",
        initials
    );


    /* =====================================================
       JURISDICTION
       ===================================================== */

    setText(
        "officialJurisdiction",
        `${district}, ${state}`
    );

}


/* =========================================================
   LOAD PROGRAMME DATA
   ========================================================= */

async function loadProgrammeData() {
    console.log("Loading programme data from local demo database...");

    let data;

    try {
        // Primary source: the FastAPI analytics backend (live SQLite/Supabase-fed data).
        const response = await fetch(
            `${ANALYTICS_API_BASE}/api/demo/programme-data`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Programme data -> HTTP ${response.status}`
            );
        }

        data = await response.json();

    } catch (error) {
        // Analytics backend isn't running/reachable (e.g. local demo without
        // `uvicorn` started). Fall back to the static demo dataset that
        // ships in this same frontend folder so the dashboard still shows
        // data. Supabase-backed flows (auth, trainee side) are unaffected.
        console.warn(
            "Analytics API unavailable, falling back to local demo_data.json:",
            error
        );

        try {
            const fallbackResponse = await fetch(
                "demo_data.json",
                { cache: "no-store" }
            );

            if (!fallbackResponse.ok) {
                throw new Error(
                    `demo_data.json -> HTTP ${fallbackResponse.status}`
                );
            }

            data = await fallbackResponse.json();

        } catch (fallbackError) {
            console.error(
                "Failed to load programme data (API and local fallback both failed):",
                fallbackError
            );

            allProfiles = [];
            allTrainingRecords = [];
            allEmploymentRecords = [];

            throw fallbackError;
        }
    }

    allProfiles = data.profiles || [];
    allTrainingRecords = data.training || [];
    allEmploymentRecords = data.employment || [];

    console.log(
        "Programme data source:",
        data.source || "local-demo-database"
    );

    console.log(
        "Profiles:",
        allProfiles.length
    );

    console.log(
        "Training:",
        allTrainingRecords.length
    );

    console.log(
        "Employment:",
        allEmploymentRecords.length
    );
}

/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    const state =
        currentFilters.state;


    const district =
        currentFilters.district;


    const programme =
        currentFilters.programme;


    /* =====================================================
       FILTER TRAINEES
       ===================================================== */

    filteredProfiles =
        allProfiles.filter(
            function (profile) {

                if (
                    state &&
                    state !== "All States" &&
                    profile.state !== state
                ) {

                    return false;

                }


                if (
                    district &&
                    district !== "All Districts" &&
                    profile.district !== district
                ) {

                    return false;

                }


                return true;

            }
        );


    /* =====================================================
       TRAINEE IDS
       ===================================================== */

    const traineeIds =
        new Set(
            filteredProfiles.map(
                profile =>
                    profile.user_id
            )
        );


    /* =====================================================
       FILTER TRAINING
       ===================================================== */

    filteredTrainingRecords =
        allTrainingRecords.filter(
            function (record) {

                if (
                    !traineeIds.has(
                        record.trainee_id
                    )
                ) {

                    return false;

                }


                if (
                    programme &&
                    programme !== "All Programmes" &&
                    record.course_name !== programme
                ) {

                    return false;

                }


                return true;

            }
        );


    /* =====================================================
       FILTER EMPLOYMENT
       ===================================================== */

    filteredEmploymentRecords =
        allEmploymentRecords.filter(
            function (record) {

                return traineeIds.has(
                    record.trainee_id
                );

            }
        );


    /* =====================================================
       UPDATE FILTER STATUS
       ===================================================== */

    updateFilterStatus();


    /* =====================================================
       UPDATE EVERYTHING
       ===================================================== */

    updateKPIs();

    updateOutcomeChart();

    updateCourseAnalytics();

    updateRetentionChart();

    updateAdvancedAnalytics();

    updateAlerts();

}


/* =========================================================
   UPDATE KPIs
   ========================================================= */

function updateKPIs() {

    const totalTrainees =
        filteredProfiles.length;


    /* =====================================================
       TRAINING COMPLETION
       ===================================================== */

    const totalTraining =
        filteredTrainingRecords.length;


    const completedTraining =
        filteredTrainingRecords.filter(
            record =>
                record.completion_date
        ).length;


    const completionRate =
        totalTraining > 0
            ? Math.round(
                (
                    completedTraining /
                    totalTraining
                ) * 100
            )
            : 0;


    /* =====================================================
       LATEST EMPLOYMENT STATUS
       ===================================================== */

    const latestEmployment =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    let placedCount = 0;


    latestEmployment.forEach(
        function (record) {

            if (
                record.status === "Employed" ||
                record.status === "Business" ||
                record.status === "Apprenticeship"
            ) {

                placedCount++;

            }

        }
    );


    const employmentRate =
        totalTrainees > 0
            ? Math.round(
                (
                    placedCount /
                    totalTrainees
                ) * 100
            )
            : 0;


    /* =====================================================
       VERIFIED OUTCOMES
       ===================================================== */

    const verifiedOutcomes =
        filteredTrainingRecords.filter(
            record =>
                record.is_verified === true
        ).length;


    /* =====================================================
       DISPLAY
       ===================================================== */

    setCounter(
        "totalTrainees",
        totalTrainees
    );


    setCounter(
        "trainingCompletion",
        completionRate,
        "%"
    );


    setCounter(
        "employmentRate",
        employmentRate,
        "%"
    );


    setCounter(
        "verifiedOutcomes",
        verifiedOutcomes
    );


    /* =====================================================
       META
       ===================================================== */

    setText(
        "totalTraineesMeta",
        `${totalTrainees.toLocaleString()} records`
    );


    setText(
        "completionMeta",
        `${completedTraining} of ${totalTraining} completed`
    );


    setText(
        "employmentMeta",
        `${placedCount} placed`
    );


    setText(
        "verificationMeta",
        `${verifiedOutcomes} verified records`
    );

}


/* =========================================================
   LATEST EMPLOYMENT PER TRAINEE
   ========================================================= */

function getLatestEmploymentByTrainee(
    records
) {

    const latestMap =
        new Map();


    records.forEach(
        function (record) {

            const existing =
                latestMap.get(
                    record.trainee_id
                );


            if (!existing) {

                latestMap.set(
                    record.trainee_id,
                    record
                );

                return;

            }


            const existingDate =
                new Date(
                    existing.recorded_at ||
                    existing.created_at
                );


            const currentDate =
                new Date(
                    record.recorded_at ||
                    record.created_at
                );


            if (
                currentDate > existingDate
            ) {

                latestMap.set(
                    record.trainee_id,
                    record
                );

            }

        }
    );


    return Array.from(
        latestMap.values()
    );

}


/* =========================================================
   OUTCOME CHART
   ========================================================= */

function updateOutcomeChart() {

    const latestEmployment =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    let employed = 0;
    let notPlaced = 0;


    latestEmployment.forEach(
        function (record) {

            if (
                record.status === "Employed" ||
                record.status === "Business" ||
                record.status === "Apprenticeship"
            ) {

                employed++;

            } else {

                notPlaced++;

            }

        }
    );


    const total =
        employed +
        notPlaced;


    const employedRate =
        total > 0
            ? Math.round(
                (employed / total) * 100
            )
            : 0;


    const notPlacedRate =
        total > 0
            ? 100 - employedRate
            : 0;


    setText(
        "employedRateDisplay",
        `${employedRate}%`
    );


    setText(
        "unemployedRateDisplay",
        `${notPlacedRate}%`
    );


    const canvas =
        document.getElementById(
            "outcomeDonutChart"
        );


    if (!canvas || typeof Chart === "undefined") {
        return;
    }


    if (outcomeDonutChart) {

        outcomeDonutChart.destroy();

    }


    outcomeDonutChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Employed / Placed",
                        "Not Placed"
                    ],

                    datasets: [
                        {
                            data: [
                                employed,
                                notPlaced
                            ]
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "70%",

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );

}


/* =========================================================
   COURSE ANALYTICS
   ========================================================= */

function updateCourseAnalytics() {

    const courseMap =
        new Map();


    filteredTrainingRecords.forEach(
        function (record) {

            const course =
                record.course_name ||
                "Unknown Programme";


            if (!courseMap.has(course)) {

                courseMap.set(
                    course,
                    {
                        total: 0,
                        completed: 0,
                        verified: 0,
                        trainees: new Set()
                    }
                );

            }


            const item =
                courseMap.get(course);


            item.total++;


            item.trainees.add(
                record.trainee_id
            );


            if (record.completion_date) {
                item.completed++;
            }


            if (record.is_verified === true) {
                item.verified++;
            }

        }
    );


    const latestEmployment =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    const employmentByTrainee =
        new Map();


    latestEmployment.forEach(
        record => {

            employmentByTrainee.set(
                record.trainee_id,
                record
            );

        }
    );


    const courseResults = [];


    courseMap.forEach(
        function (item, course) {

            let placed = 0;


            item.trainees.forEach(
                function (traineeId) {

                    const employment =
                        employmentByTrainee.get(
                            traineeId
                        );


                    if (
                        employment &&
                        (
                            employment.status === "Employed" ||
                            employment.status === "Business" ||
                            employment.status === "Apprenticeship"
                        )
                    ) {

                        placed++;

                    }

                }
            );


            const traineeCount =
                item.trainees.size;


            courseResults.push({

                course,

                trainees:
                    traineeCount,

                completion:
                    item.total > 0
                        ? Math.round(
                            (
                                item.completed /
                                item.total
                            ) * 100
                        )
                        : 0,

                employment:
                    traineeCount > 0
                        ? Math.round(
                            (
                                placed /
                                traineeCount
                            ) * 100
                        )
                        : 0,

                verification:
                    item.total > 0
                        ? Math.round(
                            (
                                item.verified /
                                item.total
                            ) * 100
                        )
                        : 0

            });

        }
    );


    courseResults.sort(
        (a, b) =>
            b.trainees -
            a.trainees
    );


    renderCourseTable(
        courseResults
    );


    renderCourseChart(
        courseResults
    );

}


/* =========================================================
   COURSE TABLE
   ========================================================= */

function renderCourseTable(
    results
) {

    const tbody =
        document.getElementById(
            "courseTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!results.length) {

        tbody.innerHTML =
            `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No programme data available for this selection.
                </td>
            </tr>
            `;

        return;

    }


    tbody.innerHTML =
        results
            .map(
                function (item) {

                    const initials =
                        getCourseInitials(
                            item.course
                        );


                    const status =
                        getCourseStatus(
                            item.employment
                        );


                    return `
                        <tr>

                            <td>

                                <div class="course-name">

                                    <div class="course-box">
                                        ${escapeHTML(initials)}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHTML(item.course)}
                                        </strong>

                                        <span>
                                            Training Programme
                                        </span>

                                    </div>

                                </div>

                            </td>

                            <td>
                                ${item.trainees.toLocaleString()}
                            </td>

                            <td>
                                ${item.completion}%
                            </td>

                            <td>
                                <b class="table-positive">
                                    ${item.employment}%
                                </b>
                            </td>

                            <td>
                                ${item.verification}%
                            </td>

                            <td>
                                <span class="${status.className}">
                                    ${status.label}
                                </span>
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   COURSE CHART
   ========================================================= */

function renderCourseChart(
    results
) {

    const canvas =
        document.getElementById(
            "courseComparisonChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    if (courseComparisonChart) {

        courseComparisonChart.destroy();

    }


    const labels =
        results.map(
            item =>
                item.course
        );


    const employment =
        results.map(
            item =>
                item.employment
        );


    const completion =
        results.map(
            item =>
                item.completion
        );


    courseComparisonChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "bar",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                "Employment %",

                            data:
                                employment
                        },

                        {
                            label:
                                "Completion %",

                            data:
                                completion
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {

                                callback:
                                    value =>
                                        `${value}%`

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   RETENTION CURVE
   ========================================================= */

function updateRetentionChart() {

    const canvas =
        document.getElementById(
            "retentionChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    const latestEmployment =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    const checkpoints = [
        3,
        6,
        12
    ];


    const retentionRates =
        checkpoints.map(
            months =>
                calculateRetention(
                    months,
                    latestEmployment
                )
        );


    if (retentionChart) {

        retentionChart.destroy();

    }


    retentionChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: [
                        "3 Month",
                        "6 Month",
                        "12 Month"
                    ],

                    datasets: [

                        {
                            label:
                                "Employment Retention",

                            data:
                                retentionRates,

                            tension:
                                0.35,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            min: 0,

                            max: 100,

                            ticks: {

                                callback:
                                    value =>
                                        `${value}%`

                            }

                        }

                    }

                }

            }
        );


    updateRetentionCards(
        retentionRates
    );

}


/* =========================================================
   RETENTION CALCULATION
   ========================================================= */

function calculateRetention(
    months,
    employmentRecords
) {

    const now =
        new Date();


    const cutoff =
        new Date(
            now
        );


    cutoff.setMonth(
        cutoff.getMonth() -
        months
    );


    /*
     * Employment records with joining dates
     * old enough to measure.
     */

    const eligible =
        employmentRecords.filter(
            record => {

                if (!record.joining_date) {
                    return false;
                }


                const joining =
                    new Date(
                        record.joining_date
                    );


                return joining <= cutoff;

            }
        );


    if (!eligible.length) {
        return 0;
    }


    const retained =
        eligible.filter(
            record => {

                return (
                    record.status === "Employed" ||
                    record.status === "Business" ||
                    record.status === "Apprenticeship"
                );

            }
        ).length;


    return Math.round(
        (
            retained /
            eligible.length
        ) * 100
    );

}


/* =========================================================
   RETENTION CARDS
   ========================================================= */

function updateRetentionCards(
    rates
) {

    const cards =
        document.querySelectorAll(
            ".retention-card"
        );


    if (!cards.length) {
        return;
    }


    rates.forEach(
        function (rate, index) {

            if (!cards[index]) {
                return;
            }


            const number =
                cards[index]
                    .querySelector(
                        ".retention-number"
                    );


            if (number) {

                number.textContent =
                    `${rate}%`;

            }

        }
    );


    const summary =
        document.querySelector(
            ".retention-summary strong"
        );


    if (summary) {

        if (
            rates.length >= 2 &&
            rates[2] >= rates[0]
        ) {

            summary.textContent =
                "Improving";

        } else {

            summary.textContent =
                "Needs attention";

        }

    }

}


/* =========================================================
   ADVANCED ANALYTICS
   ========================================================= */

function updateAdvancedAnalytics() {

    const training =
        filteredTrainingRecords;


    const employment =
        filteredEmploymentRecords;


    const latestEmployment =
        getLatestEmploymentByTrainee(
            employment
        );


    /* =====================================================
       COMPOSITE SCORE
       ===================================================== */

    const completion =
        calculateCompletionRate(
            training
        );


    const employmentRate =
        calculateEmploymentRate(
            latestEmployment,
            filteredProfiles.length
        );


    const verification =
        training.length > 0
            ? (
                training.filter(
                    record =>
                        record.is_verified === true
                ).length /
                training.length
            ) * 100
            : 0;


    const composite =
        Math.round(
            (
                completion +
                employmentRate +
                verification
            ) / 3
        );


    /* =====================================================
       IMPACT INDEX
       ===================================================== */

    const impact =
        Math.round(
            (
                completion * 0.30 +
                employmentRate * 0.50 +
                verification * 0.20
            )
        );


    /* =====================================================
       ANOMALIES
       ===================================================== */

    const anomalies =
        detectAnomalies(
            training
        );


    setText(
        "impactIndex",
        `${impact}/100`
    );


    setText(
        "compositeScore",
        `${composite}/100`
    );


    setText(
        "anomalyCount",
        anomalies.length
    );


    setText(
        "mlStatus",
        "Demo"
    );


    /* =====================================================
       PROVIDER PLACEMENT
       ===================================================== */

    updateProviderPlacement(
        training,
        latestEmployment
    );


    /* =====================================================
       WAGE GROWTH
       ===================================================== */

    updateWageGrowth(
        latestEmployment
    );


    /* =====================================================
       RELEVANCE
       ===================================================== */

    updateRelevance(
        training,
        latestEmployment
    );


    /* =====================================================
       SKILL GAP
       ===================================================== */

    updateSkillGap(
        training
    );


    /* =====================================================
       NON PLACEMENT
       ===================================================== */

    updateNonPlacementReasons(
        latestEmployment
    );


    /* =====================================================
       ATTRITION
       ===================================================== */

    updateAttritionReasons(
        latestEmployment
    );


    /* =====================================================
       ANOMALIES
       ===================================================== */

    renderAnomalies(
        anomalies
    );


    /* =====================================================
       ML DEMO
       ===================================================== */

    updateMLPredictions(
        completion,
        employmentRate
    );


    /* =====================================================
       INSIGHTS
       ===================================================== */

    updateInsights(
        completion,
        employmentRate,
        verification,
        anomalies
    );

}


/* =========================================================
   PROVIDER PLACEMENT
   ========================================================= */

function updateProviderPlacement(
    training,
    latestEmployment
) {

    const container =
        document.getElementById(
            "providerPlacement"
        );


    if (!container) {
        return;
    }


    const placed =
        new Set(
            latestEmployment
                .filter(
                    record =>
                        record.status === "Employed" ||
                        record.status === "Business" ||
                        record.status === "Apprenticeship"
                )
                .map(
                    record =>
                        record.trainee_id
                )
        );


    const providerMap =
        new Map();


    training.forEach(
        record => {

            const provider =
                record.provider_name ||
                "Unknown Provider";


            if (!providerMap.has(provider)) {

                providerMap.set(
                    provider,
                    {
                        total: new Set(),
                        placed: new Set()
                    }
                );

            }


            const item =
                providerMap.get(provider);


            item.total.add(
                record.trainee_id
            );


            if (
                placed.has(
                    record.trainee_id
                )
            ) {

                item.placed.add(
                    record.trainee_id
                );

            }

        }
    );


    const html =
        Array.from(
            providerMap.entries()
        )
        .slice(0, 8)
        .map(
            function ([provider, item]) {

                const rate =
                    item.total.size > 0
                        ? Math.round(
                            (
                                item.placed.size /
                                item.total.size
                            ) * 100
                        )
                        : 0;


                return `
                    <div class="analytics-row">
                        <span>
                            ${escapeHTML(provider)}
                        </span>

                        <strong>
                            ${rate}%
                        </strong>
                    </div>
                `;

            }
        )
        .join("");


    container.innerHTML =
        html ||
        "<span>No provider data available.</span>";

}


/* =========================================================
   WAGE GROWTH
   ========================================================= */

function updateWageGrowth(
    employment
) {

    const container =
        document.getElementById(
            "wageGrowth"
        );


    if (!container) {
        return;
    }


    const salaries =
        employment
            .map(
                record =>
                    Number(
                        record.monthly_salary
                    )
            )
            .filter(
                salary =>
                    Number.isFinite(salary) &&
                    salary >= 0
            );


    if (!salaries.length) {

        container.innerHTML =
            "<span>No salary data available yet.</span>";

        return;

    }


    const average =
        salaries.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        salaries.length;


    container.innerHTML =
        `
        <div class="analytics-highlight">
            ₹${Math.round(average).toLocaleString()}
        </div>

        <span>
            Average reported monthly salary
        </span>
        `;

}


/* =========================================================
   TRAINING RELEVANCE
   ========================================================= */

function updateRelevance(
    training,
    employment
) {

    const container =
        document.getElementById(
            "relevance"
        );


    if (!container) {
        return;
    }


    const latest =
        getLatestEmploymentByTrainee(
            employment
        );


    const employed =
        latest.filter(
            record =>
                record.status === "Employed" ||
                record.status === "Business" ||
                record.status === "Apprenticeship"
        );


    const traineeIds =
        new Set(
            training.map(
                record =>
                    record.trainee_id
            )
        );


    const relevant =
        employed.filter(
            record =>
                traineeIds.has(
                    record.trainee_id
                )
        ).length;


    const rate =
        employed.length > 0
            ? Math.round(
                (
                    relevant /
                    employed.length
                ) * 100
            )
            : 0;


    container.innerHTML =
        `
        <div class="analytics-highlight">
            ${rate}%
        </div>

        <span>
            Training-to-employment linkage
        </span>
        `;

}


/* =========================================================
   SKILL GAP
   ========================================================= */

function updateSkillGap(
    training
) {

    const container =
        document.getElementById(
            "skillGap"
        );


    if (!container) {
        return;
    }


    const skillCount =
        new Map();


    training.forEach(
        record => {

            if (!Array.isArray(record.skills)) {
                return;
            }


            record.skills.forEach(
                skill => {

                    if (!skill) {
                        return;
                    }


                    const normalized =
                        String(skill)
                            .trim();


                    skillCount.set(
                        normalized,
                        (
                            skillCount.get(
                                normalized
                            ) || 0
                        ) + 1
                    );

                }
            );

        }
    );


    const topSkills =
        Array.from(
            skillCount.entries()
        )
        .sort(
            (a, b) =>
                a[1] - b[1]
        )
        .slice(0, 5);


    if (!topSkills.length) {

        container.innerHTML =
            "<span>Skill-level data is not available yet.</span>";

        return;

    }


    container.innerHTML =
        topSkills
            .map(
                ([skill, count]) =>
                    `
                    <div class="analytics-row">
                        <span>
                            ${escapeHTML(skill)}
                        </span>

                        <strong>
                            ${count}
                        </strong>
                    </div>
                    `
            )
            .join("");

}


/* =========================================================
   NON PLACEMENT REASONS
   ========================================================= */

function updateNonPlacementReasons(
    employment
) {

    const container =
        document.getElementById(
            "nonPlacementReasons"
        );


    if (!container) {
        return;
    }


    const latest =
        getLatestEmploymentByTrainee(
            employment
        );


    const unemployed =
        latest.filter(
            record =>
                record.status === "Unemployed"
        );


    const reasonMap =
        new Map();


    unemployed.forEach(
        record => {

            const reason =
                record.unemployed_reason ||
                "Reason not provided";


            reasonMap.set(
                reason,
                (
                    reasonMap.get(reason) ||
                    0
                ) + 1
            );

        }
    );


    const rows =
        Array.from(
            reasonMap.entries()
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )
        .slice(0, 5);


    container.innerHTML =
        rows.length
            ? rows
                .map(
                    ([reason, count]) =>
                        `
                        <div class="analytics-row">
                            <span>
                                ${escapeHTML(reason)}
                            </span>

                            <strong>
                                ${count}
                            </strong>
                        </div>
                        `
                )
                .join("")
            : "<span>No non-placement reasons recorded.</span>";

}


/* =========================================================
   ATTRITION REASONS
   ========================================================= */

function updateAttritionReasons(
    employment
) {

    const container =
        document.getElementById(
            "attritionReasons"
        );


    if (!container) {
        return;
    }


    const latest =
        getLatestEmploymentByTrainee(
            employment
        );


    const unemployed =
        latest.filter(
            record =>
                record.status === "Unemployed"
        );


    if (!unemployed.length) {

        container.innerHTML =
            "<span>No current attrition signals detected.</span>";

        return;

    }


    container.innerHTML =
        `
        <div class="analytics-highlight">
            ${unemployed.length}
        </div>

        <span>
            Trainees currently recorded as unemployed
        </span>
        `;

}


/* =========================================================
   ANOMALY DETECTION
   ========================================================= */

function detectAnomalies(
    training
) {

    const anomalies = [];


    training.forEach(
        function (record) {

            const attendance =
                Number(
                    record.attendance
                );


            const assessment =
                Number(
                    record.assessment_score
                );


            if (
                Number.isFinite(attendance) &&
                attendance < 50
            ) {

                anomalies.push({
                    type:
                        "Low attendance",

                    course:
                        record.course_name,

                    trainee:
                        record.trainee_id
                });

            }


            if (
                Number.isFinite(assessment) &&
                assessment < 40
            ) {

                anomalies.push({
                    type:
                        "Low assessment score",

                    course:
                        record.course_name,

                    trainee:
                        record.trainee_id
                });

            }

        }
    );


    return anomalies;

}


/* =========================================================
   RENDER ANOMALIES
   ========================================================= */

function renderAnomalies(
    anomalies
) {

    const container =
        document.getElementById(
            "anomalies"
        );


    if (!container) {
        return;
    }


    if (!anomalies.length) {

        container.innerHTML =
            `
            <div class="analytics-highlight">
                0
            </div>

            <span>
                No statistical warning signals detected.
            </span>
            `;

        return;

    }


    container.innerHTML =
        `
        <div class="analytics-highlight">
            ${anomalies.length}
        </div>

        <span>
            Low attendance or assessment signals detected.
        </span>
        `;

}


/* =========================================================
   ML PREDICTIONS
   ========================================================= */

function updateMLPredictions(
    completion,
    employmentRate
) {

    const placement =
        document.getElementById(
            "placementPrediction"
        );


    const attrition =
        document.getElementById(
            "attritionPrediction"
        );


    /*
     * This is intentionally labelled as a demo.
     * It is not pretending to be a trained ML model.
     */

    if (placement) {

        let prediction =
            "Moderate";


        if (employmentRate >= 75) {

            prediction =
                "High";

        } else if (
            employmentRate < 45
        ) {

            prediction =
                "Low";

        }


        placement.innerHTML =
            `
            <div class="analytics-highlight">
                ${prediction}
            </div>

            <span>
                Illustrative placement signal based on current employment rate.
            </span>
            `;

    }


    if (attrition) {

        let prediction =
            "Moderate";


        if (completion >= 90) {

            prediction =
                "Low";

        } else if (
            completion < 60
        ) {

            prediction =
                "High";

        }


        attrition.innerHTML =
            `
            <div class="analytics-highlight">
                ${prediction}
            </div>

            <span>
                Illustrative attrition signal based on completion performance.
            </span>
            `;

    }

}


/* =========================================================
   INSIGHTS
   ========================================================= */

function updateInsights(
    completion,
    employmentRate,
    verification,
    anomalies
) {

    const container =
        document.getElementById(
            "insights"
        );


    if (!container) {
        return;
    }


    const insights = [];


    if (employmentRate >= 75) {

        insights.push(
            "Employment outcomes are currently strong across the selected jurisdiction."
        );

    } else if (
        employmentRate >= 50
    ) {

        insights.push(
            "Employment outcomes are moderate and should continue to be monitored."
        );

    } else {

        insights.push(
            "Employment outcomes are below the desired level and may require programme intervention."
        );

    }


    if (completion >= 90) {

        insights.push(
            "Training completion is performing at a strong level."
        );

    } else {

        insights.push(
            "Training completion has room for improvement."
        );

    }


    if (verification >= 80) {

        insights.push(
            "A high proportion of training records have been verified."
        );

    } else {

        insights.push(
            "Verification coverage should be strengthened."
        );

    }


    if (anomalies.length) {

        insights.push(
            `${anomalies.length} low-performance signal(s) were detected for further review.`
        );

    }


    container.innerHTML =
        insights
            .map(
                insight =>
                    `
                    <div class="insight-item">
                        ${escapeHTML(insight)}
                    </div>
                    `
            )
            .join("");

}


/* =========================================================
   ALERTS
   ========================================================= */

function updateAlerts() {

    const latest =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    const unemployed =
        latest.filter(
            record =>
                record.status === "Unemployed"
        ).length;


    const lowAttendance =
        filteredTrainingRecords.filter(
            record =>
                Number(record.attendance) < 50
        ).length;


    const alertList =
        document.querySelector(
            ".alert-list"
        );


    if (!alertList) {
        return;
    }


    const alerts = [];


    if (lowAttendance > 0) {

        alerts.push(`
            <div class="alert-item warning-alert">
                <div>!</div>

                <section>
                    <strong>
                        Low attendance detected
                    </strong>

                    <p>
                        ${lowAttendance}
                        training record(s) have attendance below 50%.
                    </p>
                </section>
            </div>
        `);

    }


    if (unemployed > 0) {

        alerts.push(`
            <div class="alert-item info-alert">
                <div>◷</div>

                <section>
                    <strong>
                        Employment follow-up
                    </strong>

                    <p>
                        ${unemployed}
                        trainee(s) are currently recorded as unemployed.
                    </p>
                </section>
            </div>
        `);

    }


    if (!alerts.length) {

        alerts.push(`
            <div class="alert-item success-alert">
                <div>✓</div>

                <section>
                    <strong>
                        No major alerts
                    </strong>

                    <p>
                        No immediate programme-level warning signals were detected.
                    </p>
                </section>
            </div>
        `);

    }


    alertList.innerHTML =
        alerts.join("");

}


/* =========================================================
   FILTER SETUP
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


    const resetButton =
        document.getElementById(
            "resetFilters"
        );


    if (stateFilter) {

        stateFilter.addEventListener(
            "change",
            function () {

                currentFilters.state =
                    stateFilter.value;


                currentFilters.district =
                    "";


                populateDistrictFilter(
                    stateFilter.value
                );


                applyFilters();

            }
        );

    }


    if (districtFilter) {

        districtFilter.addEventListener(
            "change",
            function () {

                currentFilters.district =
                    districtFilter.value;


                applyFilters();

            }
        );

    }


    if (programmeFilter) {

        programmeFilter.addEventListener(
            "change",
            function () {

                currentFilters.programme =
                    programmeFilter.value;


                applyFilters();

            }
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                currentFilters = {
                    state: "",
                    district: "",
                    programme: ""
                };


                if (stateFilter) {
                    stateFilter.value =
                        "";
                }


                if (districtFilter) {

                    districtFilter.innerHTML =
                        `<option value="">All Districts</option>`;

                }


                if (programmeFilter) {

                    programmeFilter.value =
                        "All Programmes";

                }


                applyFilters();

            }
        );

    }

}


/* =========================================================
   POPULATE DISTRICT FILTER
   ========================================================= */

function populateDistrictFilter(
    state
) {

    const districtFilter =
        document.getElementById(
            "districtFilter"
        );


    if (!districtFilter) {
        return;
    }


    const districts =
        [
            ...new Set(
                allProfiles
                    .filter(
                        profile =>
                            !state ||
                            profile.state === state
                    )
                    .map(
                        profile =>
                            profile.district
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    districtFilter.innerHTML =
        `<option value="">All Districts</option>`;


    districts.forEach(
        function (district) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                district;


            option.textContent =
                district;


            districtFilter.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   FILTER STATUS
   ========================================================= */

function updateFilterStatus() {

    const element =
        document.getElementById(
            "filterStatus"
        );


    if (!element) {
        return;
    }


    let message =
        `Showing ${filteredProfiles.length.toLocaleString()} trainee records`;


    if (currentFilters.state) {

        message +=
            ` in ${currentFilters.state}`;

    }


    if (
        currentFilters.district &&
        currentFilters.district !== "All Districts"
    ) {

        message +=
            `, ${currentFilters.district}`;

    }


    if (
        currentFilters.programme &&
        currentFilters.programme !== "All Programmes"
    ) {

        message +=
            ` for ${currentFilters.programme}`;

    }


    message += ".";


    element.textContent =
        message;

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-link")
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                ".nav-link"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        link.classList.add(
                            "active"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

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


    if (!menuButton || !sidebar) {
        return;
    }


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


/* =========================================================
   LOGOUT
   ========================================================= */

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


            button.textContent =
                "Signing Out...";


            try {

                await supabaseClient.auth.signOut();


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.href =
                "govt_login.html";

        }
    );

}


/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

    const settingsOverlay =
        document.getElementById(
            "settingsOverlay"
        );


    const settingsLink =
        document.querySelector(
            'a[href="#settings"]'
        );


    const cancelButton =
        document.getElementById(
            "cancelSettings"
        );


    const saveButton =
        document.getElementById(
            "saveSettings"
        );


    const autoRefresh =
        document.getElementById(
            "autoRefreshSetting"
        );


    const showAnalytics =
        document.getElementById(
            "showAnalyticsSetting"
        );


    const animations =
        document.getElementById(
            "animationsSetting"
        );


    if (settingsLink) {

        settingsLink.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                if (settingsOverlay) {

                    settingsOverlay.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                if (settingsOverlay) {

                    settingsOverlay.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            function () {

                if (showAnalytics) {

                    const panel =
                        document.getElementById(
                            "advancedAnalytics"
                        );


                    if (panel) {

                        panel.style.display =
                            showAnalytics.checked
                                ? ""
                                : "none";

                    }

                }


                if (animations) {

                    document.body.classList.toggle(
                        "disable-animations",
                        !animations.checked
                    );

                }


                if (settingsOverlay) {

                    settingsOverlay.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (autoRefresh) {

        autoRefresh.addEventListener(
            "change",
            function () {

                if (
                    autoRefresh.checked
                ) {

                    startAutoRefresh();

                } else {

                    stopAutoRefresh();

                }

            }
        );

    }

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

let autoRefreshTimer =
    null;


function startAutoRefresh() {

    stopAutoRefresh();


    autoRefreshTimer =
        setInterval(
            async function () {

                console.log(
                    "Refreshing dashboard..."
                );


                try {

                    await loadProgrammeData();

                    applyFilters();

                    updateLastUpdated();


                } catch (error) {

                    console.error(
                        "Auto refresh failed:",
                        error
                    );

                }

            },
            5 * 60 * 1000
        );

}


function stopAutoRefresh() {

    if (autoRefreshTimer) {

        clearInterval(
            autoRefreshTimer
        );

        autoRefreshTimer =
            null;

    }

}


/* =========================================================
   MODALS
   ========================================================= */

function setupModals() {

    const infoButton =
        document.getElementById(
            "outcomeInfo"
        );


    const modal =
        document.getElementById(
            "infoModal"
        );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const modalText =
        document.getElementById(
            "modalText"
        );


    if (infoButton) {

        infoButton.addEventListener(
            "click",
            function () {

                if (modalTitle) {

                    modalTitle.textContent =
                        "Placement Ratio";

                }


                if (modalText) {

                    modalText.textContent =
                        "Placement ratio is calculated from the latest employment status recorded for trainees in the selected jurisdiction.";

                }


                if (modal) {

                    modal.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    document
        .querySelectorAll("[data-close]")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        if (modal) {

                            modal.classList.remove(
                                "active"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   EXPORT REPORT
   ========================================================= */

function setupExport() {

    const button =
        document.getElementById(
            "exportBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            exportReport();

        }
    );

}


function exportReport() {

    const latestEmployment =
        getLatestEmploymentByTrainee(
            filteredEmploymentRecords
        );


    const rows = [
        [
            "Trainee",
            "Email",
            "State",
            "District",
            "Programme",
            "Provider",
            "Completion Date",
            "Attendance",
            "Assessment",
            "Verified",
            "Employment Status",
            "Company",
            "Salary"
        ]
    ];


    filteredProfiles.forEach(
        function (profile) {

            const training =
                filteredTrainingRecords.filter(
                    record =>
                        record.trainee_id ===
                        profile.user_id
                );


            const employment =
                latestEmployment.find(
                    record =>
                        record.trainee_id ===
                        profile.user_id
                );


            if (!training.length) {

                rows.push([
                    profile.full_name,
                    profile.email,
                    profile.state,
                    profile.district,
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    employment
                        ? employment.status
                        : "",
                    employment
                        ? employment.company_name || ""
                        : "",
                    employment
                        ? employment.monthly_salary || ""
                        : ""
                ]);

                return;

            }


            training.forEach(
                function (record) {

                    rows.push([

                        profile.full_name,

                        profile.email,

                        profile.state,

                        profile.district,

                        record.course_name,

                        record.provider_name,

                        record.completion_date || "",

                        record.attendance ?? "",

                        record.assessment_score ?? "",

                        record.is_verified
                            ? "Yes"
                            : "No",

                        employment
                            ? employment.status
                            : "",

                        employment
                            ? employment.company_name || ""
                            : "",

                        employment
                            ? employment.monthly_salary || ""
                            : ""

                    ]);

                }
            );

        }
    );


    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(value)
                                    .replace(/"/g, '""')}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "skilltrack-government-report.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   ANALYTICS REFRESH
   ========================================================= */

function setupAnalyticsRefresh() {

    const button =
        document.getElementById(
            "refreshAnalyticsBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async function () {

            button.disabled =
                true;


            button.textContent =
                "Refreshing...";


            try {

                await loadProgrammeData();

                applyFilters();

                await loadAdvancedAnalytics();

                updateLastUpdated();


            } catch (error) {

                console.error(
                    "Analytics refresh error:",
                    error
                );

                setAdvancedStatus(
                    "Unable to refresh analytics."
                );

            }


            button.disabled =
                false;


            button.textContent =
                "Refresh data";

        }
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
   ADVANCED STATUS
   ========================================================= */

function setAdvancedStatus(
    message
) {

    const element =
        document.getElementById(
            "advancedStatus"
        );


    if (element) {

        element.textContent =
            message;

    }

}


/* =========================================================
   SKILLTRACK ANALYTICS API (Python/FastAPI backend)
   ========================================================= */

// Points at the deployed backend by default; falls back to a local
// server automatically when the dashboard itself is opened from localhost.
const ANALYTICS_API_BASE =
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:8000"
        : "https://skilltrack-sih2026.onrender.com";

// Set this if ANALYTICS_API_KEY is configured on the backend deployment.
const ANALYTICS_API_KEY = "";

async function analyticsFetch(path) {
    const headers = ANALYTICS_API_KEY ? { "X-API-Key": ANALYTICS_API_KEY } : {};
    const response = await fetch(`${ANALYTICS_API_BASE}${path}`, { headers, cache: "no-store" });
    if (!response.ok) {
        throw new Error(`${path} -> HTTP ${response.status}`);
    }
    return response.json();
}

function renderTable(elementId, rows, columns) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!rows || rows.length === 0) {
        el.textContent = "No data available.";
        return;
    }
    const head = columns.map(c => `<th>${c.label}</th>`).join("");
    const body = rows.map(row => {
        const cells = columns.map(c => `<td>${c.format ? c.format(row[c.key], row) : (row[c.key] ?? "-")}</td>`).join("");
        return `<tr>${cells}</tr>`;
    }).join("");
    el.innerHTML = `<div class="table-container"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderNote(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message;
}

function riskBadge(value, highThreshold = 0.6, midThreshold = 0.3) {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    const cls = num >= highThreshold ? "status-bad" : num >= midThreshold ? "status-watch" : "status-good";
    return `<span class="${cls}">${(num * 100).toFixed(1)}%</span>`;
}

async function loadAdvancedAnalytics() {

    setAdvancedStatus("Loading analytics from the API...");

    const tasks = [

        // ---- existing metrics/ML endpoints ----
        analyticsFetch("/api/metrics/impact-index")
            .then(d => setText("impactIndex", d.overall_impact_index?.toFixed(1) ?? "N/A"))
            .catch(() => setText("impactIndex", "Error")),

        analyticsFetch("/api/metrics/composite-score")
            .then(rows => {
                const el = document.getElementById("compositeScore");
                if (el && rows.length) {
                    el.textContent = rows[0].composite_score?.toFixed?.(1) ?? JSON.stringify(rows[0]);
                }
                renderTable("providerPlacement", rows, [
                    { key: "group_key", label: "Provider" },
                    { key: "composite_score", label: "Score", format: v => v?.toFixed?.(1) ?? v },
                ]);
            })
            .catch(() => setText("compositeScore", "Error")),

        analyticsFetch("/api/ml/anomalies")
            .then(rows => {
                setText("anomalyCount", String(rows.length));
                renderTable("anomalies", rows, Object.keys(rows[0] || {}).slice(0, 4).map(k => ({ key: k, label: k })));
            })
            .catch(() => setText("anomalyCount", "Error")),

        analyticsFetch("/api/metrics/wage-growth")
            .then(rows => renderTable("wageGrowth", rows, [
                { key: "course_name", label: "Course" },
                { key: "wage_growth_pct", label: "Wage growth %" },
            ]))
            .catch(() => renderNote("wageGrowth", "Unable to load.")),

        analyticsFetch("/api/metrics/relevance")
            .then(rows => renderTable("relevance", rows, [
                { key: "course_name", label: "Course" },
                { key: "relevance_score", label: "Relevance", format: v => v?.toFixed?.(2) ?? v },
            ]))
            .catch(() => renderNote("relevance", "Unable to load.")),

        analyticsFetch("/api/metrics/skill-gap")
            .then(rows => renderTable("skillGap", rows, Object.keys(rows[0] || {}).slice(0, 3).map(k => ({ key: k, label: k }))))
            .catch(() => renderNote("skillGap", "Unable to load.")),

        analyticsFetch("/api/reasons/non-placement")
            .then(rows => renderTable("nonPlacementReasons", rows, [
                { key: "reason_label", label: "Reason" },
                { key: "n", label: "Count" },
            ]))
            .catch(() => renderNote("nonPlacementReasons", "Unable to load.")),

        analyticsFetch("/api/reasons/attrition")
            .then(rows => renderTable("attritionReasons", rows, [
                { key: "reason_label", label: "Reason" },
                { key: "n", label: "Count" },
            ]))
            .catch(() => renderNote("attritionReasons", "Unable to load.")),

        analyticsFetch("/api/ml/placement-prediction-demo")
            .then(d => renderNote("placementPrediction",
                d.trained === false ? d.note : `AUC-ROC: ${d.auc_roc} · F1: ${d.f1_score} (n=${d.n_train + d.n_test})`))
            .catch(() => renderNote("placementPrediction", "Unable to load.")),

        analyticsFetch("/api/ml/attrition-prediction-demo")
            .then(d => {
                renderNote("attritionPrediction",
                    d.trained === false ? d.note : `AUC-ROC: ${d.auc_roc} · F1: ${d.f1_score} (n=${d.n_train + d.n_test})`);
                setText("mlStatus", "Live");
            })
            .catch(() => { renderNote("attritionPrediction", "Unable to load."); setText("mlStatus", "Offline"); }),

        analyticsFetch("/api/insights")
            .then(d => {
                const el = document.getElementById("insights");
                if (el) el.innerHTML = (d.insights || []).map(i => `<p>${i}</p>`).join("");
            })
            .catch(() => renderNote("insights", "Unable to load insights.")),

        // ---- new ml_extensions endpoints ----
        analyticsFetch("/api/ml/dropout-risk")
            .then(d => {
                if (d.trained === false) { renderNote("dropoutRisk", d.note); return; }
                renderTable("dropoutRisk", d.at_risk_trainees, [
                    { key: "trainee_id", label: "Trainee" },
                    { key: "course_name", label: "Course" },
                    { key: "district_name", label: "District" },
                    { key: "dropout_risk", label: "Risk", format: riskBadge },
                ]);
            })
            .catch(() => renderNote("dropoutRisk", "Unable to load.")),

        analyticsFetch("/api/ml/salary-model-summary")
            .then(d => renderNote("salaryModelSummary",
                d.trained === false ? d.note : `MAE: ₹${d.mae} · R²: ${d.r2} (n=${d.n_train + d.n_test})`))
            .catch(() => renderNote("salaryModelSummary", "Unable to load.")),

        analyticsFetch("/api/followups/compliance")
            .then(rows => renderTable("followupCompliance", rows, [
                { key: "group_key", label: "Month" },
                { key: "completed", label: "Completed" },
                { key: "missed", label: "Missed" },
                { key: "completion_rate_pct", label: "Compliance %" },
            ]))
            .catch(() => renderNote("followupCompliance", "Unable to load.")),

        analyticsFetch("/api/followups/risk")
            .then(d => renderNote("followupRisk",
                d.trained === false ? d.note : `AUC-ROC: ${d.auc_roc} · F1: ${d.f1_score} (n=${d.n_train + d.n_test})`))
            .catch(() => renderNote("followupRisk", "Unable to load.")),

        analyticsFetch("/api/validation/employer-scorecard")
            .then(rows => renderTable("employerScorecard", rows.slice(0, 10), [
                { key: "employer_name", label: "Employer" },
                { key: "n_placements", label: "Placements" },
                { key: "disputed_pct", label: "Disputed %" },
                { key: "trust_score", label: "Trust score" },
            ]))
            .catch(() => renderNote("employerScorecard", "Unable to load.")),

        analyticsFetch("/api/validation/dispute-risk")
            .then(d => renderNote("disputeRisk",
                d.trained === false ? d.note : `AUC-ROC: ${d.auc_roc} · F1: ${d.f1_score} (n=${d.n_train + d.n_test})`))
            .catch(() => renderNote("disputeRisk", "Unable to load.")),

        analyticsFetch("/api/validation/suspicious-placements")
            .then(rows => renderTable("suspiciousPlacements", rows, [
                { key: "placement_id", label: "Placement" },
                { key: "flag", label: "Flag" },
                { key: "detail", label: "Detail" },
            ]))
            .catch(() => renderNote("suspiciousPlacements", "Unable to load.")),
    ];

    await Promise.allSettled(tasks);

    setAdvancedStatus(`Analytics loaded from ${ANALYTICS_API_BASE}.`);
}

function setupMlTools() {

    const jobMatchBtn = document.getElementById("jobMatchBtn");
    if (jobMatchBtn) {
        jobMatchBtn.addEventListener("click", async () => {
            const idInput = document.getElementById("jobMatchTraineeId");
            const traineeId = idInput?.value;
            if (!traineeId) return;
            renderNote("jobMatchResult", "Searching...");
            try {
                const rows = await analyticsFetch(`/api/ml/job-match/${traineeId}?top_n=5`);
                renderTable("jobMatchResult", rows, [
                    { key: "job_title", label: "Job title" },
                    { key: "sector", label: "Sector" },
                    { key: "match_score", label: "Match", format: riskBadge },
                    { key: "missing_skills", label: "Missing skills" },
                ]);
            } catch (err) {
                renderNote("jobMatchResult", "Unable to fetch recommendations.");
            }
        });
    }

    const salaryForm = document.getElementById("salaryPredictForm");
    if (salaryForm) {
        salaryForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const data = new FormData(salaryForm);
            const params = new URLSearchParams();
            for (const [key, value] of data.entries()) params.append(key, value);
            renderNote("salaryPredictResult", "Predicting...");
            try {
                const result = await analyticsFetch(`/api/ml/salary-predict?${params.toString()}`);
                renderNote("salaryPredictResult", `Predicted starting wage: ₹${result.predicted_starting_wage}`);
            } catch (err) {
                renderNote("salaryPredictResult", "Unable to predict — check the model has enough training data yet.");
            }
        });
    }
}


/* =========================================================
   DASHBOARD ERROR
   ========================================================= */

function showDashboardError(
    message
) {

    console.error(
        message
    );


    const elements = [
        "totalTrainees",
        "trainingCompletion",
        "employmentRate",
        "verifiedOutcomes"
    ];


    elements.forEach(
        id => {

            setText(
                id,
                "Error"
            );

        }
    );


    setAdvancedStatus(
        message
    );

}


/* =========================================================
   COUNTER
   ========================================================= */

function setCounter(
    id,
    value,
    suffix = ""
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.dataset.value =
        value;


    element.textContent =
        `${Number(value).toLocaleString()}${suffix}`;

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value;

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(
    name
) {

    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase() ||
        "--";

}


/* =========================================================
   COURSE INITIALS
   ========================================================= */

function getCourseInitials(
    course
) {

    return String(course)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


/* =========================================================
   COURSE STATUS
   ========================================================= */

function getCourseStatus(
    employment
) {

    if (employment >= 75) {

        return {
            label: "Good",
            className: "status-good"
        };

    }


    if (employment >= 50) {

        return {
            label: "Watch",
            className: "status-watch"
        };

    }


    return {
        label: "Needs attention",
        className: "status-watch"
    };

}


/* =========================================================
   COMPLETION RATE
   ========================================================= */

function calculateCompletionRate(
    training
) {

    if (!training.length) {
        return 0;
    }


    const completed =
        training.filter(
            record =>
                record.completion_date
        ).length;


    return Math.round(
        (
            completed /
            training.length
        ) * 100
    );

}


/* =========================================================
   EMPLOYMENT RATE
   ========================================================= */

function calculateEmploymentRate(
    latestEmployment,
    totalTrainees
) {

    if (!totalTrainees) {
        return 0;
    }


    const placed =
        latestEmployment.filter(
            record =>
                record.status === "Employed" ||
                record.status === "Business" ||
                record.status === "Apprenticeship"
        ).length;


    return Math.round(
        (
            placed /
            totalTrainees
        ) * 100
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value ?? "")
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