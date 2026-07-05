import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Car,
  CheckCircle2,
  CreditCard,
  Download,
  MapPinned,
  Moon,
  QrCode,
  Settings,
  ShieldCheck,
  Wifi
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const HOURLY_RATE = 80;

const navItems = [
  { id: "parking", label: "Live Parking", icon: MapPinned },
  { id: "reservations", label: "Reservations", icon: QrCode },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings }
];

function createDemoSlots() {
  const sections = ["A", "B", "C"];
  return Array.from({ length: 48 }, (_, index) => {
    const section = sections[index % sections.length];
    return {
      id: index + 1,
      code: `${section}-${String(index + 1).padStart(3, "0")}`,
      status: index % 7 === 0 ? "reserved" : index % 3 === 0 ? "occupied" : "available",
      slot_type: index % 11 === 0 ? "ev" : index % 13 === 0 ? "disabled" : "standard"
    };
  });
}

function makeReceipt(slot, amount, method) {
  return {
    slotCode: slot.code,
    amount,
    method,
    // customer details may be attached to the slot
    customerName: slot.customerName,
    customerPhone: slot.customerPhone,
    customerEmail: slot.customerEmail,
    invoice: `INV-${Date.now().toString().slice(-8)}`,
    paidAt: new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    })
  };
}

