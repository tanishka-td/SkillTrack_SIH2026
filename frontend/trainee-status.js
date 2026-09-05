// =====================================================
// SKILLTRACK - CURRENT STATUS
// =====================================================

// Supabase client is already created in supabase.js
// Do NOT create another client here.


document.addEventListener("DOMContentLoaded", async function () {

    console.log("Trainee status page loaded.");

    // =================================================
    // ELEMENTS
    // =================================================

    const statusButtons =
        document.querySelectorAll(".status-select");

    const dynamicFields =
        document.getElementById("dynamicFields");

    const message =
        document.getElementById("statusMessage");

    const saveButton =
        document.getElementById("saveStatus");


    // Currently selected status
    let selectedStatus = "Employed";


    // =================================================
    // STATUS BUTTONS
    // =================================================

    statusButtons.forEach(button => {

        button.addEventListener("click", function () {

            // Remove selected from all buttons
            statusButtons.forEach(item => {
                item.classList.remove("selected");
            });

            // Select clicked button
            button.classList.add("selected");

            // Get status
            selectedStatus =
                button.dataset.status;

            console.log(
                "Selected status:",
                selectedStatus
            );

            updateFields();

        });

    });


    // =================================================
    // SHOW / HIDE EMPLOYMENT FIELDS
    // =================================================

    const unemployedFields =
        document.getElementById("unemployedFields");


    function updateFields() {

        if (selectedStatus === "Unemployed") {

            dynamicFields.style.display = "none";
            unemployedFields.style.display = "block";

        } else {

            dynamicFields.style.display = "block";
            unemployedFields.style.display = "none";

        }

    }


    // =================================================
    // SAVE CURRENT STATUS
    // =================================================

    saveButton.addEventListener("click", async function () {

        console.log("Save Current Status clicked.");

        // Clear previous message
        message.textContent = "";

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";


        try {

            // =============================================
            // 1. GET LOGGED-IN USER
            // =============================================

            const {
                data: userData,
                error: userError
            } = await supabaseClient.auth.getUser();


            if (userError) {
                throw userError;
            }


            const user = userData.user;


            if (!user) {

                throw new Error(
                    "You are not logged in. Please log in again."
                );

            }


            console.log(
                "Logged-in user:",
                user.id
            );


            // =============================================
            // 2. GET FORM VALUES
            // =============================================

            let companyName = null;
            let jobRole = null;
            let salary = null;
            let joiningDate = null;
            let employmentType = null;
            let reasonText = null;

            if (selectedStatus === "Unemployed") {

                reasonText =
                    document.getElementById("unemployedReason")
                        .value.trim() || null;

            }


            // Only collect employment information
            // if the trainee is not unemployed

            if (selectedStatus !== "Unemployed") {

                const companyInput =
                    document.getElementById("company");

                const roleInput =
                    document.getElementById("role");

                const salaryInput =
                    document.getElementById("salary");

                const joiningDateInput =
                    document.getElementById("joiningDate");

                const employmentTypeInput =
                    document.getElementById("employmentType");


                companyName =
                    companyInput.value.trim() || null;


                jobRole =
                    roleInput.value.trim() || null;


                salary =
                    salaryInput.value
                        ? Number(salaryInput.value)
                        : null;


                joiningDate =
                    joiningDateInput.value || null;


                employmentType =
                    employmentTypeInput.value || null;

            }


            // =============================================
            // 3. PREPARE RECORD
            // =============================================

            const record = {

                trainee_id: user.id,

                employment_status:
                    selectedStatus,

                company_name:
                    companyName,

                job_role:
                    jobRole,

                salary:
                    salary,

                joining_date:
                    joiningDate,

                leaving_date:
                    null,

                employment_type:
                    employmentType,

                reason_text:
                    reasonText

            };


            console.log(
                "Record to insert:",
                record
            );


            // =============================================
            // 4. INSERT NEW RECORD
            // =============================================
            //
            // IMPORTANT:
            // We use INSERT.
            //
            // We NEVER update an old employment record.
            //
            // Every status submission creates a new row.
            // =============================================

            const {
                data: insertedRecord,
                error: insertError
            } = await supabaseClient
                .from("employment_records")
                .insert(record)
                .select()
                .single();


            if (insertError) {

                console.error(
                    "Supabase insert error:",
                    insertError
                );

                throw insertError;

            }


            // =============================================
            // 5. SUCCESS
            // =============================================

            console.log(
                "Successfully saved:",
                insertedRecord
            );


            message.style.color = "#15803d";

            message.textContent =
                "Current status saved successfully.";


            // =============================================
            // 6. CLEAR FORM
            // =============================================

            const companyInput =
                document.getElementById("company");

            const roleInput =
                document.getElementById("role");

            const salaryInput =
                document.getElementById("salary");

            const joiningDateInput =
                document.getElementById("joiningDate");

            const employmentTypeInput =
                document.getElementById("employmentType");


            if (companyInput) {
                companyInput.value = "";
            }


            if (roleInput) {
                roleInput.value = "";
            }


            if (salaryInput) {
                salaryInput.value = "";
            }


            if (joiningDateInput) {
                joiningDateInput.value = "";
            }


            if (employmentTypeInput) {
                employmentTypeInput.value = "";
            }

            const unemployedReasonInput =
                document.getElementById("unemployedReason");

            if (unemployedReasonInput) {
                unemployedReasonInput.value = "";
            }


        }

        catch (error) {

            console.error(
                "Unable to save status:",
                error
            );


            message.style.color = "#dc2626";


            message.textContent =
                error.message ||
                "Unable to save your status.";

        }

        finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Current Status →";

        }

    });


    // =================================================
    // INITIAL STATE
    // =================================================

    updateFields();

});