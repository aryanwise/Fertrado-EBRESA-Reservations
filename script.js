const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxVaUa22rlhlC6fJcb-X4jky9WllbffULEL-NMfOmb27A6kTm9yTvOV4BN4O_A9Msc_/exec";

// 1. Availability Check
document.getElementById("checkBtn").addEventListener("click", function () {
  const dateVal = document.getElementById("date").value;
  const status = document.getElementById("availabilityStatus");

  if (!dateVal) {
    status.innerText = "Please select a date first.";
    status.style.color = "orange";
    return;
  }

  status.innerText = "Checking...";
  status.style.color = "#3498db";

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "check", date: dateVal }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.remaining <= 0) {
        status.innerText = "FULLY BOOKED (0 slots left)";
        status.style.color = "#e74c3c";
      } else {
        status.innerText = `${data.remaining} slots remaining for this day.`;
        status.style.color = "#27ae60";
      }
    })
    .catch(() => {
      status.innerText = "Connection error.";
      status.style.color = "red";
    });
});

// 2. Form Submission
document.getElementById("bookingForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  const msg = document.getElementById("message");

  btn.disabled = true;
  btn.innerText = "Validating...";

  const formData = {
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    company: document.getElementById("company").value,
    contractNum: document.getElementById("contractNum").value,
    product: document.getElementById("product").value,
    package: document.getElementById("package").value,
    carrier: document.getElementById("carrier").value,
    transportNum: document.getElementById("transportNum").value,
    trailerNum: document.getElementById("trailerNum").value,
    cmrNum: document.getElementById("cmrNum").value,
    receiver: document.getElementById("receiver").value,
    driverName: document.getElementById("driverName").value,
    driverPhone: document.getElementById("driverPhone").value,
  };

  fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(formData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.result === "success") {
        msg.style.color = "#27ae60";
        msg.innerText = "Success! Downloading your receipt...";
        generatePDF(formData);
        document.getElementById("bookingForm").reset();
        document.getElementById("availabilityStatus").innerText = "";
      } else if (data.result === "full") {
        msg.style.color = "#e74c3c";
        msg.innerText = "Date just became full. Please pick another day.";
      }
      btn.disabled = false;
      btn.innerText = "Submit & Download Receipt";
    })
    .catch(() => {
      msg.innerText = "Critical error. Please try again.";
      btn.disabled = false;
      btn.innerText = "Submit & Download Receipt";
    });
});

// 3. PDF Generator
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(39, 174, 96);
  doc.text("LOADING AUTHORIZATION / KROVIMO LEIDIMAS", 10, 20);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  let y = 35;
  const lineGap = 8;

  const fields = [
    ["Date / Data:", data.date],
    ["Time / Laikas:", data.time],
    ["Company / Įmonė:", data.company],
    ["Contract / Sutartis:", data.contractNum],
    ["Product / Produktas:", data.product],
    ["Package / Pakuotė:", data.package],
    ["Carrier / Vežėjas:", data.carrier],
    ["Transport #:", data.transportNum],
    ["Trailer #:", data.trailerNum],
    ["CMR #:", data.cmrNum],
    ["Receiver / Gavėjas:", data.receiver],
    ["Driver / Vairuotojas:", data.driverName],
    ["Phone / Telefonas:", data.driverPhone],
  ];

  fields.forEach((field) => {
    doc.setFont("", "bold");
    doc.text(field[0], 20, y);
    doc.setFont("", "normal");
    doc.text(String(field[1]), 70, y);
    y += lineGap;
  });
  doc.text(
    "------------------------------------------------------------",
    20,
    y + 5,
  );
  doc.save(`Ebresa_Pass_${data.transportNum}.pdf`);
}
