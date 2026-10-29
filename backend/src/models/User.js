// The User model: describes what a user looks like in MongoDB.
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// How much work bcrypt does. Higher = safer but slower. 12 is a common choice.
const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // creates a unique index so two users can't share an email
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // queries do NOT return the password unless we ask with .select("+password")
    },
    // Logout strategy: every token remembers the tokenVersion it was created with.
    // Logging out increases this number, which instantly invalidates old tokens.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Controls what the user object looks like when sent as JSON to the client.
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // never leak the hash
        delete ret.tokenVersion; // internal detail
        return ret;
      },
    },
  }
);

// Runs automatically before every save(). Hashes the password only when it is new or changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Compares a plain-text password (from the login form) with the stored hash.
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
