document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const addTrainingBtn =
        document.getElementById("addTrainingBtn");

    const trainingForm =
        document.getElementById("trainingForm");

    const cancelTraining =
        document.getElementById("cancelTraining");

    const saveTraining =
        document.getElementById("saveTraining");

    const trainingFormMessage =
        document.getElementById("trainingFormMessage");

    const trainingLoading =
        document.getElementById("trainingLoading");

    const noTraining =
        document.getElementById("noTraining");

    const trainingList =
        document.getElementById("trainingList");

    const trainingDetails =
        document.getElementById("trainingDetails");

    const backToTrainingList =
        document.getElementById("backToTrainingList");

    const trainingMessage =
        document.getElementById("trainingMessage");


    // =====================================================
    // FORM ELEMENTS
    // =====================================================

    const newCourseName =
        document.getElementById("newCourseName");

    const newProviderName =
        document.getElementById("newProviderName");

    const newStartDate =
        document.getElementById("newStartDate");

    const newCompletionDate =
        document.getElementById("newCompletionDate");

    const newAttendance =
        document.getElementById("newAttendance");

    const newAssessment =
        document.getElementById("newAssessment");

    const newCertification =
        document.getElementById("newCertification");


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const {
        data: {
            user
        },
        error: authError
    } = await supabaseClient.auth.getUser();


    if (authError || !user) {

        console.error(
            "Authentication error:",
            authError
        );

        window.location.href =
            "trainee-login.html";

        return;
    }


    console.log(
        "Logged in trainee:",
        user.id
    );


    // =====================================================
    // LOAD TRAININGS
    // =====================================================

    await loadTrainings();


    // =====================================================
    // ADD TRAINING BUTTON
    // =====================================================

    addTrainingBtn.addEventListener(
        "click",
        () => {

            trainingForm.style.display =
                "block";

            trainingForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );


    // =====================================================
    // CANCEL TRAINING
    // =====================================================

    cancelTraining.addEventListener(
        "click",
        () => {

            trainingForm.style.display =
                "none";

            clearForm();

        }
    );


    // =====================================================
    // SAVE TRAINING
    // =====================================================

    saveTraining.addEventListener(
        "click",
        async () => {

            await saveNewTraining();

        }
    );


    // =====================================================
    // BACK TO TRAINING LIST
    // =====================================================

    backToTrainingList.addEventListener(
        "click",
        () => {

            trainingDetails.style.display =
                "none";

            trainingList.style.display =
                "block";

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    // =====================================================
    // LOAD ALL TRAININGS
    // =====================================================

    async function loadTrainings() {

        trainingLoading.style.display =
            "block";

        noTraining.style.display =
            "none";

        trainingList.innerHTML =
            "";

        trainingDetails.style.display =
            "none";


        const {
            data: trainings,
            error
        } = await supabaseClient
            .from("training_records")
            .select("*")
            .eq(
                "trainee_id",
                user.id
            )
            .order(
                "start_date",
                {
                    ascending: false
                }
            );


        trainingLoading.style.display =
            "none";


        if (error) {

            console.error(
                "Training fetch error:",
                error
            );

            showMessage(
                "Unable to load training records: " +
                error.message,
                "error"
            );

            return;
        }


        console.log(
            "All training records:",
            trainings
        );


        // =================================================
        // NO TRAINING
        // =================================================

        if (!trainings || trainings.length === 0) {

            noTraining.style.display =
                "block";

            return;
        }


        // =================================================
        // CREATE TRAINING CARDS
        // =================================================

        trainings.forEach(
            training => {

                createTrainingCard(
                    training
                );

            }
        );

    }


    // =====================================================
    // CREATE TRAINING CARD
    // =====================================================

    function createTrainingCard(
        training
    ) {

        const card =
            document.createElement("article");


        card.className =
            "inner-card training-card";


        const icon =
            getCourseIcon(
                training.course_name
            );


        const verification =
            training.verification_status ||
            "Pending";


        const verificationClass =
            verification
                .toLowerCase()
                .replace(
                    " ",
                    "-"
                );


        card.innerHTML = `

            <div class="training-card-top">

                <div class="big-course-icon">
                    ${icon}
                </div>


                <div class="training-card-main">

                    <span class="training-verification ${verificationClass}">
                        ${getVerificationSymbol(verification)}
                        ${verification}
                    </span>


                    <h2>
                        ${escapeHTML(
                            training.course_name ||
                            "Training Programme"
                        )}
                    </h2>


                    <p>
                        ${escapeHTML(
                            training.provider_name ||
                            "Training Provider"
                        )}
                    </p>

                </div>

            </div>


            <div class="training-card-info">

                <div>

                    <span>
                        Start Date
                    </span>

                    <strong>
                        ${formatDate(
                            training.start_date
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Completion
                    </span>

                    <strong>
                        ${formatDate(
                            training.completion_date
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Attendance
                    </span>

                    <strong>
                        ${
                            training.attendance_percentage !== null
                                ? training.attendance_percentage + "%"
                                : "-"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Assessment
                    </span>

                    <strong>
                        ${
                            training.assessment_score !== null
                                ? training.assessment_score + "%"
                                : "-"
                        }
                    </strong>

                </div>

            </div>


            <div class="training-card-bottom">

                <span>
                    Training ID: ST-TRN-${training.id}
                </span>


                <button
                    class="outline-btn view-training-btn"
                    type="button"
                >
                    View Details →
                </button>

            </div>

        `;


        // =================================================
        // VIEW DETAILS
        // =================================================

        const viewButton =
            card.querySelector(
                ".view-training-btn"
            );


        viewButton.addEventListener(
            "click",
            () => {

                showTrainingDetails(
                    training
                );

            }
        );


        trainingList.appendChild(
            card
        );

    }


    // =====================================================
    // SHOW TRAINING DETAILS
    // =====================================================

    function showTrainingDetails(
        training
    ) {

        trainingList.style.display =
            "none";

        noTraining.style.display =
            "none";

        trainingDetails.style.display =
            "block";


        // =================================================
        // ELEMENTS
        // =================================================

        const courseIcon =
            document.getElementById(
                "courseIcon"
            );

        const courseName =
            document.getElementById(
                "courseName"
            );

        const providerName =
            document.getElementById(
                "providerName"
            );

        const completionPercentage =
            document.getElementById(
                "completionPercentage"
            );

        const completionBadge =
            document.getElementById(
                "completionBadge"
            );

        const trainingCentre =
            document.getElementById(
                "trainingCentre"
            );

        const courseDuration =
            document.getElementById(
                "courseDuration"
            );

        const startDate =
            document.getElementById(
                "startDate"
            );

        const completionDate =
            document.getElementById(
                "completionDate"
            );

        const trainingId =
            document.getElementById(
                "trainingId"
            );

        const verificationStatus =
            document.getElementById(
                "verificationStatus"
            );

        const attendance =
            document.getElementById(
                "attendance"
            );

        const assessmentScore =
            document.getElementById(
                "assessmentScore"
            );

        const certificationStatus =
            document.getElementById(
                "certificationStatus"
            );

        const enrolledDate =
            document.getElementById(
                "enrolledDate"
            );

        const startedDate =
            document.getElementById(
                "startedDate"
            );

        const completedTimelineDate =
            document.getElementById(
                "completedTimelineDate"
            );

        const certificateDate =
            document.getElementById(
                "certificateDate"
            );


        // =================================================
        // BASIC DETAILS
        // =================================================

        courseName.textContent =
            training.course_name ||
            "Training Programme";


        providerName.textContent =
            training.provider_name ||
            "Training Provider";


        courseIcon.textContent =
            getCourseIcon(
                training.course_name
            );


        trainingCentre.textContent =
            training.provider_name ||
            "Not provided";


        trainingId.textContent =
            "ST-TRN-" +
            training.id;


        // =================================================
        // DATES
        // =================================================

        const start =
            formatDate(
                training.start_date
            );


        const completion =
            formatDate(
                training.completion_date
            );


        startDate.textContent =
            start;


        completionDate.textContent =
            completion;


        enrolledDate.textContent =
            start;


        startedDate.textContent =
            start;


        completedTimelineDate.textContent =
            completion;


        // =================================================
        // DURATION
        // =================================================

        courseDuration.textContent =
            calculateDuration(
                training.start_date,
                training.completion_date
            );


        // =================================================
        // PERFORMANCE
        // =================================================

        attendance.textContent =
            training.attendance_percentage !== null
                ? training.attendance_percentage + "%"
                : "Not available";


        assessmentScore.textContent =
            training.assessment_score !== null
                ? training.assessment_score + "%"
                : "Not available";


        certificationStatus.textContent =
            training.certification_status ||
            "Not available";


        // =================================================
        // VERIFICATION
        // =================================================

        const verification =
            training.verification_status ||
            "Pending";


        verificationStatus.textContent =
            getVerificationSymbol(
                verification
            ) +
            " " +
            verification;


        // =================================================
        // COMPLETION
        // =================================================

        if (training.completion_date) {

            completionBadge.textContent =
                "✓ Training Completed";

            completionPercentage.textContent =
                "100%";


            document
                .getElementById(
                    "completedStep"
                )
                .classList.add(
                    "done"
                );

        }

        else {

            completionBadge.textContent =
                "Training In Progress";

            completionPercentage.textContent =
                "In Progress";


            document
                .getElementById(
                    "completedStep"
                )
                .classList.remove(
                    "done"
                );

        }


        // =================================================
        // CERTIFICATE
        // =================================================

        if (
            training.certification_status &&
            training.certification_status
                .toLowerCase()
                .includes("issued")
        ) {

            certificateDate.textContent =
                completion;


            document
                .getElementById(
                    "certificateStep"
                )
                .classList.add(
                    "done"
                );

        }

        else {

            certificateDate.textContent =
                "Not issued";


            document
                .getElementById(
                    "certificateStep"
                )
                .classList.remove(
                    "done"
                );

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    // =====================================================
    // SAVE NEW TRAINING
    // =====================================================

    async function saveNewTraining() {

        trainingFormMessage.textContent =
            "";


        // =================================================
        // GET VALUES
        // =================================================

        const course =
            newCourseName.value.trim();

        const provider =
            newProviderName.value.trim();

        const start =
            newStartDate.value;

        const completion =
            newCompletionDate.value;

        const attendanceValue =
            newAttendance.value;

        const assessmentValue =
            newAssessment.value;

        const certification =
            newCertification.value;


        // =================================================
        // VALIDATION
        // =================================================

        if (!course) {

            showFormMessage(
                "Please enter the course name.",
                "error"
            );

            return;
        }


        if (!provider) {

            showFormMessage(
                "Please enter the training provider.",
                "error"
            );

            return;
        }


        if (!start) {

            showFormMessage(
                "Please select the start date.",
                "error"
            );

            return;
        }


        if (
            completion &&
            completion < start
        ) {

            showFormMessage(
                "Completion date cannot be before the start date.",
                "error"
            );

            return;
        }


        if (
            attendanceValue !== "" &&
            (
                Number(attendanceValue) < 0 ||
                Number(attendanceValue) > 100
            )
        ) {

            showFormMessage(
                "Attendance must be between 0 and 100.",
                "error"
            );

            return;
        }


        if (
            assessmentValue !== "" &&
            (
                Number(assessmentValue) < 0 ||
                Number(assessmentValue) > 100
            )
        ) {

            showFormMessage(
                "Assessment score must be between 0 and 100.",
                "error"
            );

            return;
        }


        // =================================================
        // DISABLE BUTTON
        // =================================================

        saveTraining.disabled =
            true;

        saveTraining.textContent =
            "Saving...";


        // =================================================
        // INSERT INTO SUPABASE
        // =================================================

        const {
            data,
            error
        } = await supabaseClient
            .from("training_records")
            .insert([

                {
                    trainee_id:
                        user.id,

                    course_name:
                        course,

                    provider_name:
                        provider,

                    start_date:
                        start,

                    completion_date:
                        completion ||
                        null,

                    attendance_percentage:
                        attendanceValue === ""
                            ? null
                            : Number(
                                attendanceValue
                            ),

                    assessment_score:
                        assessmentValue === ""
                            ? null
                            : Number(
                                assessmentValue
                            ),

                    certification_status:
                        certification ||
                        null,

                    verification_status:
                        "Pending"

                }

            ])
            .select()
            .single();


        // =================================================
        // RE-ENABLE BUTTON
        // =================================================

        saveTraining.disabled =
            false;

        saveTraining.textContent =
            "Submit for Verification →";


        // =================================================
        // ERROR
        // =================================================

        if (error) {

            console.error(
                "Insert error:",
                error
            );


            showFormMessage(
                "Could not save training: " +
                error.message,
                "error"
            );

            return;
        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "Training added:",
            data
        );


        showFormMessage(
            "Training added successfully and submitted for verification.",
            "success"
        );


        // =================================================
        // CLEAR FORM
        // =================================================

        clearForm();


        // =================================================
        // WAIT A LITTLE THEN CLOSE
        // =================================================

        setTimeout(
            async () => {

                trainingForm.style.display =
                    "none";

                await loadTrainings();

                showMessage(
                    "Training submitted successfully. Verification status: Pending.",
                    "success"
                );

            },
            1000
        );

    }


    // =====================================================
    // CLEAR FORM
    // =====================================================

    function clearForm() {

        newCourseName.value =
            "";

        newProviderName.value =
            "";

        newStartDate.value =
            "";

        newCompletionDate.value =
            "";

        newAttendance.value =
            "";

        newAssessment.value =
            "";

        newCertification.value =
            "";

        trainingFormMessage.textContent =
            "";

    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(
        dateString
    ) {

        if (!dateString) {

            return "Not available";

        }


        const date =
            new Date(
                dateString +
                "T00:00:00"
            );


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    // =====================================================
    // DURATION
    // =====================================================

    function calculateDuration(
        start,
        end
    ) {

        if (!start || !end) {

            return "In progress";

        }


        const startDate =
            new Date(
                start +
                "T00:00:00"
            );


        const endDate =
            new Date(
                end +
                "T00:00:00"
            );


        const difference =
            endDate -
            startDate;


        const days =
            Math.ceil(
                difference /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        if (days < 30) {

            return days +
                " Days";

        }


        const months =
            Math.round(
                days /
                30.44
            );


        return months +
            " Months";

    }


    // =====================================================
    // COURSE ICON
    // =====================================================

    function getCourseIcon(
        course
    ) {

        if (!course) {

            return "TR";

        }


        const words =
            course
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (words.length >= 2) {

            return (
                words[0].charAt(0) +
                words[1].charAt(0)
            ).toUpperCase();

        }


        return course
            .substring(0, 2)
            .toUpperCase();

    }


    // =====================================================
    // VERIFICATION SYMBOL
    // =====================================================

    function getVerificationSymbol(
        status
    ) {

        if (!status) {

            return "◷";

        }


        const value =
            status.toLowerCase();


        if (
            value === "verified"
        ) {

            return "✓";

        }


        if (
            value === "rejected"
        ) {

            return "✕";

        }


        return "◷";

    }


    // =====================================================
    // FORM MESSAGE
    // =====================================================

    function showFormMessage(
        text,
        type
    ) {

        trainingFormMessage.textContent =
            text;


        trainingFormMessage.style.color =
            type === "error"
                ? "#dc2626"
                : "#15803d";

    }


    // =====================================================
    // GLOBAL MESSAGE
    // =====================================================

    function showMessage(
        text,
        type
    ) {

        trainingMessage.textContent =
            text;


        trainingMessage.style.color =
            type === "error"
                ? "#dc2626"
                : "#15803d";


        setTimeout(
            () => {

                trainingMessage.textContent =
                    "";

            },
            5000
        );

    }


    // =====================================================
    // HTML ESCAPE
    // =====================================================

    function escapeHTML(
        text
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            text;

        return div.innerHTML;

    }

});