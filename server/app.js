require("dotenv").config();
const connectDB = require("./db");

const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const complaintRoutes = require("./routes/complaintRoutes");
const statsRoutes = require("./routes/statsRoutes");
const businessRoutes = require("./routes/businessRoutes");

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use("/api/complaints", complaintRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/businesses", businessRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();