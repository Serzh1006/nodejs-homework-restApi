const app = require("./app");
const mongoose = require("mongoose");
const path = require("path");
const configPath = path.join(__dirname, ".env");

require("dotenv").config({ path: configPath });

const { DB_HOST, PORT = 3000 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
