document.addEventListener("DOMContentLoaded", () => {

    const sidebar =
        document.getElementById("sidebar");

    const menuBtn =
        document.getElementById("menuBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const statusText =
        document.getElementById("dashboardStatus");

    const statusButtons =
        document.querySelectorAll(
            ".quick-status button"
        );


    /* =========================
       MOBILE SIDEBAR
    ========================= */

    menuBtn.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });


    /* =========================
       STATUS SELECTION
    ========================= */

    let selectedStatus = "Employed";


    statusButtons.forEach(button => {

        button.addEventListener("click", () => {

            statusButtons.forEach(item => {

                item.classList.remove("selected");

            });


            button.classList.add("selected");


            selectedStatus =
                button.dataset.status;


            statusText.textContent =
                selectedStatus;

        });

    });


    /* =========================
       NOTIFICATIONS
    ========================= */

    notificationBtn.addEventListener(
        "click",
        () => {

            alert(
                "You have 1 upcoming notification: 6 Month SkillTrack Check-in."
            );

        }
    );


    /* =========================
       LOGOUT
    ========================= */

    logoutBtn.addEventListener(
        "click",
        () => {

            const confirmLogout =
                confirm(
                    "Are you sure you want to sign out?"
                );


            if (confirmLogout) {

                window.location.href =
                    "login-selection.html";

            }

        }
    );

});