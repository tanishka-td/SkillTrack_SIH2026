/* =========================================================
   SKILLTRACK - MY TRAINING
   Supabase + Certificate Storage
   ========================================================= */

let currentUser = null;
let trainingRecords = [];
let selectedTraining = null;

let certificateVerified = false;
let certificateSource = null;


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "SkillTrack My Training loaded"
        );


        setupTrainingUI();

        setupCertificateUI();


        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "supabaseClient is not available."
            );

            showTrainingMessage(
                "Supabase connection is not available.",
                "error"
            );

            hideElement(
                "trainingLoading"
            );

            return;
        }


        await initializeTrainingPage();
    }
);


/* =========================================================
   INITIALIZE TRAINING PAGE
   ========================================================= */

async function initializeTrainingPage() {

    showElement(
        "trainingLoading"
    );


    hideElement(
        "noTraining"
    );


    hideElement(
        "trainingDetails"
    );


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


        currentUser =
            data.user;


        if (!currentUser) {

            window.location.href =
                "trainee-login.html";

            return;
        }


        console.log(
            "Authenticated trainee:",
            currentUser.id
        );


        await loadTrainingRecords();


    } catch (error) {

        console.error(
            "Training initialization error:",
            error
        );


        showTrainingMessage(
            error.message ||
            "Unable to load your training records.",
            "error"
        );

    } finally {

        hideElement(
            "trainingLoading"
        );
    }
}


/* =========================================================
   LOAD TRAINING RECORDS
   ========================================================= */

async function loadTrainingRecords() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("trainee_records")
            .select("*")
            .eq(
                "trainee_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Training fetch error:",
            error
        );

        throw error;
    }


    trainingRecords =
        data || [];


    console.log(
        "Training records:",
        trainingRecords
    );


    renderTrainingList();
}


/* =========================================================
   RENDER TRAINING LIST
   ========================================================= */

