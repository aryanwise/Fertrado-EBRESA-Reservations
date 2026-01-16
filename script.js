const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwUELGCUYN7kHd4esz25woFUT-UarRy-ro57v3qNTxr7zsAEYDXLU9Ry5RqOUQSMj94/exec";

// --- 1. SEND DATA FUNCTION ---
async function sendData(payload) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Connection Error:", error);
    return { result: "error", message: error.message };
  }
}

// --- 2. CHECK AVAILABILITY ---
document
  .getElementById("checkBtn")
  .addEventListener("click", async function () {
    const dateVal = document.getElementById("date").value;
    const status = document.getElementById("availabilityStatus");

    if (!dateVal) {
      status.innerText = "Select a date first.";
      return;
    }

    status.innerText = "Checking...";
    const data = await sendData({ action: "check", date: dateVal });

    if (data.result === "info") {
      status.innerText = `${data.remaining} slots remaining.`;
      status.style.color = data.remaining > 0 ? "green" : "red";
    } else {
      status.innerText = "Error checking slots.";
    }
  });

// --- 3. FORM SUBMISSION ---
document
  .getElementById("bookingForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const msg = document.getElementById("message");

    btn.disabled = true;
    btn.innerText = "Processing...";

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

    const data = await sendData(formData);

    if (data.result === "success") {
      msg.innerText = "Success! Downloading receipt...";
      msg.style.color = "green";
      generatePDF(formData); // Use your existing PDF function
      document.getElementById("bookingForm").reset();
    } else {
      msg.innerText = "Error: " + (data.error || "Slots full.");
      msg.style.color = "red";
    }
    btn.disabled = false;
    btn.innerText = "Submit & Download Receipt";
  });

// --- 4. PDF GENERATOR ---
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("LOADING AUTHORIZATION", 10, 20);
  doc.text(`Date: ${data.date}`, 10, 30);
  doc.text(`Company: ${data.company}`, 10, 40);
  doc.text(`Order: ${data.transportNum}`, 10, 50);
  doc.save(`Receipt_${data.transportNum}.pdf`);
}
