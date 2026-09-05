const traineeCard = document.getElementById("traineeCard");

const governmentCard = document.getElementById("governmentCard");



/* Trainee Login */

traineeCard.addEventListener("click", () => {

    traineeCard.style.transform =
        "scale(0.96)";


    setTimeout(() => {

        window.location.href =
            "trainee-login.html";

    }, 250);

});



/* Government Login */

governmentCard.addEventListener("click", () => {

    governmentCard.style.transform =
        "scale(0.96)";


    setTimeout(() => {

        window.location.href =
            "government-login.html";

    }, 250);

});