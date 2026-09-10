document.addEventListener("DOMContentLoaded", () => {

    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {

        item.addEventListener("click", () => {

            const isOpen = item.classList.contains("active");

            // Close all FAQ items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove("active");
                otherItem.querySelector("span").textContent = "+";
            });

            // Open clicked FAQ
            if (!isOpen) {
                item.classList.add("active");
                item.querySelector("span").textContent = "−";
            }

        });

    });

    // Contact Support button
    const supportBtn = document.getElementById("supportBtn");
    const supportMessage = document.getElementById("supportMessage");

    if (supportBtn) {

        supportBtn.addEventListener("click", () => {

            supportMessage.textContent =
                "Support request received. Our team will contact you soon.";

            supportMessage.className = "message success";

        });

    }

});