/* =========================================================
   SKILLTRACK - TRAINEE PROFILE
   ========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    console.log("====================================");
    console.log("SKILLTRACK PROFILE JS STARTED");
    console.log("====================================");


    /* =====================================================
       CHECK SUPABASE
       ===================================================== */

    if (typeof supabaseClient === "undefined") {

        console.error(
            "ERROR: supabaseClient is undefined."
        );

        alert(
            "Supabase client is not loaded. Check supabase.js."
        );

        return;
    }


    console.log(
        "Supabase client detected."
    );


    /* =====================================================
       GET LOGGED-IN USER
       ===================================================== */

    const {
        data: authData,
        error: authError
    } = await supabaseClient.auth.getUser();


    console.log(
        "Auth response:",
        authData
    );


    if (authError) {

        console.error(
            "AUTH ERROR:",
            authError
        );

        return;
    }


    const user =
        authData.user;


    if (!user) {

        console.error(
            "NO LOGGED-IN USER."
        );

        window.location.href =
            "trainee-login.html";

        return;
    }


    console.log(
        "USER ID:",
        user.id
    );

    console.log(
        "USER EMAIL:",
        user.email
    );


    /* =====================================================
       FETCH PROFILE
       ===================================================== */

    console.log(
        "Fetching from public.profile..."
    );


    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profile")
        .select("*")
        .eq(
            "user_id",
            user.id
        )
        .single();


    /* =====================================================
       CHECK DATABASE ERROR
       ===================================================== */

    if (profileError) {

        console.error(
            "PROFILE DATABASE ERROR:",
            profileError
        );

        console.error(
            "Error message:",
            profileError.message
        );

        console.error(
            "Error code:",
            profileError.code
        );

        console.error(
            "Error details:",
            profileError.details
        );

        return;
    }


    /* =====================================================
       CHECK PROFILE
       ===================================================== */

    if (!profile) {

        console.error(
            "PROFILE ROW NOT FOUND."
        );

        return;
    }


    console.log(
        "===================================="
    );

    console.log(
        "PROFILE FETCHED:"
    );

    console.log(
        profile
    );

    console.log(
        "===================================="
    );


    /* =====================================================
       FILL FULL NAME
       ===================================================== */

    const name =
        document.getElementById(
            "profileName"
        );


    if (name) {

        name.value =
            profile.full_name || "";

    }


    /* =====================================================
       FILL AGE
       ===================================================== */

    const age =
        document.getElementById(
            "age"
        );


    if (age) {

        age.value =
            profile.age ?? "";

    }


    /* =====================================================
       FILL GENDER
       ===================================================== */

    const gender =
        document.getElementById(
            "gender"
        );


    if (gender) {

        let genderValue =
            profile.gender || "";


        genderValue =
            genderValue.toLowerCase();


        gender.value =
            genderValue;

    }


    /* =====================================================
       FILL PHONE
       ===================================================== */

    const phone =
        document.getElementById(
            "phone"
        );


    if (phone) {

        phone.value =
            profile.mobile_number || "";

    }


    /* =====================================================
       FILL EMAIL
       ===================================================== */

    const email =
        document.getElementById(
            "email"
        );


    if (email) {

        email.value =
            profile.email ||
            user.email ||
            "";

    }


    /* =====================================================
       FILL STATE
       ===================================================== */

    const state =
        document.getElementById(
            "state"
        );


    if (state) {

        state.value =
            profile.state || "";

    }


    /* =====================================================
       FILL DISTRICT
       ===================================================== */

    const district =
        document.getElementById(
            "district"
        );


    if (district) {

        district.value =
            profile.district || "";

    }


    /* =====================================================
       FILL CITY
       ===================================================== */

    const city =
        document.getElementById(
            "city"
        );


    if (city) {

        city.value =
            profile.city_block_town || "";

    }


    /* =====================================================
       UPDATE PROFILE HEADER
       ===================================================== */

    const displayName =
        document.getElementById(
            "displayName"
        );


    if (displayName) {

        displayName.textContent =
            profile.full_name ||
            "Trainee";

    }


    /* =====================================================
       TRAINEE ID
       ===================================================== */

    const displayTraineeId =
        document.getElementById(
            "displayTraineeId"
        );


    if (displayTraineeId) {

        const cleanId =
            user.id
                .replace(/-/g, "")
                .substring(0, 6)
                .toUpperCase();


        displayTraineeId.textContent =
            "Trainee ID: ST-" +
            cleanId;

    }


    /* =====================================================
       AVATAR
       ===================================================== */

    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (avatar) {

        avatar.textContent =
            getInitials(
                profile.full_name
            );

    }


    /* =====================================================
       PROFILE COMPLETION
       ===================================================== */

    const completion =
        calculateCompletion(
            profile
        );


    const completionElement =
        document.getElementById(
            "profileCompletion"
        );


    if (completionElement) {

        completionElement.textContent =
            completion + "%";

    }


    console.log(
        "Profile displayed successfully."
    );


    /* =====================================================
       SAVE BUTTON
       ===================================================== */

    const saveButton =
        document.getElementById(
            "saveProfile"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async function () {

                await saveProfile(
                    user.id
                );

            }
        );

    }

});



