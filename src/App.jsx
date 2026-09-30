import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  // =========================
  // STUDENTS
  // =========================

  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem("tutordesk_students");

    if (!savedStudents) return [];

    try {
      const parsedStudents = JSON.parse(savedStudents);

      return parsedStudents.map((student) => ({
        ...student,
        fee: Number(student.fee) || 0,
        status: student.status || "Pending",
        payments: Array.isArray(student.payments)
          ? student.payments
          : [],
      }));
    } catch {
      return [];
    }
  });

  // =========================
  // UI STATE
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // =========================
  // FORM STATE
  // =========================

  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("");
  const [status, setStatus] = useState("Pending");

  // =========================
  // SAVE DATA
  // =========================

  useEffect(() => {
    localStorage.setItem(
      "tutordesk_students",
      JSON.stringify(students)
    );
  }, [students]);

  // =========================
  // CURRENT MONTH
  // =========================

  const currentMonth = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // =========================
  // FORM RESET
  // =========================

  const resetForm = () => {
    setName("");
    setParent("");
    setPhone("");
    setFee("");
    setStatus("Pending");
    setEditingId(null);
  };

  // =========================
  // ADD / UPDATE STUDENT
  // =========================

  const addStudent = (e) => {
    e.preventDefault();

    if (!name || !parent || !phone || !fee) {
      alert("Please fill all details");
      return;
    }

    if (editingId !== null) {
      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === editingId
            ? {
                ...student,
                name,
                parent,
                phone,
                fee: Number(fee),
                status,
              }
            : student
        )
      );
    } else {
      const newStudent = {
        id: Date.now(),
        name,
        parent,
        phone,
        fee: Number(fee),
        status,
        joinedAt: new Date().toISOString(),
        payments:
          status === "Paid"
            ? [
                {
                  id: Date.now(),
                  month: currentMonth,
                  amount: Number(fee),
                  date: new Date().toISOString(),
                },
              ]
            : [],
      };

      setStudents((currentStudents) => [
        ...currentStudents,
        newStudent,
      ]);
    }

    resetForm();
    setShowForm(false);
  };

  // =========================
  // EDIT STUDENT
  // =========================

  const editStudent = (student) => {
    setName(student.name);
    setParent(student.parent);
    setPhone(student.phone);
    setFee(student.fee);
    setStatus(student.status);

    setEditingId(student.id);
    setShowForm(true);
    setShowProfile(false);
  };

  // =========================
  // DELETE STUDENT
  // =========================

  const deleteStudent = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    setStudents((currentStudents) =>
      currentStudents.filter((student) => student.id !== id)
    );

    setShowProfile(false);
  };

  // =========================
  // TOGGLE PAYMENT STATUS
  // =========================

  const togglePaymentStatus = (id) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) => {
        if (student.id !== id) return student;

        const newStatus =
          student.status === "Paid" ? "Pending" : "Paid";

        let updatedPayments = student.payments || [];

        if (newStatus === "Paid") {
          const alreadyPaid = updatedPayments.some(
            (payment) => payment.month === currentMonth
          );

          if (!alreadyPaid) {
            updatedPayments = [
              ...updatedPayments,
              {
                id: Date.now(),
                month: currentMonth,
                amount: student.fee,
                date: new Date().toISOString(),
              },
            ];
          }
        }

        return {
          ...student,
          status: newStatus,
          payments: updatedPayments,
        };
      })
    );

    // Keep opened profile updated
    setSelectedStudent((current) => {
      if (!current || current.id !== id) return current;

      const student = students.find((s) => s.id === id);

      if (!student) return current;

      return {
        ...student,
        status:
          student.status === "Paid" ? "Pending" : "Paid",
      };
    });
  };

  // =========================
  // WHATSAPP REMINDER
  // =========================

  const remindStudent = (student) => {
    const message =
      "Hello " +
      student.parent +
      ", this is a reminder regarding " +
      student.name +
      "'s tuition fee of ₹" +
      student.fee +
      " for " +
      currentMonth +
      ". Please make the payment when convenient. Thank you.";

    const cleanPhone = student.phone.replace(/\D/g, "");

    const url =
      "https://wa.me/91" +
      cleanPhone +
      "?text=" +
      encodeURIComponent(message);

    window.open(url, "_blank");
  };

  // =========================
  // OPEN PROFILE
  // =========================

  const openProfile = (student) => {
    setSelectedStudent(student);
    setShowProfile(true);
  };

  // =========================
  // FILTER + SEARCH
  // =========================

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        student.name.toLowerCase().includes(searchText) ||
        student.parent.toLowerCase().includes(searchText) ||
        student.phone.includes(searchText);

      const matchesFilter =
        filter === "All" || student.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter]);

  // =========================
  // DASHBOARD CALCULATIONS
  // =========================

  const expectedFees = students.reduce(
    (total, student) => total + Number(student.fee),
    0
  );

  const collectedFees = students
    .filter((student) => student.status === "Paid")
    .reduce(
      (total, student) => total + Number(student.fee),
      0
    );

  const pendingFees = students
    .filter((student) => student.status === "Pending")
    .reduce(
      (total, student) => total + Number(student.fee),
      0
    );

  const paidStudents = students.filter(
    (student) => student.status === "Paid"
  ).length;

  const pendingStudents = students.filter(
    (student) => student.status === "Pending"
  ).length;

  const collectionPercentage =
    expectedFees > 0
      ? Math.round((collectedFees / expectedFees) * 100)
      : 0;

  // =========================
  // RETURN
  // =========================

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="navbar">
        <h2>✨ TutorDesk</h2>
        <span>Teacher Dashboard</span>
      </header>

      <main className="dashboard">

        {/* =========================
            WELCOME
        ========================= */}

        <div className="welcome">
          <div>
            <p>Welcome back 👋</p>
            <h1>Your Tuition Dashboard</h1>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Student
          </button>
        </div>

        {/* =========================
            STATS
        ========================= */}

        <section className="stats">

          <div className="card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>

          <div className="card">
            <span>Expected Fees</span>
            <strong>₹{expectedFees}</strong>
          </div>

          <div className="card">
            <span>Collected</span>
            <strong>₹{collectedFees}</strong>
          </div>

          <div className="card pending">
            <span>Pending</span>
            <strong>₹{pendingFees}</strong>
          </div>

        </section>

        {/* =========================
            COLLECTION PROGRESS
        ========================= */}

        {students.length > 0 && (
          <section className="progress-card">

            <div className="progress-header">

              <div>
                <span>MONTHLY COLLECTION</span>
                <h2>{currentMonth}</h2>
              </div>

              <strong>{collectionPercentage}%</strong>

            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${collectionPercentage}%`,
                }}
              ></div>
            </div>

            <div className="progress-info">
              <span>
                🟢 {paidStudents} paid
              </span>

              <span>
                🔴 {pendingStudents} pending
              </span>
            </div>

          </section>
        )}

        {/* =========================
            ADD / EDIT FORM
        ========================= */}

        {showForm && (
          <div className="form-container">

            <div className="form-header">

              <div>
                <span className="form-label">
                  STUDENT MANAGEMENT
                </span>

                <h2>
                  {editingId !== null
                    ? "Edit Student"
                    : "Add New Student"}
                </h2>

                <p>
                  {editingId !== null
                    ? "Update the student's information below."
                    : "Enter the student's details to start tracking fees."}
                </p>
              </div>

              <button
                type="button"
                className="close-form"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={addStudent}
              className="student-form"
            >

              <div className="form-field">
                <label>Student Name</label>

                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label>Parent Name</label>

                <input
                  type="text"
                  placeholder="e.g. Mr. Sharma"
                  value={parent}
                  onChange={(e) =>
                    setParent(e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label>Parent Mobile</label>

                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label>Monthly Fee</label>

                <div className="fee-input">
                  <span>₹</span>

                  <input
                    type="number"
                    placeholder="1500"
                    value={fee}
                    onChange={(e) =>
                      setFee(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="form-field full-width">
                <label>Payment Status</label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                >
                  <option value="Pending">
                    🔴 Pending
                  </option>

                  <option value="Paid">
                    🟢 Paid
                  </option>
                </select>
              </div>

              <div className="form-actions">

                <button
                  type="submit"
                  className="save-student"
                >
                  {editingId !== null
                    ? "✓ Update Student"
                    : "+ Add Student"}
                </button>

                <button
                  type="button"
                  className="cancel-student"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* =========================
            STUDENTS SECTION
        ========================= */}

        <section className="students-section">

          <div className="section-title">

            <div>
              <h2>Students</h2>

              <span>
                {filteredStudents.length} of{" "}
                {students.length} students
              </span>
            </div>

            <div className="student-controls">

              <input
                type="text"
                placeholder="🔍 Search student..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option value="All">All</option>
                <option value="Paid">
                  🟢 Paid
                </option>
                <option value="Pending">
                  🔴 Pending
                </option>
              </select>

            </div>

          </div>

          {/* =========================
              EMPTY / NO RESULTS
          ========================= */}

          {filteredStudents.length === 0 ? (

            <div className="empty">

              <h3>
                {students.length === 0
                  ? "No students added yet"
                  : "No students found"}
              </h3>

              <p>
                {students.length === 0
                  ? "Add your first student to start tracking tuition fees."
                  : "Try a different search or filter."}
              </p>

              {students.length === 0 && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  + Add First Student
                </button>
              )}

            </div>

          ) : (

            <div className="student-list">

              {filteredStudents.map((student) => (

                <div
                  className="student-row"
                  key={student.id}
                >

                  {/* STUDENT INFO */}

                  <div
                    className="student-info-clickable"
                    onClick={() =>
                      openProfile(student)
                    }
                  >
                    <h3>{student.name}</h3>
                    <p>{student.parent}</p>
                  </div>

                  {/* FEE */}

                  <strong>
                    ₹{student.fee}
                  </strong>

                  {/* STATUS */}

                  <button
                    className={`status ${
                      student.status === "Paid"
                        ? "status-paid"
                        : "status-pending"
                    }`}
                    onClick={() =>
                      togglePaymentStatus(student.id)
                    }
                  >
                    {student.status === "Paid"
                      ? "🟢 Paid"
                      : "🔴 Pending"}
                  </button>

                  {/* REMINDER */}

                  {student.status === "Pending" && (
                    <button
                      onClick={() =>
                        remindStudent(student)
                      }
                    >
                      Remind
                    </button>
                  )}

                  {/* EDIT */}

                  <button
                    className="edit-btn"
                    onClick={() =>
                      editStudent(student)
                    }
                  >
                    Edit
                  </button>

                  {/* DELETE */}

                  <button
                    className="delete-btn"
                    onClick={() =>
                      deleteStudent(student.id)
                    }
                  >
                    Delete
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>

      {/* =========================
          STUDENT PROFILE MODAL
      ========================= */}

      {showProfile && selectedStudent && (

        <div
          className="profile-overlay"
          onClick={() => setShowProfile(false)}
        >

          <div
            className="profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="profile-header">

              <div>
                <span className="form-label">
                  STUDENT PROFILE
                </span>

                <h2>
                  {selectedStudent.name}
                </h2>

                <p>
                  {selectedStudent.parent}
                </p>
              </div>

              <button
                className="close-form"
                onClick={() =>
                  setShowProfile(false)
                }
              >
                ✕
              </button>

            </div>

            {/* CONTACT DETAILS */}

            <div className="profile-details">

              <div className="profile-detail">
                <span>Parent</span>
                <strong>
                  {selectedStudent.parent}
                </strong>
              </div>

              <div className="profile-detail">
                <span>Mobile</span>
                <strong>
                  {selectedStudent.phone}
                </strong>
              </div>

              <div className="profile-detail">
                <span>Monthly Fee</span>
                <strong>
                  ₹{selectedStudent.fee}
                </strong>
              </div>

              <div className="profile-detail">
                <span>Status</span>

                <strong>
                  {selectedStudent.status ===
                  "Paid"
                    ? "🟢 Paid"
                    : "🔴 Pending"}
                </strong>
              </div>

            </div>

            {/* PAYMENT HISTORY */}

            <div className="payment-history">

              <div className="history-header">
                <h3>Payment History</h3>

                <span>
                  {(
                    selectedStudent.payments ||
                    []
                  ).length}{" "}
                  payments
                </span>
              </div>

              {selectedStudent.payments &&
              selectedStudent.payments.length > 0 ? (

                <div className="history-list">

                  {[
                    ...selectedStudent.payments,
                  ]
                    .reverse()
                    .map((payment) => (

                      <div
                        className="history-row"
                        key={payment.id}
                      >

                        <div>
                          <strong>
                            {payment.month}
                          </strong>

                          <p>
                            {new Date(
                              payment.date
                            ).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <strong>
                          ₹{payment.amount}
                        </strong>

                        <span className="history-paid">
                          ✓ Paid
                        </span>

                      </div>

                    ))}

                </div>

              ) : (

                <div className="no-history">
                  No payments recorded yet.
                </div>

              )}

            </div>

            {/* PROFILE ACTIONS */}

            <div className="profile-actions">

              <button
                className="save-student"
                onClick={() =>
                  togglePaymentStatus(
                    selectedStudent.id
                  )
                }
              >
                {selectedStudent.status ===
                "Paid"
                  ? "↩ Mark Pending"
                  : "✓ Mark Paid"}
              </button>

              {selectedStudent.status ===
                "Pending" && (
                <button
                  className="remind-profile-btn"
                  onClick={() =>
                    remindStudent(
                      selectedStudent
                    )
                  }
                >
                  🔔 Remind
                </button>
              )}

              <button
                className="edit-btn"
                onClick={() =>
                  editStudent(
                    selectedStudent
                  )
                }
              >
                ✏️ Edit
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;