function renderTrainingList() {

    const container =
        document.getElementById(
            "trainingList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !trainingRecords.length
    ) {

        hideElement(
            "trainingList"
        );


        showElement(
            "noTraining"
        );


        return;
    }


    hideElement(
        "noTraining"
    );


    showElement(
        "trainingList"
    );


    trainingRecords.forEach(
        function (record) {

            const card =
                createTrainingCard(
                    record
                );


            container.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   CREATE TRAINING CARD
   ========================================================= */

function createTrainingCard(
    record
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "training-card";


    const courseName =
        record.course_name ||
        "Training Programme";


    const provider =
        record.provider_name ||
        "Training Provider";


    const completion =
        record.completion_date
            ? formatDate(
                record.completion_date
            )
            : "In progress";


    const certification =
        record.certification_status ||
        "Pending";


    const verified =
        record.is_verified === true;


    const certificateVerified =
        record.certificate_verified === true;


    const statusClass =
        verified
            ? "verified"
            : "pending";


    card.innerHTML = `
        <div class="training-card-header">

            <div class="course-icon">
                ${getCourseInitials(courseName)}
            </div>

            <div class="training-card-title">

                <h3>
                    ${escapeHTML(courseName)}
                </h3>

                <span>
                    ${escapeHTML(provider)}
                </span>

            </div>

            <span class="training-status ${statusClass}">
                ${
                    verified
                        ? "Verified"
                        : "Pending Verification"
                }
            </span>

        </div>

        <div class="training-card-info">

            <div>
                <span>Start Date</span>
                <strong>
                    ${
                        record.start_date
                            ? formatDate(
                                record.start_date
                            )
                            : "-"
                    }
                </strong>
            </div>

            <div>
                <span>Completion</span>
                <strong>
                    ${completion}
                </strong>
            </div>

            <div>
                <span>Certification</span>
                <strong>
                    ${escapeHTML(certification)}
                </strong>
            </div>

            <div>
                <span>Certificate</span>
                <strong>
                    ${
                        certificateVerified
                            ? "Verified"
                            : record.certificate_path
                                ? "Uploaded"
                                : "Not Added"
                    }
                </strong>
            </div>

        </div>

        <button
            type="button"
            class="outline-btn view-training-btn"
        >
            View Details →
        </button>
    `;


    const button =
        card.querySelector(
            ".view-training-btn"
        );


    button.addEventListener(
        "click",
        function () {

            showTrainingDetails(
                record
            );
        }
    );


    return card;
}


/* =========================================================
   SHOW TRAINING DETAILS
   ========================================================= */

function showTrainingDetails(
    record
) {

    selectedTraining =
        record;


    hideElement(
        "trainingList"
    );


    hideElement(
        "noTraining"
    );


    showElement(
        "trainingDetails"
    );


    setText(
        "courseName",
        record.course_name ||
        "Training Programme"
    );


    setText(
        "providerName",
        record.provider_name ||
        "-"
    );


    setText(
        "trainingCentre",
        record.provider_name ||
        "-"
    );


    setText(
        "startDate",
        record.start_date
            ? formatDate(
                record.start_date
            )
            : "-"
    );


    setText(
        "completionDate",
        record.completion_date
            ? formatDate(
                record.completion_date
            )
            : "In progress"
    );


    setText(
        "trainingId",
        record.id ||
        "-"
    );


    setText(
        "attendance",
        record.attendance !== null &&
        record.attendance !== undefined
            ? `${record.attendance}%`
            : "-"
    );


    setText(
        "assessmentScore",
        record.assessment_score !== null &&
        record.assessment_score !== undefined
            ? `${record.assessment_score}%`
            : "-"
    );


    setText(
        "certificationStatus",
        record.certification_status ||
        "Pending"
    );


    setText(
        "verificationStatus",
        record.is_verified === true
            ? "Verified"
            : "Pending Verification"
    );


    /* =============================================
       DURATION
       ============================================= */

    let duration =
        record.duration_months;


    if (
        duration === null ||
        duration === undefined
    ) {

        duration =
            calculateDuration(
                record.start_date,
                record.completion_date
            );
    }


    setText(
        "courseDuration",
        duration
            ? `${duration} months`
            : "-"
    );


    /* =============================================
       COMPLETION
       ============================================= */

    const completionPercentage =
        calculateCompletionPercentage(
            record
        );


    setText(
        "completionPercentage",
        `${completionPercentage}%`
    );


    /* =============================================
       COURSE ICON
       ============================================= */

    setText(
        "courseIcon",
        getCourseInitials(
            record.course_name
        )
    );


    /* =============================================
       BADGE
       ============================================= */

    setText(
        "completionBadge",
        record.completion_date
            ? "Completed"
            : "In Progress"
    );


    /* =============================================
       TIMELINE
       ============================================= */

    renderTimeline(
        record
    );


    /* =============================================
       SKILLS
       ============================================= */

    renderSkills(
        record.skills
    );
}


/* =========================================================
   TIMELINE
   ========================================================= */

function renderTimeline(
    record
) {

    setText(
        "enrolledDate",
        record.created_at
            ? formatDate(
                record.created_at
            )
            : "-"
    );


    setText(
        "startedDate",
        record.start_date
            ? formatDate(
                record.start_date
            )
            : "-"
    );


    setText(
        "completedTimelineDate",
        record.completion_date
            ? formatDate(
                record.completion_date
            )
            : "-"
    );


    let certificateDate =
        "-";


    if (
        record.certificate_verified_at
    ) {

        certificateDate =
            formatDate(
                record.certificate_verified_at
            );

    } else if (
        record.certification_status ===
        "Issued"
        &&
        record.completion_date
    ) {

        certificateDate =
            formatDate(
                record.completion_date
            );
    }


    setText(
        "certificateDate",
        certificateDate
    );


    updateTimelineStep(
        "enrolledStep",
        true
    );


    updateTimelineStep(
        "startedStep",
        Boolean(
            record.start_date
        )
    );


    updateTimelineStep(
        "completedStep",
        Boolean(
            record.completion_date
        )
    );


    updateTimelineStep(
        "certificateStep",
        record.certification_status ===
        "Issued"
        ||
        record.certificate_verified === true
    );
}


/* =========================================================
   SKILLS
   ========================================================= */

function renderSkills(
    skills
) {

    const container =
        document.querySelector(
            ".skill-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !skills ||
        !Array.isArray(skills) ||
        !skills.length
    ) {

        container.innerHTML = `
            <span>
                Skills information
            </span>

            <span>
                Will be added
            </span>

            <span>
                to training records
            </span>
        `;

        return;
    }


    skills.forEach(
        function (skill) {

            const element =
                document.createElement(
                    "span"
                );


            element.textContent =
                skill;


            container.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   ADD TRAINING
   ========================================================= */

function setupTrainingUI() {

    const addButton =
        document.getElementById(
            "addTrainingBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelTraining"
        );


    const saveButton =
        document.getElementById(
            "saveTraining"
        );


    const backButton =
        document.getElementById(
            "backToTrainingList"
        );


    addButton?.addEventListener(
        "click",
        function () {

            showTrainingForm();
        }
    );


    cancelButton?.addEventListener(
        "click",
        function () {

            hideTrainingForm();
        }
    );


    saveButton?.addEventListener(
        "click",
        submitTraining
    );


    backButton?.addEventListener(
        "click",
        function () {

            hideElement(
                "trainingDetails"
            );

            showElement(
                "trainingList"
            );

            if (
                !trainingRecords.length
            ) {

                showElement(
                    "noTraining"
                );
            }
        }
    );
}


/* =========================================================
   SHOW FORM
   ========================================================= */

function showTrainingForm() {

    const form =
        document.getElementById(
            "trainingForm"
        );


    if (!form) {
        return;
    }


    form.style.display =
        "block";


    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    resetCertificateState();
}


/* =========================================================
   HIDE FORM
   ========================================================= */

function hideTrainingForm() {

    const form =
        document.getElementById(
            "trainingForm"
        );


    if (!form) {
        return;
    }


    form.style.display =
        "none";
}


/* =========================================================
   SUBMIT TRAINING
   ========================================================= */

async function submitTraining() {

    if (!currentUser) {

        showTrainingMessage(
            "Please sign in again.",
            "error"
        );

        return;
    }


    const courseName =
        getValue(
            "newCourseName"
        );


    const providerName =
        getValue(
            "newProviderName"
        );


    const startDate =
        getValue(
            "newStartDate"
        );


    const completionDate =
        getValue(
            "newCompletionDate"
        );


    const attendanceValue =
        getValue(
            "newAttendance"
        );


    const assessmentValue =
        getValue(
            "newAssessment"
        );


    const certification =
        getValue(
            "newCertification"
        );


    const termsAnalysis =
        document.getElementById(
            "termsAnalysis"
        );


    const termsAccuracy =
        document.getElementById(
            "termsAccuracy"
        );


    /* =============================================
       VALIDATION
       ============================================= */

    if (
        !courseName ||
        !providerName ||
        !startDate
    ) {

        showFormMessage(
            "Please fill in the course name, provider and start date.",
            "error"
        );

        return;
    }


    if (
        completionDate &&
        completionDate < startDate
    ) {

        showFormMessage(
            "Completion date cannot be before the start date.",
            "error"
        );

        return;
    }


    const attendance =
        attendanceValue === ""
            ? null
            : Number(
                attendanceValue
            );


    const assessment =
        assessmentValue === ""
            ? null
            : Number(
                assessmentValue
            );


    if (
        attendance !== null &&
        (
            attendance < 0 ||
            attendance > 100
        )
    ) {

        showFormMessage(
            "Attendance must be between 0 and 100.",
            "error"
        );

        return;
    }


    if (
        assessment !== null &&
        (
            assessment < 0 ||
            assessment > 100
        )
    ) {

        showFormMessage(
            "Assessment score must be between 0 and 100.",
            "error"
        );

        return;
    }


    if (
        !certification
    ) {

        showFormMessage(
            "Please select a certification status.",
            "error"
        );

        return;
    }


    if (
        !termsAnalysis ||
        !termsAnalysis.checked
    ) {

        showFormMessage(
            "Please allow your data to be used for analysis.",
            "error"
        );

        return;
    }


    if (
        !termsAccuracy ||
        !termsAccuracy.checked
    ) {

        showFormMessage(
            "Please confirm that the training information is accurate.",
            "error"
        );

        return;
    }


    const saveButton =
        document.getElementById(
            "saveTraining"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Uploading & Submitting...";
    }


    try {

        /* =============================================
           CERTIFICATE UPLOAD
           ============================================= */

        let certificatePath =
            null;


        if (
            certificateVerified &&
            certificateSource ===
            "DigiLocker"
        ) {

            /*
             * DigiLocker prototype verification.
             *
             * There is no real DigiLocker API call here yet.
             */

            certificatePath =
                null;

        } else {

            const file =
                document.getElementById(
                    "certificateFile"
                )?.files?.[0];


            if (file) {

                certificatePath =
                    await uploadCertificate(
                        file
                    );
            }
        }


        /* =============================================
           INSERT TRAINING RECORD
           ============================================= */

        const payload = {

            trainee_id:
                currentUser.id,

            course_name:
                courseName,

            provider_name:
                providerName,

            start_date:
                startDate,

            completion_date:
                completionDate ||
                null,

            attendance:
                attendance,

            assessment_score:
                assessment,

            certification_status:
                certification,

            is_verified:
                false,

            certificate_path:
                certificatePath,

            certificate_source:
                certificateVerified
                    ? certificateSource
                    : null,

            certificate_verified:
                certificateVerified,

            certificate_verified_at:
                certificateVerified
                    ? new Date().toISOString()
                    : null
        };


        console.log(
            "Training payload:",
            payload
        );


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "trainee_records"
                )
                .insert(
                    [payload]
                )
                .select()
                .single();


        if (error) {

            /*
             * If DB insertion fails after a file upload,
             * remove the uploaded certificate so we don't
             * leave orphaned files.
             */

            if (
                certificatePath
            ) {

                await deleteCertificate(
                    certificatePath
                );
            }


            throw error;
        }


        console.log(
            "Training created:",
            data
        );


        showFormMessage(
            "Training submitted successfully for verification.",
            "success"
        );


        trainingRecords.unshift(
            data
        );


        resetTrainingForm();


        setTimeout(
            function () {

                hideTrainingForm();

                renderTrainingList();

                showTrainingMessage(
                    "Training record added successfully.",
                    "success"
                );

            },
            1200
        );


    } catch (error) {

        console.error(
            "Training submission error:",
            error
        );


        showFormMessage(
            error.message ||
            "Unable to save training record.",
            "error"
        );

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Submit for Verification →";
        }
    }
}


/* =========================================================
   UPLOAD CERTIFICATE
   ========================================================= */

async function uploadCertificate(
    file
) {

    validateCertificateFile(
        file
    );


    const extension =
        getFileExtension(
            file.name
        );


    const randomName =
        crypto.randomUUID();


    const fileName =
        `${randomName}.${extension}`;


    const filePath =
        `${currentUser.id}/${fileName}`;


    console.log(
        "Uploading certificate:",
        filePath
    );


    const {
        error
    } =
        await supabaseClient
            .storage
            .from("certificates")
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        console.error(
            "Certificate upload error:",
            error
        );

        throw new Error(
            "Certificate upload failed: " +
            error.message
        );
    }


    return filePath;
}


/* =========================================================
   DELETE CERTIFICATE
   ========================================================= */

async function deleteCertificate(
    path
) {

    if (!path) {
        return;
    }


    try {

        await supabaseClient
            .storage
            .from("certificates")
            .remove(
                [path]
            );

    } catch (error) {

        console.warn(
            "Could not remove orphaned certificate:",
            error
        );
    }
}


/* =========================================================
   CERTIFICATE UI
   ========================================================= */

function setupCertificateUI() {

    const fileInput =
        document.getElementById(
            "certificateFile"
        );


    const digiButton =
        document.getElementById(
            "digilockerBtn"
        );


    const closeButton =
        document.getElementById(
            "closeDigilockerModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelDigilocker"
        );


    const allowButton =
        document.getElementById(
            "allowDigilocker"
        );


    fileInput?.addEventListener(
        "change",
        function () {

            certificateVerified =
                false;

            certificateSource =
                null;


            const file =
                fileInput.files?.[0];


            if (!file) {
                return;
            }


            try {

                validateCertificateFile(
                    file
                );


                showCertificateResult(
                    `Certificate selected: ${file.name}`,
                    false
                );


            } catch (error) {

                fileInput.value =
                    "";


                showCertificateResult(
                    error.message,
                    false
                );
            }
        }
    );


    digiButton?.addEventListener(
        "click",
        function () {

            openDigilockerModal();
        }
    );


    closeButton?.addEventListener(
        "click",
        closeDigilockerModal
    );


    cancelButton?.addEventListener(
        "click",
        closeDigilockerModal
    );


    allowButton?.addEventListener(
        "click",
        handleDigilockerAuthorization
    );
}


/* =========================================================
   OPEN DIGILOCKER MODAL
   ========================================================= */

function openDigilockerModal() {

    const modal =
        document.getElementById(
            "digilockerModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "flex";
}


/* =========================================================
   CLOSE DIGILOCKER MODAL
   ========================================================= */

function closeDigilockerModal() {

    const modal =
        document.getElementById(
            "digilockerModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "none";
}


/* =========================================================
   DIGILOCKER AUTHORIZATION
   ========================================================= */

function handleDigilockerAuthorization() {

    closeDigilockerModal();


    const courseInput =
        document.getElementById(
            "newCourseName"
        );


    const providerInput =
        document.getElementById(
            "newProviderName"
        );


    const course =
        courseInput?.value.trim() ||
        "Training Credential";


    const issuer =
        providerInput?.value.trim() ||
        "Verified Training Provider";


    /*
     * This is currently a PROTOTYPE DigiLocker flow.
     *
     * Real DigiLocker integration requires an approved
     * API/integration flow and OAuth authorization.
     */

    certificateVerified =
        true;


    certificateSource =
        "DigiLocker";


    const details =
        `
            Training: ${escapeHTML(course)}<br>
            Issuer: ${escapeHTML(issuer)}<br>
            Status: Verified via DigiLocker
        `;


    const detailsElement =
        document.getElementById(
            "verifiedDetailsText"
        );


    if (detailsElement) {

        detailsElement.innerHTML =
            details;
    }


    const resultBox =
        document.getElementById(
            "verificationResultBox"
        );


    if (resultBox) {

        resultBox.style.display =
            "block";
    }


    const certification =
        document.getElementById(
            "newCertification"
        );


    if (certification) {

        certification.value =
            "Issued";
    }


    showFormMessage(
        "Credential verified successfully.",
        "success"
    );
}


/* =========================================================
   VALIDATE CERTIFICATE
   ========================================================= */

function validateCertificateFile(
    file
) {

    if (!file) {

        throw new Error(
            "Please select a certificate file."
        );
    }


    const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Only PDF, PNG and JPG/JPEG certificates are allowed."
        );
    }


    const maxSize =
        10 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        throw new Error(
            "Certificate file must be smaller than 10 MB."
        );
    }


    return true;
}


/* =========================================================
   CERTIFICATE RESULT
   ========================================================= */

function showCertificateResult(
    message,
    verified
) {

    const box =
        document.getElementById(
            "verificationResultBox"
        );


    const text =
        document.getElementById(
            "verifiedDetailsText"
        );


    if (!box || !text) {
        return;
    }


    text.innerHTML =
        escapeHTML(
            message
        );


    box.style.display =
        "block";


    if (!verified) {

        box.style.background =
            "#eff6ff";

        box.style.borderColor =
            "#93c5fd";
    }
}


/* =========================================================
   RESET CERTIFICATE STATE
   ========================================================= */

function resetCertificateState() {

    certificateVerified =
        false;


    certificateSource =
        null;


    const fileInput =
        document.getElementById(
            "certificateFile"
        );


    if (fileInput) {

        fileInput.value =
            "";
    }


    const resultBox =
        document.getElementById(
            "verificationResultBox"
        );


    if (resultBox) {

        resultBox.style.display =
            "none";
    }
}


/* =========================================================
   RESET TRAINING FORM
   ========================================================= */

function resetTrainingForm() {

    const fields = [
        "newCourseName",
        "newProviderName",
        "newStartDate",
        "newCompletionDate",
        "newAttendance",
        "newAssessment"
    ];


    fields.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";
            }
        }
    );


    const certification =
        document.getElementById(
            "newCertification"
        );


    if (certification) {

        certification.value =
            "";
    }


    const termsAnalysis =
        document.getElementById(
            "termsAnalysis"
        );


    const termsAccuracy =
        document.getElementById(
            "termsAccuracy"
        );


    if (termsAnalysis) {

        termsAnalysis.checked =
            false;
    }


    if (termsAccuracy) {

        termsAccuracy.checked =
            false;
    }


    resetCertificateState();
}


