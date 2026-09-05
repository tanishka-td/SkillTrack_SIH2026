const startButton = document.getElementById("startBtn");


startButton.addEventListener("click", () => {

    startButton.style.transform = "scale(0.95)";


    setTimeout(() => {

        window.location.href = "login-selection.html";

    }, 250);

});