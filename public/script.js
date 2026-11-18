// ==========================================
// AttendEase - Student Attendance System
// ==========================================

const API = {
    students: "/api/students",
    attendance: "/api/attendance"
};

let students = [];
let attendanceRecords = [];
let editingStudentId = null;

// ==========================================
// ELEMENTS
// ==========================================

const studentTableBody = document.getElementById("studentTableBody");
const attendanceTableBody = document.getElementById("attendanceTableBody");

const studentModal = document.getElementById("studentModal");
const studentForm = document.getElementById("studentForm");

const attendanceDate = document.getElementById("attendanceDate");
const searchInput = document.getElementById("searchInput");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getToday() {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60000)
        .toISOString()
        .split("T")[0];
}

function getStudentId(record) {
    return record.studentId?._id || record.studentId;
}

// ==========================================
// LOAD STUDENTS
// ==========================================

async function loadStudents() {
    try {
        students = await apiRequest(API.students);

        displayStudents();
        await loadAttendance();

    } catch (error) {
        console.error("Loading students failed:", error);
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

// ==========================================
// DISPLAY STUDENTS
// ==========================================

function displayStudents() {
    const search = searchInput.value.toLowerCase().trim();

    const filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(search) ||
        student.regNumber.toLowerCase().includes(search)
    );

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No students found.
                </td>
            </tr>
        `;
        return;
    }

    studentTableBody.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>${escapeHTML(student.regNumber)}</td>
            <td>${escapeHTML(student.fullName)}</td>
            <td>${escapeHTML(student.email)}</td>
            <td>${escapeHTML(student.course)}</td>
            <td>${escapeHTML(student.year)}</td>
            <td>
                <button class="edit-btn"
                    onclick="editStudent('${student._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>

                <button class="delete-btn"
                    onclick="deleteStudent('${student._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// ==========================================
// ADD STUDENT
// ==========================================

document.getElementById("openAddForm").addEventListener("click", () => {
    editingStudentId = null;
    studentForm.reset();

    document.getElementById("studentId").value = "";
    document.getElementById("modalTitle").textContent = "Add New Student";

    studentModal.style.display = "flex";
});

// ==========================================
// CLOSE MODAL
// ==========================================

function closeStudentModal() {
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentId = null;
}

document.getElementById("closeModal").addEventListener("click", closeStudentModal);
document.getElementById("cancelModal").addEventListener("click", closeStudentModal);

// ==========================================
// SAVE STUDENT
// ==========================================

studentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const studentData = {
        regNumber: document.getElementById("regNumber").value.trim(),
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        course: document.getElementById("course").value.trim(),
        year: document.getElementById("year").value
    };

    try {
        if (editingStudentId) {
            await apiRequest(
                `${API.students}/${editingStudentId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(studentData)
                }
            );
        } else {
            await apiRequest(API.students, {
                method: "POST",
                body: JSON.stringify(studentData)
            });
        }

        closeStudentModal();
        await loadStudents();

    } catch (error) {
        alert(error.message);
    }
});
// ==========================================
// EDIT STUDENT
// ==========================================

window.editStudent = function(id) {
    const student = students.find(item => item._id === id);

    if (!student) return;

    editingStudentId = id;

    document.getElementById("studentId").value = id;
    document.getElementById("regNumber").value = student.regNumber;
    document.getElementById("fullName").value = student.fullName;
    document.getElementById("email").value = student.email;
    document.getElementById("course").value = student.course;
    document.getElementById("year").value = student.year;

    document.getElementById("modalTitle").textContent = "Edit Student";

    studentModal.style.display = "flex";
};

// ==========================================
// DELETE STUDENT
// ==========================================

window.deleteStudent = async function(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {
        await apiRequest(`${API.students}/${id}`, {
            method: "DELETE"
        });

        alert("Student deleted successfully.");
        await loadStudents();

    } catch (error) {
        alert(error.message);
    }
};

// ==========================================
// SEARCH STUDENTS
// ==========================================

searchInput.addEventListener("input", displayStudents);

// ==========================================
// LOAD ATTENDANCE
// ==========================================

