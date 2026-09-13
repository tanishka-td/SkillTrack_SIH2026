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

    const stateDistricts = {
    "Andhra Pradesh": [
      "Alluri Sitharama Raju",
      "Anakapalli",
      "Ananthapuramu",
      "Annamayya",
      "Bapatla",
      "Chittoor",
      "Dr. B.R. Ambedkar Konaseema",
      "East Godavari",
      "Eluru",
      "Guntur",
      "Kakinada",
      "Krishna",
      "Kurnool",
      "Nandyal",
      "NTR",
      "Palnadu",
      "Parvathipuram Manyam",
      "Prakasam",
      "Sri Potti Sriramulu Nellore",
      "Sri Sathya Sai",
      "Srikakulam",
      "Tirupati",
      "Visakhapatnam",
      "Vizianagaram",
      "West Godavari",
      "YSR Kadapa",
    ],

    "Arunachal Pradesh": [
      "Anjaw",
      "Bichom",
      "Changlang",
      "Dibang Valley",
      "East Kameng",
      "East Siang",
      "Itanagar Capital Complex",
      "Kamle",
      "Keyi Panyor",
      "Kra Daadi",
      "Kurung Kumey",
      "Lepa Rada",
      "Lohit",
      "Longding",
      "Lower Dibang Valley",
      "Lower Siang",
      "Lower Subansiri",
      "Namsai",
      "Pakke-Kessang",
      "Papum Pare",
      "Shi Yomi",
      "Siang",
      "Tawang",
      "Tirap",
      "Upper Siang",
      "Upper Subansiri",
      "West Kameng",
      "West Siang",
    ],

    Assam: [
      "Baksa",
      "Bajali",
      "Barpeta",
      "Biswanath",
      "Bongaigaon",
      "Cachar",
      "Charaideo",
      "Chirang",
      "Darrang",
      "Dhemaji",
      "Dhubri",
      "Dibrugarh",
      "Dima Hasao",
      "Goalpara",
      "Golaghat",
      "Hailakandi",
      "Hojai",
      "Jorhat",
      "Kamrup",
      "Kamrup Metropolitan",
      "Karbi Anglong",
      "Kokrajhar",
      "Lakhimpur",
      "Majuli",
      "Morigaon",
      "Nagaon",
      "Nalbari",
      "Sivasagar",
      "Sonitpur",
      "South Salmara-Mankachar",
      "Tamulpur",
      "Tinsukia",
      "Udalguri",
      "West Karbi Anglong",
    ],

    Bihar: [
      "Araria",
      "Arwal",
      "Aurangabad",
      "Banka",
      "Begusarai",
      "Bhagalpur",
      "Bhojpur",
      "Buxar",
      "Darbhanga",
      "East Champaran",
      "Gaya",
      "Gopalganj",
      "Jamui",
      "Jehanabad",
      "Kaimur",
      "Katihar",
      "Khagaria",
      "Kishanganj",
      "Lakhisarai",
      "Madhepura",
      "Madhubani",
      "Munger",
      "Muzaffarpur",
      "Nalanda",
      "Nawada",
      "Patna",
      "Purnia",
      "Rohtas",
      "Saharsa",
      "Samastipur",
      "Saran",
      "Sheikhpura",
      "Sheohar",
      "Sitamarhi",
      "Siwan",
      "Supaul",
      "Vaishali",
      "West Champaran",
    ],

    Chhattisgarh: [
      "Balod",
      "Baloda Bazar",
      "Balrampur-Ramanujganj",
      "Bastar",
      "Bemetara",
      "Bijapur",
      "Bilaspur",
      "Dantewada",
      "Dhamtari",
      "Durg",
      "Gariaband",
      "Gaurela-Pendra-Marwahi",
      "Janjgir-Champa",
      "Jashpur",
      "Kabirdham",
      "Kanker",
      "Khairagarh-Chhuikhadan-Gandai",
      "Kondagaon",
      "Korba",
      "Koriya",
      "Mahasamund",
      "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki",
      "Mungeli",
      "Narayanpur",
      "Raigarh",
      "Raipur",
      "Rajnandgaon",
      "Sakti",
      "Sarangarh-Bilaigarh",
      "Sukma",
      "Surajpur",
      "Surguja",
    ],

    Goa: ["North Goa", "South Goa"],

    Gujarat: [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udaipur",
      "Dahod",
      "Dang",
      "Devbhoomi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda",
      "Kutch",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada",
      "Navsari",
      "Panchmahal",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha",
      "Surat",
      "Surendranagar",
      "Tapi",
      "Vadodara",
      "Valsad",
    ],

    Haryana: [
      "Ambala",
      "Bhiwani",
      "Charkhi Dadri",
      "Faridabad",
      "Fatehabad",
      "Gurugram",
      "Hisar",
      "Jhajjar",
      "Jind",
      "Kaithal",
      "Karnal",
      "Kurukshetra",
      "Mahendragarh",
      "Nuh",
      "Palwal",
      "Panchkula",
      "Panipat",
      "Rewari",
      "Rohtak",
      "Sirsa",
      "Sonipat",
      "Yamunanagar",
    ],

    "Himachal Pradesh": [
      "Bilaspur",
      "Chamba",
      "Hamirpur",
      "Kangra",
      "Kinnaur",
      "Kullu",
      "Lahaul and Spiti",
      "Mandi",
      "Shimla",
      "Sirmaur",
      "Solan",
      "Una",
    ],

    Jharkhand: [
      "Bokaro",
      "Chatra",
      "Deoghar",
      "Dhanbad",
      "Dumka",
      "East Singhbhum",
      "Garhwa",
      "Giridih",
      "Godda",
      "Gumla",
      "Hazaribagh",
      "Jamtara",
      "Khunti",
      "Koderma",
      "Latehar",
      "Lohardaga",
      "Pakur",
      "Palamu",
      "Ramgarh",
      "Ranchi",
      "Sahibganj",
      "Seraikela Kharsawan",
      "Simdega",
      "West Singhbhum",
    ],

    Karnataka: [
      "Bagalkot",
      "Ballari",
      "Belagavi",
      "Bengaluru Rural",
      "Bengaluru Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikkaballapur",
      "Chikkamagaluru",
      "Chitradurga",
      "Dakshina Kannada",
      "Davanagere",
      "Dharwad",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi",
      "Kodagu",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru",
      "Raichur",
      "Ramanagara",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
      "Uttara Kannada",
      "Vijayanagara",
      "Vijayapura",
      "Yadgir",
    ],

    Kerala: [
      "Alappuzha",
      "Ernakulam",
      "Idukki",
      "Kannur",
      "Kasaragod",
      "Kollam",
      "Kottayam",
      "Kozhikode",
      "Malappuram",
      "Palakkad",
      "Pathanamthitta",
      "Thiruvananthapuram",
      "Thrissur",
      "Wayanad",
    ],

    "Madhya Pradesh": [
      "Agar Malwa",
      "Alirajpur",
      "Anuppur",
      "Ashoknagar",
      "Balaghat",
      "Barwani",
      "Betul",
      "Bhind",
      "Bhopal",
      "Burhanpur",
      "Chhatarpur",
      "Chhindwara",
      "Damoh",
      "Datia",
      "Dewas",
      "Dhar",
      "Dindori",
      "Guna",
      "Gwalior",
      "Harda",
      "Indore",
      "Jabalpur",
      "Jhabua",
      "Katni",
      "Khandwa",
      "Khargone",
      "Maihar",
      "Mandla",
      "Mandsaur",
      "Mauganj",
      "Morena",
      "Narmadapuram",
      "Narsinghpur",
      "Neemuch",
      "Niwari",
      "Panna",
      "Raisen",
      "Rajgarh",
      "Ratlam",
      "Rewa",
      "Sagar",
      "Satna",
      "Sehore",
      "Seoni",
      "Shahdol",
      "Shajapur",
      "Sheopur",
      "Shivpuri",
      "Sidhi",
      "Singrauli",
      "Tikamgarh",
      "Ujjain",
      "Umaria",
      "Vidisha",
    ],

    Maharashtra: [
      "Ahmednagar",
      "Akola",
      "Amravati",
      "Aurangabad",
      "Beed",
      "Bhandara",
      "Buldhana",
      "Chandrapur",
      "Chhatrapati Sambhajinagar",
      "Dhule",
      "Gadchiroli",
      "Gondia",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Kolhapur",
      "Latur",
      "Mumbai City",
      "Mumbai Suburban",
      "Nagpur",
      "Nanded",
      "Nandurbar",
      "Nashik",
      "Osmanabad",
      "Palghar",
      "Parbhani",
      "Pune",
      "Raigad",
      "Ratnagiri",
      "Sangli",
      "Satara",
      "Sindhudurg",
      "Solapur",
      "Thane",
      "Wardha",
      "Washim",
      "Yavatmal",
    ],

    Manipur: [
      "Bishnupur",
      "Chandel",
      "Churachandpur",
      "Imphal East",
      "Imphal West",
      "Jiribam",
      "Kakching",
      "Kamjong",
      "Kangpokpi",
      "Noney",
      "Pherzawl",
      "Senapati",
      "Tamenglong",
      "Tengnoupal",
      "Thoubal",
      "Ukhrul",
    ],

    Meghalaya: [
      "East Garo Hills",
      "East Jaintia Hills",
      "East Khasi Hills",
      "Eastern West Khasi Hills",
      "North Garo Hills",
      "Ri-Bhoi",
      "South Garo Hills",
      "South West Garo Hills",
      "South West Khasi Hills",
      "West Garo Hills",
      "West Jaintia Hills",
      "West Khasi Hills",
    ],

    Mizoram: [
      "Aizawl",
      "Champhai",
      "Hnahthial",
      "Khawzawl",
      "Kolasib",
      "Lawngtlai",
      "Lunglei",
      "Mamit",
      "Saitual",
      "Serchhip",
      "Siaha",
    ],

    Nagaland: [
      "Chumoukedima",
      "Dimapur",
      "Kiphire",
      "Kohima",
      "Longleng",
      "Mokokchung",
      "Mon",
      "Niuland",
      "Noklak",
      "Peren",
      "Phek",
      "Shamator",
      "Tuensang",
      "Tseminyu",
      "Wokha",
      "Zunheboto",
    ],

    Odisha: [
      "Angul",
      "Balangir",
      "Balasore",
      "Bargarh",
      "Bhadrak",
      "Boudh",
      "Cuttack",
      "Deogarh",
      "Dhenkanal",
      "Gajapati",
      "Ganjam",
      "Jagatsinghpur",
      "Jajpur",
      "Jharsuguda",
      "Kalahandi",
      "Kandhamal",
      "Kendrapara",
      "Kendujhar",
      "Khordha",
      "Koraput",
      "Malkangiri",
      "Mayurbhanj",
      "Nabarangpur",
      "Nayagarh",
      "Nuapada",
      "Puri",
      "Rayagada",
      "Sambalpur",
      "Subarnapur",
      "Sundargarh",
    ],

    Punjab: [
      "Amritsar",
      "Barnala",
      "Bathinda",
      "Faridkot",
      "Fatehgarh Sahib",
      "Fazilka",
      "Ferozepur",
      "Gurdaspur",
      "Hoshiarpur",
      "Jalandhar",
      "Kapurthala",
      "Ludhiana",
      "Malerkotla",
      "Mansa",
      "Moga",
      "Pathankot",
      "Patiala",
      "Rupnagar",
      "Sahibzada Ajit Singh Nagar",
      "Sangrur",
      "Shahid Bhagat Singh Nagar",
      "Sri Muktsar Sahib",
      "Tarn Taran",
    ],

    Rajasthan: [
      "Ajmer",
      "Alwar",
      "Anupgarh",
      "Balotra",
      "Banswara",
      "Baran",
      "Barmer",
      "Beawar",
      "Bharatpur",
      "Bhilwara",
      "Bikaner",
      "Bundi",
      "Chittorgarh",
      "Churu",
      "Dausa",
      "Deeg",
      "Dholpur",
      "Didwana-Kuchamana",
      "Dudu",
      "Dungarpur",
      "Ganganagar",
      "Gangapur City",
      "Hanumangarh",
      "Jaipur",
      "Jaisalmer",
      "Jalore",
      "Jhalawar",
      "Jhunjhunu",
      "Jodhpur",
      "Karauli",
      "Khairthal-Tijara",
      "Kota",
      "Kotputli-Behror",
      "Nagaur",
      "Neem Ka Thana",
      "Pali",
      "Phalodi",
      "Pratapgarh",
      "Rajsamand",
      "Salumbar",
      "Sawai Madhopur",
      "Sikar",
      "Sirohi",
      "Tonk",
      "Udaipur",
    ],

    Sikkim: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],

    "Tamil Nadu": [
      "Ariyalur",
      "Chengalpattu",
      "Chennai",
      "Coimbatore",
      "Cuddalore",
      "Dharmapuri",
      "Dindigul",
      "Erode",
      "Kallakurichi",
      "Kancheepuram",
      "Karur",
      "Krishnagiri",
      "Madurai",
      "Mayiladuthurai",
      "Nagapattinam",
      "Namakkal",
      "Nilgiris",
      "Perambalur",
      "Pudukkottai",
      "Ramanathapuram",
      "Ranipet",
      "Salem",
      "Sivaganga",
      "Tenkasi",
      "Thanjavur",
      "Theni",
      "Thoothukudi",
      "Tiruchirappalli",
      "Tirunelveli",
      "Tirupathur",
      "Tiruppur",
      "Tiruvallur",
      "Tiruvannamalai",
      "Tiruvarur",
      "Vellore",
      "Viluppuram",
      "Virudhunagar",
    ],

    Telangana: [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Hanamkonda",
      "Hyderabad",
      "Jagtial",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Jogulamba Gadwal",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Komaram Bheem Asifabad",
      "Mahabubabad",
      "Mahbubnagar",
      "Mancherial",
      "Medak",
      "Medchal-Malkajgiri",
      "Mulugu",
      "Nagarkurnool",
      "Nalgonda",
      "Narayanpet",
      "Nirmal",
      "Nizamabad",
      "Peddapalli",
      "Rajanna Sircilla",
      "Rangareddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal",
      "Yadadri Bhuvanagiri",
    ],

    Tripura: [
      "Dhalai",
      "Gomati",
      "Khowai",
      "North Tripura",
      "Sepahijala",
      "South Tripura",
      "Unakoti",
      "West Tripura",
    ],

    "Uttar Pradesh": [
      "Agra",
      "Aligarh",
      "Ambedkar Nagar",
      "Amethi",
      "Amroha",
      "Auraiya",
      "Ayodhya",
      "Azamgarh",
      "Baghpat",
      "Bahraich",
      "Ballia",
      "Balrampur",
      "Banda",
      "Barabanki",
      "Bareilly",
      "Basti",
      "Bhadohi",
      "Bijnor",
      "Budaun",
      "Bulandshahr",
      "Chandauli",
      "Chitrakoot",
      "Deoria",
      "Etah",
      "Etawah",
      "Farrukhabad",
      "Fatehpur",
      "Firozabad",
      "Gautam Buddha Nagar (Noida)",
      "Ghaziabad",
      "Ghazipur",
      "Gonda",
      "Gorakhpur",
      "Hamirpur",
      "Hapur",
      "Hardoi",
      "Hathras",
      "Jalaun",
      "Jaunpur",
      "Jhansi",
      "Kannauj",
      "Kanpur Dehat",
      "Kanpur Nagar",
      "Kasganj",
      "Kaushambi",
      "Kushinagar",
      "Lakhimpur Kheri",
      "Lalitpur",
      "Lucknow",
      "Maharajganj",
      "Mahoba",
      "Mainpuri",
      "Mathura",
      "Mau",
      "Meerut",
      "Mirzapur",
      "Moradabad",
      "Muzaffarnagar",
      "Pilibhit",
      "Pratapgarh",
      "Prayagraj",
      "Raebareli",
      "Rampur",
      "Saharanpur",
      "Sambhal",
      "Sant Kabir Nagar",
      "Shahjahanpur",
      "Shamli",
      "Shravasti",
      "Siddharthnagar",
      "Sitapur",
      "Sonbhadra",
      "Sultanpur",
      "Unnao",
      "Varanasi",
    ],

    Uttarakhand: [
      "Almora",
      "Bageshwar",
      "Chamoli",
      "Champawat",
      "Dehradun",
      "Haridwar",
      "Nainital",
      "Pauri Garhwal",
      "Pithoragarh",
      "Rudraprayag",
      "Tehri Garhwal",
      "Udham Singh Nagar",
      "Uttarkashi",
    ],

    "West Bengal": [
      "Alipurduar",
      "Bankura",
      "Paschim Bardhaman",
      "Purba Bardhaman",
      "Birbhum",
      "Cooch Behar",
      "Dakshin Dinajpur",
      "Darjeeling",
      "Hooghly",
      "Howrah",
      "Jalpaiguri",
      "Jhargram",
      "Kalimpong",
      "Kolkata",
      "Maldah",
      "Murshidabad",
      "Nadia",
      "North 24 Parganas",
      "South 24 Parganas",
      "Paschim Medinipur",
      "Purba Medinipur",
      "Uttar Dinajpur",
    ],

    "Andaman and Nicobar Islands": [
      "Nicobar",
      "North and Middle Andaman",
      "South Andaman",
    ],

    Chandigarh: ["Chandigarh"],

    "Dadra and Nagar Haveli and Daman and Diu": [
      "Dadra and Nagar Haveli",
      "Daman",
      "Diu",
    ],

    Delhi: [
      "Central Delhi",
      "East Delhi",
      "New Delhi",
      "North Delhi",
      "North East Delhi",
      "North West Delhi",
      "Shahdara",
      "South Delhi",
      "South East Delhi",
      "South West Delhi",
      "West Delhi",
    ],

    "Jammu and Kashmir": [
      "Anantnag",
      "Bandipora",
      "Baramulla",
      "Budgam",
      "Doda",
      "Ganderbal",
      "Jammu",
      "Kathua",
      "Kishtwar",
      "Kulgam",
      "Kupwara",
      "Poonch",
      "Pulwama",
      "Rajouri",
      "Ramban",
      "Reasi",
      "Samba",
      "Shopian",
      "Srinagar",
      "Udhampur",
    ],

    Ladakh: ["Kargil", "Leh"],

    Lakshadweep: ["Lakshadweep"],

    Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  };

  if (stateSelect && districtSelect) {
    // State dropdown populate karein
    stateSelect.innerHTML =
      '<option value="" disabled selected>Select State</option>';
    districtSelect.innerHTML =
      '<option value="" disabled selected>Select District</option>';
    districtSelect.disabled = true;

    Object.keys(stateDistricts).forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    // State change hone par district load karein
    stateSelect.addEventListener("change", function () {
      const selectedState = this.value;

      districtSelect.innerHTML =
        '<option value="" disabled selected>Select District</option>';

      if (selectedState && stateDistricts[selectedState]) {
        districtSelect.disabled = false;

        stateDistricts[selectedState].forEach((district) => {
          const option = document.createElement("option");
          option.value = district;
          option.textContent = district;
          districtSelect.appendChild(option);
        });
      } else {
        districtSelect.disabled = true;
      }
    });
  }
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