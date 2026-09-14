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

// =========================================================
// DEMO DATA MODE
// =========================================================
const DEMO_MODE = true;

const DEMO_API_URL =
    "http://127.0.0.1:8000/api/demo/programme-data";

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


        /* =================================================
           LOAD DASHBOARD
           ================================================= */

        await initializeDashboard();

    }
);


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeDashboard() {

    try {

        setAdvancedStatus(
            "Loading demo data..."
        );


        /* =================================================
           DEMO GOVERNMENT OFFICIAL
           ================================================= */

        currentUser = {
            id: "demo-government-user"
        };


        currentOfficial = {

            full_name:
                "Demo Government Official",

            designation:
                "Government Programme Officer",

            official_id:
                "DEMO-001",

            department:
                "Skill Development",

            government_level:
                "State",

            official_role:
                "Government Official",

            state:
                "Haryana",

            district:
                "",

            office:
                "Demo Office",

            official_email:
                "",

            mobile:
                "",

            office_address:
                "",

            verification_status:
                true

        };


        /* =================================================
           UPDATE OFFICIAL INFORMATION
           ================================================= */

        updateOfficialUI();


        /* =================================================
           LOAD SQLITE DEMO DATA THROUGH API
           ================================================= */

        await loadProgrammeData();


        /* =================================================
           INITIAL FILTERS
           ================================================= */

        currentFilters = {

            state:
                "Haryana",

            district:
                "",

            programme:
                ""

        };


        /* =================================================
           STATE DROPDOWN
           ================================================= */

        const stateFilter =
            document.getElementById(
                "stateFilter"
            );


        if (stateFilter) {

            stateFilter.value =
                "Haryana";

        }


        /* =================================================
           DISTRICT DROPDOWN
           ================================================= */

        populateDistrictFilter(
            "Haryana"
        );


        const districtFilter =
            document.getElementById(
                "districtFilter"
            );


        if (districtFilter) {

            districtFilter.value =
                "";

        }


        /* =================================================
           APPLY FILTERS
           ================================================= */

        applyFilters();


        /* =================================================
           FINAL UI UPDATE
           ================================================= */

        updateLastUpdated();


        setAdvancedStatus(
            "Demo data loaded successfully."
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

    console.log(
        "Loading programme data from SQLite demo database..."
    );


    const response =
        await fetch(
            DEMO_API_URL
        );


    if (!response.ok) {

        throw new Error(
            `Demo API returned HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    /* =====================================================
       LOAD DATA INTO DASHBOARD ARRAYS
       ===================================================== */

    allProfiles =
        data.profiles || [];


    allTrainingRecords =
        data.training || [];


    allEmploymentRecords =
        data.employment || [];


    /* =====================================================
       DEBUG
       ===================================================== */

    console.log(
        "======================================"
    );

    console.log(
        "SQLITE DEMO DATA LOADED"
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

    console.log(
        "Source:",
        data.source
    );

    console.log(
        "======================================"
    );

}

/* =========================================================
   CSV → OBJECTS
   ========================================================= */

function csvToObjects(
    text
) {

    const rows = [];

    let row = [];

    let field = "";

    let insideQuotes =
        false;


    text =
        text.replace(
            /^\uFEFF/,
            ""
        );


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];

        const next =
            text[i + 1];


        /* ---------------------------------------------
           QUOTES
           --------------------------------------------- */

        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                next === '"'
            ) {

                field += '"';

                i++;

            }

            else {

                insideQuotes =
                    !insideQuotes;

            }

        }


        /* ---------------------------------------------
           COMMA
           --------------------------------------------- */

        else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(
                field
            );

            field =
                "";

        }


        /* ---------------------------------------------
           NEW LINE
           --------------------------------------------- */

        else if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }


            row.push(
                field
            );


            if (
                row.some(
                    value =>
                        value.trim() !== ""
                )
            ) {

                rows.push(
                    row
                );

            }


            row =
                [];

            field =
                "";

        }


        /* ---------------------------------------------
           NORMAL CHARACTER
           --------------------------------------------- */

        else {

            field +=
                char;

        }

    }


    /* ---------------------------------------------
       LAST ROW
       --------------------------------------------- */

    if (
        field !== "" ||
        row.length
    ) {

        row.push(
            field
        );


        if (
            row.some(
                value =>
                    value.trim() !== ""
            )
        ) {

            rows.push(
                row
            );

        }

    }


    if (!rows.length) {

        return [];

    }


    /* ---------------------------------------------
       HEADERS
       --------------------------------------------- */

    const headers =
        rows[0].map(
            header =>
                header.trim()
        );


    /* ---------------------------------------------
       OBJECTS
       --------------------------------------------- */

    return rows
        .slice(1)
        .map(
            function (values) {

                const object =
                    {};


                headers.forEach(
                    function (
                        header,
                        index
                    ) {

                        object[header] =
                            (
                                values[index] ??
                                ""
                            ).trim();

                    }
                );


                return object;

            }
        );

}


/* =========================================================
   NUMBER HELPER
   ========================================================= */

function toNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }


    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* =========================================================
   PROGRAMME DROPDOWN
   ========================================================= */

function populateProgrammeFilter() {

    const programmeFilter =
        document.getElementById(
            "programmeFilter"
        );


    if (!programmeFilter) {

        return;

    }


    const programmes =
        [
            ...new Set(
                allTrainingRecords
                    .map(
                        record =>
                            record.course_name
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    programmeFilter.innerHTML =
        `
        <option value="All Programmes">
            All Programmes
        </option>
        `;


    programmes.forEach(
        function (programme) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                programme;


            option.textContent =
                programme;


            programmeFilter.appendChild(
                option
            );

        }
    );

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
                        "";

                }


                applyFilters();

            }
        );

    }

}


/* =========================================================
   POPULATE PROGRAMME FILTER
   ========================================================= */

function populateProgrammeFilter() {

    const programmeFilter =
        document.getElementById(
            "programmeFilter"
        );


    if (!programmeFilter) {
        return;
    }


    /* =====================================================
       GET UNIQUE PROGRAMMES FROM DEMO DATA
       ===================================================== */

    const programmes =
        [
            ...new Set(
                allTrainingRecords
                    .map(
                        record =>
                            record.course_name
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    /* =====================================================
       RESET DROPDOWN
       ===================================================== */

    programmeFilter.innerHTML =
        `<option value="">All Programmes</option>`;


    /* =====================================================
       ADD PROGRAMMES
       ===================================================== */

    programmes.forEach(
        function (programme) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                programme;


            option.textContent =
                programme;


            programmeFilter.appendChild(
                option
            );

        }
    );

}

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
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    console.log(
        "Applying filters:",
        currentFilters
    );


    /* =====================================================
       NORMALIZE FILTER VALUES
       ===================================================== */

    const selectedState =
        currentFilters.state || "";


    const selectedDistrict =
        currentFilters.district || "";


    const selectedProgramme =
        currentFilters.programme || "";


    const programmeIsAll =
        !selectedProgramme ||
        selectedProgramme === "All Programmes";


    const districtIsAll =
        !selectedDistrict ||
        selectedDistrict === "All Districts";


    /* =====================================================
       STEP 1 — FILTER PROFILES BY STATE + DISTRICT
       ===================================================== */

    filteredProfiles =
        allProfiles.filter(
            function (profile) {

                const stateMatches =
                    !selectedState ||
                    profile.state === selectedState;


                const districtMatches =
                    districtIsAll ||
                    profile.district === selectedDistrict;


                return (
                    stateMatches &&
                    districtMatches
                );

            }
        );


    /* =====================================================
       STEP 2 — IF PROGRAMME IS SELECTED,
                KEEP ONLY TRAINEES IN THAT PROGRAMME
       ===================================================== */

    if (!programmeIsAll) {

        const programmeTraineeIds =
            new Set(

                allTrainingRecords

                    .filter(
                        function (record) {

                            return (
                                record.course_name ===
                                selectedProgramme
                            );

                        }
                    )

                    .map(
                        function (record) {

                            return String(
                                record.trainee_id
                            );

                        }
                    )

            );


        filteredProfiles =
            filteredProfiles.filter(
                function (profile) {

                    return programmeTraineeIds.has(
                        String(profile.user_id)
                    );

                }
            );

    }


    /* =====================================================
       STEP 3 — GET IDs OF FILTERED TRAINEES
       ===================================================== */

    const filteredTraineeIds =
        new Set(

            filteredProfiles.map(
                function (profile) {

                    return String(
                        profile.user_id
                    );

                }
            )

        );


    /* =====================================================
       STEP 4 — FILTER TRAINING RECORDS
       ===================================================== */

    filteredTrainingRecords =
        allTrainingRecords.filter(
            function (record) {

                const traineeMatches =
                    filteredTraineeIds.has(
                        String(record.trainee_id)
                    );


                const programmeMatches =
                    programmeIsAll ||
                    record.course_name ===
                        selectedProgramme;


                return (
                    traineeMatches &&
                    programmeMatches
                );

            }
        );


    /* =====================================================
       STEP 5 — FILTER EMPLOYMENT RECORDS
       ===================================================== */

    filteredEmploymentRecords =
        allEmploymentRecords.filter(
            function (record) {

                return filteredTraineeIds.has(
                    String(record.trainee_id)
                );

            }
        );


    /* =====================================================
       DEBUG
       ===================================================== */

    console.log(
        "Filtered profiles:",
        filteredProfiles.length
    );

    console.log(
        "Filtered training:",
        filteredTrainingRecords.length
    );

    console.log(
        "Filtered employment:",
        filteredEmploymentRecords.length
    );


    /* =====================================================
       UPDATE DASHBOARD
       ===================================================== */

    updateKPIs();

    updateOutcomeChart();

    updateCourseAnalytics();

    updateRetentionChart();

    updateAdvancedAnalytics();

    updateAlerts();

    updateFilterStatus();


    console.log(
        "Dashboard filters applied successfully."
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

/* =====================================================
   PROGRAMME PERFORMANCE - VIEW DETAILS
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const courseDetailsBtn =
        document.getElementById("courseDetailsBtn");

    const courseDetails =
        document.getElementById("courseDetails");

    if (!courseDetailsBtn || !courseDetails) {
        return;
    }

    courseDetailsBtn.addEventListener("click", () => {

        const isHidden = courseDetails.hasAttribute("hidden");

        if (isHidden) {

            // Show details
            courseDetails.removeAttribute("hidden");

            courseDetailsBtn.textContent = "Hide details";
            courseDetailsBtn.setAttribute(
                "aria-expanded",
                "true"
            );

        } else {

            // Hide details
            courseDetails.setAttribute("hidden", "");

            courseDetailsBtn.textContent = "View details";
            courseDetailsBtn.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });

});


