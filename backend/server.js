require("dotenv").config();

const mongoose = require("mongoose");

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("MongoDB connected");

    app.listen(PORT,"0.0.0.0", () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });

  } catch (error) {

    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();