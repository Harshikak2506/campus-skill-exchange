import { useState, useEffect } from "react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function App() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // =========================================================
  // USERS
  // =========================================================

  const [users, setUsers] = useState([]);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  // =========================================================
  // SKILLS (REAL COURSES POSTED BY REGISTERED TEACHERS)
  // =========================================================

  const [skills, setSkills] = useState([]);

  // =========================================================
  // REQUESTS
  // =========================================================

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("requests");
    return saved ? JSON.parse(saved) : [];
  });

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [studentForm, setStudentForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [teacherForm, setTeacherForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [adminCode, setAdminCode] = useState("");

  // =========================================================
  // OFFER SKILL
  // =========================================================

  const [offerSkill, setOfferSkill] = useState({
    name: "",
    category: "Coding",
    level: "Beginner",
  });

  // =========================================================
  // SESSIONS
  // =========================================================

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("sessions");
    return saved ? JSON.parse(saved) : [];
  });

  // =========================================================
  // ADMIN DASHBOARD STATE
  // =========================================================

  const [adminData, setAdminData] = useState({
    totalStudents: 0,
    totalSkills: 0,
    students: [],
    loginLogs: [],
  });
  const [adminSearch, setAdminSearch] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // =========================================================
  // SAVE LOCAL DATA
  // =========================================================

  useEffect(() => {
    // Purge any legacy dummy skills cached locally in the browser
    localStorage.removeItem("skills");
  }, []);

  useEffect(() => {
    localStorage.setItem("requests", JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions]);

  // =========================================================
  // LOAD STUDENTS FROM MONGODB
  // =========================================================

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/students`);

        if (!response.ok) {
          throw new Error("Failed to load students");
        }

        const data = await response.json();

        console.log("Students from MongoDB:", data);

        const cleanedStudents = data.map((student) => ({
          id: student.studentId,
          name: student.name,
          email: student.email,
          phone: student.phone,
        }));

        setUsers(cleanedStudents);
      } catch (error) {
        console.error("Could not load students:", error);
      }
    };

    loadStudents();
  }, []);

  // =========================================================
  // LOAD SKILLS FROM MONGODB
  // =========================================================

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/skills`);

        if (!response.ok) {
          throw new Error("Failed to load skills");
        }

        const data = await response.json();

        console.log("Skills from MongoDB:", data);

        if (Array.isArray(data)) {
          const cleanedSkills = data.map((skill) => ({
            id: skill._id || skill.id,
            name: skill.name,
            category: skill.category,
            level: skill.level,
            description: skill.description || "",
            teacher: skill.teacher,
            teacherId: skill.teacherId || "",
            teacherEmail: skill.teacherEmail || "",
            teacherPhone: skill.teacherPhone || "",
          }));

          setSkills(cleanedSkills);
        }
      } catch (error) {
        console.error("Could not load skills from MongoDB:", error);
      }
    };

    loadSkills();
  }, []);

  // =========================================================
  // LOAD REQUESTS FROM MONGODB (REAL-TIME STUDENT-INSTRUCTOR)
  // =========================================================

  const loadRequests = async (overrideToken) => {
    const token = overrideToken || localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) {
        const cleaned = data.map((r) => ({
          id: r._id || r.id,
          _id: r._id || r.id,
          student: r.studentName || r.student,
          studentId: r.studentId,
          studentEmail: r.studentEmail || "",
          studentPhone: r.studentPhone || "",
          teacher: r.teacherName || r.teacher,
          teacherId: r.teacherId,
          teacherEmail: r.teacherEmail || "",
          teacherPhone: r.teacherPhone || "",
          skill: r.skillName || r.skill,
          status: r.status,
          message: r.message || "",
          createdAt: r.createdAt,
          phone: r.teacherPhone || r.phone || "N/A",
          email: r.teacherEmail || r.email || "N/A",
        }));

        setRequests(cleaned);
        localStorage.setItem("requests", JSON.stringify(cleaned));
      }
    } catch (error) {
      console.error("Could not load requests from MongoDB:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadRequests();
    }
  }, [currentUser, page]);

  // =========================================================
  // ADMIN DASHBOARD FUNCTIONS
  // =========================================================

  const fetchAdminData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load admin data");
      }

      const data = await response.json();
      setAdminData(data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (page === "admin" && currentUser) {
      fetchAdminData();
    }
  }, [page, currentUser]);

  const toggleStudentRole = async (studentId, currentRole) => {
    const newRole = currentRole === "admin" ? "student" : "admin";
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId, role: newRole }),
      });
      if (response.ok) {
        alert(`User role updated to ${newRole}!`);
        fetchAdminData();
      }
    } catch (err) {
      alert("Could not update role");
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm(`Are you sure you want to remove student ${studentId}?`)) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/student/${studentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        alert("Student removed!");
        fetchAdminData();
      }
    } catch (err) {
      alert("Could not remove student");
    }
  };

  const filteredAdminStudents = (adminData.students || []).filter((s) => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async () => {
    if (!loginId.trim() || !loginPass) {
      alert("Please enter Student ID / Email and Password.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: loginId.trim(),
            email: loginId.trim(),
            password: loginPass,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        alert(data.message || "Invalid Student ID / Email or Password");
        return;
      }

      // Save JWT token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Create frontend user object
      const student = {
        id: data.student.studentId,
        name: data.student.name,
        email: data.student.email,
        phone: data.student.phone,
        role:
          data.student.role ||
          (data.student.studentId?.toUpperCase().includes("ADMIN")
            ? "admin"
            : "student"),
      };

      // Update users
      setUsers((prevUsers) => {
        const exists = prevUsers.some(
          (u) =>
            u.id.trim().toUpperCase() ===
            student.id.trim().toUpperCase()
        );

        if (exists) {
          return prevUsers.map((u) =>
            u.id.trim().toUpperCase() ===
            student.id.trim().toUpperCase()
              ? { ...u, ...student }
              : u
          );
        }

        return [...prevUsers, student];
      });

      // Set logged-in user
      setCurrentUser(student);

      if (data.token) {
        loadRequests(data.token);
      }

      setShowLogin(false);
      setPage("dashboard");

      setLoginId("");
      setLoginPass("");

      alert("Login Successful!");
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Cannot connect to server. Make sure the backend is running on port 5000."
      );
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================
  // REGISTER (STUDENT OR TEACHER)
  // =========================================================

  const handleRegister = async (role, formData) => {
    const isTeacher = role === "teacher";
    const idLabel = isTeacher ? "Teacher / Faculty ID" : "Student ID";

    if (
      !formData.id.trim() ||
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password
    ) {
      alert(`Please fill all fields for ${isTeacher ? "Teacher" : "Student"} registration.`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: formData.id.trim(),
          teacherId: formData.id.trim(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: role,
          adminSecret: adminCode.trim(),
        }),
      });

      const data = await response.json();

      console.log("Register response:", data);

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      const registeredUser = {
        id: data.student.studentId,
        name: data.student.name,
        email: data.student.email,
        phone: data.student.phone,
        role:
          data.student.role ||
          (data.student.studentId?.toUpperCase().includes("ADMIN")
            ? "admin"
            : role),
      };

      // Add user to frontend state
      setUsers((prevUsers) => [...prevUsers, registeredUser]);

      // Automatically log in
      setCurrentUser(registeredUser);

      setShowRegister(false);
      setPage("dashboard");

      setStudentForm({ id: "", name: "", phone: "", email: "", password: "" });
      setTeacherForm({ id: "", name: "", phone: "", email: "", password: "" });
      setAdminCode("");

      alert(`${isTeacher ? "Teacher" : "Student"} Registration Successful! Welcome, ${registeredUser.name}!`);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Cannot connect to server. Make sure the backend is running.");
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("requests");
    setRequests([]);

    setCurrentUser(null);
    setPage("home");
  };

  // =========================================================
  // SEND REQUEST (MONGODB-BACKED)
  // =========================================================

  const sendRequest = async (skill) => {
    if (!currentUser) {
      alert("Please login first to request courses.");
      setShowLogin(true);
      return;
    }

    if (
      skill.teacher === currentUser.name ||
      (skill.teacherId && skill.teacherId === currentUser.id)
    ) {
      alert("You are the instructor of this course.");
      return;
    }

    const alreadyRequested = requests.some(
      (r) =>
        (r.student === currentUser.name || (r.studentId && r.studentId === currentUser.id)) &&
        r.skill === skill.name &&
        (r.teacher === skill.teacher || (skill.teacherId && r.teacherId === skill.teacherId)) &&
        r.status === "Pending"
    );

    if (alreadyRequested) {
      alert("You have already sent a pending request for this course.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          skillId: skill.id || skill._id || "",
          skillName: skill.name,
          teacherName: skill.teacher,
          teacherId: skill.teacherId || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to send request.");
        return;
      }

      const r = data.request;
      const formattedRequest = {
        id: r._id || r.id,
        _id: r._id || r.id,
        student: r.studentName,
        studentId: r.studentId,
        studentEmail: r.studentEmail || "",
        studentPhone: r.studentPhone || "",
        teacher: r.teacherName,
        teacherId: r.teacherId,
        teacherEmail: r.teacherEmail || "",
        teacherPhone: r.teacherPhone || "",
        skill: r.skillName,
        status: r.status,
        phone: r.teacherPhone || "N/A",
        email: r.teacherEmail || "N/A",
      };

      setRequests((prevRequests) => [
        formattedRequest,
        ...prevRequests.filter((item) => (item.id || item._id) !== formattedRequest.id),
      ]);

      alert(`✅ Request Sent to ${skill.teacher}! The instructor will see it on their dashboard.`);
    } catch (error) {
      console.error("sendRequest error:", error);
      alert("Cannot connect to server. Make sure the backend is running.");
    }
  };

  // =========================================================
  // UPDATE REQUEST (MONGODB-BACKED)
  // =========================================================

  const updateRequest = async (id, status) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || `Failed to update request status.`);
        return;
      }

      const updated = data.request;

      setRequests((prevRequests) =>
        prevRequests.map((r) =>
          (r.id === id || r._id === id)
            ? {
                ...r,
                status: updated.status,
                studentEmail: updated.studentEmail || r.studentEmail,
                studentPhone: updated.studentPhone || r.studentPhone,
                teacherEmail: updated.teacherEmail || r.teacherEmail,
                teacherPhone: updated.teacherPhone || r.teacherPhone,
              }
            : r
        )
      );

      alert(`Request has been ${status}!`);
    } catch (error) {
      console.error("updateRequest error:", error);
      alert("Could not update request on server. Please try again.");
    }
  };

  // =========================================================
  // ADD SKILL / COURSE
  // =========================================================

  const addSkill = async () => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
      alert("Only registered Teachers or Admins can post courses. Please register with a Teacher account.");
      return;
    }

    if (!offerSkill.name.trim()) {
      alert("Please enter a course name.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: offerSkill.name.trim(),
          category: offerSkill.category,
          level: offerSkill.level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post course");
      }

      const createdSkill = {
        id: (data.skill && data.skill._id) || Date.now(),
        name: (data.skill && data.skill.name) || offerSkill.name.trim(),
        category: (data.skill && data.skill.category) || offerSkill.category,
        level: (data.skill && data.skill.level) || offerSkill.level,
        teacher: (data.skill && data.skill.teacher) || currentUser.name,
        teacherId: currentUser.id,
        teacherEmail: currentUser.email,
        teacherPhone: currentUser.phone,
      };

      setSkills((prevSkills) => [createdSkill, ...prevSkills]);

      setOfferSkill({
        name: "",
        category: "Coding",
        level: "Beginner",
      });

      alert("Course Published Successfully to Campus!");
    } catch (err) {
      console.error("Error adding course:", err);
      alert(err.message || "Could not post course to server.");
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Could not delete course");
      }

      setSkills((prev) => prev.filter((s) => (s.id || s._id) !== courseId));
      alert("Course deleted successfully!");
    } catch (err) {
      alert(err.message || "Could not delete course");
    }
  };

  // =========================================================
  // BOOK SESSION
  // =========================================================

  const bookSession = (requestId, date, time) => {
    const request = requests.find(
      (r) => (r._id || r.id) === requestId
    );

    if (!request) {
      alert("Request not found.");
      return;
    }

    if (!date || !time) {
      alert("Please choose date and time.");
      return;
    }

    const alreadyBooked = sessions.some(
      (s) => s.requestId === requestId
    );

    if (alreadyBooked) {
      alert("Session already booked.");
      return;
    }

    const newSession = {
      id: Date.now(),
      requestId,
      student: request.student,
      teacher: request.teacher,
      skill: request.skill,
      date,
      time,
      status: "Upcoming",
    };

    setSessions((prevSessions) => [
      ...prevSessions,
      newSession,
    ]);

    alert("Session Booked!");
  };

  // =========================================================
  // COMPLETE SESSION
  // =========================================================

  const completeSession = (id) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) =>
        s.id === id
          ? { ...s, status: "Completed" }
          : s
      )
    );
  };

  // =========================================================
  // FILTER SKILLS
  // =========================================================

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      skill.category === category;

    return matchesSearch && matchesCategory;
  });

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const unread = currentUser
    ? requests.filter(
        (r) =>
          (r.teacher === currentUser.name ||
            (r.teacherId && r.teacherId === currentUser.id)) &&
          r.status === "Pending"
      ).length
    : 0;

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">
        <h1>VESIT Skill Exchange</h1>

        <div className="nav-links">

          <button
            onClick={() => setPage("home")}
          >
            Home
          </button>

          <button
            onClick={() => setPage("skills")}
          >
            Skills
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => setPage("dashboard")}
              >
                Dashboard
              </button>

              {(currentUser.role === "admin" ||
                currentUser.id?.toUpperCase().includes("ADMIN")) && (
                <button
                  onClick={() => setPage("admin")}
                  style={{
                    backgroundColor: page === "admin" ? "#be123c" : "#e11d48",
                    color: "white",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    padding: "6px 14px",
                  }}
                >
                  🛡️ Admin Panel
                </button>
              )}

              <span>
                🔔 {unread}
              </span>

              <span>
                Hi, {currentUser.name}
              </span>

              <button
                className="logout"
                onClick={logout}
              >
                Logout
              </button>
            </>
          )}

          {!currentUser && (
            <>
              <button
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>

              <button
                onClick={() => setShowRegister(true)}
              >
                Register
              </button>
            </>
          )}

        </div>
      </nav>

      {/* =====================================================
          HOME
      ===================================================== */}

      {page === "home" && (
        <section className="hero">

          <h2>
            Find a Skill. Share a Skill.
          </h2>

          <p>
            Connect with VESIT students to learn
            and teach skills across campus.
          </p>

          <button
            onClick={() => setPage("skills")}
          >
            Explore Skills
          </button>

        </section>
      )}

      {/* =====================================================
          SKILLS PAGE
      ===================================================== */}

      {page === "skills" && (
        <section className="skills-page">

          <h2>Popular Skills</h2>

          <div className="filters">

            <input
              placeholder="Search skills..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              <option>All</option>
              <option>Coding</option>
              <option>Design</option>
              <option>Business</option>
              <option>Communication</option>
            </select>

          </div>

          <div className="skills-grid">

            {filteredSkills.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "1.2rem", color: "#64748b", marginBottom: "10px" }}>
                  No courses posted yet.
                </p>
                <p style={{ color: "#94a3b8" }}>
                  Register or login with a <strong>Teacher</strong> account to publish courses to campus!
                </p>
                {currentUser && (currentUser.role === "teacher" || currentUser.role === "admin") && (
                  <button
                    onClick={() => setPage("dashboard")}
                    style={{ marginTop: "14px", padding: "10px 22px" }}
                  >
                    ➕ Post a Course Now
                  </button>
                )}
              </div>
            ) : (
              filteredSkills.map((skill) => (

                <div
                  key={skill.id}
                  className="skill-card"
                >

                  <h3>{skill.name}</h3>

                  <p>
                    Level: {skill.level}
                  </p>

                  <p>
                    Category: {skill.category}
                  </p>

                  <p>
                    Offered by {skill.teacher}
                  </p>

                  {currentUser &&
                  (currentUser.name === skill.teacher ||
                    (skill.teacherId && skill.teacherId === currentUser.id)) ? (
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <span
                        style={{
                          padding: "8px 12px",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        👨‍🏫 Your Course
                      </span>
                      <button
                        onClick={() => deleteCourse(skill.id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        sendRequest(skill)
                      }
                    >
                      {requests.some(
                        (r) =>
                          currentUser &&
                          (r.student === currentUser.name || (r.studentId && r.studentId === currentUser.id)) &&
                          r.skill === skill.name &&
                          (r.teacher === skill.teacher || (skill.teacherId && r.teacherId === skill.teacherId)) &&
                          r.status === "Pending"
                      )
                        ? "Requested"
                        : "Request to Learn"}
                    </button>
                  )}

                </div>

              ))
            )}

          </div>

        </section>
      )}

      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      {page === "dashboard" &&
        currentUser && (
          <section className="dashboard">

            <h2>
              {currentUser.name}'s Dashboard
            </h2>

            {/* STATS */}

            <div className="stats">

              <div className="stat-box">
                <h3>
                  {
                    skills.filter(
                      (s) =>
                        s.teacher ===
                        currentUser.name
                    ).length
                  }
                </h3>

                <p>My Skills</p>
              </div>

              <div className="stat-box">
                <h3>
                  {
                    requests.filter(
                      (r) =>
                        r.student === currentUser.name ||
                        (r.studentId && r.studentId === currentUser.id)
                    ).length
                  }
                </h3>

                <p>Requests Sent</p>
              </div>

              <div className="stat-box">
                <h3>{unread}</h3>

                <p>Pending Requests</p>
              </div>

            </div>

            {/* =================================================
                TEACHER COURSE PUBLISHING PORTAL
            ================================================= */}

            {(currentUser.role === "teacher" || currentUser.role === "admin") ? (
              <>
                <div className="panel" style={{ borderLeft: "6px solid #2563eb" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <h3>👨‍🏫 Post a New Course (Teacher Portal)</h3>
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                      }}
                    >
                      Instructor: {currentUser.name}
                    </span>
                  </div>

                  <input
                    placeholder="Course name (e.g. Advanced Python, Full Stack React)"
                    value={offerSkill.name}
                    onChange={(e) =>
                      setOfferSkill({
                        ...offerSkill,
                        name: e.target.value,
                      })
                    }
                  />

                  <select
                    value={offerSkill.category}
                    onChange={(e) =>
                      setOfferSkill({
                        ...offerSkill,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>Coding</option>
                    <option>Design</option>
                    <option>Business</option>
                    <option>Communication</option>
                  </select>

                  <select
                    value={offerSkill.level}
                    onChange={(e) =>
                      setOfferSkill({
                        ...offerSkill,
                        level: e.target.value,
                      })
                    }
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>

                  <button onClick={addSkill} style={{ marginTop: "14px" }}>
                    🚀 Publish Course to Campus
                  </button>
                </div>

                {/* MY COURSES LIST */}
                {skills.filter(
                  (s) =>
                    s.teacher === currentUser.name ||
                    (s.teacherId && s.teacherId === currentUser.id)
                ).length > 0 && (
                  <div className="panel">
                    <h3>Courses You Teach</h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "16px",
                        marginTop: "12px",
                      }}
                    >
                      {skills
                        .filter(
                          (s) =>
                            s.teacher === currentUser.name ||
                            (s.teacherId && s.teacherId === currentUser.id)
                        )
                        .map((s) => (
                          <div
                            key={s.id}
                            style={{
                              border: "1px solid #e2e8f0",
                              padding: "16px",
                              borderRadius: "14px",
                              background: "#f8fafc",
                            }}
                          >
                            <h4 style={{ color: "#1e3a8a", fontSize: "1.15rem", marginBottom: "6px" }}>
                              {s.name}
                            </h4>
                            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "4px 0" }}>
                              Category: {s.category} | Level: {s.level}
                            </p>
                            <button
                              onClick={() => deleteCourse(s.id)}
                              style={{
                                background: "#ef4444",
                                color: "#fff",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "0.85rem",
                                marginTop: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Delete Course
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                className="panel"
                style={{
                  borderLeft: "6px solid #10b981",
                  background: "#f0fdf4",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ color: "#065f46", marginBottom: "8px" }}>🎓 Student Account</h3>
                <p style={{ color: "#047857", marginBottom: "14px", fontSize: "0.95rem" }}>
                  You are logged in as a <strong>Student</strong>. Browse courses on the <strong>Skills</strong> page and click <em>Request to Learn</em> to study with an instructor. (To teach and post courses, register a Teacher account).
                </p>
                <button
                  onClick={() => setPage("skills")}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Browse Available Courses
                </button>
              </div>
            )}

            {/* =================================================
                REQUESTS
            ================================================= */}

            <div className="dashboard-grid">

              {/* REQUESTS RECEIVED */}

              <div className="panel">

                <h3>Requests Received</h3>

                {requests.filter(
                  (r) =>
                    r.teacher === currentUser.name ||
                    (r.teacherId && r.teacherId === currentUser.id)
                ).length === 0 ? (
                  <p>No requests received yet.</p>
                ) : (
                  requests
                    .filter(
                      (r) =>
                        r.teacher === currentUser.name ||
                        (r.teacherId && r.teacherId === currentUser.id)
                    )
                    .map((r) => (

                      <div
                        key={r._id || r.id}
                        className="request-card"
                      >

                        <strong>
                          {r.skill}
                        </strong>

                        <p>
                          Student: <strong>{r.student}</strong>
                        </p>

                        <p>
                          Status: <span style={{
                            fontWeight: "bold",
                            color: r.status === "Accepted" ? "#16a34a" : r.status === "Rejected" ? "#dc2626" : "#d97706"
                          }}>{r.status}</span>
                        </p>

                        {r.status === "Pending" ? (

                          <div className="actions">

                            <button
                              onClick={() =>
                                updateRequest(
                                  r._id || r.id,
                                  "Accepted"
                                )
                              }
                            >
                              Accept
                            </button>

                            <button
                              onClick={() =>
                                updateRequest(
                                  r._id || r.id,
                                  "Rejected"
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : (
                          <>
                            {r.status === "Accepted" && (
                              <div style={{ marginTop: "8px", fontSize: "0.9rem", color: "#334155" }}>
                                <p style={{ fontWeight: "600", color: "#0f766e" }}>Student Contact Details:</p>
                                <p>📞 {r.studentPhone || r.phone || "Not provided"}</p>
                                <p>✉️ {r.studentEmail || r.email || "Not provided"}</p>
                              </div>
                            )}
                          </>
                        )}

                      </div>

                    ))
                )}

              </div>

              {/* MY REQUESTS */}

              <div className="panel">

                <h3>My Requests</h3>

                {requests.filter(
                  (r) =>
                    r.student === currentUser.name ||
                    (r.studentId && r.studentId === currentUser.id)
                ).length === 0 ? (
                  <p>No requests sent yet.</p>
                ) : (
                  requests
                    .filter(
                      (r) =>
                        r.student === currentUser.name ||
                        (r.studentId && r.studentId === currentUser.id)
                    )
                    .map((r) => (

                      <div
                        key={r._id || r.id}
                        className="request-card"
                      >

                        <strong>
                          {r.skill}
                        </strong>

                        <p>
                          Teacher: <strong>{r.teacher}</strong>
                        </p>

                        <p>
                          Status: <span style={{
                            fontWeight: "bold",
                            color: r.status === "Accepted" ? "#16a34a" : r.status === "Rejected" ? "#dc2626" : "#d97706"
                          }}>{r.status}</span>
                        </p>

                        {r.status === "Accepted" && (
                          <>
                            <div style={{ marginTop: "8px", fontSize: "0.9rem", color: "#334155" }}>
                              <p style={{ fontWeight: "600", color: "#1d4ed8" }}>Instructor Contact Details:</p>
                              <p>📞 {r.teacherPhone || r.phone || "Available"}</p>
                              <p>✉️ {r.teacherEmail || r.email || "Available"}</p>
                            </div>

                            <button
                              onClick={() =>
                                bookSession(
                                  r._id || r.id,
                                  "2026-10-01",
                                  "16:00"
                                )
                              }
                            >
                              Book Demo Session
                            </button>
                          </>
                        )}

                      </div>

                    ))
                )}

              </div>

            </div>

            {/* =================================================
                UPCOMING SESSIONS
            ================================================= */}

            <div className="panel">

              <h3>Upcoming Sessions</h3>

              {sessions.filter(
                (s) =>
                  s.status === "Upcoming" &&
                  (
                    s.student ===
                      currentUser.name ||
                    s.teacher ===
                      currentUser.name
                  )
              ).length === 0 ? (
                <p>
                  No upcoming sessions.
                </p>
              ) : (
                sessions
                  .filter(
                    (s) =>
                      s.status ===
                        "Upcoming" &&
                      (
                        s.student ===
                          currentUser.name ||
                        s.teacher ===
                          currentUser.name
                      )
                  )
                  .map((s) => (

                    <div
                      key={s.id}
                      className="session-card"
                    >

                      <strong>
                        {s.skill}
                      </strong>

                      <p>
                        Date: {s.date}
                      </p>

                      <p>
                        Time: {s.time}
                      </p>

                      <p>
                        {s.teacher} ↔{" "}
                        {s.student}
                      </p>

                      <button
                        onClick={() =>
                          completeSession(s.id)
                        }
                      >
                        Mark Completed
                      </button>

                    </div>

                  ))
              )}

            </div>

            {/* =================================================
                COMPLETED SESSIONS
            ================================================= */}

            <div className="panel">

              <h3>Completed Sessions</h3>

              {sessions.filter(
                (s) =>
                  s.status === "Completed" &&
                  (
                    s.student ===
                      currentUser.name ||
                    s.teacher ===
                      currentUser.name
                  )
              ).length === 0 ? (
                <p>
                  No completed sessions.
                </p>
              ) : (
                sessions
                  .filter(
                    (s) =>
                      s.status ===
                        "Completed" &&
                      (
                        s.student ===
                          currentUser.name ||
                        s.teacher ===
                          currentUser.name
                      )
                  )
                  .map((s) => (

                    <div
                      key={s.id}
                      className="session-card"
                    >

                      <strong>
                        {s.skill}
                      </strong>

                      <p>
                        Date: {s.date}
                      </p>

                      <p>
                        Time: {s.time}
                      </p>

                      <p>
                        {s.teacher} ↔{" "}
                        {s.student}
                      </p>

                      <p>
                        ✅ Session Completed
                      </p>

                    </div>

                  ))
              )}

            </div>

          </section>
        )}

      {/* =====================================================
          ADMIN DASHBOARD
      ===================================================== */}

      {page === "admin" && currentUser && (
        <section className="dashboard">
          <div className="panel" style={{ borderLeft: "6px solid #e11d48" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "2rem", color: "#12245e", marginBottom: "4px" }}>
                  🛡️ Admin Control Center
                </h2>
                <p style={{ color: "#64748b" }}>
                  Database administration, student directory, and platform analytics
                </p>
              </div>
              <button
                onClick={fetchAdminData}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#1f3fa3",
                  color: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🔄 Refresh Live Data
              </button>
            </div>

            {/* Metrics Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                marginTop: "24px",
              }}
            >
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "20px",
                  borderRadius: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#166534" }}>
                  {adminData.totalStudents ?? adminData.students?.length ?? 0}
                </div>
                <div style={{ color: "#15803d", fontWeight: "600", marginTop: "6px" }}>
                  👥 Total Registered Students
                </div>
              </div>

              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "20px",
                  borderRadius: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#1e40af" }}>
                  {adminData.totalSkills ?? skills.length}
                </div>
                <div style={{ color: "#1d4ed8", fontWeight: "600", marginTop: "6px" }}>
                  📚 Active Skills & Courses
                </div>
              </div>

              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  padding: "20px",
                  borderRadius: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#9f1239" }}>
                  {adminData.loginLogs ? adminData.loginLogs.length : 0}
                </div>
                <div style={{ color: "#be123c", fontWeight: "600", marginTop: "6px" }}>
                  🔑 Recent Login Records
                </div>
              </div>
            </div>
          </div>

          {/* Student Management Panel */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <h3>Student Management Directory</h3>
              <input
                style={{
                  padding: "10px 16px",
                  width: "320px",
                  maxWidth: "100%",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                }}
                placeholder="🔍 Search by ID, Name, or Email..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>

            {adminLoading ? (
              <p>Loading database records...</p>
            ) : filteredAdminStudents.length === 0 ? (
              <p>No students found matching your search.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.95rem",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 16px" }}>Student ID</th>
                      <th style={{ padding: "14px 16px" }}>Name</th>
                      <th style={{ padding: "14px 16px" }}>Email</th>
                      <th style={{ padding: "14px 16px" }}>Phone</th>
                      <th style={{ padding: "14px 16px" }}>Role</th>
                      <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminStudents.map((st) => (
                      <tr
                        key={st._id || st.studentId}
                        style={{ borderBottom: "1px solid #e2e8f0" }}
                      >
                        <td style={{ padding: "14px 16px", fontWeight: "600" }}>{st.studentId}</td>
                        <td style={{ padding: "14px 16px" }}>{st.name}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{st.email}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>
                          {st.phone || "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "999px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              backgroundColor: st.role === "admin" ? "#ffe4e6" : "#e0e7ff",
                              color: st.role === "admin" ? "#e11d48" : "#3730a3",
                            }}
                          >
                            {st.role?.toUpperCase() || "STUDENT"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => toggleStudentRole(st.studentId, st.role)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.85rem",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: st.role === "admin" ? "#64748b" : "#3b82f6",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              {st.role === "admin" ? "Demote" : "Make Admin"}
                            </button>
                            <button
                              onClick={() => deleteStudent(st.studentId)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.85rem",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#ef4444",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Login Activity Logs */}
          <div className="panel">
            <h3>Recent Login Activity Logs</h3>
            {adminData.loginLogs && adminData.loginLogs.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px" }}>Student ID</th>
                      <th style={{ padding: "12px 14px" }}>Email</th>
                      <th style={{ padding: "12px 14px" }}>Action</th>
                      <th style={{ padding: "12px 14px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.loginLogs.map((log, i) => (
                      <tr key={log._id || i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 14px", fontWeight: "600" }}>{log.studentId}</td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{log.email}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#16a34a", fontWeight: "bold" }}>● {log.action}</span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No recent login logs recorded.</p>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          LOGIN MODAL
      ===================================================== */}

      {showLogin && (
        <div className="modal-overlay">

          <div className="modal">

            <h2>Login to Skill Exchange</h2>

            <input
              placeholder="Student ID or Email"
              value={loginId}
              onChange={(e) =>
                setLoginId(e.target.value)
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPass}
              onChange={(e) =>
                setLoginPass(e.target.value)
              }
            />

            <button onClick={login}>
              Login
            </button>

            <button
              onClick={() =>
                setShowLogin(false)
              }
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          REGISTER MODAL
      ===================================================== */}

      {showRegister && (
        <div className="modal-overlay">

          <div className="modal modal-register-wide">

            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <h2 style={{ fontSize: "2.3rem", color: "#172e6a", marginBottom: "4px" }}>
                Campus Registration
              </h2>
              <p style={{ color: "#64748b", fontSize: "1.05rem" }}>
                Choose your portal below to register as a Student or Teacher
              </p>
            </div>

            <div className="register-adjacent-container">

              {/* WINDOW 1: STUDENT REGISTRATION */}
              <div className="register-column-card student-card">
                <h3 style={{ color: "#1d4ed8" }}>🎓 Student Registration</h3>
                <p className="subtitle">Learn new skills and request mentorship</p>

                <input
                  placeholder="Student ID (e.g. 2024ayush)"
                  value={studentForm.id}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      id: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Full Name"
                  value={studentForm.name}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Contact Phone"
                  value={studentForm.phone}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      phone: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Student Email"
                  value={studentForm.email}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={studentForm.password}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() => handleRegister("student", studentForm)}
                >
                  Register as Student
                </button>
              </div>

              {/* WINDOW 2: TEACHER REGISTRATION */}
              <div className="register-column-card teacher-card">
                <h3 style={{ color: "#047857" }}>👨‍🏫 Teacher / Faculty Registration</h3>
                <p className="subtitle">Publish courses, share skills, and teach</p>

                <input
                  placeholder="Teacher / Faculty ID (e.g. PROF_AYUSH)"
                  value={teacherForm.id}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      id: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Full Name (with Prof./Dr. prefix)"
                  value={teacherForm.name}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Contact Phone"
                  value={teacherForm.phone}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      phone: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Teacher / Faculty Email"
                  value={teacherForm.email}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={teacherForm.password}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() => handleRegister("teacher", teacherForm)}
                >
                  Register as Teacher
                </button>
              </div>

            </div>

            {/* Optional Admin Passcode */}
            <div style={{ marginTop: "14px", textAlign: "center" }}>
              <input
                style={{
                  maxWidth: "340px",
                  margin: "0 auto",
                  padding: "8px 14px",
                  fontSize: "14px",
                  textAlign: "center",
                  display: "inline-block",
                  borderRadius: "8px",
                  border: "1px dashed #94a3b8",
                }}
                placeholder="Admin Passcode (optional: admin123)"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowRegister(false)}
              style={{
                width: "auto",
                margin: "14px auto 0 auto",
                display: "block",
                padding: "10px 32px",
                backgroundColor: "#64748b",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">
        © 2026 VESIT Skill Exchange
      </footer>

    </div>
  );
}