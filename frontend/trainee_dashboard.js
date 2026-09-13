/* =========================================================
   SKILLTRACK: TRAINEE DASHBOARD
   LIVE SUPABASE DATA VERSION
   ========================================================= */

let dashboardUser = null;
let dashboardProfile = null;
let dashboardTrainings = [];
let dashboardEmployment = [];
let latestTraining = null;
let latestEmployment = null;

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  initInteractions();
});

/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value, fallback = "Not available") {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? fallback;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getInitials(name) {
  if (!name) return "TR";

  const parts = String(name).trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function generateTraineeId(uuid) {
  if (!uuid) return "ST-......";

  return (
    "ST-" +
    String(uuid)
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase()
  );
}

function buildLocation(trainee) {
  const locations = [];

  if (trainee?.city_block_town) {
    locations.push(trainee.city_block_town);
  }

  if (trainee?.district) {
    locations.push(trainee.district);
  }

  if (trainee?.state) {
    locations.push(trainee.state);
  }

  return locations.length
    ? locations.join(", ")
    : "Not available";
}

function getStatus(record) {
  if (!record) return null;

  return (
    record.employment_status ||
    record.status ||
    null
  );
}

function getSalary(record) {
  if (!record) return null;

  return safeNumber(
    record.salary ??
    record.monthly_salary
  );
}

function getJoiningDate(record) {
  if (!record) return null;

  return (
    record.joining_date ||
    record.start_date ||
    null
  );
}

function isEmploymentActive(record) {
  const status = String(getStatus(record) || "").toLowerCase();

  return [
    "active",
    "employed",
    "business",
    "apprenticeship",
    "self-employed"
  ].includes(status);
}

/* =========================================================
   AUTHENTICATION + DATA LOADING
   ========================================================= */

async function loadDashboard() {
  console.log("Loading SkillTrack trainee dashboard...");

  try {
    if (typeof supabaseClient === "undefined") {
      console.error(
        "Supabase client is not loaded. Check supabase.js."
      );
      return;
    }

    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      redirectToLogin();
      return;
    }

    dashboardUser = user;

    const [
      profileResponse,
      trainingResponse,
      employmentResponse
    ] = await Promise.all([
      supabaseClient
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabaseClient
        .from("trainings")
        .select("*")
        .eq("trainee_id", user.id)
        .order("created_at", { ascending: false }),

      supabaseClient
        .from("employment_records")
        .select("*")
        .eq("trainee_id", user.id)
        .order("created_at", { ascending: false })
    ]);

    if (profileResponse.error) {
      console.error(
        "Profile query failed:",
        profileResponse.error
      );
    }

    if (trainingResponse.error) {
      console.error(
        "Training query failed:",
        trainingResponse.error
      );
    }

    if (employmentResponse.error) {
      console.error(
        "Employment query failed:",
        employmentResponse.error
      );
    }

    dashboardProfile = profileResponse.data || {};
    dashboardTrainings = trainingResponse.data || [];
    dashboardEmployment = employmentResponse.data || [];

    latestTraining =
      dashboardTrainings.length
        ? dashboardTrainings[0]
        : null;

    latestEmployment =
      dashboardEmployment.length
        ? dashboardEmployment[0]
        : null;

    console.log("Live dashboard data:", {
      profile: dashboardProfile,
      trainings: dashboardTrainings,
      employment: dashboardEmployment
    });

    updateDashboard();

  } catch (error) {
    console.error(
      "Dashboard loading error:",
      error
    );
  }
}

function redirectToLogin() {
  window.location.href = "trainee_login.html";
}

/* =========================================================
   MAIN DASHBOARD RENDER
   ========================================================= */

function updateDashboard() {
  const trainee = dashboardProfile || {};
  const user = dashboardUser || {};

  updateIdentity(trainee, user);
  updateProfileCompletion(trainee);
  updateTrainingCard();
  updateCurrentStatus();
  updateFollowUpWindow();
  updateJourney();
  updatePlacementReadiness(trainee);
  updateSalaryCard();
  updateRetention();
  updateRecentActivity();
  updateJobMatches();
}

/* =========================================================
   IDENTITY
   ========================================================= */

function updateIdentity(trainee, user) {
  const name = trainee.full_name || "Trainee";
  const firstName =
    name.trim().split(/\s+/)[0] || "Trainee";

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  setText(
    "welcomeMessage",
    `${greeting}, ${firstName}`
  );

  setText(
    "sidebarName",
    name
  );

  setText(
    "topUserName",
    name
  );

  const initials = getInitials(name);

  setText(
    "sidebarAvatar",
    initials
  );

  setText(
    "topAvatar",
    initials
  );

  const traineeIdElement =
    document.getElementById("traineeId");

  if (traineeIdElement) {
    traineeIdElement.innerHTML =
      `<i class="fa-solid fa-id-badge"></i> ${generateTraineeId(user.id)}`;
  }

  setText(
    "profileName",
    name
  );

  setText(
    "profileEmail",
    trainee.email ||
    user.email ||
    "Not available"
  );

  setText(
    "profileLocation",
    buildLocation(trainee)
  );

  const status =
    String(
      trainee.profile_status || "active"
    ).toLowerCase();

  const statusLabels = {
    active: "Profile Active",
    inactive: "Inactive",
    pending: "Verification Pending"
  };

  setText(
    "dashboardStatus",
    statusLabels[status] ||
    "Profile Active"
  );
}

/* =========================================================
   PROFILE COMPLETION
   ========================================================= */

function updateProfileCompletion(trainee) {
  const fields = [
    trainee.full_name,
    trainee.age,
    trainee.gender,
    trainee.mobile_number,
    trainee.email || dashboardUser?.email,
    trainee.state,
    trainee.district,
    trainee.city_block_town
  ];

  const completed =
    fields.filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    ).length;

  const percentage =
    Math.round(
      (completed / fields.length) * 100
    );

  setText(
    "profilePercentage",
    `${percentage}%`
  );

  const circle =
    document.getElementById(
      "progressCircle"
    );

  if (circle && circle.r?.baseVal) {
    const radius =
      circle.r.baseVal.value;

    const circumference =
      2 * Math.PI * radius;

    circle.style.strokeDasharray =
      `${circumference} ${circumference}`;

    circle.style.strokeDashoffset =
      circumference -
      (percentage / 100) *
      circumference;
  }

  let completionText =
    "Incomplete";

  if (percentage === 100) {
    completionText = "Complete";
  } else if (percentage >= 75) {
    completionText = "Almost there";
  } else if (percentage >= 50) {
    completionText = "In progress";
  }

  setText(
    "completionText",
    completionText
  );

  dashboardProfile.__completion =
    percentage;
}

