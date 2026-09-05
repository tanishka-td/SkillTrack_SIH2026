document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* ==========================================
           ELEMENTS
        ========================================== */

        const sidebar =
            document.getElementById(
                "sidebar"
            );

        const menuBtn =
            document.getElementById(
                "menuBtn"
            );

        const mobileOverlay =
            document.getElementById(
                "mobileOverlay"
            );

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        const notificationBtn =
            document.getElementById(
                "notificationBtn"
            );

        const exportBtn =
            document.getElementById(
                "exportBtn"
            );

        const resetFilters =
            document.getElementById(
                "resetFilters"
            );

        const outcomeInfo =
            document.getElementById(
                "outcomeInfo"
            );

        const courseDetailsBtn =
            document.getElementById(
                "courseDetailsBtn"
            );

        const verificationBtn =
            document.getElementById(
                "verificationBtn"
            );

        const modal =
            document.getElementById(
                "infoModal"
            );

        const modalTitle =
            document.getElementById(
                "modalTitle"
            );

        const modalText =
            document.getElementById(
                "modalText"
            );



        /* ==========================================
           SIDEBAR
        ========================================== */

        menuBtn.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

                mobileOverlay.classList.toggle(
                    "show"
                );

            }
        );


        mobileOverlay.addEventListener(
            "click",
            closeSidebar
        );


        function closeSidebar() {

            sidebar.classList.remove(
                "open"
            );

            mobileOverlay.classList.remove(
                "show"
            );

        }



        /* ==========================================
           NAVIGATION ACTIVE STATE
        ========================================== */

        document
            .querySelectorAll(
                ".nav-link"
            )
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            document
                                .querySelectorAll(
                                    ".nav-link"
                                )
                                .forEach(
                                    item =>
                                        item.classList.remove(
                                            "active"
                                        )
                                );


                            link.classList.add(
                                "active"
                            );


                            closeSidebar();

                        }
                    );

                }
            );



        /* ==========================================
           COUNTERS
        ========================================== */

        const counters =
            document.querySelectorAll(
                ".counter"
            );


        counters.forEach(
            counter => {

                const target =
                    Number(
                        counter.dataset.value
                    );

                const suffix =
                    counter.dataset.suffix
                    || "";


                let current =
                    0;


                const duration =
                    1100;


                const interval =
                    20;


                const increment =
                    target /
                    (
                        duration /
                        interval
                    );


                const timer =
                    setInterval(
                        () => {

                            current +=
                                increment;


                            if (
                                current >=
                                target
                            ) {

                                current =
                                    target;

                                clearInterval(
                                    timer
                                );

                            }


                            counter.textContent =
                                Math.floor(
                                    current
                                ).toLocaleString(
                                    "en-IN"
                                ) +
                                suffix;

                        },
                        interval
                    );

            }
        );



        /* ==========================================
           FILTERS
        ========================================== */

        const stateFilter =
            document.getElementById(
                "stateFilter"
            );

        const districtFilter =
            document.getElementById(
                "districtFilter"
            );

        const programmeFilter =
            document.getElementById(
                "programmeFilter"
            );


        [
            stateFilter,
            districtFilter,
            programmeFilter
        ].forEach(
            filter => {

                filter.addEventListener(
                    "change",
                    () => {

                        console.log(
                            "Filter changed:",
                            filter.value
                        );

                    }
                );

            }
        );


        resetFilters.addEventListener(
            "click",
            () => {

                stateFilter.value =
                    "Delhi";

                districtFilter.value =
                    "All Districts";

                programmeFilter.value =
                    "All Programmes";

            }
        );



        /* ==========================================
           NOTIFICATIONS
        ========================================== */

        notificationBtn.addEventListener(
            "click",
            () => {

                showModal(
                    "Notifications",
                    "There are 8 pending employer verifications and 12 upcoming trainee follow-ups requiring attention."
                );

            }
        );



        /* ==========================================
           OUTCOME INFORMATION
        ========================================== */

        outcomeInfo.addEventListener(
            "click",
            () => {

                showModal(
                    "Outcome Analytics",
                    "The outcome distribution represents the latest recorded trainee status across the selected reporting period."
                );

            }
        );



        /* ==========================================
           COURSE DETAILS
        ========================================== */

        courseDetailsBtn.addEventListener(
            "click",
            () => {

                showModal(
                    "Course Performance",
                    "Detailed course analytics can include centre-wise completion, employment rate, salary outcomes, retention and employer verification."
                );

            }
        );



        /* ==========================================
           VERIFICATION QUEUE
        ========================================== */

        verificationBtn.addEventListener(
            "click",
            () => {

                showModal(
                    "Verification Queue",
                    "The verification module will allow authorized officers to review employer-submitted confirmations before they become verified programme records."
                );

            }
        );


        document
            .querySelectorAll(
                ".queue-item button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            showModal(
                                "Employer Verification",
                                "This trainee's employment verification record is ready for review."
                            );

                        }
                    );

                }
            );



        /* ==========================================
           EXPORT
        ========================================== */

        exportBtn.addEventListener(
            "click",
            () => {

                const report =
                    `
SkillTrack Government Outcome Report
====================================

Reporting Period: ${
    document.getElementById(
        "periodSelect"
    ).value
}

State: ${
    stateFilter.value
}

District: ${
    districtFilter.value
}

Programme: ${
    programmeFilter.value
}


KEY INDICATORS
--------------

Total Trainees: 24,860

Training Completion: 91%

Employment Rate: 74%

Verified Outcomes: 18,420


LONGITUDINAL RETENTION
----------------------

3 Month: 78%

6 Month: 73%

12 Month: 67%
                `;


                const blob =
                    new Blob(
                        [report],
                        {
                            type:
                                "text/plain"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const a =
                    document.createElement(
                        "a"
                    );


                a.href =
                    url;

                a.download =
                    "SkillTrack-Government-Report.txt";


                document.body.appendChild(
                    a
                );


                a.click();


                document.body.removeChild(
                    a
                );


                URL.revokeObjectURL(
                    url
                );

            }
        );



        /* ==========================================
           MODAL
        ========================================== */

        function showModal(
            title,
            message
        ) {

            modalTitle.textContent =
                title;

            modalText.textContent =
                message;

            modal.classList.add(
                "show"
            );

        }


        document
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            modal.classList.remove(
                                "show"
                            );

                        }
                    );

                }
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "show"
                    );

                }

            }
        );



        /* ==========================================
           LOGOUT
        ========================================== */

        logoutBtn.addEventListener(
            "click",
            () => {

                const answer =
                    confirm(
                        "Are you sure you want to sign out?"
                    );


                if (
                    answer
                ) {

                    window.location.href =
                        "login-selection.html";

                }

            }
        );


    }
);