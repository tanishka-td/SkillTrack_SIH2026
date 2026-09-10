/* =========================================================
   SKILLTRACK: TRAINEE DASHBOARD SCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  initInteractions();
});


// =========================================================
// LOAD DASHBOARD DATA FROM SUPABASE
// =========================================================

async function loadDashboard() {
  console.log("Loading SkillTrack dashboard...");

  try {

    // -----------------------------------------------------
    // GET CURRENT LOGGED-IN USER
    // -----------------------------------------------------

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("Authentication error:", userError);
      redirectToLogin();
      return;
    }

    if (!user) {
      console.warn("No logged-in trainee found.");
      redirectToLogin();
      return;
    }

    console.log("Logged-in user:", user.id);


    // -----------------------------------------------------
    // FETCH TRAINEE PROFILE
    // -----------------------------------------------------

    const {
      data: trainee,
      error: traineeError
    } = await supabaseClient
      .from("profile")
      .select("*")
      .eq("user_id", user.id)
      .single();


    // -----------------------------------------------------
    // HANDLE PROFILE ERROR
    // -----------------------------------------------------

    if (traineeError) {
      console.error("Trainee profile query failed:");
      console.error("Code:", traineeError.code);
      console.error("Message:", traineeError.message);
      console.error("Details:", traineeError.details);

      return;
    }

    if (!trainee) {
      console.error("No trainee profile found.");
      return;
    }


    // -----------------------------------------------------
    // PROFILE SUCCESS
    // -----------------------------------------------------

    console.log("Trainee profile loaded:", trainee);

    updateDashboard(trainee, user);

  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

  }
}


// =========================================================
// REDIRECT TO LOGIN
// =========================================================

function redirectToLogin() {
  window.location.href = "trainee_login.html";
}


// =========================================================
// UPDATE DASHBOARD UI
// =========================================================

function updateDashboard(trainee, user) {

  // -----------------------------------------------------
  // NAME
  // -----------------------------------------------------

  const name =
    trainee.full_name || "Trainee";

  const firstName =
    name.trim().split(/\s+/)[0];


  // -----------------------------------------------------
  // WELCOME MESSAGE
  // -----------------------------------------------------

  const welcome =
    document.getElementById("welcomeMessage");

  if (welcome) {
    welcome.textContent =
      `Good morning, ${firstName}`;
  }


  // -----------------------------------------------------
  // SIDEBAR NAME
  // -----------------------------------------------------

  const sidebarName =
    document.getElementById("sidebarName");

  if (sidebarName) {
    sidebarName.textContent = name;
  }


  // -----------------------------------------------------
  // TOP USER NAME
  // -----------------------------------------------------

  const topName =
    document.getElementById("topUserName");

  if (topName) {
    topName.textContent = name;
  }


  // -----------------------------------------------------
  // AVATARS
  // -----------------------------------------------------

  const initials =
    getInitials(name);

  const sidebarAvatar =
    document.getElementById("sidebarAvatar");

  if (sidebarAvatar) {
    sidebarAvatar.textContent = initials;
  }


  const topAvatar =
    document.getElementById("topAvatar");

  if (topAvatar) {
    topAvatar.textContent = initials;
  }


  // -----------------------------------------------------
  // TRAINEE ID
  // -----------------------------------------------------

  const traineeId =
    generateTraineeId(user.id);

  const traineeIdElement =
    document.getElementById("traineeId");

  if (traineeIdElement) {
    traineeIdElement.innerHTML =
      `<i class="fa-solid fa-id-badge"></i> ${traineeId}`;
  }


  // -----------------------------------------------------
  // PROFILE NAME
  // -----------------------------------------------------

  const profileName =
    document.getElementById("profileName");

  if (profileName) {
    profileName.textContent =
      trainee.full_name || "Not available";
  }


  // -----------------------------------------------------
  // PROFILE EMAIL
  // -----------------------------------------------------

  const email =
    trainee.email ||
    user.email ||
    "Not available";

  const profileEmail =
    document.getElementById("profileEmail");

  if (profileEmail) {
    profileEmail.textContent = email;
  }


  // -----------------------------------------------------
  // PROFILE LOCATION
  // -----------------------------------------------------

  const location =
    buildLocation(trainee);

  const profileLocation =
    document.getElementById("profileLocation");

  if (profileLocation) {
    profileLocation.textContent =
      location;
  }


  // -----------------------------------------------------
  // PROFILE STATUS
  // -----------------------------------------------------

  updateProfileStatus(
    trainee.profile_status
  );


  // -----------------------------------------------------
  // PROFILE COMPLETION
  // -----------------------------------------------------

  calculateProfileCompletion(
    trainee
  );
}


// =========================================================
// GET INITIALS
// =========================================================

function getInitials(name) {

  if (!name) {
    return "TR";
  }

  const parts =
    name.trim().split(/\s+/);


  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}


// =========================================================
// GENERATE TRAINEE ID
// =========================================================

function generateTraineeId(uuid) {

  if (!uuid) {
    return "ST-......";
  }

  const cleanUuid =
    uuid.replace(/-/g, "");

  return (
    "ST-" +
    cleanUuid
      .substring(0, 6)
      .toUpperCase()
  );
}


// =========================================================
// BUILD LOCATION
// =========================================================

function buildLocation(trainee) {

  const locations = [];


  // City / Block / Town
  if (trainee.city_block_town) {
    locations.push(
      trainee.city_block_town
    );
  }


  // District
  if (trainee.district) {
    locations.push(
      trainee.district
    );
  }


  // State
  if (trainee.state) {
    locations.push(
      trainee.state
    );
  }


  if (locations.length === 0) {
    return "Not available";
  }


  return locations.join(", ");
}


// =========================================================
// UPDATE PROFILE STATUS
// =========================================================

function updateProfileStatus(status) {

  const statusDisplay =
    document.getElementById(
      "dashboardStatus"
    );

  if (!statusDisplay) {
    return;
  }


  const statusLabels = {
    active: "Profile Active",
    inactive: "Inactive",
    pending: "Verification Pending"
  };


  statusDisplay.textContent =
    statusLabels[status] ||
    "Profile Active";
}


// =========================================================
// PROFILE COMPLETION
// =========================================================

function calculateProfileCompletion(trainee) {

  const fields = [

    trainee.full_name,

    trainee.age,

    trainee.gender,

    trainee.mobile_number,

    trainee.email,

    trainee.state,

    trainee.district,

    trainee.city_block_town

  ];


  let completed = 0;


  fields.forEach((field) => {

    if (
      field !== null &&
      field !== undefined &&
      String(field).trim() !== ""
    ) {
      completed++;
    }

  });


  const percentage =
    Math.round(
      (completed / fields.length) * 100
    );


  // -----------------------------------------------------
  // PERCENTAGE TEXT
  // -----------------------------------------------------

  const percentageElement =
    document.getElementById(
      "profilePercentage"
    );

  if (percentageElement) {

    percentageElement.textContent =
      percentage + "%";

  }


  // -----------------------------------------------------
  // SVG PROGRESS RING
  // -----------------------------------------------------

  const circle =
    document.getElementById(
      "progressCircle"
    );

  if (circle) {

    const radius =
      circle.r.baseVal.value;

    const circumference =
      2 * Math.PI * radius;


    circle.style.strokeDasharray =
      `${circumference} ${circumference}`;


    const offset =
      circumference -
      (percentage / 100) *
      circumference;


    circle.style.strokeDashoffset =
      offset;
  }


  // -----------------------------------------------------
  // COMPLETION TEXT
  // -----------------------------------------------------

  const completionText =
    document.getElementById(
      "completionText"
    );


  if (completionText) {

    if (percentage === 100) {

      completionText.textContent =
        "Complete";

    } else if (percentage >= 75) {

      completionText.textContent =
        "Almost there";

    } else if (percentage >= 50) {

      completionText.textContent =
        "In progress";

    } else {

      completionText.textContent =
        "Incomplete";
    }
  }
}


// =========================================================
// EVENT LISTENERS & UI INTERACTIONS
// =========================================================

function initInteractions() {


  // =======================================================
  // SIGN OUT
  // =======================================================

  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        logoutButton.disabled = true;


        const { error } =
          await supabaseClient.auth.signOut();


        if (error) {

          console.error(
            "Sign out error:",
            error
          );

          alert(
            "Unable to sign out."
          );

          logoutButton.disabled = false;

          return;
        }


        window.location.href =
          "trainee_login.html";

      }
    );

  }


  // =======================================================
  // QUICK STATUS SELECTION
  // =======================================================

  const statusButtons =
    document.querySelectorAll(
      ".quick-status button"
    );


  statusButtons.forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        // Remove active from all
        statusButtons.forEach((btn) => {

          btn.classList.remove(
            "active"
          );

        });


        // Activate clicked button
        button.classList.add(
          "active"
        );


        // Get selected status
        const status =
          button.dataset.status;


        // Update dashboard text
        const statusDisplay =
          document.getElementById(
            "dashboardStatus"
          );


        if (statusDisplay) {

          statusDisplay.textContent =
            status;

        }


        console.log(
          "Selected career status:",
          status
        );

      }
    );

  });


  // =======================================================
  // MOBILE NAVIGATION DRAWER
  // =======================================================

  const menuButton =
    document.getElementById(
      "menuBtn"
    );


  const sidebar =
    document.getElementById(
      "sidebar"
    );


  if (menuButton && sidebar) {

    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );

      }
    );

  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Calculate and populate Salary Prediction based on skills
  const traineeSkills = ['React.js', 'Node.js']; 
  const yearsExperience = 1;
  
  function predictSalary(skills, exp) {
    // Mock algorithm: Base salary + (skill value) + (experience multiplier)
    let baseMin = 300000;
    let baseMax = 400000;
    
    // Add value for high-demand skills
    if(skills.includes('React.js')) { baseMin += 50000; baseMax += 70000; }
    if(skills.includes('Node.js')) { baseMin += 50000; baseMax += 80000; }
    
    // Experience multiplier
    baseMin = baseMin + (exp * 50000);
    baseMax = baseMax + (exp * 70000);
    
    // Format to Lakhs (L)
    const formatINR = (num) => `₹${(num / 100000).toFixed(1)}L`;
    return `${formatINR(baseMin)} - ${formatINR(baseMax)}`;
  }

  const salaryText = predictSalary(traineeSkills, yearsExperience);
  document.getElementById('predictedSalary').textContent = salaryText;

  // 2. Job Retention Calculation
  const employmentStartDate = new Date('2025-11-01'); // Replace with DB value
  const currentDate = new Date();
  
  // Calculate months difference
  let tenureMonths = (currentDate.getFullYear() - employmentStartDate.getFullYear()) * 12;
  tenureMonths -= employmentStartDate.getMonth();
  tenureMonths += currentDate.getMonth();

  if (tenureMonths > 0) {
    document.getElementById('tenureMonths').textContent = `${tenureMonths} Months`;
    // Calculate percentage towards 12-month goal
    let retentionPercentage = Math.min((tenureMonths / 12) * 100, 100);
    document.querySelector('.retention-bar-fill').style.width = `${retentionPercentage}%`;
  }
});


// Add this logic to your trainee_dashboard.js file where user data is loaded
function calculatePlacementProbability(traineeData) {
  // Example weights: Attendance (40%), Profile Completion (40%), Skill Readiness (20%)
  const attendance = traineeData.attendanceScore || 90; // e.g., 94.2
  const profileCompletion = traineeData.profileCompletion || 75; // e.g. from progress circle
  const hasCompletedModules = traineeData.modulesCompleted ? 20 : 10;

  const score = Math.min(
    Math.round(attendance * 0.4 + profileCompletion * 0.4 + hasCompletedModules * 1),
    99
  );

  const scoreElement = document.getElementById('placementScore');
  const badgeElement = document.getElementById('probabilityBadge');
  const textElement = document.getElementById('probabilityText');

  if (scoreElement) scoreElement.textContent = `${score}%`;

  if (badgeElement && textElement) {
    if (score >= 85) {
      badgeElement.className = 'badge verified';
      badgeElement.innerHTML = `<i class="fa-solid fa-bolt"></i> High Readiness`;
      textElement.textContent = `Excellent placement outlook! Your strong engagement and consistent attendance put you in top tier candidates.`;
    } else if (score >= 60) {
      badgeElement.className = 'badge warning';
      badgeElement.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Moderate Readiness`;
      textElement.textContent = `Good progress. Complete your profile details and pending assessments to boost your match probability.`;
    } else {
      badgeElement.className = 'badge danger';
      badgeElement.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Action Required`;
      textElement.textContent = `Increase your attendance and update your technical skills to improve job market competitiveness.`;
    }
  }
}