/* =========================================================
   TRAINING OVERVIEW
   ========================================================= */

function updateTrainingCard() {
  const training =
    latestTraining;

  const courseStrong =
    document.querySelector(
      ".course-text strong"
    );

  const courseSpan =
    document.querySelector(
      ".course-text span"
    );

  const detailRows =
    document.querySelectorAll(
      ".details-list .detail-row"
    );

  if (!training) {
    if (courseStrong) {
      courseStrong.textContent =
        "No training record found";
    }

    if (courseSpan) {
      courseSpan.textContent =
        "Add your first training programme";
    }

    setDetailRow(
      detailRows,
      0,
      "Training Center",
      "Not available"
    );

    setDetailRow(
      detailRows,
      1,
      "Term Duration",
      "Not available"
    );

    setDetailRow(
      detailRows,
      2,
      "Attendance Score",
      "Not available"
    );

    return;
  }

  if (courseStrong) {
    courseStrong.textContent =
      training.course_name ||
      "Training Programme";
  }

  if (courseSpan) {
    courseSpan.textContent =
      training.provider_name ||
      training.provider ||
      "Training provider not available";
  }

  const duration =
    calculateDuration(
      training.start_date,
      training.completion_date
    );

  const attendance =
    safeNumber(
      training.attendance ??
      training.attendance_percentage
    );

  setDetailRow(
    detailRows,
    0,
    "Training Center",
    training.provider_name ||
    training.provider ||
    "Not available"
  );

  setDetailRow(
    detailRows,
    1,
    "Term Duration",
    duration ||
    "In progress"
  );

  setDetailRow(
    detailRows,
    2,
    "Attendance Score",
    attendance !== null
      ? `${attendance}%`
      : "Not available"
  );
}

