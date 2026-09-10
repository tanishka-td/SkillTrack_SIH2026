/* =========================================================
   SKILLTRACK - CURRENT STATUS
   JavaScript
   Backend: Supabase
   Table: employment_records
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;
let selectedStatus = "Employed";


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("SkillTrack Current Status loaded.");

    initStatusPage();

});


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

async function initStatusPage() {

    try {

        /* -------------------------------------------------
           CHECK SUPABASE
        ------------------------------------------------- */

        if (typeof supabaseClient === "undefined") {

            console.error(
                "supabaseClient is not available."
            );

            showMessage(
                "Database connection error. Please check supabase.js.",
                "error"
            );

            return;

        }


        /* -------------------------------------------------
           GET CURRENT USER
        ------------------------------------------------- */

        const {
            data: {
                user
            },
            error
        } = await supabaseClient.auth.getUser();


        if (error) {

            console.error(
                "Authentication error:",
                error
            );

            window.location.href =
                "trainee-login.html";

            return;

        }


        if (!user) {

            console.warn(
                "No logged-in user."
            );

            window.location.href =
                "trainee-login.html";

            return;

        }


        currentUser = user;


        console.log(
            "Logged-in user:",
            currentUser.id
        );


        /* -------------------------------------------------
           SETUP STATUS BUTTONS
        ------------------------------------------------- */

        setupStatusButtons();


        /* -------------------------------------------------
           SETUP SAVE BUTTON
        ------------------------------------------------- */

        const saveButton =
            document.getElementById("saveStatus");


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                saveCurrentStatus
            );

        }


        /* -------------------------------------------------
           LOAD PREVIOUS STATUS
        ------------------------------------------------- */

        await loadLatestStatus();


    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showMessage(
            "Unable to load the current status.",
            "error"
        );

    }

}


/* =========================================================
   STATUS BUTTONS
   ========================================================= */

function setupStatusButtons() {

    const buttons =
        document.querySelectorAll(
            ".status-select"
        );


    console.log(
        "Status buttons found:",
        buttons.length
    );


    if (buttons.length === 0) {

        console.error(
            "No status buttons found."
        );

        return;

    }


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                /* -----------------------------------------
                   GET SELECTED STATUS
                ----------------------------------------- */

                const status =
                    this.getAttribute(
                        "data-status"
                    );


                if (!status) {

                    console.error(
                        "Status button has no data-status."
                    );

                    return;

                }


                selectedStatus =
                    status;


                console.log(
                    "Status selected:",
                    selectedStatus
                );


                /* -----------------------------------------
                   REMOVE SELECTED CLASS
                ----------------------------------------- */

                buttons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "selected"
                        );

                    }
                );


                /* -----------------------------------------
                   ADD SELECTED CLASS
                ----------------------------------------- */

                this.classList.add(
                    "selected"
                );


                /* -----------------------------------------
                   UPDATE FORM
                ----------------------------------------- */

                updateDynamicFields();

            }
        );

    });


    /* -----------------------------------------------------
       INITIAL STATE
    ----------------------------------------------------- */

    selectStatusButton(
        selectedStatus
    );


    updateDynamicFields();

}


/* =========================================================
   SELECT STATUS BUTTON
   ========================================================= */

function selectStatusButton(status) {

    const buttons =
        document.querySelectorAll(
            ".status-select"
        );


    buttons.forEach(function (button) {

        const buttonStatus =
            button.getAttribute(
                "data-status"
            );


        if (buttonStatus === status) {

            button.classList.add(
                "selected"
            );

        } else {

            button.classList.remove(
                "selected"
            );

        }

    });

}


/* =========================================================
   SHOW / HIDE FORM SECTIONS
   ========================================================= */

