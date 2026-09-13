/* ============================================================
   SKILLTRACK - TRAINEE PROFILE PREVIEW
   Backend + Supabase Storage Connected
   ============================================================ */

let currentUser = null;
let currentProfile = null;

/* ============================================================
   CONFIGURATION
   ============================================================ */

const STORAGE_BUCKET = "profile-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
    await loadProfilePreview();
    setupPhotoUpload();
});


/* ============================================================
   MAIN PROFILE LOADER
   ============================================================ */

async function loadProfilePreview() {

    try {

        if (typeof supabaseClient === "undefined") {
            showMessage("Supabase client is not available.", true);
            console.error("supabaseClient is undefined.");
            return;
        }

        /* ----------------------------------------------------
           GET LOGGED-IN USER
        ---------------------------------------------------- */

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError) {
            console.error("User error:", userError);
            showMessage("Unable to verify your login.", true);
            return;
        }

        if (!user) {
            window.location.href = "trainee_login.html";
            return;
        }

        currentUser = user;


        /* ----------------------------------------------------
           FETCH PROFILE
        ---------------------------------------------------- */

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profile")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();


        if (profileError) {

            console.error("Profile fetch error:", profileError);

            showMessage(
                "Unable to load your profile information.",
                true
            );

            return;
        }


        if (!profile) {

            console.warn("No profile found for user:", user.id);

            showMessage(
                "Profile information has not been created yet.",
                true
            );

            setLoadingDefaults();

            return;
        }


        currentProfile = profile;


        /* ----------------------------------------------------
           UPDATE PAGE
        ---------------------------------------------------- */

        updateIdentity(profile);
        updatePersonalDetails(profile);
        updateContactDetails(profile);
        updateLocation(profile);
        updateProfileCompletion(profile);
        await updateProfilePhoto(profile);
        updateProfileStatus(profile);


    } catch (error) {

        console.error("Dashboard error:", error);

        showMessage(
            "Something went wrong while loading your profile.",
            true
        );
    }
}


/* ============================================================
   IDENTITY
   ============================================================ */

function updateIdentity(profile) {

    const name =
        profile.full_name ||
        profile.name ||
        "Trainee";


    /* Main name */

    setText("previewName", name);


    /* Trainee ID */

    const traineeId =
        profile.trainee_id ||
        generateTraineeId(currentUser.id);

    setText(
        "previewTraineeId",
        traineeId
    );


    /* Initials */

    const initials = getInitials(name);

    setText(
        "photoInitials",
        initials
    );
}


/* ============================================================
   PERSONAL DETAILS
   ============================================================ */

function updatePersonalDetails(profile) {

    setText(
        "detailName",
        profile.full_name ||
        profile.name ||
        "—"
    );


    setText(
        "detailAge",
        profile.age !== null &&
        profile.age !== undefined &&
        profile.age !== ""
            ? profile.age
            : "—"
    );


    setText(
        "detailGender",
        profile.gender ||
        "—"
    );
}


/* ============================================================
   CONTACT DETAILS
   ============================================================ */

function updateContactDetails(profile) {

    setText(
        "detailPhone",
        profile.mobile_number ||
        profile.phone ||
        profile.phone_number ||
        "—"
    );


    setText(
        "detailEmail",
        profile.email ||
        currentUser?.email ||
        "—"
    );
}


/* ============================================================
   LOCATION
   ============================================================ */

function updateLocation(profile) {

    setText(
        "detailState",
        profile.state ||
        profile.state_ut ||
        "—"
    );


    setText(
        "detailDistrict",
        profile.district ||
        "—"
    );


    setText(
        "detailCity",
        profile.city_block_town ||
        profile.city ||
        profile.town ||
        profile.block ||
        "—"
    );
}


/* ============================================================
   PROFILE COMPLETION
   ============================================================ */

