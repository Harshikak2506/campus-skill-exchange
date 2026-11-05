const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =========================================================
   MONGODB CONNECTION
========================================================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exitCode = 1;
  });


/* =========================================================
   STUDENT SCHEMA
========================================================= */

const studentsSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    /* Experiment 6 - User Role */
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   LOGIN LOG SCHEMA
========================================================= */

const loginLogSchema = new mongoose.Schema(
  {
    studentId: String,
    email: String,
    action: String,
    token: String,
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   SKILLS SCHEMA
========================================================= */

const skillsSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    level: String,
    description: String,
    teacher: String,
    teacherId: String,
    teacherEmail: String,
    teacherPhone: String,
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   MODELS
========================================================= */

const Student = mongoose.model(
  "Student",
  studentsSchema,
  "students"
);

const LoginLog = mongoose.model(
  "LoginLog",
  loginLogSchema,
  "loginlogs"
);

const Skill = mongoose.model(
  "Skill",
  skillsSchema,
  "skills"
);

/* =========================================================
   REQUESTS SCHEMA & MODEL
========================================================= */

const requestsSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      default: "",
    },
    studentPhone: {
      type: String,
      default: "",
    },
    teacherId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    teacherEmail: {
      type: String,
      default: "",
    },
    teacherPhone: {
      type: String,
      default: "",
    },
    skillId: {
      type: String,
      default: "",
    },
    skillName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const CourseRequest = mongoose.model(
  "CourseRequest",
  requestsSchema,
  "courserequests"
);


/* =========================================================
   HOME / TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "VESIT Skill Exchange API is running",
  });
});


/* =========================================================
   EXPERIMENT 5
   REGISTER API
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const rawId = (
      req.body.studentId ||
      req.body.teacherId ||
      req.body.id ||
      ""
    ).trim();

    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    const isTeacher = req.body.role === "teacher";

    /* Validate required fields */

    if (
      !rawId ||
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: `Please fill all required fields (${isTeacher ? "Teacher ID" : "Student ID"}, Name, Email, Password)`,
      });
    }

    /* Check whether ID already exists */

    const existingStudent = await Student.findOne({
      studentId: rawId,
    });

    if (existingStudent) {
      return res.status(400).json({
        message: isTeacher ? "This Teacher ID already exists" : "This Student ID already exists",
      });
    }

    /* Check whether email already exists */

    const existingEmail = await Student.findOne({
      email: email.trim(),
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    /* Hash password */

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    /* Determine user role */
    let assignedRole = "student";
    if (
      req.body.role === "admin" ||
      req.body.adminSecret === "admin123" ||
      (rawId && rawId.toUpperCase().includes("ADMIN"))
    ) {
      assignedRole = "admin";
    } else if (req.body.role === "teacher") {
      assignedRole = "teacher";
    }

    /* Create user account */

    const student = await Student.create({
      studentId: rawId,
      name: name.trim(),
      email: email.trim(),
      phone: phone || "",
      password: hashedPassword,
      role: assignedRole,
    });

    res.status(201).json({
      message: "Registration Successful",

      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
      },
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   EXPERIMENT 5 + 6
   LOGIN API
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const identifier = (
      req.body.studentId ||
      req.body.email ||
      req.body.identifier ||
      ""
    ).trim();
    const password = req.body.password;

    /* Validate input */

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Student ID or Email and Password are required",
      });
    }

    /* Escape regex characters for safe query */
    const safeIdentifier = identifier.replace(
      /[-[\]{}()*+?.,\\^$|#\s]/g,
      "\\$&"
    );

    /* Find student by Student ID or Email (case-insensitive) */

    const student = await Student.findOne({
      $or: [
        { studentId: { $regex: new RegExp(`^${safeIdentifier}$`, "i") } },
        { email: { $regex: new RegExp(`^${safeIdentifier}$`, "i") } },
      ],
    });

    if (!student) {

      await LoginLog.create({
        studentId: identifier,
        email: identifier.includes("@") ? identifier : "N/A",
        action: "LOGIN_FAILED_NOT_FOUND",
      });

      return res.status(400).json({
        message: "No account found with this Student ID or Email",
      });
    }

    /* Compare password with hashed password */

    const passwordMatch = await bcrypt.compare(
      password,
      student.password
    );

    if (!passwordMatch) {

      await LoginLog.create({
        studentId: student.studentId,
        email: student.email,
        action: "LOGIN_FAILED_WRONG_PASSWORD",
      });

      return res.status(400).json({
        message: "Invalid Student ID or Password",
      });
    }

    /* =====================================================
       CREATE JWT TOKEN
       Experiment 6
    ===================================================== */

    const token = jwt.sign(
      {
        studentId: student.studentId,
        email: student.email,

        /* Role is stored inside JWT */
        role: student.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "1h",
      }
    );


    /* Store successful login */

    await LoginLog.create({
      studentId: student.studentId,
      email: student.email,
      action: "LOGIN",
      token: token,
    });


    /* Send response */

    res.status(200).json({
      message: "Login Successful",

      token: token,

      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: student.role,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   JWT AUTHENTICATION MIDDLEWARE
   Experiment 6
========================================================= */

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers.authorization;

  /* No Authorization header */

  if (!authHeader) {
    return res.status(401).json({
      message: "Access Token Required",
    });
  }


  /* Expected format:
     Authorization: Bearer TOKEN
  */

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid Authorization Format",
    });
  }


  /* Verify JWT */

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* Store decoded user information */

    req.user = decoded;

    next();

  } catch (err) {

    console.log("JWT ERROR:", err.message);

    return res.status(403).json({
      message: "Invalid or Expired Token",
    });
  }
};


