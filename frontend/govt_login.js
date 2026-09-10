/* =========================================================
   SKILLTRACK
   GOVERNMENT OFFICIAL LOGIN + REGISTRATION
   ========================================================= */


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Government portal loaded");


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const registerTab =
        document.getElementById("registerTab");

    const loginTab =
        document.getElementById("loginTab");

    const registerForm =
        document.getElementById("registerForm");

    const loginForm =
        document.getElementById("loginForm");


    /* =====================================================
       TAB SWITCHING
       ===================================================== */

    if (registerTab && loginTab) {

        registerTab.addEventListener("click", function () {

            registerTab.classList.add("active");
            loginTab.classList.remove("active");

            if (registerForm) {
                registerForm.classList.remove("hidden");
            }

            if (loginForm) {
                loginForm.classList.add("hidden");
            }

        });


        loginTab.addEventListener("click", function () {

            loginTab.classList.add("active");
            registerTab.classList.remove("active");

            if (loginForm) {
                loginForm.classList.remove("hidden");
            }

            if (registerForm) {
                registerForm.classList.add("hidden");
            }

        });

    }


    /* =====================================================
       PASSWORD TOGGLE
       ===================================================== */

    document
        .querySelectorAll(".password-toggle")
        .forEach(function (button) {

            button.addEventListener("click", function () {

                const targetId =
                    button.getAttribute("data-target");

                const input =
                    document.getElementById(targetId);

                if (!input) {
                    return;
                }

                if (input.type === "password") {

                    input.type = "text";
                    button.textContent = "HIDE";

                } else {

                    input.type = "password";
                    button.textContent = "SHOW";

                }

            });

        });


    /* =====================================================
       PASSWORD STRENGTH
       ===================================================== */

    const password =
        document.getElementById("password");

    const strengthBar =
        document.getElementById("strengthBar");

    const strengthText =
        document.getElementById("strengthText");


    if (password) {

        password.addEventListener("input", function () {

            updatePasswordStrength(
                password.value,
                strengthBar,
                strengthText
            );

        });

    }


    /* =====================================================
       STATE / DISTRICT
       ===================================================== */

    setupStateDistrict();


    /* =====================================================
       REGISTER
       ===================================================== */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegistration
        );

    }


    /* =====================================================
       LOGIN
       ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /* =====================================================
       FORGOT PASSWORD
       ===================================================== */

    const forgotPassword =
        document.getElementById("forgotPassword");

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            handleForgotPassword
        );

    }

});


/* =========================================================
   REGISTRATION
   ========================================================= */