/* =========================================================
   TRAINING MESSAGE
   ========================================================= */

function showTrainingMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "trainingMessage"
        );


    if (!element) {
        console.log(message);
        return;
    }


    element.textContent =
        message;


    element.style.display =
        "block";


    if (
        type ===
        "success"
    ) {

        element.style.color =
            "#15803d";

    } else {

        element.style.color =
            "#dc2626";
    }
}


/* =========================================================
   FORM MESSAGE
   ========================================================= */

function showFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "trainingFormMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.display =
        "block";


    if (
        type ===
        "success"
    ) {

        element.style.color =
            "#15803d";

    } else {

        element.style.color =
            "#dc2626";
    }
}


/* =========================================================
   TIMELINE STEP
   ========================================================= */

function updateTimelineStep(
    id,
    done
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    if (done) {

        element.classList.add(
            "done"
        );

    } else {

        element.classList.remove(
            "done"
        );
    }
}


/* =========================================================
   CALCULATE COMPLETION
   ========================================================= */

function calculateCompletionPercentage(
    record
) {

    if (
        record.completion_date
    ) {

        return 100;
    }


    if (
        record.start_date
    ) {

        const start =
            new Date(
                record.start_date
            );


        const now =
            new Date();


        if (
            now > start
        ) {

            const days =
                Math.floor(
                    (
                        now - start
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            /*
             * This is only a UI estimate
             * when completion date is missing.
             */

            return Math.min(
                95,
                Math.max(
                    10,
                    Math.round(
                        (
                            days /
                            180
                        ) *
                        100
                    )
                )
            );
        }
    }


    return 0;
}


/* =========================================================
   CALCULATE DURATION
   ========================================================= */

function calculateDuration(
    startDate,
    completionDate
) {

    if (!startDate) {
        return null;
    }


    const start =
        new Date(
            startDate
        );


    const end =
        completionDate
            ? new Date(
                completionDate
            )
            : new Date();


    if (
        Number.isNaN(
            start.getTime()
        ) ||
        Number.isNaN(
            end.getTime()
        )
    ) {

        return null;
    }


    const months =
        (
            (
                end.getFullYear() -
                start.getFullYear()
            ) *
            12
        ) +
        (
            end.getMonth() -
            start.getMonth()
        );


    return Math.max(
        1,
        months
    );
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
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


/* =========================================================
   COURSE INITIALS
   ========================================================= */

function getCourseInitials(
    courseName
) {

    if (!courseName) {
        return "TR";
    }


    const words =
        courseName
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();
}


/* =========================================================
   GET VALUE
   ========================================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return element.value.trim();
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


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


/* =========================================================
   SHOW ELEMENT
   ========================================================= */

function showElement(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.style.display =
            "";
    }
}


/* =========================================================
   HIDE ELEMENT
   ========================================================= */

function hideElement(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.style.display =
            "none";
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   FILE EXTENSION
   ========================================================= */

function getFileExtension(
    fileName
) {

    const parts =
        fileName
            .split(".");


    return parts.length > 1
        ? parts[
            parts.length - 1
        ].toLowerCase()
        : "file";
}