function updateProfileCompletion(profile) {

    const fields = [

        profile.full_name,

        profile.age,

        profile.gender,

        profile.mobile_number ||
        profile.phone ||
        profile.phone_number,

        profile.email ||
        currentUser?.email,

        profile.state,

        profile.district,

        profile.city_block_town ||
        profile.city ||
        profile.town ||
        profile.block
    ];


    const completedFields =
        fields.filter(
            value =>
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
        ).length;


    const totalFields = fields.length;


    let percentage = Math.round(
        (completedFields / totalFields) * 100
    );


    percentage = Math.max(
        0,
        Math.min(100, percentage)
    );


    /* Percentage text */

    setText(
        "previewCompletion",
        `${percentage}%`
    );


    /* Progress bar */

    const progressBar =
        document.getElementById("completionBar");

    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

        progressBar.setAttribute(
            "aria-valuenow",
            percentage
        );
    }
}


/* ============================================================
   PROFILE STATUS
   ============================================================ */

function updateProfileStatus(profile) {

    const status =
        profile.profile_status ||
        profile.status ||
        "Active";


    const statusElements =
        document.querySelectorAll(
            ".report-footer .generated strong"
        );


    statusElements.forEach(element => {

        element.textContent =
            String(status).toUpperCase();

    });
}


/* ============================================================
   PROFILE PHOTO
   ============================================================ */

async function updateProfilePhoto(profile) {

    const photoContainer =
        document.getElementById("profilePhoto");

    const initialsElement =
        document.getElementById("photoInitials");


    if (!photoContainer) {
        return;
    }


    /* --------------------------------------------------------
       Find image path from profile
       -------------------------------------------------------- */

    const imagePath =
        profile.profile_image_path ||
        profile.profile_photo_path ||
        profile.profile_photo ||
        profile.photo_path ||
        profile.avatar_path ||
        null;


    if (!imagePath) {

        showInitials();

        return;
    }


    try {

        let imageUrl = null;


        /* ----------------------------------------------------
           If database contains complete public URL
        ---------------------------------------------------- */

        if (
            typeof imagePath === "string" &&
            (
                imagePath.startsWith("http://") ||
                imagePath.startsWith("https://")
            )
        ) {

            imageUrl = imagePath;

        } else {

            /* ------------------------------------------------
               Create signed URL for private bucket
            ------------------------------------------------ */

            const {
                data,
                error
            } = await supabaseClient.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(
                    imagePath,
                    60 * 60
                );


            if (error) {

                console.error(
                    "Image URL error:",
                    error
                );

                showInitials();

                return;
            }


            imageUrl = data?.signedUrl;
        }


        if (!imageUrl) {

            showInitials();

            return;
        }


        /* ----------------------------------------------------
           Display image
        ---------------------------------------------------- */

        photoContainer.style.backgroundImage =
            `url("${imageUrl}")`;

        photoContainer.style.backgroundSize =
            "cover";

        photoContainer.style.backgroundPosition =
            "center";

        photoContainer.style.backgroundRepeat =
            "no-repeat";


        if (initialsElement) {

            initialsElement.style.display =
                "none";
        }


    } catch (error) {

        console.error(
            "Profile photo error:",
            error
        );

        showInitials();
    }
}


/* ============================================================
   SHOW INITIALS
   ============================================================ */

function showInitials() {

    const photoContainer =
        document.getElementById("profilePhoto");

    const initialsElement =
        document.getElementById("photoInitials");


    if (photoContainer) {

        photoContainer.style.backgroundImage =
            "none";
    }


    if (initialsElement) {

        initialsElement.style.display =
            "flex";
    }
}


/* ============================================================
   PHOTO UPLOAD SETUP
   ============================================================ */

function setupPhotoUpload() {

    const uploadButton =
        document.getElementById("uploadPhotoBtn");

    const photoInput =
        document.getElementById("photoInput");


    if (!uploadButton || !photoInput) {

        console.warn(
            "Photo upload elements not found."
        );

        return;
    }


    /* Button opens file selector */

    uploadButton.addEventListener(
        "click",
        () => {

            photoInput.click();

        }
    );


    /* File selected */

    photoInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];


            if (!file) {
                return;
            }


            await uploadProfilePhoto(file);

            /* Allow same file to be selected again */

            photoInput.value = "";

        }
    );
}


/* ============================================================
   UPLOAD PROFILE PHOTO
   ============================================================ */

