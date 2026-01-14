const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required()
});

const onboardingSchema = Joi.object({
  companyName: Joi.string().min(2).max(80).required(),
  businessType: Joi.string().valid("store", "coffee", "market", "company").required(),
  branchesCount: Joi.number().integer().min(1).max(200).required(),
  firstBranch: Joi.string().min(2).max(80).required()
});

const settingsSchema = Joi.object({
  companyName: Joi.string().max(80).allow(""),
  alertsEmail: Joi.boolean(),
  alertsWhatsapp: Joi.boolean()
});

const planSchema = Joi.object({
  plan: Joi.string().required()
});

const roleSchema = Joi.object({
  role: Joi.string().valid("admin", "manager", "viewer").required()
});

const profileSchema = Joi.object({
  fullName: Joi.string().max(100).allow(""),
  companyName: Joi.string().max(100).allow(""),
  phoneNumber: Joi.string().max(20).allow(""),
  avatarUrl: Joi.string().max(500).allow(""),
  bio: Joi.string().max(500).allow("")
});

module.exports = {
  registerSchema,
  loginSchema,
  onboardingSchema,
  settingsSchema,
  planSchema,
  roleSchema,
  profileSchema
};
