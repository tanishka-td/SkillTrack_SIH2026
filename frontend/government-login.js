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

    document.querySelectorAll(
        ".show-password"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );


                if (
                    target.type ===
                    "password"
                ) {

                    target.type =
                        "text";

                    button.textContent =
                        "Hide";

                } else {

                    target.type =
                        "password";

                    button.textContent =
                        "Show";

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
        event => {

            event.preventDefault();

            clearMessages();


            const fullName =
                document.getElementById(
                    "fullName"
                ).value.trim();


            const designation =
                document.getElementById(
                    "designation"
                ).value.trim();


            const employeeId =
                document.getElementById(
                    "employeeId"
                ).value.trim();


            const department =
                document.getElementById(
                    "department"
                ).value.trim();


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


            const office =
                document.getElementById(
                    "office"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            const agreement =
                document.getElementById(
                    "agreement"
                ).checked;



            /* NAME */

            if (
                fullName.length < 3
            ) {

                showError(
                    signupMessage,
                    "Please enter the official full name."
                );

                return;

            }



            /* DESIGNATION */

            if (
                designation.length < 2
            ) {

                showError(
                    signupMessage,
                    "Please enter your designation."
                );

                return;

            }



            /* OFFICIAL ID */

            if (
                employeeId.length < 3
            ) {

                showError(
                    signupMessage,
                    "Please enter your employee or official ID."
                );

                return;

            }



            /* DEPARTMENT */

            if (
                department.length < 2
            ) {

                showError(
                    signupMessage,
                    "Please enter your department or ministry."
                );

                return;

            }



            /* PHONE */

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



            /* EMAIL */

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



            /* STATE */

            if (!state) {

                showError(
                    signupMessage,
                    "Please select your State / UT."
                );

                return;

            }



            /* DISTRICT */

            if (
                district.length < 2
            ) {

                showError(
                    signupMessage,
                    "Please enter your district."
                );

                return;

            }



            /* OFFICE */

            if (
                office.length < 2
            ) {

                showError(
                    signupMessage,
                    "Please enter your office or organisation."
                );

                return;

            }



            /* PASSWORD */

            if (
                password.length < 8
            ) {

                showError(
                    signupMessage,
                    "Password must contain at least 8 characters."
                );

                return;

            }



            /* PASSWORD MATCH */

            if (
                password !==
                confirmPassword
            ) {

                showError(
                    signupMessage,
                    "Passwords do not match."
                );

                return;

            }



            /* AUTHORIZATION */

            if (!agreement) {

                showError(
                    signupMessage,
                    "Please confirm that you are an authorised government representative."
                );

                return;

            }



            /* SUCCESS */

            showSuccess(
                signupMessage,
                "Registration submitted successfully. Your account is pending verification."
            );


            /*
                DEMO ONLY

                In production this should send
                the registration to the backend
                and administrator verification
                system.
            */

            setTimeout(
                () => {

                    loginTab.click();

                },
                1800
            );

        }
    );



    /* =====================================
       LOGIN
    ===================================== */

    loginForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            clearMessages();


            const identity =
                document.getElementById(
                    "loginIdentity"
                ).value.trim();


            const password =
                document.getElementById(
                    "loginPassword"
                ).value;



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



            showSuccess(
                loginMessage,
                "Credentials accepted. Preparing secure verification..."
            );


            /*
                DEMO ONLY

                Replace with real authentication
                and OTP verification.
            */

            setTimeout(
                () => {

                    window.location.href =
                        "government-dashboard.html";

                },
                1400
            );

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