async function handleRegistration(event) {

    event.preventDefault();


    const message =
        document.getElementById("registerMessage");

    clearMessage(message);


    /* =====================================================
       GET FORM VALUES
       ===================================================== */

    const fullName =
        getValue("fullName");

    const designation =
        getValue("designation");

    const officialId =
        getValue("officialId");

    const department =
        getValue("department");

    const governmentLevel =
        getValue("governmentLevel");

    const officialRole =
        getValue("officialRole");

    const state =
        getValue("stateSelect");

    const district =
        getValue("districtSelect");

    const office =
        getValue("office");

    const officialEmail =
        getValue("officialEmail").toLowerCase();

    const mobile =
        getValue("mobile");

    const officeAddress =
        getValue("officeAddress");

    const password =
        getValue("password");

    const confirmPassword =
        getValue("confirmPassword");

    const authorization =
        document.getElementById("authorization");


    /* =====================================================
       VALIDATION
       ===================================================== */

    if (
        !fullName ||
        !designation ||
        !officialId ||
        !department ||
        !governmentLevel ||
        !officialRole ||
        !state ||
        !district ||
        !office ||
        !officialEmail ||
        !mobile ||
        !officeAddress ||
        !password ||
        !confirmPassword
    ) {

        showMessage(
            message,
            "Please fill all required fields.",
            "error"
        );

        return;
    }


    /* =====================================================
       EMAIL VALIDATION
       ===================================================== */

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(officialEmail)) {

        showMessage(
            message,
            "Please enter a valid official email address.",
            "error"
        );

        return;
    }


    /* =====================================================
       MOBILE VALIDATION
       ===================================================== */

    if (!/^[0-9]{10}$/.test(mobile)) {

        showMessage(
            message,
            "Please enter a valid 10-digit mobile number.",
            "error"
        );

        return;
    }


    /* =====================================================
       PASSWORD VALIDATION
       ===================================================== */

    if (password.length < 8) {

        showMessage(
            message,
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            message,
            "Passwords do not match.",
            "error"
        );

        return;
    }


    /* =====================================================
       AUTHORIZATION CHECK
       ===================================================== */

    if (
        !authorization ||
        !authorization.checked
    ) {

        showMessage(
            message,
            "Please confirm that you are an authorized government official.",
            "error"
        );

        return;
    }


    /* =====================================================
       SUPABASE CHECK
       ===================================================== */

    if (
        typeof supabaseClient === "undefined"
    ) {

        showMessage(
            message,
            "Supabase connection is not available.",
            "error"
        );

        console.error(
            "supabaseClient is undefined. Check supabase.js and script order."
        );

        return;
    }


    /* =====================================================
       BUTTON
       ===================================================== */

    const submitButton =
        registerForm
            ? registerForm.querySelector(
                'button[type="submit"]'
            )
            : null;


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Submitting...";

    }


    /* =====================================================
       CREATE AUTH ACCOUNT
       ===================================================== */

    try {

        console.log(
            "Creating government account..."
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email:
                    officialEmail,

                password:
                    password,

                options: {

                    data: {

                        /*
                         * These values are stored inside
                         * auth.users.raw_user_meta_data.
                         *
                         * PostgreSQL trigger will read them
                         * and create government_officials row.
                         */

                        full_name:
                            fullName,

                        designation:
                            designation,

                        official_id:
                            officialId,

                        department:
                            department,

                        government_level:
                            governmentLevel,

                        official_role:
                            officialRole,

                        state:
                            state,

                        district:
                            district,

                        office:
                            office,

                        mobile:
                            mobile,

                        office_address:
                            officeAddress,

                        account_type:
                            "government"

                    }

                }

            });


        /* =================================================
           AUTH ERROR
           ================================================= */

        if (error) {

            console.error(
                "Supabase Auth registration error:",
                error
            );

            throw error;
        }


        /* =================================================
           USER CHECK
           ================================================= */

        if (!data || !data.user) {

            throw new Error(
                "Government account could not be created."
            );

        }


        console.log(
            "Government Auth account created:",
            data.user.id
        );


        /* =================================================
           IMPORTANT

           DO NOT INSERT INTO government_officials HERE.

           The PostgreSQL trigger connected to auth.users
           creates the government_officials record.

           verification_status is automatically:
           pending
           ================================================= */


        showMessage(
            message,
            "Registration submitted successfully. Your account is now pending government verification.",
            "success"
        );


        /* =================================================
           RESET FORM
           ================================================= */

        if (registerForm) {
            registerForm.reset();
        }


        /* =================================================
           RESET DISTRICT
           ================================================= */

        const districtSelect =
            document.getElementById("districtSelect");

        if (districtSelect) {

            districtSelect.innerHTML =
                `<option value="">Select District</option>`;

            districtSelect.disabled = true;

        }


        /* =================================================
           RESET PASSWORD STRENGTH
           ================================================= */

        if (strengthBar) {
            strengthBar.style.width = "0%";
        }

        if (strengthText) {
            strengthText.textContent =
                "Password strength";
        }


        /* =================================================
           SWITCH TO LOGIN
           ================================================= */

        setTimeout(function () {

            if (loginTab) {
                loginTab.click();
            }

        }, 1800);


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        console.error(
            "Error message:",
            error.message
        );

        if (error.details) {
            console.error(
                "Error details:",
                error.details
            );
        }

        if (error.hint) {
            console.error(
                "Error hint:",
                error.hint
            );
        }


        showMessage(
            message,
            error.message ||
            "Registration failed.",
            "error"
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit for Official Verification";

        }

    }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const message =
        document.getElementById("loginMessage");

    clearMessage(message);


    /* =====================================================
       GET LOGIN VALUES
       ===================================================== */

    const identifier =
        getValue("loginIdentifier");

    const password =
        getValue("loginPassword");


    if (
        !identifier ||
        !password
    ) {

        showMessage(
            message,
            "Please enter your official email/ID and password.",
            "error"
        );

        return;
    }


    /* =====================================================
       SUPABASE CHECK
       ===================================================== */

    if (
        typeof supabaseClient === "undefined"
    ) {

        showMessage(
            message,
            "Supabase connection is not available.",
            "error"
        );

        return;
    }


    const submitButton =
        loginFormButton();


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Signing In...";

    }


    try {

        /* =================================================
           STEP 1
           DETERMINE EMAIL
           ================================================= */

        let email =
            identifier.trim();


        /*
         * If the user entered an Official ID,
         * find the associated official email.
         */

        if (!identifier.includes("@")) {

            console.log(
                "Searching official ID..."
            );


            const {
                data: officialLookup,
                error: lookupError
            } =
                await supabaseClient
                    .from("government_officials")
                    .select("official_email")
                    .eq(
                        "official_id",
                        identifier
                    )
                    .maybeSingle();


            if (lookupError) {

                console.error(
                    "Official ID lookup error:",
                    lookupError
                );

                throw lookupError;
            }


            if (!officialLookup) {

                throw new Error(
                    "Official ID not found."
                );

            }


            if (!officialLookup.official_email) {

                throw new Error(
                    "No official email is linked to this account."
                );

            }


            email =
                officialLookup
                    .official_email
                    .toLowerCase();

        }


        /* =================================================
           STEP 2
           AUTHENTICATE
           ================================================= */

        console.log(
            "Authenticating..."
        );


        const {
            data: authData,
            error: authError
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (authError) {

            throw authError;

        }


        const user =
            authData.user;


        if (!user) {

            throw new Error(
                "Authentication failed."
            );

        }


        console.log(
            "Authentication successful:",
            user.id
        );


        /* =================================================
           STEP 3
           FETCH GOVERNMENT PROFILE
           ================================================= */

        const {
            data: official,
            error: profileError
        } =
            await supabaseClient
                .from("government_officials")
                .select(`
                    id,
                    user_id,
                    full_name,
                    official_id,
                    official_email,
                    verification_status
                `)
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (profileError) {

            console.error(
                "Government profile lookup error:",
                profileError
            );

            await supabaseClient.auth.signOut();

            throw profileError;

        }


        /* =================================================
           NO PROFILE
           ================================================= */

        if (!official) {

            await supabaseClient.auth.signOut();

            showMessage(
                message,
                "Government official profile not found. Please contact the administrator.",
                "error"
            );

            return;

        }


        console.log(
            "Verification status:",
            official.verification_status
        );


        /* =================================================
           HARD VERIFICATION GATE

           ONLY VERIFIED USERS CAN ENTER.
           ================================================= */

      if (
    official.verification_status !== true
) {
            /*
             * Remove Auth session immediately.
             */

            await supabaseClient.auth.signOut();


            /* ---------------------------------------------
               PENDING
               --------------------------------------------- */

            if (
                official.verification_status ===
                false
            ) {

                showMessage(
                    message,
                    "Your account is pending government verification. Login is not allowed until your account is verified.",
                    "error"
                );

                return;

            }


       


     

            /* ---------------------------------------------
               UNKNOWN STATUS
               --------------------------------------------- */

            showMessage(
                message,
                "Your account has not been verified for portal access.",
                "error"
            );

            return;

        }


        /* =================================================
           VERIFIED
           ================================================= */

        console.log(
            "Government official VERIFIED."
        );


        showMessage(
            message,
            "Verification successful. Redirecting...",
            "success"
        );


        /* =================================================
           REDIRECT TO GOVERNMENT DASHBOARD
           ================================================= */

        setTimeout(function () {

            window.location.href =
                "govt_dashboard.html";

        }, 800);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Unable to sign in.",
            "error"
        );


    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Sign In to Government Portal";

        }

    }

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function handleForgotPassword(event) {

    event.preventDefault();


    const identifier =
        getValue("loginIdentifier");


    const message =
        document.getElementById(
            "loginMessage"
        );


    clearMessage(message);


    /* =====================================================
       VALIDATION
       ===================================================== */

    if (!identifier) {

        showMessage(
            message,
            "Enter your official email first.",
            "error"
        );

        return;
    }


    if (!identifier.includes("@")) {

        showMessage(
            message,
            "Please enter your official email to reset your password.",
            "error"
        );

        return;
    }


    if (
        typeof supabaseClient === "undefined"
    ) {

        showMessage(
            message,
            "Supabase connection is not available.",
            "error"
        );

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    identifier.toLowerCase(),
                    {
                        redirectTo:
                            window.location.origin +
                            "/reset-password.html"
                    }
                );


        if (error) {
            throw error;
        }


        showMessage(
            message,
            "Password reset instructions have been sent to your email.",
            "success"
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Unable to send password reset email.",
            "error"
        );

    }

}


