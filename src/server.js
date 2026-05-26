require("dotenv").config();
const path = require("path");
const express = require("express");
const { handleInbound } = require("./handlers/inbound");
const { handleStatus } = require("./handlers/status");
const { handleIntelligence } = require("./handlers/intelligence");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.post("/webhook/inbound", handleInbound);
app.post("/webhook/status", handleStatus);
app.post("/webhook/intelligence", handleIntelligence);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Inbound webhook: ${process.env.BASE_URL}/webhook/inbound`);
});
