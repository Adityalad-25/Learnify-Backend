import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema({
  //name : type . required
  name: {
    type: String,
    required: [true, "Please enter a name"],
  },

  //email : type . required . unique . validate
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    validate: validator.isEmail,
  },

  //password : type . required . minlength . select
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [6, "Minimum password length is 6 characters"],
    select: false,
  },
  //role : type . enum . default
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  //subscription : id , status
  subscription: {
    id: String,
    status: String,
  },
  //avatar : public_id , url
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  //playlist : [courseId,Poster]
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
     
    },
  ],

  //createdAt : type . default
  createdAt: {
    type: Date,
    default: Date.now,
  },

  //ResetPasswordToken : type
  ResetPasswordToken: String,

  //ResetPasswordExpire : type
  ResetPasswordExpire: Date,
});

// for hashing the password before saving it to the database
schema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// for jwt token and token expire time
schema.methods.getJwtToken = function() {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15 days",
  });
};

// compare password
schema.methods.comparePassword = async function(password) {
  // console.log(this.password);
  // this.password is the hashed password || and password is the password entered by the user
  return await bcrypt.compare(password, this.password);
};

// for reset password token

// console.log(crypto.randomBytes(20).toString("hex"));
schema.methods.getResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken
  this.ResetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.ResetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};
export const User = mongoose.model("User", schema);