/* =========================================================
   STATE / DISTRICT
   ========================================================= */

function setupStateDistrict() {

    const stateSelect =
        document.getElementById(
            "stateSelect"
        );


    const districtSelect =
        document.getElementById(
            "districtSelect"
        );


    if (
        !stateSelect ||
        !districtSelect
    ) {

        return;

    }


    /* =====================================================
       STATE DATA
       ===================================================== */

    const states = {

        "Andhra Pradesh": [
            "Anantapur",
            "Guntur",
            "Krishna",
            "Kurnool",
            "Nellore",
            "Visakhapatnam"
        ],

        "Delhi": [
            "Central Delhi",
            "East Delhi",
            "New Delhi",
            "North Delhi",
            "South Delhi",
            "West Delhi"
        ],

        "Gujarat": [
            "Ahmedabad",
            "Gandhinagar",
            "Rajkot",
            "Surat",
            "Vadodara"
        ],

        "Karnataka": [
            "Bengaluru Urban",
            "Mysuru",
            "Mangaluru",
            "Belagavi",
            "Hubballi-Dharwad"
        ],

        "Maharashtra": [
            "Mumbai",
            "Pune",
            "Nagpur",
            "Nashik",
            "Thane",
            "Navi Mumbai"
        ],

        "Rajasthan": [
            "Jaipur",
            "Jodhpur",
            "Udaipur",
            "Kota",
            "Ajmer"
        ],

        "Tamil Nadu": [
            "Chennai",
            "Coimbatore",
            "Madurai",
            "Salem",
            "Tiruchirappalli"
        ],

        "Telangana": [
            "Hyderabad",
            "Warangal",
            "Karimnagar",
            "Nizamabad"
        ],

        "Uttar Pradesh": [
            "Lucknow",
            "Kanpur Nagar",
            "Agra",
            "Varanasi",
            "Prayagraj",
            "Noida"
        ],

        "West Bengal": [
            "Kolkata",
            "Howrah",
            "Darjeeling",
            "Hooghly",
            "North 24 Parganas"
        ]

    };


    /* =====================================================
       POPULATE STATES ONLY IF HTML DOES NOT ALREADY HAVE THEM
       ===================================================== */

    if (stateSelect.options.length <= 1) {

        Object.keys(states).forEach(
            function (state) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    state;

                option.textContent =
                    state;

                stateSelect.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       STATE CHANGE
       ===================================================== */

    stateSelect.addEventListener(
        "change",
        function () {

            districtSelect.innerHTML =
                `<option value="">Select District</option>`;


            const districts =
                states[
                    stateSelect.value
                ] || [];


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

                    districtSelect.appendChild(
                        option
                    );

                }
            );


            districtSelect.disabled =
                districts.length === 0;

        }
    );


    /*
     * Make district disabled initially if
     * there is no selected state.
     */

    if (!stateSelect.value) {

        districtSelect.disabled = true;

    }

}


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function updatePasswordStrength(
    value,
    bar,
    text
) {

    if (
        !bar ||
        !text
    ) {

        return;

    }


    let score = 0;


    /* Minimum length */

    if (value.length >= 8) {
        score++;
    }


    /* Uppercase */

    if (/[A-Z]/.test(value)) {
        score++;
    }


    /* Lowercase */

    if (/[a-z]/.test(value)) {
        score++;
    }


    /* Number */

    if (/[0-9]/.test(value)) {
        score++;
    }


    /* Special character */

    if (/[^A-Za-z0-9]/.test(value)) {
        score++;
    }


    const widths = [
        "0%",
        "20%",
        "40%",
        "60%",
        "80%",
        "100%"
    ];


    bar.style.width =
        widths[score];


    if (!value) {

        text.textContent =
            "Password strength";

        return;

    }


    if (score <= 2) {

        text.textContent =
            "Weak password";

    } else if (score === 3) {

        text.textContent =
            "Moderate password";

    } else if (score === 4) {

        text.textContent =
            "Strong password";

    } else {

        text.textContent =
            "Very strong password";

    }

}


/* =========================================================
   GET VALUE HELPER
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(
    element,
    text,
    type
) {

    if (!element) {

        console.log(text);

        return;

    }


    element.textContent =
        text;


    element.style.display =
        "block";


    if (type === "success") {

        element.style.color =
            "#15803d";

    } else {

        element.style.color =
            "#dc2626";

    }

}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearMessage(element) {

    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.style.display =
        "none";

}


/* =========================================================
   LOGIN FORM BUTTON
   ========================================================= */

function loginFormButton() {

    const form =
        document.getElementById(
            "loginForm"
        );


    if (!form) {
        return null;
    }


    return form.querySelector(
        'button[type="submit"]'
    );

}