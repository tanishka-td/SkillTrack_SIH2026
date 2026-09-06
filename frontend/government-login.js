document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       ELEMENTS
    ===================================== */

    const signupTab =
        document.getElementById("signupTab");

    const loginTab =
        document.getElementById("loginTab");

    const signupForm =
        document.getElementById("signupForm");

    const loginForm =
        document.getElementById("loginForm");

    const formTitle =
        document.getElementById("formTitle");

    const signupMessage =
        document.getElementById("signupMessage");

    const loginMessage =
        document.getElementById("loginMessage");


    /* =====================================
       SWITCH TO LOGIN
    ===================================== */

    loginTab.addEventListener(
        "click",
        () => {

            signupTab.classList.remove("active");

            loginTab.classList.add("active");

            signupForm.classList.add("hidden");

            loginForm.classList.remove("hidden");

            formTitle.textContent =
                "Government access";

            clearMessages();

        }
    );


    /* =====================================
       SWITCH TO REGISTER
    ===================================== */

    signupTab.addEventListener(
        "click",
        () => {

            loginTab.classList.remove("active");

            signupTab.classList.add("active");

            loginForm.classList.add("hidden");

            signupForm.classList.remove("hidden");

            formTitle.textContent =
                "Government access";

            clearMessages();

        }
    );


    /* =====================================
       SHOW / HIDE PASSWORD
    ===================================== */

    document
        .querySelectorAll(".show-password")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        document.getElementById(
                            button.dataset.target
                        );


                    if (
                        target.type === "password"
                    ) {

                        target.type = "text";

                        button.textContent = "Hide";

                    } else {

                        target.type = "password";

                        button.textContent = "Show";

                    }

                }
            );

        });


    /* =====================================
       PHONE INPUT
    ===================================== */

    const phone =
        document.getElementById("phone");


    phone.addEventListener(
        "input",
        () => {

            phone.value =
                phone.value.replace(
                    /\D/g,
                    ""
                );

        }
    );


    /* =====================================
       SIGN UP
    ===================================== */

    signupForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearMessages();


            /* ---------------------------------
               GET FORM VALUES
            --------------------------------- */

            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const designation =
                document
                    .getElementById("designation")
                    .value
                    .trim();


            const employeeId =
                document
                    .getElementById("employeeId")
                    .value
                    .trim();


            const department =
                document
                    .getElementById("department")
                    .value
                    .trim();


            const phoneValue =
                phone.value.trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const state =
                document
                    .getElementById("state")
                    .value;


            const district =
                document
                    .getElementById("district")
                    .value
                    .trim();


            const office =
                document
                    .getElementById("office")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const agreement =
                document
                    .getElementById("agreement")
                    .checked;


            /* =================================
               VALIDATION
            ================================= */

            if (fullName.length < 3) {

                showError(
                    signupMessage,
                    "Please enter the official full name."
                );

                return;

            }


            if (designation.length < 2) {

                showError(
                    signupMessage,
                    "Please enter your designation."
                );

                return;

            }


            if (employeeId.length < 3) {

                showError(
                    signupMessage,
                    "Please enter your employee or official ID."
                );

                return;

            }


            if (department.length < 2) {

                showError(
                    signupMessage,
                    "Please enter your department or ministry."
                );

                return;

            }


            if (
                !/^[6-9]\d{9}$/.test(
                    phoneValue
                )
            ) {

                showError(
                    signupMessage,
                    "Please enter a valid 10-digit official mobile number."
                );

                return;

            }


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {

                showError(
                    signupMessage,
                    "Please enter a valid official email address."
                );

                return;

            }


            if (!state) {

                showError(
                    signupMessage,
                    "Please select your State / UT."
                );

                return;

            }


            if (district.length < 2) {

                showError(
                    signupMessage,
                    "Please enter your district."
                );

                return;

            }


            if (office.length < 2) {

                showError(
                    signupMessage,
                    "Please enter your office or organisation."
                );

                return;

            }


            if (password.length < 8) {

                showError(
                    signupMessage,
                    "Password must contain at least 8 characters."
                );

                return;

            }


            if (password !== confirmPassword) {

                showError(
                    signupMessage,
                    "Passwords do not match."
                );

                return;

            }


            if (!agreement) {

                showError(
                    signupMessage,
                    "Please confirm that you are an authorised government representative."
                );

                return;

            }


            /* =================================
               DISABLE BUTTON
            ================================= */

            const submitButton =
                signupForm.querySelector(
                    ".submit-button"
                );


            const originalText =
                submitButton
                    .querySelector("span")
                    .textContent;


            submitButton.disabled = true;

            submitButton
                .querySelector("span")
                .textContent =
                "Creating account...";


            /* =================================
               CREATE SUPABASE ACCOUNT
            ================================= */

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                full_name:
                                    fullName,

                                designation:
                                    designation,

                                employee_id:
                                    employeeId,

                                department:
                                    department,

                                phone:
                                    phoneValue,

                                state:
                                    state,

                                district:
                                    district,

                                office:
                                    office

                            }

                        }

                    });


                if (error) {

                    throw error;

                }


                /* =================================
                   SUCCESS
                ================================= */

                showSuccess(
                    signupMessage,
                    "Registration submitted successfully. Your account is pending government verification."
                );


                signupForm.reset();


                /*
                 * Supabase may require email
                 * confirmation before login.
                 */

                setTimeout(
                    () => {

                        loginTab.click();

                    },
                    2200
                );


            }
            catch (error) {

                console.error(
                    "Government registration error:",
                    error
                );


                let message =
                    "Registration failed. Please try again.";


                if (
                    error.message
                ) {

                    message =
                        error.message;

                }


                showError(
                    signupMessage,
                    message
                );

            }
            finally {

                submitButton.disabled = false;

                submitButton
                    .querySelector("span")
                    .textContent =
                    originalText;

            }

        }
    );


    /* =====================================
       LOGIN
    ===================================== */

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearMessages();


            /* ---------------------------------
               GET LOGIN VALUES
            --------------------------------- */

            const identity =
                document
                    .getElementById("loginIdentity")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            /* =================================
               VALIDATION
            ================================= */

            if (!identity) {

                showError(
                    loginMessage,
                    "Please enter your official email or employee ID."
                );

                return;

            }


            if (!password) {

                showError(
                    loginMessage,
                    "Please enter your password."
                );

                return;

            }


            /* =================================
               DISABLE BUTTON
            ================================= */

            const submitButton =
                loginForm.querySelector(
                    ".submit-button"
                );


            const originalText =
                submitButton
                    .querySelector("span")
                    .textContent;


            submitButton.disabled = true;

            submitButton
                .querySelector("span")
                .textContent =
                "Signing in...";


            try {

                let loginEmail =
                    identity;


                /* =================================
                   CHECK IF EMPLOYEE ID
                ================================= */

                if (
                    !identity.includes("@")
                ) {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .rpc(
                                "get_government_email",
                                {
                                    p_employee_id:
                                        identity
                                }
                            );


                    if (error) {

                        console.error(
                            "Employee ID lookup error:",
                            error
                        );

                        throw new Error(
                            "Unable to find your employee ID. Please try using your official email."
                        );

                    }


                    if (!data) {

                        throw new Error(
                            "No government account was found with that employee ID."
                        );

                    }


                    loginEmail =
                        data;

                }


                /* =================================
                   SUPABASE LOGIN
                ================================= */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email:
                                loginEmail,

                            password:
                                password

                        });


                if (error) {

                    throw error;

                }


                if (!data.user) {

                    throw new Error(
                        "Login failed. Please try again."
                    );

                }


                /* =================================
                   GET GOVERNMENT PROFILE
                ================================= */

                const {
                    data: profile,
                    error: profileError
                } =
                    await supabaseClient
                        .from("government_users")
                        .select(`
                            id,
                            user_id,
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
                        .eq(
                            "user_id",
                            data.user.id
                        )
                        .maybeSingle();


                /* =================================
                   PROFILE ERROR
                ================================= */

                if (profileError) {

                    console.error(
                        "Government profile fetch error:",
                        profileError
                    );


                    await supabaseClient.auth.signOut();


                    throw new Error(
                        "Unable to load your government profile. Please contact the administrator."
                    );

                }


                /* =================================
                   PROFILE NOT FOUND
                ================================= */

                if (!profile) {

                    await supabaseClient.auth.signOut();


                    throw new Error(
                        "Government profile not found. Please complete registration again."
                    );

                }


                /* =================================
                   CHECK VERIFICATION
                ================================= */

                if (!profile.is_verified) {

                    await supabaseClient.auth.signOut();


                    throw new Error(
                        "Your account has been created, but it is still pending government verification."
                    );

                }


                /* =================================
                   SAVE PROFILE FOR CURRENT PAGE
                ================================= */

                window.currentGovernmentOfficer =
                    profile;


                /* =================================
                   LOGIN SUCCESS
                ================================= */

                showSuccess(
                    loginMessage,
                    `Welcome, ${profile.full_name}. Opening your government dashboard...`
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "government-dashboard.html";

                    },
                    900
                );

            }
            catch (error) {

                console.error(
                    "Government login error:",
                    error
                );


                let message =
                    "Unable to sign in. Please check your credentials.";


                if (
                    error.message
                ) {

                    message =
                        error.message;

                }


                showError(
                    loginMessage,
                    message
                );

            }
            finally {

                submitButton.disabled = false;

                submitButton
                    .querySelector("span")
                    .textContent =
                    originalText;

            }

        }
    );


    /* =====================================
       HELPERS
    ===================================== */

    function showError(
        element,
        message
    ) {

        element.textContent =
            message;

        element.style.color =
            "#dc2626";

    }


    function showSuccess(
        element,
        message
    ) {

        element.textContent =
            message;

        element.style.color =
            "#15803d";

    }


    function clearMessages() {

        signupMessage.textContent =
            "";

        loginMessage.textContent =
            "";

    }

});