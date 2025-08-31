// test.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:5000/api";

// Store tokens and data
let adminToken;
let securityToken;
let visitorToken;
let visitorData;
let qrCodeData;

// Create test admin user
const createAdmin = async () => {
  try {
    console.log("=== Creating Admin User ===");

    // First try to login with default admin credentials
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: "sanchit@admin.com",
        password: "password",
      });

      adminToken = loginResponse.data.token;
      console.log("Admin login successful with existing account");
      return;
    } catch (error) {
      console.log("Admin login failed, creating new admin account...");
    }

    // If login fails, register a new admin (this would typically be done in database setup)
    // For testing purposes, we'll use a direct database connection or a special endpoint
    // This is a simplified example - in production, admin creation would be more secure
    const response = await axios.post(`${API_URL}/auth/register-staff`, {
      name: "Admin User",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
    });

    adminToken = response.data.token;
    console.log("Admin created successfully:", response.data.user.name);
  } catch (error) {
    console.error(
      "Admin creation failed:",
      error.response?.data || error.message
    );
    throw new Error("Admin creation failed");
  }
};

// Create security guard user
const createSecurityGuard = async () => {
  try {
    console.log("\n=== Creating Security Guard ===");

    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        name: "Security Guard",
        email: "security@hospital.com",
        password: "security123",
        role: "security",
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    securityToken = response.data.token;
    console.log(
      "Security guard logged in successfully:",
      response.data.user.name
    );
  } catch (error) {
    console.error(
      "Security guard creation failed:",
      error.response?.data || error.message
    );
    throw new Error("Security guard creation failed");
  }
};

// Register a visitor
const registerVisitor = async () => {
  try {
    console.log("\n=== Registering Visitor ===");

    // Create a unique Aadhaar number for testing
    const uniqueAadhaar = `${Date.now()}`.slice(-12);

    // Path to test image
    const imagePath = path.join(__dirname, "tests", "dp.jpg");

    // Verify file exists
    if (!fs.existsSync(imagePath)) {
      console.log("Test image not found, creating a placeholder image...");
      // Create a simple placeholder image if test image doesn't exist
      const tempDir = path.join(__dirname, "tests");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(imagePath, "placeholder image data");
    }

    const formData = new FormData();
    formData.append("name", "John Visitor");
    formData.append("phoneNumber", "9876543210");
    formData.append("aadhaarNumber", uniqueAadhaar);
    formData.append("address", "123 Test Street, Test City");
    formData.append("email", "visitor4@example.com");
    formData.append("password", "visitor123");
    formData.append("purpose", "Patient Visit");
    formData.append("selfie", fs.createReadStream(imagePath));

    const response = await axios.post(
      `${API_URL}/visitors/register`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    visitorToken = response.data.token;
    visitorData = response.data.visitor;
    qrCodeData = response.data.visitor.qrCode;

    console.log("Visitor registered successfully:", response.data.user.name);
    console.log("Visitor ID:", visitorData.id);
  } catch (error) {
    console.error(
      "Visitor registration failed:",
      error.response?.data || error.message
    );
    throw new Error("Visitor registration failed");
  }
};

// Record visitor entry
const recordEntry = async () => {
  try {
    console.log("\n=== Recording Visitor Entry ===");

    const response = await axios.post(
      `${API_URL}/access/entry`,
      {
        qrCodeData: qrCodeData,
        purpose: "Patient Visit",
      },
      {
        headers: { Authorization: `Bearer ${securityToken}` },
      }
    );

    console.log("Entry recorded successfully");
    console.log("Entry time:", response.data.data.visitLog.entryTime);
    console.log("Visitor status:", response.data.data.visitor.status);
  } catch (error) {
    console.error(
      "Entry recording failed:",
      error.response?.data || error.message
    );
    throw new Error("Entry recording failed");
  }
};

// Record visitor exit
const recordExit = async () => {
  try {
    console.log("\n=== Recording Visitor Exit ===");

    const response = await axios.post(
      `${API_URL}/access/exit`,
      {
        qrCodeData: qrCodeData,
      },
      {
        headers: { Authorization: `Bearer ${securityToken}` },
      }
    );

    console.log("Exit recorded successfully");
    console.log("Entry time:", response.data.data.visitLog.entryTime);
    console.log("Exit time:", response.data.data.visitLog.exitTime);
    console.log("Visitor status:", response.data.data.visitor.status);
  } catch (error) {
    console.error(
      "Exit recording failed:",
      error.response?.data || error.message
    );
    throw new Error("Exit recording failed");
  }
};

// Generate daily report
const generateReport = async () => {
  try {
    console.log("\n=== Generating Daily Report ===");

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const response = await axios.get(`${API_URL}/reports/daily?date=${today}`, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    // Save the report to a file
    const reportPath = path.join(__dirname, `visitor-report-${today}.xlsx`);
    fs.writeFileSync(reportPath, response.data);

    console.log("Report generated successfully");
    console.log("Report saved to:", reportPath);
  } catch (error) {
    console.error(
      "Report generation failed:",
      error.response?.data?.toString() || error.message
    );
    throw new Error("Report generation failed");
  }
};

// View visitor information
const viewVisitorInfo = async () => {
  try {
    console.log("\n=== Viewing Visitor Information ===");

    // Security guard viewing visitor info
    const securityResponse = await axios.get(
      `${API_URL}/visitors/${visitorData.id}`,
      {
        headers: { Authorization: `Bearer ${securityToken}` },
      }
    );

    console.log("Security guard can view visitor info:");
    console.log("Visitor name:", securityResponse.data.data.visitor.name);
    console.log(
      "Visit history count:",
      securityResponse.data.data.visitHistory.length
    );

    // Visitor viewing own info
    const visitorResponse = await axios.get(`${API_URL}/visitors/my-info`, {
      headers: { Authorization: `Bearer ${visitorToken}` },
    });

    console.log("\nVisitor can view own info:");
    console.log("Visitor name:", visitorResponse.data.data.name);
    console.log("Visitor status:", visitorResponse.data.data.status);
  } catch (error) {
    console.error(
      "Viewing visitor info failed:",
      error.response?.data || error.message
    );
    throw new Error("Viewing visitor info failed");
  }
};

// Run all tests in sequence
const runTests = async () => {
  try {
    console.log("Starting Hospital Visitor Management System Tests");
    console.log("==============================================");

    await createAdmin();
    await createSecurityGuard();
    await registerVisitor();
    await recordEntry();

    // Wait for a few seconds to simulate time spent in hospital
    console.log("\nWaiting for 5 seconds to simulate visit duration...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await recordExit();
    await viewVisitorInfo();
    await generateReport();

    console.log("\n==============================================");
    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("\nTest sequence failed:", error.message);
    process.exit(1);
  }
};

// Execute the test sequence
runTests();