function App() {
  const [slots, setSlots] = useState(createDemoSlots);
  const [activeView, setActiveView] = useState("parking");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("Select an available slot to begin.");
  const [paymentStatus, setPaymentStatus] = useState("No pending payment");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [vehicleNumber, setVehicleNumber] = useState("TN-01-AB-1234");
  const [durationHours, setDurationHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [overstayAlert, setOverstayAlert] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [showPaymentComplete, setShowPaymentComplete] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/parking/slots`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlots(data);
          setToast("Loaded live parking slots from API.");
        }
      })
      .catch(() => setToast("Using demo slots while API data is unavailable."));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlots((current) => {
        let updated = false;
        const next = current.map((slot) => {
          if (slot.status === "mine" && slot.expiresAt && Date.now() > slot.expiresAt && !slot.alertSent) {
            updated = true;
            const extraHours = Math.ceil((Date.now() - slot.expiresAt) / (1000 * 60 * 60));
            setToast(`Overstay alert for ${slot.code}: extra ${extraHours} hour(s), fine Rs. ${extraHours * 50}`);
            setOverstayAlert(`Parking time expired for ${slot.code}. Fine Rs. ${extraHours * 50}. Please send message to the user.`);
            return {
              ...slot,
              alertSent: true,
              fine: extraHours * 50
            };
          }
          return slot;
        });
        return updated ? next : current;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("welcomeSeen");
      if (seen) setShowWelcome(false);
    } catch (e) {}
  }, []);

  const selected = slots.find((slot) => slot.code === selectedSlot);
  const paymentAmount = Math.max(1, Number(durationHours) || 1) * HOURLY_RATE;

  const stats = useMemo(() => {
    const total = slots.length;
    const available = slots.filter((slot) => slot.status === "available").length;
    const occupied = slots.filter((slot) => slot.status === "occupied").length;
    const reserved = slots.filter((slot) => slot.status === "reserved").length;
    const mine = slots.filter((slot) => slot.status === "mine").length;
    return {
      total_slots: total,
      available_slots: available,
      occupied_slots: occupied,
      reserved_slots: reserved,
      owned_slots: mine,
      revenue_today: 18420 + reserved * HOURLY_RATE + mine * paymentAmount
    };
  }, [paymentAmount, slots]);

  const reservations = slots.filter((slot) => slot.status === "reserved" || slot.status === "mine");

  function updateSlot(code, changes) {
    setSlots((current) => current.map((slot) => (slot.code === code ? { ...slot, ...changes } : slot)));
  }

  function reserveSlot(slot = selected) {
    if (!slot || slot.status !== "available") {
      setToast("Select an available slot first.");
      return;
    }
    if (!userName || !userPhone || !userEmail) {
      setToast("Please enter name, phone and email before reserving.");
      return;
    }
    updateSlot(slot.code, {
      status: "reserved",
      vehicleNumber,
      reservedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      customerName: userName,
      customerPhone: userPhone,
      customerEmail: userEmail
    });
    setSelectedSlot(slot.code);
    setActiveView("reservations");
    setReceipt(null);
    setPaymentStatus(`Payment pending for ${slot.code}.`);
    setToast(`${slot.code} reserved. Complete payment to make this slot yours.`);
  }

  function reserveNearestSlot() {
    // Allocate in alphabetical section order: A -> B -> C
    const sections = ["A", "B", "C"];
    let nearest = null;
    for (const sec of sections) {
      nearest = slots.find((slot) => slot.status === "available" && slot.code.startsWith(`${sec}-`));
      if (nearest) break;
    }
    if (!nearest) {
      setToast("No available slots right now.");
      return;
    }
    reserveSlot(nearest);
  }

  function handleWelcomeNext() {
    if (!userName || !userPhone || !userEmail) {
      setToast("Please enter name, phone and email to continue.");
      return;
    }
    // close welcome and run reservation flow
    try {
      localStorage.setItem("welcomeSeen", "1");
    } catch (e) {}
    setShowWelcome(false);
    // ensure view shows reservations
    setActiveView("reservations");
  }

  function cancelReservation(slot = selected) {
    if (!slot || slot.status !== "reserved") {
      setToast("Only unpaid reserved slots can be cancelled.");
      return;
    }
    updateSlot(slot.code, {
      status: "available",
      vehicleNumber: undefined,
      reservedAt: undefined,
      paidAt: undefined
    });
    setPaymentStatus("No pending payment");
    setReceipt(null);
    setToast(`${slot.code} reservation cancelled.`);
  }

  function releaseOwnedSlot(slot = selected) {
    if (!slot || slot.status !== "mine") {
      setToast("Select your paid slot first.");
      return;
    }
    updateSlot(slot.code, {
      status: "available",
      vehicleNumber: undefined,
      reservedAt: undefined,
      paidAt: undefined
    });
    setReceipt(null);
    setPaymentStatus("No pending payment");
    setToast(`${slot.code} released after exit.`);
  }

  function completePayment() {
    if (selected && !["available", "reserved"].includes(selected.status)) {
      setToast(`${selected.code} cannot be paid now. Choose an available or reserved slot.`);
      return;
    }

    const payableSlot = selected ?? slots.find((slot) => slot.status === "reserved");

    if (!payableSlot) {
      setToast("Select an available or reserved slot before payment.");
      return;
    }

    const paidReceipt = makeReceipt(payableSlot, paymentAmount, paymentMethod);
    const expiryTimestamp = Date.now() + durationHours * 60 * 60 * 1000;
    updateSlot(payableSlot.code, {
      status: "mine",
      vehicleNumber,
      durationHours,
      paidAt: paidReceipt.paidAt,
      invoice: paidReceipt.invoice,
      expiresAt: expiryTimestamp,
      fine: 0,
      alertSent: false
    });
    setSelectedSlot(payableSlot.code);
    setReceipt(paidReceipt);
    setShowPaymentComplete(true);
    setPaymentStatus(`Payment successful. ${payableSlot.code} is yours.`);
    setToast(`Payment successful. Slot ${payableSlot.code} is yours.`);
  }

  function exportReport() {
    const rows = [
      ["code", "status", "slot_type", "vehicle_number", "invoice", "expires_at", "fine"],
      ...slots.map((slot) => [
        slot.code,
        slot.status,
        slot.slot_type,
        slot.vehicleNumber ?? "",
        slot.invoice ?? "",
        slot.expiresAt ? new Date(slot.expiresAt).toLocaleString("en-IN") : "",
        slot.fine ?? 0
      ])
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "parking-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("CSV report downloaded.");
  }

  function handleNav(id) {
    setActiveView(id);
    setToast(`${navItems.find((item) => item.id === id)?.label} opened.`);
  }

  if (showWelcome) {
    return (
      <main className={dark ? "app dark" : "app"}>
        <section className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome">
          <div className="welcome-core">
            <h2>WELCOME TO SMART BOOKING PLATFORM</h2>
            <p>Please enter your details to begin booking.</p>
            <label className="field">
              Full name
              <input placeholder="Full name" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </label>
            <label className="field">
              Phone
              <input placeholder="Phone number" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
            </label>
            <label className="field">
              Email
              <input placeholder="Email address" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
            </label>
            <label className="field">
              Vehicle Number
              <input placeholder="Vehicle number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} />
            </label>
            <div className="welcome-actions">
              <button type="button" className="primary" onClick={handleWelcomeNext}>Next</button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  try {
                    localStorage.setItem("welcomeSeen", "1");
                  } catch (e) {}
                  setShowWelcome(false);
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
  return (
    <main className={dark ? "app dark" : "app"}>
      {showPaymentComplete && receipt && (
        <section className="payment-complete" role="dialog" aria-modal="true" aria-label="Payment completed">
          <button
            type="button"
            className="payment-back"
            onClick={() => setShowPaymentComplete(false)}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="payment-success-core">
            <div className="success-mark">
              <CheckCircle2 size={72} />
            </div>
            <span className="payment-label">Payment complete</span>
            <strong>Rs. {receipt.amount.toLocaleString("en-IN")}</strong>
            <p>Paid for parking slot {receipt.slotCode}</p>
          </div>

          <div className="payment-details">
            {receipt.customerName && (
              <div>
                <span>Name</span>
                <strong>{receipt.customerName}</strong>
              </div>
            )}
            {receipt.customerPhone && (
              <div>
                <span>Phone</span>
                <strong>{receipt.customerPhone}</strong>
              </div>
            )}
            <div>
              <span>Vehicle</span>
              <strong>{vehicleNumber}</strong>
            </div>
            <div>
              <span>Method</span>
              <strong>{receipt.method}</strong>
            </div>
            <div>
              <span>Invoice</span>
              <strong>{receipt.invoice}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{receipt.paidAt}</strong>
            </div>
          </div>

          <div className="payment-qr">
            <span>Reservation QR</span>
            <img
              alt={`QR for ${receipt.slotCode}`}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                receipt.invoice + "|" + receipt.slotCode + "|" + (receipt.customerName ?? "") + "|" + (receipt.customerPhone ?? "")
              )}`}
            />
            <div className="thank-you">THANK YOU</div>
          </div>

          <button type="button" className="done-button" onClick={() => setShowPaymentComplete(false)}>
            Done
          </button>
        </section>
      )}

      <aside className="sidebar">
        <div className="brand"><Car size={24} /> Smart Parking</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? "active" : ""}
              onClick={() => handleNav(item.id)}
            >
              <Icon size={18} /> {item.label}
            </button>
          );
        })}
        <button type="button" onClick={() => {
          setDark((value) => !value);
          setToast("Theme updated.");
        }}>
          <Moon size={18} /> Theme
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>{navItems.find((item) => item.id === activeView)?.label ?? "Live Parking"}</h1>
            <p>{toast}</p>
          </div>
          <button type="button" className="primary" onClick={reserveNearestSlot}>Reserve Nearest Slot</button>
        </header>

        {receipt && (
          <section className="success-banner">
            <CheckCircle2 size={26} />
            <div>
              <strong>Payment successful. Slot {receipt.slotCode} is yours.</strong>
              <span>{receipt.invoice} - {receipt.method} - Rs. {receipt.amount.toLocaleString("en-IN")}</span>
            </div>
          </section>
        )}

        {overstayAlert && (
          <section className="warning-banner">
            <Bell size={22} />
            <div>
              <strong>Overstay Alert</strong>
              <span>{overstayAlert}</span>
            </div>
          </section>
        )}

        <section className="metrics">
          <article><span>Total Slots</span><strong>{stats.total_slots}</strong></article>
          <article><span>Available</span><strong>{stats.available_slots}</strong></article>
          <article><span>Occupied</span><strong>{stats.occupied_slots}</strong></article>
          <article><span>Reserved</span><strong>{stats.reserved_slots}</strong></article>
          <article><span>Your Slots</span><strong>{stats.owned_slots}</strong></article>
        </section>

        <section className="workspace">
          <div className="lot-area">
            <section className="live-visual" aria-label="Live parking visualization">
              <div className="live-visual-header">
                <div>
                  <h2>Live Lot View</h2>
                  <p>{stats.available_slots} slots open right now</p>
                </div>
                <span><Wifi size={16} /> Live</span>
              </div>
              <div className="lot-visual">
                <div className="entry-gate">ENTRY</div>
                <div className="drive-lane">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {slots.slice(0, 18).map((slot, index) => (
                  <button
                    key={slot.code}
                    type="button"
                    className={`visual-car ${slot.status} ${selectedSlot === slot.code ? "selected" : ""}`}
                    style={{
                      "--row": Math.floor(index / 6) + 1,
                      "--col": (index % 6) + 1
                    }}
                    onClick={() => {
                      setSelectedSlot(slot.code);
                      setToast(`${slot.code} selected in live view.`);
                    }}
                    aria-label={`${slot.code} ${slot.status}`}
                  >
                    <Car size={22} />
                    <small>{slot.code}</small>
                  </button>
                ))}
                <div className="exit-gate">EXIT</div>
              </div>
            </section>

            <div className="parking-map" aria-label="Parking slot map">
              {slots.map((slot) => (
                <button
                  key={slot.code}
                  type="button"
                  className={`slot ${slot.status} ${selectedSlot === slot.code ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedSlot(slot.code);
                    setToast(`${slot.code} selected.`);
                  }}
                >
                  <span>{slot.code}</span>
                  <small>{slot.status === "mine" ? "yours" : slot.slot_type}</small>
                </button>
              ))}
            </div>
          </div>

          <aside className="panel">
            {activeView === "parking" && (
              <>
                <h2>Slot Actions</h2>
                <p className="forecast">
                  {selected ? `${selected.code} is ${selected.status}. Type: ${selected.slot_type}.` : "Select a slot on the map."}
                </p>
                <label className="field">
                  Name
                  <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" />
                </label>
                <label className="field">
                  Phone
                  <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="Phone number" />
                </label>
                <label className="field">
                  Email
                  <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email address" />
                </label>
                <button type="button" className="secondary" onClick={() => reserveSlot()}>Reserve Selected</button>
                <button type="button" className="ghost" onClick={() => cancelReservation()}>Cancel Unpaid Reservation</button>
                <button type="button" className="ghost" onClick={() => releaseOwnedSlot()}>Release My Slot</button>
              </>
            )}

            {activeView === "reservations" && (
              <>
                <h2>Reservations</h2>
                <p className="forecast">{reservations.length} active reservation{reservations.length === 1 ? "" : "s"}.</p>
                <div className="list">
                  {reservations.length === 0 && <span>No active reservations yet.</span>}
                  {reservations.slice(0, 6).map((slot) => (
                    <span key={slot.code} className={slot.status === "mine" ? "owned-row" : ""}>
                      {slot.status === "mine" ? "Confirmed" : "Pending payment"} - {slot.code} - {slot.vehicleNumber ?? vehicleNumber}
                    </span>
                  ))}
                </div>
                {receipt && (
                  <div className="receipt">
                    <ShieldCheck size={22} />
                    <strong>Slot {receipt.slotCode} is yours</strong>
                    {receipt.customerName && <span>{receipt.customerName}</span>}
                    {receipt.customerPhone && <span>{receipt.customerPhone}</span>}
                    <span>Invoice: {receipt.invoice}</span>
                    <span>Paid: Rs. {receipt.amount.toLocaleString("en-IN")}</span>
                    <span>Time: {receipt.paidAt}</span>
                  </div>
                )}
                <button type="button" className="secondary" onClick={() => setActiveView("payments")}>Go To Payment</button>
              </>
            )}

            {activeView === "payments" && (
              <>
                <h2>Complete Payment</h2>
                <p className="forecast">{paymentStatus}</p>
                <label className="field">
                  Vehicle Number
                  <input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value.toUpperCase())} />
                </label>
                <label className="field">
                  Duration
                  <select value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))}>
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours</option>
                    <option value={4}>4 hours</option>
                    <option value={8}>Full day</option>
                  </select>
                </label>
                <label className="field">
                  Payment Method
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Razorpay</option>
                    <option>Cash at Gate</option>
                  </select>
                </label>
                <div className="amount-row">
                  <span>Total</span>
                  <strong>Rs. {paymentAmount.toLocaleString("en-IN")}</strong>
                </div>
                <button type="button" className="secondary pay-button" onClick={completePayment}>
                  <CreditCard size={17} /> Pay Now
                </button>
                {receipt && (
                  <div className="receipt">
                    <ShieldCheck size={22} />
                    <strong>Slot {receipt.slotCode} is yours</strong>
                    {receipt.customerName && <span>{receipt.customerName}</span>}
                    {receipt.customerPhone && <span>{receipt.customerPhone}</span>}
                    <span>Invoice: {receipt.invoice}</span>
                    <span>Paid: Rs. {receipt.amount.toLocaleString("en-IN")}</span>
                    <span>Time: {receipt.paidAt}</span>
                  </div>
                )}
              </>
            )}

            {activeView === "analytics" && (
              <>
                <h2>AI Forecast</h2>
                <p className="forecast">Peak demand expected between 6 PM and 8 PM. EV slots are trending high.</p>
                <div className="legend"><span className="dot available"></span> Available</div>
                <div className="legend"><span className="dot occupied"></span> Occupied</div>
                <div className="legend"><span className="dot reserved"></span> Reserved</div>
                <div className="legend"><span className="dot mine"></span> Yours</div>
                <button type="button" className="secondary" onClick={exportReport}><Download size={16} /> Export Report</button>
              </>
            )}

            {activeView === "alerts" && (
              <>
                <h2>Alerts</h2>
                <p className="forecast">Notifications are {alertsEnabled ? "enabled" : "paused"}.</p>
                <button type="button" className="secondary" onClick={() => {
                  setAlertsEnabled((value) => !value);
                  setToast("Alert preference updated.");
                }}>
                  {alertsEnabled ? "Pause Alerts" : "Enable Alerts"}
                </button>
              </>
            )}

            {activeView === "settings" && (
              <>
                <h2>Settings</h2>
                <p className="forecast">Theme is currently {dark ? "dark" : "light"}.</p>
                <button type="button" className="secondary" onClick={() => setDark((value) => !value)}>Toggle Theme</button>
              </>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
