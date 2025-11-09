import { Schema, Document, Types, model } from "mongoose";

export interface IDevice extends Document {
  deviceId: string;
  userId: Types.ObjectId;
  deviceType: string;
  os?: string;
  osVersion?: string;
  riskScore: number;
  riskStatus: DeviceRiskStatus;
  lastActive: Date;
  location?: {
    country: string;
    city?: string;
    ipAddress: string;
  };
  posture: {
    diskEncrypted: boolean;
    antivirus: boolean;
    isJailbroken?: boolean;
    lastSecurityUpdate?: Date;
  };
}

enum DeviceRiskStatus {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deviceType: { type: String, required: true },
    os: { type: String },
    osVersion: { type: String },
    riskScore: { type: Number, default: 0 },
    riskStatus: {
      type: String,
      enum: Object.values(DeviceRiskStatus),
      default: DeviceRiskStatus.LOW,
    },
    lastActive: { type: Date, default: Date.now },
    location: {
      country: { type: String },
      city: { type: String },
      ipAddress: { type: String },
    },
    posture: {
      diskEncrypted: { type: Boolean, required: true },
      antivirus: { type: Boolean, required: true },
      isJailbroken: { type: Boolean },
      lastSecurityUpdate: { type: Date },
    },
  },
  { timestamps: true }
);

const DeviceModel = model<IDevice>("Device", deviceSchema);

export default DeviceModel;
