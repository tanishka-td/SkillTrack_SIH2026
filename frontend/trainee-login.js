document.addEventListener("DOMContentLoaded", () => {


    /* =========================================
       ELEMENTS
    ========================================= */

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

    const formMessage =
        document.getElementById("formMessage");

    const loginMessage =
        document.getElementById("loginMessage");

    const password =
        document.getElementById("password");

    const strengthFill =
        document.getElementById("strengthFill");

    const strengthText =
        document.getElementById("strengthText");


    /* =========================================
       SWITCH TO SIGN IN
    ========================================= */

    loginTab.addEventListener("click", () => {

        signupTab.classList.remove("active");

        loginTab.classList.add("active");

        signupForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        formTitle.textContent =
            "Sign in to your account";

        clearMessages();

    });


    /* =========================================
       SWITCH TO SIGN UP
    ========================================= */

    signupTab.addEventListener("click", () => {

        loginTab.classList.remove("active");

        signupTab.classList.add("active");

        loginForm.classList.add("hidden");

        signupForm.classList.remove("hidden");

        formTitle.textContent =
            "Create your account";

        clearMessages();

    });


    /* =========================================
       PASSWORD SHOW / HIDE
    ========================================= */

    document.querySelectorAll(
        ".password-toggle"
    ).forEach(button => {

        button.addEventListener("click", () => {

            const targetId =
                button.dataset.target;

            const input =
                document.getElementById(targetId);


            if (input.type === "password") {

                input.type = "text";

                button.textContent =
                    "Hide";

            } else {

                input.type = "password";

                button.textContent =
                    "Show";

            }

        });

    });


    /* =========================================
       PASSWORD STRENGTH
    ========================================= */

    password.addEventListener(
        "input",
        updatePasswordStrength
    );


    function updatePasswordStrength() {

        const value =
            password.value;

        let score = 0;


        if (value.length >= 8) {

            score++;

        }


        if (/[A-Z]/.test(value)) {

            score++;

        }


        if (/[0-9]/.test(value)) {

            score++;

        }


        if (/[^A-Za-z0-9]/.test(value)) {

            score++;

        }


        const percentages = [
            "0%",
            "25%",
            "50%",
            "75%",
            "100%"
        ];


        strengthFill.style.width =
            percentages[score];


        if (value.length === 0) {

            strengthText.textContent =
                "Password strength";

        }

        else if (score <= 1) {

            strengthText.textContent =
                "Weak password";

        }

        else if (score === 2) {

            strengthText.textContent =
                "Moderate password";

        }

        else if (score === 3) {

            strengthText.textContent =
                "Good password";

        }

        else {

            strengthText.textContent =
                "Strong password";

        }

    }


    /* =========================================
       PHONE NUMBER
    ========================================= */

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


    /* =========================================
       SIGN UP VALIDATION
    ========================================= */

    signupForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            clearMessages();


            const name =
                document.getElementById(
                    "name"
                ).value.trim();


            const age =
                Number(
                    document.getElementById(
                        "age"
                    ).value
                );


            const gender =
                document.getElementById(
                    "gender"
                ).value;


            const phoneValue =
                phone.value.trim();


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


            const city =
                document.getElementById(
                    "city"
                ).value.trim();


            const course =
                document.getElementById(
                    "course"
                ).value.trim();


            const passwordValue =
                password.value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const terms =
                document.getElementById(
                    "terms"
                ).checked;


            /* NAME */

            if (name.length < 3) {

                showMessage(
                    formMessage,
                    "Please enter your full name."
                );

                return;

            }


            /* AGE */

            if (
                !age ||
                age < 15 ||
                age > 100
            ) {

                showMessage(
                    formMessage,
                    "Please enter a valid age between 15 and 100."
                );

                return;

            }


            /* GENDER */

            if (!gender) {

                showMessage(
                    formMessage,
                    "Please select your gender."
                );

                return;

            }


            /* PHONE */

            if (
                !/^[6-9]\d{9}$/.test(
                    phoneValue
                )
            ) {

                showMessage(
                    formMessage,
                    "Please enter a valid 10-digit mobile number."
                );

                return;

            }


            /* EMAIL */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    email
                )
            ) {

                showMessage(
                    formMessage,
                    "Please enter a valid email address."
                );

                return;

            }


            /* LOCATION */

            if (!state) {

                showMessage(
                    formMessage,
                    "Please select your state or UT."
                );

                return;

            }


            if (!district) {

                showMessage(
                    formMessage,
                    "Please enter your district."
                );

                return;

            }


            if (!city) {

                showMessage(
                    formMessage,
                    "Please enter your city, block or town."
                );

                return;

            }


            /* TRAINING */

            if (!course) {

                showMessage(
                    formMessage,
                    "Please enter your training course."
                );

                return;

            }


            /* PASSWORD */

            if (passwordValue.length < 8) {

                showMessage(
                    formMessage,
                    "Password must contain at least 8 characters."
                );

                return;

            }


            /* CONFIRM */

            if (
                passwordValue !==
                confirmPassword
            ) {

                showMessage(
                    formMessage,
                    "Passwords do not match."
                );

                return;

            }


            /* TERMS */

            if (!terms) {

                showMessage(
                    formMessage,
                    "Please accept the terms and privacy policy."
                );

                return;

            }


            /* SUCCESS */

            showSuccess(
                formMessage,
                "Profile details verified. Demo account created successfully."
            );


            /*
                DEMO ONLY

                In your real project, replace this
                with your backend API / Supabase
                registration logic.
            */

            setTimeout(() => {

                window.location.href =
                    "trainee-dashboard.html";

            }, 1500);

        }
    );


    /* =========================================
       LOGIN
    ========================================= */

    loginForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            clearMessages();


            const loginEmail =
                document.getElementById(
                    "loginEmail"
                ).value.trim();


            const loginPassword =
                document.getElementById(
                    "loginPassword"
                ).value;


            if (!loginEmail) {

                showMessage(
                    loginMessage,
                    "Please enter your email or mobile number."
                );

                return;

            }


            if (!loginPassword) {

                showMessage(
                    loginMessage,
                    "Please enter your password."
                );

                return;

            }


            showSuccess(
                loginMessage,
                "Sign in details accepted. Redirecting..."
            );


            /*
                DEMO ONLY

                Replace with your real
                authentication system.
            */

            setTimeout(() => {

                window.location.href =
                    "trainee-dashboard.html";

            }, 1200);

        }
    );


    /* =========================================
       FORGOT PASSWORD
    ========================================= */

    document.getElementById(
        "forgotPassword"
    ).addEventListener(
        "click",
        event => {

            event.preventDefault();

            showSuccess(
                loginMessage,
                "Password reset instructions would be sent to your registered contact."
            );

        }
    );


    /* =========================================
       HELPERS
    ========================================= */

    function showMessage(
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

        formMessage.textContent =
            "";

        loginMessage.textContent =
            "";

    }

});