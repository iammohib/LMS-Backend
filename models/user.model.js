import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [3, "Name must have 3 characters"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please fill in a valid email address",
      ], // Matches email against regex
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 characters"],
      select: false,
    },
    subscription: {
      id: String,
      status: String,
    },
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    tempEmail: String,
    otp: String,
    otpExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// Hashing password before saving to DB
userSchema.pre("save", async function (next) {
  // If password is not modified then do not hash it
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// methods
userSchema.methods = {
  // Generating JWT token
  generateJWTToken: async function () {
    const payloads = {
      id: this._id,
      email: this.email,
      subscription: this.subscription,
      role: this.role,
    };
    return JWT.sign(payloads, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRY,
    });
  },

  // Comparing, if users's input password is valid or not
  comparePassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },

  // Generating token for reset-password, and hash the token and saving it in DB
  getForgotPasswordToken: async function () {
    const forgotPasswordToken = crypto.randomBytes(20).toString("hex");

    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(forgotPasswordToken)
      .digest("hex");
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;

    return forgotPasswordToken;
  },

  // Generating a 6 digit OTP for email verification
  generateOTP: async function () {
    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;

    this.otp = crypto.createHash("sha256").update(otp.toString()).digest("hex");

    this.otpExpiry = Date.now() + 15 * 60 * 1000;

    return otp;
  },

  // Comparing user's input OTP to hash OTP
  isValidOTP: async function (otp) {
    const userOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    if (this.otp === userOTP && this.otpExpiry >= Date.now()) {
      return true;
    }
    return false;
  },
};

const User = model("User", userSchema);
export default User;