function setDetailRow(
  rows,
  index,
  label,
  value
) {
  if (!rows[index]) return;

  const span =
    rows[index].querySelector(
      "span"
    );

  const strong =
    rows[index].querySelector(
      "strong"
    );

  if (span) {
    span.textContent = label;
  }

  if (strong) {
    strong.textContent = value;
  }
}

function calculateDuration(
  start,
  end
) {
  if (!start) return null;

  const startDate =
    new Date(start);

  const endDate =
    end
      ? new Date(end)
      : new Date();

  if (
    Number.isNaN(
      startDate.getTime()
    ) ||
    Number.isNaN(
      endDate.getTime()
    )
  ) {
    return null;
  }

  const months =
    Math.max(
      0,
      (
        endDate.getFullYear() -
        startDate.getFullYear()
      ) * 12 +
      endDate.getMonth() -
      startDate.getMonth()
    );

  if (months < 1) {
    return "< 1 Month";
  }

  return (
    `${months} Month` +
    (months === 1 ? "" : "s")
  );
}

/* =========================================================
   CURRENT STATUS
   ========================================================= */

function updateCurrentStatus() {
  const status =
    getStatus(
      latestEmployment
    );

  const statusDisplay =
    document.getElementById(
      "dashboardStatus"
    );

  if (
    statusDisplay &&
    status
  ) {
    statusDisplay.textContent =
      formatCareerStatus(
        status
      );
  }

  const buttons =
    document.querySelectorAll(
      ".quick-status button"
    );

  buttons.forEach(button => {
    const buttonStatus =
      String(
        button.dataset.status || ""
      ).toLowerCase();

    const liveStatus =
      String(
        status || ""
      ).toLowerCase();

    const matches =
      normaliseStatus(
        buttonStatus
      ) ===
      normaliseStatus(
        liveStatus
      );

    button.classList.toggle(
      "active",
      matches
    );
  });
}

function normaliseStatus(status) {
  const value =
    String(
      status || ""
    ).toLowerCase();

  if (
    value === "active" ||
    value === "employed"
  ) {
    return "employed";
  }

  if (
    value === "business" ||
    value === "self-employed"
  ) {
    return "business";
  }

  if (
    value === "apprenticeship" ||
    value === "apprentice"
  ) {
    return "apprenticeship";
  }

  if (
    value === "unemployed" ||
    value === "job seeking"
  ) {
    return "unemployed";
  }

  return value;
}

function formatCareerStatus(
  status
) {
  const normalised =
    normaliseStatus(status);

  const labels = {
    employed: "Employed",
    business: "Self-Employed",
    apprenticeship: "Apprentice",
    unemployed: "Job Seeking"
  };

  return (
    labels[normalised] ||
    String(status)
  );
}

/* =========================================================
   FOLLOW-UP WINDOW
   ========================================================= */

function updateFollowUpWindow() {
  const training =
    latestTraining;

  const statCards =
    document.querySelectorAll(
      ".stat-card"
    );

  if (
    !training ||
    !statCards[2]
  ) {
    return;
  }

  const startDate =
    training.completion_date ||
    training.start_date;

  if (!startDate) return;

  const baseDate =
    new Date(startDate);

  if (
    Number.isNaN(
      baseDate.getTime()
    )
  ) {
    return;
  }

  const now =
    new Date();

  const monthsElapsed =
    Math.max(
      0,
      (
        now.getFullYear() -
        baseDate.getFullYear()
      ) * 12 +
      now.getMonth() -
      baseDate.getMonth()
    );

  let checkpoint =
    "Month 3";

  let daysToNext =
    daysUntilMonths(
      baseDate,
      now,
      3
    );

  if (
    monthsElapsed >= 3 &&
    monthsElapsed < 6
  ) {
    checkpoint =
      "Month 6";

    daysToNext =
      daysUntilMonths(
        baseDate,
        now,
        6
      );

  } else if (
    monthsElapsed >= 6 &&
    monthsElapsed < 12
  ) {
    checkpoint =
      "Month 12";

    daysToNext =
      daysUntilMonths(
        baseDate,
        now,
        12
      );

  } else if (
    monthsElapsed >= 12
  ) {
    checkpoint =
      "12-Month Review";

    daysToNext = 0;
  }

  const data =
    statCards[2].querySelector(
      ".stat-data"
    );

  if (!data) return;

  const strongs =
    data.querySelectorAll(
      "strong"
    );

  const small =
    data.querySelector(
      "small"
    );

  if (strongs[1]) {
    strongs[1].textContent =
      checkpoint;
  }

  if (small) {
    small.textContent =
      daysToNext > 0
        ? `Next: ${daysToNext} Days`
        : "Review due";
  }
}

