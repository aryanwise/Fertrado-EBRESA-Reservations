const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzSvRQeLnH69MssLEpTPbK-CAa-IzmGNv6K-Mp7NNIcl5SxvsirEHWmFUhiNlGMKtEM/exec";

async function sendData(payload) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      // This header is the secret to bypassing CORS errors with Google Apps Script
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      // Forces the browser to handle redirects which Google uses
      redirect: "follow",
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Fetch Error:", error);
    return { result: "error", message: "Network error or CORS block." };
  }
}
// 1. Availability Check
document
  .getElementById("checkBtn")
  .addEventListener("click", async function () {
    const dateVal = document.getElementById("date").value;
    if (!dateVal) return alert("Select date");

    const data = await sendData({ action: "check", date: dateVal });
    const status = document.getElementById("availabilityStatus");

    if (data.result === "info") {
      status.innerText = data.remaining + " slots left.";
    } else {
      alert("Error: " + JSON.stringify(data));
    }
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
    mode: "no-cors", // This is a common fix for Google Apps Script errors
    cache: "no-cache",
    headers: { "Content-Type": "application/json" },
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
