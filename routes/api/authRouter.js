const express = require("express");
const {
  registerSchema,
  loginSchema,
  emailResendSchema,
} = require("../../schemas/user-schemas");
const validateBody = require("../../decorators/validateBody");
const controllersUser = require("../../controllers/auth-controller");
const { validToken, upload } = require("../../middleware/validation/index");

const authRouter = express.Router();

const userRegisterValidate = validateBody(registerSchema);
const userLoginValidate = validateBody(loginSchema);
const emailResendValidate = validateBody(emailResendSchema);

authRouter.post("/register", userRegisterValidate, controllersUser.register);
authRouter.get("/verify/:verificationToken", controllersUser.verify);
authRouter.post("/verify", emailResendValidate, controllersUser.emailResend);
authRouter.post("/login", userLoginValidate, controllersUser.login);
authRouter.get("/current", validToken, controllersUser.getCurrent);
authRouter.post("/logout", validToken, controllersUser.logout);
authRouter.patch(
  "/avatars",
  validToken,
  upload.single("avatarURL"),
  controllersUser.updateAvatar
);

module.exports = authRouter;
