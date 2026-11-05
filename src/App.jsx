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
  // SKILLS
  // =========================================================

  const [skills, setSkills] = useState(() => {
    const saved = localStorage.getItem("skills");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "Java",
            category: "Coding",
            level: "Intermediate",
            teacher: "Harshika",
          },
          {
            id: 2,
            name: "Python",
            category: "Coding",
            level: "Advanced",
            teacher: "Priya",
          },
          {
            id: 3,
            name: "React",
            category: "Coding",
            level: "Intermediate",
            teacher: "Harshika",
          },
          {
            id: 4,
            name: "C",
            category: "Coding",
            level: "Beginner",
            teacher: "Rahul",
          },
          {
            id: 5,
            name: "C++",
            category: "Coding",
            level: "Intermediate",
            teacher: "Rahul",
          },
          {
            id: 6,
            name: "Canva",
            category: "Design",
            level: "Beginner",
            teacher: "Rahul",
          },
          {
            id: 7,
            name: "Figma",
            category: "Design",
            level: "Intermediate",
            teacher: "Priya",
          },
          {
            id: 8,
            name: "Photoshop",
            category: "Design",
            level: "Advanced",
            teacher: "Harshika",
          },
          {
            id: 9,
            name: "Marketing",
            category: "Business",
            level: "Intermediate",
            teacher: "Priya",
          },
          {
            id: 10,
            name: "Excel",
            category: "Business",
            level: "Advanced",
            teacher: "Rahul",
          },
          {
            id: 11,
            name: "Power BI",
            category: "Business",
            level: "Intermediate",
            teacher: "Harshika",
          },
          {
            id: 12,
            name: "Public Speaking",
            category: "Communication",
            level: "Advanced",
            teacher: "Priya",
          },
        ];
  });

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

  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });

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
    localStorage.setItem("skills", JSON.stringify(skills));
  }, [skills]);

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

        if (Array.isArray(data) && data.length > 0) {
          const cleanedSkills = data.map((skill) => ({
            id: skill._id || skill.id,
            name: skill.name,
            category: skill.category,
            level: skill.level,
            teacher: skill.teacher,
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
      alert("Please enter Student ID and Password.");
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
            password: loginPass,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        alert(data.message || "Invalid Student ID or Password");
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

  const register = async () => {
    if (
      !newUser.id.trim() ||
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.phone.trim() ||
      !newUser.password
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: newUser.id.trim(),
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          phone: newUser.phone.trim(),
          password: newUser.password,
          role: newUser.isAdmin ? "admin" : "student",
          adminSecret: newUser.adminSecret || "",
        }),
      });

      const data = await response.json();

      console.log("Register response:", data);

      if (!response.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

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

      // Add user to frontend state
      setUsers((prevUsers) => [...prevUsers, student]);

      // Automatically log in
      setCurrentUser(student);

      setShowRegister(false);
      setPage("dashboard");

      setNewUser({
        id: "",
        name: "",
        phone: "",
        email: "",
        password: "",
        isAdmin: false,
        adminSecret: "",
      });

      alert("Registration Successful!");
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        "Cannot connect to server. Make sure the backend is running on port 5000."
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");

    setCurrentUser(null);
    setPage("home");
  };

  // =========================================================
  // SEND REQUEST
  // =========================================================

  const sendRequest = (skill) => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if (skill.teacher === currentUser.name) {
      alert("You already own this skill.");
      return;
    }

    const alreadyRequested = requests.some(
      (r) =>
        r.student === currentUser.name &&
        r.skill === skill.name &&
        r.teacher === skill.teacher
    );

    if (alreadyRequested) {
      alert("Request already sent.");
      return;
    }

    const teacher = users.find(
      (u) => u.name === skill.teacher
    );

    if (!teacher) {
      alert("Teacher information not found.");
      return;
    }

    const newRequest = {
      id: Date.now(),
      student: currentUser.name,
      teacher: skill.teacher,
      skill: skill.name,
      status: "Pending",
      phone: teacher.phone,
      email: teacher.email,
    };

    setRequests((prevRequests) => [
      ...prevRequests,
      newRequest,
    ]);

    alert("Request Sent!");
  };

  // =========================================================
  // UPDATE REQUEST
  // =========================================================

  const updateRequest = (id, status) => {
    setRequests((prevRequests) =>
      prevRequests.map((r) =>
        r.id === id ? { ...r, status } : r
      )
    );
  };

  // =========================================================
  // ADD SKILL
  // =========================================================

  const addSkill = async () => {
    if (!currentUser) {
      alert("Please login first.");
      return;
    }

    if (!offerSkill.name.trim()) {
      alert("Please enter a skill name.");
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
        throw new Error(data.message || "Failed to add skill");
      }

      const createdSkill = {
        id: (data.skill && data.skill._id) || Date.now(),
        name: (data.skill && data.skill.name) || offerSkill.name.trim(),
        category: (data.skill && data.skill.category) || offerSkill.category,
        level: (data.skill && data.skill.level) || offerSkill.level,
        teacher: (data.skill && data.skill.teacher) || currentUser.name,
      };

      setSkills((prevSkills) => [...prevSkills, createdSkill]);

      setOfferSkill({
        name: "",
        category: "Coding",
        level: "Beginner",
      });

      alert("Skill Added Successfully to MongoDB!");
    } catch (err) {
      console.error("Error adding skill:", err);
      alert(err.message || "Could not add skill to server.");
    }
  };

  // =========================================================
  // BOOK SESSION
  // =========================================================

  const bookSession = (requestId, date, time) => {
    const request = requests.find(
      (r) => r.id === requestId
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
          r.teacher === currentUser.name &&
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
              <p>No skills found.</p>
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

                  <button
                    onClick={() =>
                      sendRequest(skill)
                    }
                  >
                    {requests.some(
                      (r) =>
                        currentUser &&
                        r.student ===
                          currentUser.name &&
                        r.skill === skill.name &&
                        r.teacher === skill.teacher
                    )
                      ? "Requested"
                      : "Request to Learn"}
                  </button>

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
                        r.student ===
                        currentUser.name
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
                OFFER NEW SKILL
            ================================================= */}

            <div className="panel">

              <h3>Offer a New Skill</h3>

              <input
                placeholder="Skill name"
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

              <button onClick={addSkill}>
                Add Skill
              </button>

            </div>

            {/* =================================================
                REQUESTS
            ================================================= */}

            <div className="dashboard-grid">

              {/* REQUESTS RECEIVED */}

              <div className="panel">

                <h3>Requests Received</h3>

                {requests.filter(
                  (r) =>
                    r.teacher === currentUser.name
                ).length === 0 ? (
                  <p>No requests received yet.</p>
                ) : (
                  requests
                    .filter(
                      (r) =>
                        r.teacher ===
                        currentUser.name
                    )
                    .map((r) => (

                      <div
                        key={r.id}
                        className="request-card"
                      >

                        <strong>
                          {r.skill}
                        </strong>

                        <p>
                          Student: {r.student}
                        </p>

                        <p>
                          Status: {r.status}
                        </p>

                        {r.status ===
                        "Pending" ? (

                          <div className="actions">

                            <button
                              onClick={() =>
                                updateRequest(
                                  r.id,
                                  "Accepted"
                                )
                              }
                            >
                              Accept
                            </button>

                            <button
                              onClick={() =>
                                updateRequest(
                                  r.id,
                                  "Rejected"
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : (
                          <>
                            <p>
                              📞 {r.phone}
                            </p>

                            <p>
                              ✉️ {r.email}
                            </p>
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
                    r.student === currentUser.name
                ).length === 0 ? (
                  <p>No requests sent yet.</p>
                ) : (
                  requests
                    .filter(
                      (r) =>
                        r.student ===
                        currentUser.name
                    )
                    .map((r) => (

                      <div
                        key={r.id}
                        className="request-card"
                      >

                        <strong>
                          {r.skill}
                        </strong>

                        <p>
                          Teacher: {r.teacher}
                        </p>

                        <p>
                          Status: {r.status}
                        </p>

                        {r.status ===
                          "Accepted" && (
                          <>
                            <p>
                              📞 {r.phone}
                            </p>

                            <p>
                              ✉️ {r.email}
                            </p>

                            <button
                              onClick={() =>
                                bookSession(
                                  r.id,
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

            <h2>Student Login</h2>

            <input
              placeholder="Student ID"
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

          <div className="modal">

            <h2>Student Registration</h2>

            <input
              placeholder="Student ID"
              value={newUser.id}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  id: e.target.value,
                })
              }
            />

            <input
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Phone"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  phone: e.target.value,
                })
              }
            />

            <input
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  email: e.target.value,
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  password: e.target.value,
                })
              }
            />

            <div style={{ margin: "10px 0", textAlign: "left", fontSize: "0.9rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newUser.isAdmin || false}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      isAdmin: e.target.checked,
                    })
                  }
                />
                <span>Register as Admin (Code: <code>admin123</code>)</span>
              </label>
              {newUser.isAdmin && (
                <input
                  style={{ marginTop: "8px" }}
                  placeholder="Admin Code (enter admin123)"
                  value={newUser.adminSecret || ""}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      adminSecret: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <button onClick={register}>
              Register
            </button>

            <button
              onClick={() =>
                setShowRegister(false)
              }
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