function daysUntilMonths(
  baseDate,
  now,
  months
) {
  const target =
    new Date(baseDate);

  target.setMonth(
    target.getMonth() +
    months
  );

  const difference =
    target.getTime() -
    now.getTime();

  return Math.max(
    0,
    Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    )
  );
}

/* =========================================================
   JOURNEY TIMELINE
   ========================================================= */

function updateJourney() {
  const items =
    document.querySelectorAll(
      ".journey .journey-item"
    );

  if (!items.length) return;

  const training =
    latestTraining;

  const employment =
    latestEmployment;

  const trainingStarted =
    Boolean(
      training?.start_date
    );

  const trainingCompleted =
    Boolean(
      training?.completion_date
    );

  const certificationIssued =
    String(
      training?.certification_status ||
      ""
    ).toLowerCase() ===
    "issued";

  const employed =
    isEmploymentActive(
      employment
    );

  const checkpoints =
    dashboardEmployment.filter(
      record =>
        record &&
        (
          record.recorded_at ||
          record.updated_at ||
          record.created_at
        )
    );

  items.forEach(item =>
    item.classList.remove(
      "done",
      "current"
    )
  );

  if (items[0]) {
    items[0].classList.add(
      trainingStarted
        ? "done"
        : "current"
    );
  }

  if (items[1]) {
    if (trainingCompleted) {
      items[1].classList.add(
        "done"
      );
    } else {
      items[1].classList.add(
        "current"
      );
    }
  }

  if (items[2]) {
    if (certificationIssued) {
      items[2].classList.add(
        "done"
      );
    } else if (
      trainingCompleted
    ) {
      items[2].classList.add(
        "current"
      );
    }
  }

  if (items[3]) {
    if (employed) {
      items[3].classList.add(
        "done"
      );
    } else if (
      certificationIssued
    ) {
      items[3].classList.add(
        "current"
      );
    }
  }

  if (items[4]) {
    if (checkpoints.length > 0) {
      items[4].classList.add(
        "current"
      );
    }
  }

  items.forEach(
    (item, index) => {
      const dot =
        item.querySelector(
          ".journey-dot"
        );

      if (!dot) return;

      if (
        item.classList.contains(
          "done"
        )
      ) {
        dot.innerHTML =
          '<i class="fa-solid fa-check"></i>';

      } else if (
        item.classList.contains(
          "current"
        )
      ) {
        dot.innerHTML = "";

      } else {
        dot.textContent =
          String(index + 1);
      }
    }
  );
}

/* =========================================================
   PLACEMENT READINESS
   ========================================================= */

function updatePlacementReadiness(
  trainee
) {
  const attendance =
    safeNumber(
      latestTraining?.attendance ??
      latestTraining?.attendance_percentage
    );

  const assessment =
    safeNumber(
      latestTraining?.assessment_score
    );

  const profileCompletion =
    safeNumber(
      trainee.__completion
    ) ?? 0;

  const certificationIssued =
    String(
      latestTraining?.certification_status ||
      ""
    ).toLowerCase() ===
    "issued";

  const employed =
    isEmploymentActive(
      latestEmployment
    );

  let score = 0;

  score +=
    (attendance ?? 0) *
    0.35;

  score +=
    profileCompletion *
    0.25;

  score +=
    (assessment ?? 0) *
    0.20;

  score +=
    certificationIssued
      ? 10
      : 0;

  score +=
    employed
      ? 10
      : 0;

  score =
    Math.min(
      99,
      Math.round(score)
    );

  const hasEnoughData =
    attendance !== null ||
    assessment !== null ||
    profileCompletion > 0;

  if (!hasEnoughData) {
    setText(
      "placementScore",
      "--"
    );

    setText(
      "probabilityText",
      "Complete your training and profile details to generate a personalised readiness estimate."
    );

    return;
  }

  setText(
    "placementScore",
    `${score}%`
  );

  const badge =
    document.getElementById(
      "probabilityBadge"
    );

  const text =
    document.getElementById(
      "probabilityText"
    );

  if (
    badge &&
    text
  ) {
    if (score >= 85) {
      badge.className =
        "badge verified";

      badge.innerHTML =
        '<i class="fa-solid fa-bolt"></i> High Readiness';

      text.textContent =
        "Strong current readiness based on your live attendance, assessment, profile completion and verified career milestones.";

    } else if (score >= 60) {
      badge.className =
        "badge warning";

      badge.innerHTML =
        '<i class="fa-solid fa-triangle-exclamation"></i> Moderate Readiness';

      text.textContent =
        "Good progress. Completing pending training, assessment, certification or profile information can improve readiness.";

    } else {
      badge.className =
        "badge danger";

      badge.innerHTML =
        '<i class="fa-solid fa-circle-exclamation"></i> Action Required';

      text.textContent =
        "More training progress, stronger assessment performance or additional profile information is needed.";
    }
  }

  updateReadinessTips(
    attendance,
    assessment,
    profileCompletion,
    certificationIssued
  );
}