/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile(userId) {

    const saveButton =
        document.getElementById(
            "saveProfile"
        );


    /* =====================================================
       GET VALUES
       ===================================================== */

    const fullName =
        document.getElementById(
            "profileName"
        ).value.trim();


    const ageValue =
        document.getElementById(
            "age"
        ).value;


    const gender =
        document.getElementById(
            "gender"
        ).value;


    const mobileNumber =
        document.getElementById(
            "phone"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const state =
        document.getElementById(
            "state"
        ).value;


    const district =
        document.getElementById(
            "district"
        ).value.trim();


    const cityBlockTown =
        document.getElementById(
            "city"
        ).value.trim();


    /* =====================================================
       VALIDATION
       ===================================================== */

    if (!fullName) {

        showMessage(
            "Please enter your full name.",
            "error"
        );

        return;
    }


    if (
        ageValue &&
        (
            Number(ageValue) < 15 ||
            Number(ageValue) > 100
        )
    ) {

        showMessage(
            "Age must be between 15 and 100.",
            "error"
        );

        return;
    }


    if (!email) {

        showMessage(
            "Please enter your email.",
            "error"
        );

        return;
    }


    if (!state) {

        showMessage(
            "Please select your state.",
            "error"
        );

        return;
    }


    if (!district) {

        showMessage(
            "Please enter your district.",
            "error"
        );

        return;
    }


    if (!cityBlockTown) {

        showMessage(
            "Please enter your city or town.",
            "error"
        );

        return;
    }


    /* =====================================================
       LOADING
       ===================================================== */

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";

    }


    /* =====================================================
       UPDATE PROFILE
       ===================================================== */

    const updates = {

        full_name:
            fullName,

        age:
            ageValue
                ? Number(ageValue)
                : null,

        gender:
            gender
                ? gender.toLowerCase()
                : null,

        mobile_number:
            mobileNumber || null,

        email:
            email,

        state:
            state,

        district:
            district,

        city_block_town:
            cityBlockTown

    };


    console.log(
        "Updating profile:",
        updates
    );


    const {
        data,
        error
    } = await supabaseClient
        .from("profile")
        .update(updates)
        .eq(
            "user_id",
            userId
        )
        .select()
        .single();


    /* =====================================================
       ERROR
       ===================================================== */

    if (error) {

        console.error(
            "SAVE ERROR:",
            error
        );


        showMessage(
            "Unable to save: " +
            error.message,
            "error"
        );


        resetSaveButton();

        return;
    }


    /* =====================================================
       SUCCESS
       ===================================================== */

    console.log(
        "Profile updated:",
        data
    );


    showMessage(
        "Profile changes saved successfully.",
        "success"
    );


    /* =====================================================
       REFRESH HEADER
       ===================================================== */

    const displayName =
        document.getElementById(
            "displayName"
        );


    if (displayName) {

        displayName.textContent =
            data.full_name;

    }


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (avatar) {

        avatar.textContent =
            getInitials(
                data.full_name
            );

    }


    const completion =
        calculateCompletion(
            data
        );


    const completionElement =
        document.getElementById(
            "profileCompletion"
        );


    if (completionElement) {

        completionElement.textContent =
            completion + "%";

    }


    resetSaveButton();

}



/* =========================================================
   PROFILE COMPLETION
   ========================================================= */

function calculateCompletion(profile) {

    const fields = [

        profile.full_name,

        profile.age,

        profile.gender,

        profile.mobile_number,

        profile.email,

        profile.state,

        profile.district,

        profile.city_block_town

    ];


    let completed = 0;


    fields.forEach(
        function (field) {

            if (
                field !== null &&
                field !== undefined &&
                String(field).trim() !== ""
            ) {

                completed++;

            }

        }
    );


    return Math.round(
        (
            completed /
            fields.length
        ) * 100
    );

}



/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) {

        return "TR";

    }


    const parts =
        name
            .trim()
            .split(/\s+/);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}



/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "profileMessage"
        );


    if (!message) {

        console.log(
            text
        );

        return;
    }


    message.textContent =
        text;


    message.style.display =
        "block";


    if (type === "success") {

        message.style.color =
            "#15803d";

    } else {

        message.style.color =
            "#dc2626";

    }

}



/* =========================================================
   RESET SAVE BUTTON
   ========================================================= */

function resetSaveButton() {

    const saveButton =
        document.getElementById(
            "saveProfile"
        );


    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        false;


    saveButton.textContent =
        "Save Changes";

}