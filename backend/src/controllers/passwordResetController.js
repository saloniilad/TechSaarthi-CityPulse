import crypto from "node:crypto";
import { User } from "../models/user.models.js";
import sendResetEmail from "../utils/sendResetEmail.js";

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      !["user", "staff"].includes(type)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email and account type.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Both account types are stored in the User collection.
    const role = type === "staff" ? "staff" : "public";

    const account = await User.findOne({
      email: normalizedEmail,
      role,
    });

    const message =
      "If an account matches those details, a reset link will be sent.";

    if (!account) {
      return res.status(200).json({ message });
    }

    // Generate a cryptographically secure token.
    const token = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the token.
    account.resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    account.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await account.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      account.resetPasswordToken = null;
      account.resetPasswordExpires = null;
      await account.save();

      return res.status(500).json({
        message: "Password reset is not configured.",
      });
    }

    const resetLink =
      `${frontendUrl}/reset-password?token=${token}&type=${type}`;

    try {
      await sendResetEmail(account.email, resetLink);
    } catch (emailError) {
      account.resetPasswordToken = null;
      account.resetPasswordExpires = null;
      await account.save();

      console.error("Reset email failed:", emailError);

      return res.status(500).json({
        message: "Unable to send reset email. Please try again later.",
      });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, type, password } = req.body;

    if (
      typeof token !== "string" ||
      !token ||
      !["user", "staff"].includes(type) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: "Invalid request or password. Use 8–128 characters.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const role = type === "staff" ? "staff" : "public";

    const account = await User.findOne({
      role,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!account) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired.",
      });
    }

    // The User schema's pre-save hook hashes this password.
    account.password = password;
    account.resetPasswordToken = null;
    account.resetPasswordExpires = null;

    await account.save();

    return res.status(200).json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password. Please try again.",
    });
  }
};
