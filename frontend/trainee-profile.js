document.addEventListener(
    "DOMContentLoaded",
    () => {

        const save =
            document.getElementById(
                "saveProfile"
            );

        const message =
            document.getElementById(
                "profileMessage"
            );


        save.addEventListener(
            "click",
            () => {

                message.style.color =
                    "#15803d";

                message.textContent =
                    "Profile changes saved successfully.";

            }
        );

    }
);