function updateDynamicFields() {

    const dynamicFields =
        document.getElementById(
            "dynamicFields"
        );


    const unemployedFields =
        document.getElementById(
            "unemployedFields"
        );


    if (!dynamicFields) {

        console.error(
            "#dynamicFields was not found."
        );

        return;

    }


    if (!unemployedFields) {

        console.error(
            "#unemployedFields was not found."
        );

        return;

    }


    console.log(
        "Updating form for:",
        selectedStatus
    );


    /* =====================================================
       UNEMPLOYED
       ===================================================== */

    if (
        selectedStatus ===
        "Unemployed"
    ) {

        dynamicFields.style.display =
            "none";


        unemployedFields.style.display =
            "block";


        return;

    }


    /* =====================================================
       EMPLOYED
       BUSINESS
       APPRENTICESHIP
       ===================================================== */

    dynamicFields.style.display =
        "block";


    unemployedFields.style.display =
        "none";

}


/* =========================================================
   LOAD LATEST STATUS
   ========================================================= */

async function loadLatestStatus() {

    if (!currentUser) {

        console.warn(
            "Cannot load status without a user."
        );

        return;

    }


    try {

        console.log(
            "Fetching latest employment record..."
        );


        const {
            data,
            error
        } = await supabaseClient
            .from("employment_records")
            .select("*")
            .eq(
                "trainee_id",
                currentUser.id
            )
            .order(
                "recorded_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


        /* -------------------------------------------------
           DATABASE ERROR
        ------------------------------------------------- */

        if (error) {

            console.error(
                "Could not load employment record:",
                error
            );

            return;

        }


        /* -------------------------------------------------
           NO PREVIOUS RECORD
        ------------------------------------------------- */

        if (!data) {

            console.log(
                "No previous status found."
            );

            selectedStatus =
                "Employed";


            selectStatusButton(
                selectedStatus
            );


            updateDynamicFields();


            return;

        }


        console.log(
            "Latest status:",
            data
        );


        /* -------------------------------------------------
           RESTORE STATUS
        ------------------------------------------------- */

        selectedStatus =
            data.status;


        selectStatusButton(
            selectedStatus
        );


        /* -------------------------------------------------
           RESTORE COMPANY
        ------------------------------------------------- */

        setInputValue(
            "company",
            data.company_name
        );


        /* -------------------------------------------------
           RESTORE ROLE
        ------------------------------------------------- */

        setInputValue(
            "role",
            data.job_role
        );


        /* -------------------------------------------------
           RESTORE SALARY
        ------------------------------------------------- */

        setInputValue(
            "salary",
            data.monthly_salary
        );


        /* -------------------------------------------------
           RESTORE JOINING DATE
        ------------------------------------------------- */

        setInputValue(
            "joiningDate",
            data.joining_date
        );


        /* -------------------------------------------------
           RESTORE EMPLOYMENT TYPE
        ------------------------------------------------- */

        setInputValue(
            "employmentType",
            data.employment_type
        );


        /* -------------------------------------------------
           RESTORE UNEMPLOYMENT REASON
        ------------------------------------------------- */

        setInputValue(
            "unemployedReason",
            data.unemployed_reason
        );


        /* -------------------------------------------------
           UPDATE VISIBLE FIELDS
        ------------------------------------------------- */

        updateDynamicFields();


    } catch (error) {

        console.error(
            "Error loading latest status:",
            error
        );

    }

}


/* =========================================================
   SAVE CURRENT STATUS
   ========================================================= */

async function saveCurrentStatus() {

    console.log(
        "Saving status:",
        selectedStatus
    );


    /* =====================================================
       CHECK USER
       ===================================================== */

    if (!currentUser) {

        showMessage(
            "You are not logged in. Please sign in again.",
            "error"
        );

        return;

    }


    /* =====================================================
       GET FORM VALUES
       ===================================================== */

    const companyName =
        getInputValue(
            "company"
        );


    const jobRole =
        getInputValue(
            "role"
        );


    const salaryValue =
        getInputValue(
            "salary"
        );


    const joiningDate =
        getInputValue(
            "joiningDate"
        );


    const employmentType =
        getInputValue(
            "employmentType"
        );


    const unemployedReason =
        getInputValue(
            "unemployedReason"
        );


    /* =====================================================
       VALIDATE STATUS
       ===================================================== */

    if (!selectedStatus) {

        showMessage(
            "Please select your current status.",
            "error"
        );

        return;

    }


    /* =====================================================
       VALIDATE EMPLOYED / BUSINESS / APPRENTICESHIP
       ===================================================== */

    if (
        selectedStatus !==
        "Unemployed"
    ) {


        if (!companyName) {

            showMessage(
                "Please enter your company or organisation.",
                "error"
            );

            return;

        }


        if (!employmentType) {

            showMessage(
                "Please select your employment type.",
                "error"
            );

            return;

        }

    }


    /* =====================================================
       SALARY
       ===================================================== */

    let monthlySalary = null;


    if (salaryValue !== "") {

        monthlySalary =
            parseFloat(
                salaryValue
            );


        if (
            Number.isNaN(
                monthlySalary
            ) ||
            monthlySalary < 0
        ) {

            showMessage(
                "Please enter a valid salary.",
                "error"
            );

            return;

        }

    }


    /* =====================================================
       BUILD DATABASE RECORD
       ===================================================== */

    const payload = {

        trainee_id:
            currentUser.id,

        status:
            selectedStatus,

        company_name:
            selectedStatus === "Unemployed"
                ? null
                : companyName || null,

        job_role:
            selectedStatus === "Unemployed"
                ? null
                : jobRole || null,

        monthly_salary:
            selectedStatus === "Unemployed"
                ? null
                : monthlySalary,

        joining_date:
            selectedStatus === "Unemployed"
                ? null
                : joiningDate || null,

        employment_type:
            selectedStatus === "Unemployed"
                ? null
                : employmentType || null,

        unemployed_reason:
            selectedStatus === "Unemployed"
                ? unemployedReason || null
                : null,

        recorded_at:
            new Date().toISOString()

    };


    console.log(
        "Record being saved:",
        payload
    );


    /* =====================================================
       SAVE BUTTON LOADING STATE
       ===================================================== */

    const saveButton =
        document.getElementById(
            "saveStatus"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    /* =====================================================
       INSERT INTO SUPABASE
       ===================================================== */

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("employment_records")
            .insert([
                payload
            ])
            .select()
            .single();


        /* -------------------------------------------------
           DATABASE ERROR
        ------------------------------------------------- */

        if (error) {

            console.error(
                "Supabase error:",
                error
            );


            showMessage(
                "Unable to save status: " +
                error.message,
                "error"
            );


            return;

        }


        /* -------------------------------------------------
           SUCCESS
        ------------------------------------------------- */

        console.log(
            "Employment record saved:",
            data
        );


        showMessage(
            "Your current status has been updated successfully.",
            "success"
        );


        /* -------------------------------------------------
           CLEAR UNEMPLOYMENT REASON
           IF CURRENT STATUS IS NOT UNEMPLOYED
        ------------------------------------------------- */

        if (
            selectedStatus !==
            "Unemployed"
        ) {

            const reason =
                document.getElementById(
                    "unemployedReason"
                );


            if (reason) {

                reason.value =
                    "";

            }

        }


    } catch (error) {

        console.error(
            "Unexpected save error:",
            error
        );


        showMessage(
            error.message ||
            "Something went wrong while saving.",
            "error"
        );


    } finally {

        /* -------------------------------------------------
           RESTORE BUTTON
        ------------------------------------------------- */

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Current Status →";

        }

    }

}


/* =========================================================
   GET INPUT VALUE
   ========================================================= */

function getInputValue(id) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "Element not found:",
            id
        );

        return "";

    }


    return element.value.trim();

}


/* =========================================================
   SET INPUT VALUE
   ========================================================= */

function setInputValue(id, value) {

    const element =
        document.getElementById(
            id
        );


    if (
        element &&
        value !== null &&
        value !== undefined
    ) {

        element.value =
            value;

    }

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(message, type) {

    const messageElement =
        document.getElementById(
            "statusMessage"
        );


    if (!messageElement) {

        console.warn(
            "Status message element not found."
        );

        return;

    }


    messageElement.textContent =
        message;


    messageElement.className =
        "message " + type;


    messageElement.style.display =
        "block";


    /* -----------------------------------------------------
       AUTO HIDE
    ----------------------------------------------------- */

    setTimeout(
        function () {

            messageElement.style.display =
                "none";

        },
        5000
    );

}