function updateReadinessTips(
  attendance,
  assessment,
  profileCompletion,
  certificationIssued
) {
  const list =
    document.querySelector(
      ".tips-list"
    );

  if (!list) return;

  const tips = [];

  if (
    attendance !== null &&
    attendance >= 85
  ) {
    tips.push(
      '<i class="fa-solid fa-check-circle"></i> Strong attendance record'
    );
  } else {
    tips.push(
      '<i class="fa-solid fa-arrow-up"></i> Improve training attendance'
    );
  }

  if (
    assessment !== null &&
    assessment >= 70
  ) {
    tips.push(
      '<i class="fa-solid fa-check-circle"></i> Assessment performance is on track'
    );
  } else {
    tips.push(
      '<i class="fa-solid fa-arrow-up"></i> Complete or improve your assessment'
    );
  }

  if (
    profileCompletion >= 100
  ) {
    tips.push(
      '<i class="fa-solid fa-check-circle"></i> Profile is complete'
    );
  } else {
    tips.push(
      '<i class="fa-solid fa-user-pen"></i> Complete remaining profile fields'
    );
  }

  if (!certificationIssued) {
    tips.push(
      '<i class="fa-solid fa-certificate"></i> Certification is not yet marked as issued'
    );
  }

  list.innerHTML =
    tips
      .slice(0, 3)
      .map(
        item => `<li>${item}</li>`
      )
      .join("");
}

/* =========================================================
   SALARY CARD
   ========================================================= */

function updateSalaryCard() {
  const salaryElement =
    document.getElementById(
      "predictedSalary"
    );

  const skillTags =
    document.querySelector(
      ".skill-tags"
    );

  if (!salaryElement) return;

  const salary =
    getSalary(
      latestEmployment
    );

  if (
    salary !== null &&
    isEmploymentActive(
      latestEmployment
    )
  ) {
    const annual =
      salary * 12;

    salaryElement.textContent =
      formatSalaryRange(
        annual,
        annual
      );

    const period =
      document.querySelector(
        ".salary-period"
      );

    if (period) {
      period.textContent =
        "Current Annualised CTC";
    }

  } else {
    salaryElement.textContent =
      "Not available";

    const period =
      document.querySelector(
        ".salary-period"
      );

    if (period) {
      period.textContent =
        "Add verified employment salary to view";
    }
  }

  if (skillTags) {
    const course =
      latestTraining?.course_name ||
      "Current training";

    skillTags.innerHTML = `
      <span class="tag">
        ${escapeHtml(course)}
      </span>

      ${
        latestTraining?.assessment_score != null
          ? `
            <span class="tag">
              Assessment
              ${escapeHtml(
                String(
                  latestTraining.assessment_score
                )
              )}%
            </span>
          `
          : ""
      }

      ${
        latestTraining?.attendance != null ||
        latestTraining?.attendance_percentage != null
          ? `
            <span class="tag">
              Attendance
              ${escapeHtml(
                String(
                  latestTraining.attendance ??
                  latestTraining.attendance_percentage
                )
              )}%
            </span>
          `
          : ""
      }
    `;
  }
}

function formatSalaryRange(
  min,
  max
) {
  const format =
    value =>
      `₹${(
        value / 100000
      ).toFixed(1)}L`;

  return min === max
    ? format(min)
    : `${format(min)} - ${format(max)}`;
}

/* =========================================================
   RETENTION
   ========================================================= */