async function uploadProfilePhoto(file) {

    try {

        if (!currentUser) {

            showMessage(
                "Please log in again.",
                true
            );

            return;
        }


        /* ----------------------------------------------------
           VALIDATE TYPE
        ---------------------------------------------------- */

        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp"

        ];


        if (!allowedTypes.includes(file.type)) {

            showMessage(
                "Please upload a JPG, PNG or WEBP image.",
                true
            );

            return;
        }


        /* ----------------------------------------------------
           VALIDATE SIZE
        ---------------------------------------------------- */

        if (file.size > MAX_IMAGE_SIZE) {

            showMessage(
                "Image must be smaller than 5 MB.",
                true
            );

            return;
        }


        showMessage(
            "Uploading profile photo..."
        );


        /* ----------------------------------------------------
           CREATE UNIQUE FILE PATH
        ---------------------------------------------------- */

        const extension =
            getFileExtension(file);


        const filePath =
            `${currentUser.id}/profile.${extension}`;


        /* ----------------------------------------------------
           UPLOAD TO SUPABASE STORAGE
        ---------------------------------------------------- */

        const {
            error: uploadError
        } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: true,
                    contentType: file.type
                }
            );


        if (uploadError) {

            console.error(
                "Photo upload error:",
                uploadError
            );

            showMessage(
                "Photo upload failed: " +
                uploadError.message,
                true
            );

            return;
        }


        /* ----------------------------------------------------
           SAVE STORAGE PATH IN PROFILE
        ---------------------------------------------------- */

        const {
            error: updateError
        } = await supabaseClient
            .from("profile")
            .update({

                profile_image_path:
                    filePath

            })
            .eq(
                "user_id",
                currentUser.id
            );


        if (updateError) {

            console.error(
                "Profile update error:",
                updateError
            );

            showMessage(
                "Photo uploaded, but profile could not be updated.",
                true
            );

            return;
        }


        /* Update local state */

        currentProfile.profile_image_path =
            filePath;


        /* Refresh image */

        await updateProfilePhoto(
            currentProfile
        );


        showMessage(
            "Profile photo updated successfully."
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        showMessage(
            "Something went wrong while uploading the photo.",
            true
        );
    }
}


/* ============================================================
   FILE EXTENSION
   ============================================================ */

function getFileExtension(file) {

    const mimeMap = {

        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"

    };


    return (
        mimeMap[file.type] ||
        "jpg"
    );
}


/* ============================================================
   TRAINEE ID
   ============================================================ */

function generateTraineeId(userId) {

    if (!userId) {
        return "TR-UNKNOWN";
    }


    /*
       Uses the Supabase UUID to generate
       a stable trainee ID.

       Example:
       TR-7A29F31C
    */

    const cleanId =
        userId
            .replace(/-/g, "")
            .substring(0, 8)
            .toUpperCase();


    return `TR-${cleanId}`;
}


/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(name) {

    if (!name) {
        return "TR";
    }


    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


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


/* ============================================================
   DEFAULT LOADING STATE
   ============================================================ */

function setLoadingDefaults() {

    setText(
        "previewName",
        "Trainee"
    );

    setText(
        "previewTraineeId",
        generateTraineeId(
            currentUser?.id
        )
    );

    setText(
        "detailName",
        "—"
    );

    setText(
        "detailAge",
        "—"
    );

    setText(
        "detailGender",
        "—"
    );

    setText(
        "detailPhone",
        "—"
    );

    setText(
        "detailEmail",
        currentUser?.email || "—"
    );

    setText(
        "detailState",
        "—"
    );

    setText(
        "detailDistrict",
        "—"
    );

    setText(
        "detailCity",
        "—"
    );

    setText(
        "previewCompletion",
        "0%"
    );

    showInitials();
}


/* ============================================================
   SET TEXT HELPER
   ============================================================ */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "—";
    }
}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(message, isError = false) {

    const element =
        document.getElementById(
            "previewMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.toggle(
        "error",
        isError
    );


    element.classList.add(
        "show"
    );


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        setTimeout(() => {

            element.classList.remove(
                "show"
            );

        }, 4000);
}


/* ============================================================
   OPTIONAL GLOBAL REFRESH
   ============================================================ */

window.refreshProfilePreview =
    async function () {

        await loadProfilePreview();

    };