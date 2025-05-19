// controllers/reportController.js
const VisitLog = require("../models/VisitLog");
const ExcelJS = require("exceljs");

// Generate daily report
exports.generateDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();

    reportDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setUTCDate(reportDate.getUTCDate() + 1);
    endDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCMilliseconds(-1);

    // Find all visit logs for the specified date
    const visitLogs = await VisitLog.find({
      $or: [
        { entryTime: { $gte: reportDate, $lte: endDate } },
        { exitTime: { $gte: reportDate, $lte: endDate } },
      ],
    }).populate("visitor");

    if (visitLogs.length === 0) {
      return res
        .status(404)
        .json({ message: "No visits found for the specified date" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily Visitor Report");

    // Add headers
    worksheet.columns = [
      { header: "Visitor Name", key: "name", width: 20 },
      { header: "Phone Number", key: "phone", width: 15 },
      { header: "Aadhaar Number", key: "aadhaar", width: 20 },
      { header: "Entry Time", key: "entry", width: 20 },
      { header: "Exit Time", key: "exit", width: 20 },
      { header: "Purpose", key: "purpose", width: 30 },
      { header: "Duration (minutes)", key: "duration", width: 15 },
    ];

    // Add rows
    visitLogs.forEach((log) => {
      const duration =
        log.exitTime && log.entryTime
          ? Math.round((log.exitTime - log.entryTime) / (1000 * 60))
          : "N/A";

      worksheet.addRow({
        name: log.visitor.name,
        phone: log.visitor.phoneNumber,
        aadhaar: log.visitor.aadhaarNumber,
        entry: log.entryTime ? log.entryTime.toLocaleString() : "N/A",
        exit: log.exitTime ? log.exitTime.toLocaleString() : "N/A",
        purpose: log.purpose,
        duration: duration,
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=visitor-report-${
        reportDate.toISOString().split("T")[0]
      }.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
