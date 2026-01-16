const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzbXTzTo3aMpO8bDrRoGaX72_wlThVmiAL-S-lkAJRL_5sutC6DkERu63rs3SfZVB0P/exec";

// --- 1. AVAILABILITY CHECK LOGIC ---
document
  .getElementById("checkBtn")
  .addEventListener("click", async function () {
    const dateVal = document.getElementById("date").value;
    const status = document.getElementById("availabilityStatus");

    if (!dateVal) {
      status.innerText = "Please select a date first / Pasirinkite datą.";
      status.style.color = "orange";
      return;
    }

    status.innerText = "Checking availability... / Tikrinama...";
    status.style.color = "#3498db";

    try {
      // We use text/plain to avoid CORS pre-flight blocks
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "check", date: dateVal }),
      });

      const data = await response.json();

      if (data.remaining <= 0) {
        status.innerText = "FULLY BOOKED (0 slots left) / UŽPILTYTA";
        status.style.color = "#e74c3c";
      } else {
        status.innerText = `${data.remaining} slots remaining / likusios vietos.`;
        status.style.color = "#27ae60";
      }
    } catch (error) {
      console.error("Check error:", error);
      status.innerText = "Error checking slots. Please try again.";
      status.style.color = "red";
    }
  });

// --- 2. FORM SUBMISSION LOGIC ---
document
  .getElementById("bookingForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const msg = document.getElementById("message");

    btn.disabled = true;
    btn.innerText = "Processing... / Apdorojama...";

    // Collect all 13 fields
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

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.result === "success") {
        msg.style.color = "#27ae60";
        msg.innerText =
          "SUCCESS! Downloading receipt. / SĖKMINGA! Atsiunčiamas kvitas.";
        generatePDF(formData);
        document.getElementById("bookingForm").reset();
        document.getElementById("availabilityStatus").innerText = "";
      } else if (data.result === "full") {
        msg.style.color = "#e74c3c";
        msg.innerText = "Date is full (40/40). / Data užpildyta.";
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      msg.style.color = "#e74c3c";
      msg.innerText = "Connection error. Please check your internet.";
    } finally {
      btn.disabled = false;
      btn.innerText = "Submit & Download Receipt";
    }
  });

// --- 3. PDF RECEIPT GENERATOR ---
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(39, 174, 96);
  doc.text("LOADING AUTHORIZATION / KROVIMO LEIDIMAS", 105, 20, {
    align: "center",
  });

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Fertrado-EBRESA Logistics System", 105, 27, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = 45;
  const lineGap = 9;

  // Data Fields Mapping
  const fields = [
    ["Reservation Date:", data.date],
    ["Time Slot:", data.time],
    ["Company / Įmonė:", data.company],
    ["Contract # / Sutartis:", data.contractNum],
    ["Product / Produktas:", data.product],
    ["Package / Pakuotė:", data.package],
    ["Carrier / Vežėjas:", data.carrier],
    ["Transport # / Numeris:", data.transportNum],
    ["Trailer # / Priekaba:", data.trailerNum],
    ["CMR #:", data.cmrNum],
    ["Receiver / Gavėjas:", data.receiver],
    ["Driver / Vairuotojas:", data.driverName],
    ["Phone / Telefonas:", data.driverPhone],
  ];

  fields.forEach((field) => {
    doc.setFont(undefined, "bold");
    doc.text(field[0], 20, y);
    doc.setFont(undefined, "normal");
    doc.text(String(field[1]), 80, y);
    y += lineGap;
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Show this digital pass to security at the gate.", 105, y + 15, {
    align: "center",
  });

  doc.save(`Ebresa_Booking_${data.transportNum}.pdf`);
}