function updateRetention() {
  const start =
    getJoiningDate(
      latestEmployment
    );

  const bar =
    document.querySelector(
      ".retention-bar-fill"
    );

  const tenureElement =
    document.getElementById(
      "tenureMonths"
    );

  const insight =
    document.querySelector(
      ".retention-insight"
    );

  if (!start) {
    if (tenureElement) {
      tenureElement.textContent =
        "Not started";
    }

    if (bar) {
      bar.style.width =
        "0%";
    }

    if (insight) {
      insight.innerHTML =
        '<i class="fa-solid fa-circle-info"></i> Employment start date will appear here after a career status is recorded.';
    }

    return;
  }

  const startDate =
    new Date(start);

  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    return;
  }

  const endDate =
    latestEmployment?.leaving_date
      ? new Date(
          latestEmployment.leaving_date
        )
      : new Date();

  let months =
    (
      endDate.getFullYear() -
      startDate.getFullYear()
    ) * 12;

  months +=
    endDate.getMonth() -
    startDate.getMonth();

  months =
    Math.max(
      0,
      months
    );

  if (tenureElement) {
    tenureElement.textContent =
      `${months} Month${
        months === 1
          ? ""
          : "s"
      }`;
  }

  const percentage =
    Math.min(
      100,
      (months / 12) * 100
    );

  if (bar) {
    bar.style.width =
      `${percentage}%`;
  }

  if (insight) {
    if (months >= 12) {
      insight.innerHTML =
        '<i class="fa-solid fa-circle-check"></i> You have reached the 12-month retention milestone.';
    } else {
      const remaining =
        12 - months;

      insight.innerHTML =
        `<i class="fa-solid fa-circle-info"></i> ${remaining} month${
          remaining === 1
            ? ""
            : "s"
        } remaining to reach the 1-year retention milestone.`;
    }
  }
}

/* =========================================================
   JOB MATCHES
   ========================================================= */

