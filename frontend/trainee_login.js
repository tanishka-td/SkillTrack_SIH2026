document.addEventListener("DOMContentLoaded", () => {
  /* =========================================
        ELEMENTS
    ========================================= */

  const signupTab = document.getElementById("signupTab");
  const loginTab = document.getElementById("loginTab");
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const formTitle = document.getElementById("formTitle");
  const formMessage = document.getElementById("formMessage");
  const loginMessage = document.getElementById("loginMessage");
  const password = document.getElementById("password");
  const strengthFill = document.getElementById("strengthFill");
  const strengthText = document.getElementById("strengthText");
  const phone = document.getElementById("phone");

  const stateSelect = document.getElementById("stateSelect");
  const districtSelect = document.getElementById("districtSelect");

  /* =========================================
        SAFETY CHECK
    ========================================= */

  if (!signupTab || !loginTab || !signupForm || !loginForm) {
    console.error("SkillTrack: Authentication elements not found.");
    return;
  }

  /* =========================================
        SHOW SIGN IN
    ========================================= */

  loginTab.addEventListener("click", () => {
    signupTab.classList.remove("active");
    loginTab.classList.add("active");
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    if (formTitle) {
      formTitle.textContent = "Sign in to your account";
    }

    clearMessages();

    setTimeout(() => {
      const loginEmail = document.getElementById("loginEmail");
      if (loginEmail) {
        loginEmail.focus();
      }
    }, 150);
  });

  /* =========================================
        SHOW CREATE ACCOUNT
    ========================================= */

  signupTab.addEventListener("click", () => {
    loginTab.classList.remove("active");
    signupTab.classList.add("active");
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");

    if (formTitle) {
      formTitle.textContent = "Create your account";
    }

    clearMessages();
  });

  /* =========================================
        PASSWORD SHOW / HIDE
    ========================================= */

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
      } else {
        input.type = "password";
        button.textContent = "Show";
      }
    });
  });

  /* =========================================
        PASSWORD STRENGTH
    ========================================= */

  if (password && strengthFill && strengthText) {
    password.addEventListener("input", updatePasswordStrength);
  }

  function updatePasswordStrength() {
    const value = password.value;
    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    const percentages = ["0%", "25%", "50%", "75%", "100%"];
    strengthFill.style.width = percentages[score];

    if (!value.length) {
      strengthText.textContent = "Password strength";
      strengthText.style.color = "";
    } else if (score <= 1) {
      strengthText.textContent = "Weak password";
      strengthText.style.color = "#dc2626";
    } else if (score === 2) {
      strengthText.textContent = "Moderate password";
      strengthText.style.color = "#d97706";
    } else if (score === 3) {
      strengthText.textContent = "Good password";
      strengthText.style.color = "#16a34a";
    } else {
      strengthText.textContent = "Strong password";
      strengthText.style.color = "#15803d";
    }
  }

  /* =========================================
        PHONE NUMBER FORMATTING
    ========================================= */

  if (phone) {
    phone.addEventListener("input", () => {
      phone.value = phone.value.replace(/\D/g, "");
    });
  }

  /* =========================================
        STATE & DISTRICT DEPENDENT DROPDOWN
    ========================================= */

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

  /* =========================================
        SUPABASE SIGNUP + PROFILE STORAGE
  ========================================== */

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessages();

    // -----------------------------------------
    // EXTRACT FORM DATA
    // -----------------------------------------

    const fullName = document.getElementById("name").value.trim();

    const age = parseInt(document.getElementById("age").value, 10);

    const gender = document.getElementById("gender").value;

    const mobileNumber = phone.value.trim();

    const email = document.getElementById("email").value.trim().toLowerCase();

    const state = stateSelect.value;

    const district = districtSelect.value;

    const cityBlockTown = document.getElementById("city").value.trim();

    const passwordValue = password.value;

    const confirmPassword = document.getElementById("confirmPassword").value;

    const termsAccepted = document.getElementById("terms").checked;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (
      !fullName ||
      !age ||
      !gender ||
      !mobileNumber ||
      !email ||
      !state ||
      !district ||
      !cityBlockTown ||
      !passwordValue ||
      !confirmPassword
    ) {
      showMessage(formMessage, "Please fill in all required fields.", "error");

      return;
    }

    if (age < 15 || age > 100) {
      showMessage(formMessage, "Age must be between 15 and 100.", "error");

      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      showMessage(
        formMessage,
        "Please enter a valid 10-digit mobile number.",
        "error",
      );

      return;
    }

    if (passwordValue !== confirmPassword) {
      showMessage(formMessage, "Passwords do not match.", "error");

      return;
    }

    if (!termsAccepted) {
      showMessage(
        formMessage,
        "Please accept the terms and privacy policy.",
        "error",
      );

      return;
    }

    // -----------------------------------------
    // BUTTON LOADING
    // -----------------------------------------

    const submitButton = signupForm.querySelector('button[type="submit"]');

    const submitText = submitButton?.querySelector("span");

    const originalText = submitText?.textContent || "Create Trainee Account";

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (submitText) {
      submitText.textContent = "Creating account...";
    }

    try {
      // ========================================
      // STEP 1: CREATE SUPABASE AUTH ACCOUNT
      // ========================================

      const { data: authData, error: authError } =
        await supabaseClient.auth.signUp({
          email: email,
          password: passwordValue,
        });

      if (authError) {
        throw authError;
      }

      const user = authData.user;

      if (!user) {
        throw new Error("Account could not be created.");
      }

      // ========================================
      // STEP 2: STORE PROFILE DATA
      // ========================================

      const profileData = {
        user_id: user.id,

        full_name: fullName,

        age: age,

        gender: gender,

        mobile_number: mobileNumber,

        email: email,

        state: state,

        district: district,

        city_block_town: cityBlockTown,

        profile_status: "active",
      };

      console.log("Saving trainee profile:", profileData);

      const { data: savedProfile, error: profileError } = await supabaseClient
        .from("profile")
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);

        throw new Error("Profile save failed: " + profileError.message);
      }
      // ========================================
      // STEP 3: SUCCESS
      // ========================================

      console.log("Trainee profile saved successfully:", savedProfile);

      showMessage(formMessage, "Account created successfully!", "success");

      // ========================================
      // STEP 4: GO TO DASHBOARD
      // ========================================

      setTimeout(() => {
        window.location.href = "trainee_dashboard.html";
      }, 1200);
    } catch (error) {
      console.error("SkillTrack signup error:", error);

      showMessage(
        formMessage,
        error.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      // ========================================
      // RESTORE BUTTON
      // ========================================

      if (submitButton) {
        submitButton.disabled = false;
      }

      if (submitText) {
        submitText.textContent = originalText;
      }
    }
  });

  /* =========================================
        SUPABASE LOGIN
    ========================================= */

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const passwordValue = passwordInput ? passwordInput.value : "";

    if (!email || !passwordValue) {
      showMessage(loginMessage, "Please fill in all required fields.", "error");
      return;
    }

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const submitText = submitButton?.querySelector("span");
    const originalText = submitText?.textContent || "Sign In";

    if (submitButton) {
      submitButton.disabled = true;
    }
    if (submitText) {
      submitText.textContent = "Signing in...";
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: passwordValue,
      });

      if (error) {
        throw error;
      }

      showMessage(loginMessage, "Sign in successful!", "success");

      setTimeout(() => {
        window.location.href = "trainee_dashboard.html";
      }, 1000);
    } catch (error) {
      console.error("SkillTrack login error:", error);
      showMessage(
        loginMessage,
        error.message || "Invalid email or password.",
        "error",
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
      if (submitText) {
        submitText.textContent = originalText;
      }
    }
  });

  /* =========================================
        MESSAGE HELPER
    ========================================= */

  function showMessage(element, message, type) {
    if (!element) return;

    element.textContent = message;

    element.classList.remove("success", "error");

    element.classList.add(type);
  }

  /* =========================================
        CLEAR MESSAGES
    ========================================= */

  function clearMessages() {
    if (formMessage) {
      formMessage.textContent = "";
      formMessage.classList.remove("success", "error");
    }

    if (loginMessage) {
      loginMessage.textContent = "";
      loginMessage.classList.remove("success", "error");
    }
  }
});