/* =========================================================
   ROLE AUTHORIZATION MIDDLEWARE
   Experiment 6
========================================================= */

const authorizeRole = (...allowedRoles) => {

  return (req, res, next) => {

    /* User must first be authenticated */

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication Required",
      });
    }


    /* Check whether user's role is allowed */

    if (!allowedRoles.includes(req.user.role)) {

      return res.status(403).json({
        message:
          "Access Denied: Insufficient Permissions",
      });
    }


    next();
  };
};


/* =========================================================
   GET ALL STUDENTS
   Experiment 5
========================================================= */

app.get("/api/students", async (req, res) => {

  try {

    const students = await Student.find();

    res.status(200).json(students);

  } catch (err) {

    console.log("STUDENTS ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   GET LOGIN LOGS
   Experiment 5
========================================================= */

app.get("/api/loginlogs", async (req, res) => {

  try {

    const logs = await LoginLog.find()
      .sort({
        createdAt: -1,
      });

    res.status(200).json(logs);

  } catch (err) {

    console.log("LOGIN LOG ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   LOGOUT API
========================================================= */

app.post(
  "/api/logout",
  authenticateToken,
  async (req, res) => {

    try {

      await LoginLog.create({
        studentId: req.user.studentId,
        email: req.user.email,
        action: "LOGOUT",
      });

      res.status(200).json({
        message: "Logout Successful",
      });

    } catch (err) {

      console.log("LOGOUT ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   GET CURRENT USER
   Protected JWT route
========================================================= */

app.get(
  "/api/profile",
  authenticateToken,
  async (req, res) => {

    try {

      const student = await Student.findOne({
        studentId: req.user.studentId,
      }).select("-password");

      if (!student) {
        return res.status(404).json({
          message: "Student Not Found",
        });
      }

      res.status(200).json({
        message: "Authenticated User",
        student: student,
      });

    } catch (err) {

      console.log("PROFILE ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   ADMIN DASHBOARD
   JWT + ROLE AUTHORIZATION
========================================================= */

app.get(
  "/api/admin/dashboard",

  /* First check JWT */
  authenticateToken,

  /* Then check role */
  authorizeRole("admin"),

  async (req, res) => {

    try {

      const students = await Student.find()
        .select("-password");

      const totalSkills = await Skill.countDocuments();

      const loginLogs = await LoginLog.find()
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({

        message: "Welcome Admin",

        loggedInUser: req.user,

        totalStudents: students.length,

        totalSkills: totalSkills,

        students: students,

        loginLogs: loginLogs,
      });

    } catch (err) {

      console.log("ADMIN ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

/* =========================================================
   ADMIN ROLE TOGGLE & REMOVE STUDENT
========================================================= */

app.put(
  "/api/admin/role",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { studentId, role } = req.body;
      if (!["student", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updated = await Student.findOneAndUpdate(
        { studentId: studentId.trim() },
        { role },
        { new: true }
      ).select("-password");

      res.status(200).json({
        message: "Role updated successfully",
        student: updated,
      });
    } catch (err) {
      console.log("ROLE ERROR:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

app.delete(
  "/api/admin/student/:studentId",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      await Student.findOneAndDelete({ studentId: studentId.trim() });
      res.status(200).json({ message: "Student removed successfully" });
    } catch (err) {
      console.log("DELETE STUDENT ERROR:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);


/* =========================================================
   STUDENT-ONLY PROTECTED ROUTE
========================================================= */

app.get(
  "/api/student/dashboard",

  authenticateToken,

  authorizeRole("student"),

  async (req, res) => {

    try {

      const student = await Student.findOne({
        studentId: req.user.studentId,
      }).select("-password");

      res.status(200).json({
        message: "Welcome Student",
        student: student,
      });

    } catch (err) {

      console.log("STUDENT DASHBOARD ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   GET SKILLS
========================================================= */

app.get("/api/skills", async (req, res) => {
  try {
    // Automatically purge legacy dummy mock skills (which lack a real registered teacherId)
    await Skill.deleteMany({
      $or: [
        { teacherId: { $exists: false } },
        { teacherId: null },
        { teacherId: "" },
      ],
    });

    const skills = await Skill.find().sort({ createdAt: -1 });

    res.status(200).json(skills);

  } catch (err) {

    console.log("SKILLS ERROR:", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});


/* =========================================================
   ADD SKILL / COURSE
   Available to Teachers and Admins
========================================================= */

app.post(
  "/api/skills",
  authenticateToken,
  async (req, res) => {

    try {

      const {
        name,
        category,
        level,
        description,
      } = req.body;

      if (!name || !category || !level) {
        return res.status(400).json({
          message: "All skill fields are required",
        });
      }

      const instructor = await Student.findOne({
        studentId: req.user.studentId,
      });

      if (!instructor) {
        return res.status(404).json({
          message: "User account not found",
        });
      }

      // Check if user is a registered teacher or admin
      if (instructor.role !== "teacher" && instructor.role !== "admin") {
        return res.status(403).json({
          message: "Only registered Teachers or Admins can post courses.",
        });
      }

      const skill = await Skill.create({
        name: name.trim(),
        category: category,
        level: level,
        description: description || "",
        teacher: instructor.name,
        teacherId: instructor.studentId,
        teacherEmail: instructor.email,
        teacherPhone: instructor.phone || "",
      });

      res.status(201).json({
        message: "Course Posted Successfully",
        skill: skill,
      });

    } catch (err) {

      console.log("ADD SKILL ERROR:", err);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

/* =========================================================
   DELETE SKILL / COURSE
========================================================= */

app.delete(
  "/api/skills/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const skill = await Skill.findById(req.params.id);

      if (!skill) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Ensure only the instructor who posted it or an admin can delete it
      if (
        skill.teacherId !== req.user.studentId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "You are not authorized to delete this course.",
        });
      }

      await Skill.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Course deleted successfully",
      });
    } catch (err) {
      console.log("DELETE SKILL ERROR:", err);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);


/* =========================================================
   REQUESTS API ENDPOINTS
   Real-time Student-Instructor Course Requests
========================================================= */

/* CREATE REQUEST */
app.post("/api/requests", authenticateToken, async (req, res) => {
  try {
    const { skillId, skillName, teacherName, teacherId, message } = req.body;

    if (!skillName || (!teacherName && !teacherId)) {
      return res.status(400).json({
        message: "Skill name and instructor information are required.",
      });
    }

    // Lookup authentic student profile
    const student = await Student.findOne({ studentId: req.user.studentId });
    if (!student) {
      return res.status(404).json({ message: "Student account not found." });
    }

    // Lookup teacher profile from DB if possible
    const instructor = await Student.findOne({
      $or: [
        ...(teacherId ? [{ studentId: teacherId }] : []),
        ...(teacherName ? [{ name: teacherName }] : []),
      ],
    });

    const finalTeacherId = instructor ? instructor.studentId : (teacherId || "");
    const finalTeacherName = instructor ? instructor.name : (teacherName || "Instructor");
    const finalTeacherEmail = instructor ? instructor.email : "";
    const finalTeacherPhone = instructor ? (instructor.phone || "") : "";

    // Prevent requesting own course
    if (
      student.studentId === finalTeacherId ||
      student.name.trim().toLowerCase() === finalTeacherName.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: "You cannot request your own course.",
      });
    }

    // Check for duplicate pending requests
    const existing = await CourseRequest.findOne({
      studentId: student.studentId,
      skillName: skillName.trim(),
      $or: [
        { teacherId: finalTeacherId },
        { teacherName: finalTeacherName },
      ],
      status: "Pending",
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already sent a pending request for this course.",
      });
    }

    const newRequest = await CourseRequest.create({
      studentId: student.studentId,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone || "",
      teacherId: finalTeacherId,
      teacherName: finalTeacherName,
      teacherEmail: finalTeacherEmail,
      teacherPhone: finalTeacherPhone,
      skillId: skillId || "",
      skillName: skillName.trim(),
      message: message || "",
      status: "Pending",
    });

    res.status(201).json({
      message: "Request successfully sent to instructor!",
      request: newRequest,
    });
  } catch (err) {
    console.log("CREATE REQUEST ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* GET REQUESTS FOR CURRENT USER */
app.get("/api/requests", authenticateToken, async (req, res) => {
  try {
    const user = await Student.findOne({ studentId: req.user.studentId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let filter = {};

    if (user.role === "admin") {
      filter = {};
    } else {
      filter = {
        $or: [
          { teacherId: user.studentId },
          { teacherName: user.name },
          { studentId: user.studentId },
          { studentName: user.name },
        ],
      };
    }

    const requests = await CourseRequest.find(filter).sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    console.log("GET REQUESTS ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* UPDATE REQUEST STATUS (Accept or Reject) */
app.put("/api/requests/:id", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const courseRequest = await CourseRequest.findById(req.params.id);
    if (!courseRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Ensure only the instructor of this course (or admin) can accept/reject
    const isTeacher =
      courseRequest.teacherId === req.user.studentId ||
      courseRequest.teacherName === req.user.studentId ||
      (req.user.name && courseRequest.teacherName === req.user.name);
    const isAdmin = req.user.role === "admin";

    if (!isTeacher && !isAdmin) {
      return res.status(403).json({
        message: "Only the designated instructor or an admin can update this request.",
      });
    }

    courseRequest.status = status;
    await courseRequest.save();

    res.status(200).json({
      message: `Request marked as ${status}`,
      request: courseRequest,
    });
  } catch (err) {
    console.log("UPDATE REQUEST ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* DELETE REQUEST */
app.delete("/api/requests/:id", authenticateToken, async (req, res) => {
  try {
    const courseRequest = await CourseRequest.findById(req.params.id);
    if (!courseRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isStudent = courseRequest.studentId === req.user.studentId;
    const isTeacher = courseRequest.teacherId === req.user.studentId;
    const isAdmin = req.user.role === "admin";

    if (!isStudent && !isTeacher && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to delete this request.",
      });
    }

    await CourseRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Request deleted successfully",
    });
  } catch (err) {
    console.log("DELETE REQUEST ERROR:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

/* =========================================================
   404 ROUTE
========================================================= */

app.use((req, res) => {

  res.status(404).json({
    message: "API Route Not Found",
  });
});