async function loadAttendance() {
    const date = attendanceDate.value;

    if (!date) return;

    try {
        attendanceRecords = await apiRequest(
            `${API.attendance}?date=${encodeURIComponent(date)}`
        );

        displayAttendance();
        updateStatistics();

    } catch (error) {
        console.error("Loading attendance failed:", error);

        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-message">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

// ==========================================
// DISPLAY ATTENDANCE
// ==========================================

function displayAttendance() {
    if (students.length === 0) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-message">
                    No students available for attendance.
                </td>
            </tr>
        `;
        return;
    }

    attendanceTableBody.innerHTML = students.map(student => {
        const record = attendanceRecords.find(item =>
            String(getStudentId(item)) === String(student._id)
        );

        const status = record?.status || "";

        return `
            <tr data-student-id="${student._id}">
                <td>${escapeHTML(student.regNumber)}</td>
                <td>${escapeHTML(student.fullName)}</td>
                <td>${escapeHTML(student.course)}</td>

                <td>
                    <select
                        class="attendance-status ${status.toLowerCase()}"
                        data-student-id="${student._id}"
                        onchange="changeAttendance(this)"
                    >
                        <option value=""
                            ${!status ? "selected" : ""}>
                            Select Status
                        </option>

                        <option value="Present"
                            ${status === "Present" ? "selected" : ""}>
                            Present
                        </option>

                        <option value="Absent"
                            ${status === "Absent" ? "selected" : ""}>
                            Absent
                        </option>
                    </select>

                    <span class="status-label ${status.toLowerCase()}"
                        data-status-for="${student._id}">
                        ${status || "Not marked"}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

// ==========================================
// CHANGE ATTENDANCE STATUS
// ==========================================

window.changeAttendance = async function(selectElement) {
    const studentId = selectElement.dataset.studentId;
    const status = selectElement.value;
    const date = attendanceDate.value;

    if (!status || !date) return;

    // Immediately update the visible status.
    selectElement.classList.remove("present", "absent");
    selectElement.classList.add(status.toLowerCase());

    const label = document.querySelector(
        `[data-status-for="${studentId}"]`
    );

    if (label) {
        label.textContent = status;
        label.classList.remove("present", "absent");
        label.classList.add(status.toLowerCase());
    }

    selectElement.disabled = true;

    try {
        const savedRecord = await apiRequest(API.attendance, {
            method: "POST",
            body: JSON.stringify({
                studentId,
                date,
                status
            })
        });

        const existingIndex = attendanceRecords.findIndex(record =>
            String(getStudentId(record)) === String(studentId)
        );

        if (existingIndex >= 0) {
            attendanceRecords[existingIndex] = savedRecord;
        } else {
            attendanceRecords.push(savedRecord);
        }

        updateStatistics();

    } catch (error) {
        alert("Could not save attendance: " + error.message);

        await loadAttendance();

    } finally {
        selectElement.disabled = false;
    }
};

// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {
    const total = students.length;

    const present = attendanceRecords.filter(
        record => record.status === "Present"
    ).length;

    const absent = attendanceRecords.filter(
        record => record.status === "Absent"
    ).length;

    const marked = present + absent;

    const rate = marked > 0
        ? Math.round((present / marked) * 100)
        : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("presentStudents").textContent = present;
    document.getElementById("absentStudents").textContent = absent;
    document.getElementById("attendanceRate").textContent = rate + "%";
}

// ==========================================
// CHANGE ATTENDANCE DATE
// ==========================================

attendanceDate.addEventListener("change", loadAttendance);

// ==========================================
// INITIALISE SYSTEM
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    attendanceDate.value = getToday();
    await loadStudents();
});

// ==========================================
// PRINT ATTENDANCE
// ==========================================

window.printAttendance = function() {
    const date = attendanceDate.value;

    if (!date) {
        alert("Please select an attendance date.");
        return;
    }

    const marked = attendanceRecords.length;

    if (marked === 0) {
        alert("No attendance has been recorded for this date.");
        return;
    }

    window.print();
};