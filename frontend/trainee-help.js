document.addEventListener(
    "DOMContentLoaded",
    () => {

        const faqItems =
            document.querySelectorAll(
                ".faq-item"
            );


        faqItems.forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    item.classList.toggle(
                        "open"
                    );


                    const icon =
                        item.querySelector(
                            ":scope > span"
                        );


                    icon.textContent =
                        item.classList.contains(
                            "open"
                        )
                            ? "−"
                            : "+";

                }
            );

        });


        const support =
            document.getElementById(
                "supportBtn"
            );

        const message =
            document.getElementById(
                "supportMessage"
            );


        support.addEventListener(
            "click",
            () => {

                message.style.color =
                    "#15803d";

                message.textContent =
                    "Support request area is ready to be connected to your official support service.";

            }
        );

    }
);