function updateJobMatches() {
  const list =
    document.querySelector(
      ".job-list"
    );

  if (!list) return;

  const role =
    latestEmployment?.job_role ||
    null;

  const course =
    latestTraining?.course_name ||
    null;

  if (role) {
    list.innerHTML = `
      <div class="job-item">
        <div class="job-details">
          <strong>
            ${escapeHtml(role)}
          </strong>

          <span>
            ${
              escapeHtml(
                latestEmployment?.company_name ||
                "Current employer"
              )
            }
          </span>
        </div>

        <span class="match-badge high-match">
          Current
        </span>
      </div>
    `;

    return;
  }

  if (course) {
    list.innerHTML = `
      <div class="job-item">
        <div class="job-details">
          <strong>
            ${escapeHtml(course)}
            pathway
          </strong>

          <span>
            Based on your current training record
          </span>
        </div>

        <span class="match-badge med-match">
          Profile
        </span>
      </div>
    `;

    return;
  }

  list.innerHTML = `
    <div class="job-item">
      <div class="job-details">
        <strong>
          No job match data yet
        </strong>

        <span>
          Complete a training record to personalise this section.
        </span>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

function updateRecentActivity() {
  const stream =
    document.querySelector(
      ".activity-stream"
    );

  if (!stream) return;

  const events = [];

  if (
    dashboardProfile?.full_name
  ) {
    events.push({
      icon: "fa-user-plus",
      color: "blue",
      title:
        "Trainee Record Loaded",
      description:
        "Your profile was loaded from the SkillTrack database.",
      time: "Live"
    });
  }

  if (latestTraining) {
    events.push({
      icon:
        "fa-graduation-cap",
      color: "green",
      title:
        latestTraining.completion_date
          ? "Training Completed"
          : "Training In Progress",
      description:
        latestTraining.course_name ||
        "Training record available.",
      time:
        latestTraining.completion_date
          ? formatDate(
              latestTraining.completion_date
            )
          : "Active"
    });
  }

  if (latestEmployment) {
    events.push({
      icon:
        "fa-briefcase",
      color: "purple",
      title:
        "Career Status Updated",
      description:
        `${formatCareerStatus(
          getStatus(
            latestEmployment
          )
        )}${
          latestEmployment.company_name
            ? ` • ${latestEmployment.company_name}`
            : ""
        }`,
      time:
        formatDate(
          latestEmployment.updated_at ||
          latestEmployment.recorded_at ||
          latestEmployment.created_at
        )
    });
  }

  if (!events.length) {
    events.push({
      icon:
        "fa-circle-info",
      color: "blue",
      title:
        "No Recent Events",
      description:
        "Your dashboard activity will appear here as records are added.",
      time: "Waiting"
    });
  }

  stream.innerHTML =
    events
      .slice(0, 3)
      .map(
        event => `
          <div class="activity-item">

            <div class="activity-icon ${event.color}">
              <i class="fa-solid ${event.icon}"></i>
            </div>

            <div class="activity-content">
              <strong>
                ${escapeHtml(
                  event.title
                )}
              </strong>

              <span>
                ${escapeHtml(
                  event.description
                )}
              </span>
            </div>

            <time>
              ${escapeHtml(
                event.time
              )}
            </time>

          </div>
        `
      )
      .join("");
}

/* =========================================================
   QUICK STATUS UPDATE
   ========================================================= */

function initInteractions() {

  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      handleLogout
    );
  }

  const statusButtons =
    document.querySelectorAll(
      ".quick-status button"
    );

  statusButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const status =
            button.dataset.status;

          await saveQuickStatus(
            status,
            button
          );

        }
      );

    }
  );

  const menuButton =
    document.getElementById(
      "menuBtn"
    );

  const sidebar =
    document.getElementById(
      "sidebar"
    );

  if (
    menuButton &&
    sidebar
  ) {
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

async function saveQuickStatus(
  selectedStatus,
  clickedButton
) {
  if (!dashboardUser) {
    alert(
      "Authentication required. Please sign in again."
    );

    return;
  }

  const statusMap = {
    Employed: "Employed",
    Business: "Business",
    Apprenticeship:
      "Apprenticeship",
    Unemployed: "Unemployed"
  };

  const status =
    statusMap[selectedStatus] ||
    selectedStatus;

  const buttons =
    document.querySelectorAll(
      ".quick-status button"
    );

  buttons.forEach(
    button => {
      button.disabled = true;
    }
  );

  try {

    const existing =
      latestEmployment || {};

    const payload = {
      trainee_id:
        dashboardUser.id,

      employment_status:
        status,

      company_name:
        status === "Unemployed"
          ? null
          : existing.company_name ||
            null,

      job_role:
        status === "Unemployed"
          ? null
          : existing.job_role ||
            null,

      salary:
        status === "Unemployed"
          ? null
          : getSalary(
              existing
            ),

      joining_date:
        status === "Unemployed"
          ? null
          : getJoiningDate(
              existing
            ),

      employment_type:
        status === "Unemployed"
          ? null
          : existing.employment_type ||
            null,

      updated_at:
        new Date().toISOString()
    };

    let response;

    if (existing.id) {

      response =
        await supabaseClient
          .from(
            "employment_records"
          )
          .update(payload)
          .eq(
            "id",
            existing.id
          )
          .select()
          .single();

    } else {

      response =
        await supabaseClient
          .from(
            "employment_records"
          )
          .insert([payload])
          .select()
          .single();

    }

    if (response.error) {
      throw response.error;
    }

    latestEmployment =
      response.data;

    updateCurrentStatus();
    updateSalaryCard();
    updateRetention();
    updateRecentActivity();
    updateJourney();

    buttons.forEach(
      button => {
        button.classList.toggle(
          "active",
          button ===
            clickedButton
        );
      }
    );

    console.log(
      "Quick career status saved:",
      response.data
    );

  } catch (error) {

    console.error(
      "Quick status update failed:",
      error
    );

    alert(
      "Unable to update your career status. Please use Detailed Update."
    );

  } finally {

    buttons.forEach(
      button => {
        button.disabled = false;
      }
    );
  }
}

/* =========================================================
   SIGN OUT
   ========================================================= */

async function handleLogout() {

  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );

  if (logoutButton) {
    logoutButton.disabled =
      true;
  }

  try {

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

      if (logoutButton) {
        logoutButton.disabled =
          false;
      }

      return;
    }

    window.location.href =
      "trainee_login.html";

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    if (logoutButton) {
      logoutButton.disabled =
        false;
    }
  }
}

/* =========================================================
   MANUAL REFRESH
   ========================================================= */

window.refreshTraineeDashboard =
  async function () {
    await loadDashboard();
  };