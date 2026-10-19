import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["public", "staff"],
      required: true
    },

    // 👇 STAFF ONLY
    workCategory: {
      type: String,
      enum: [
        "Road Damage",
        "Water Leakage",
        "Garbage Overflow",
        "Street Light Issue",
        "Drainage Problem",
        "Public Toilet Issue",
        "Electricity Issue",
        "Footpath Issue",
        "Traffic Signal Issue"
      ]
    },

    workLocation: {
      type: String,
      trim: true
    },

    resetPasswordToken: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// 🔐 hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// 🔐 compare password
userSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

// 🔐 jwt
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

export const User = mongoose.model("User", userSchema);
