import mongoose, { Document, Schema } from "mongoose";

export interface IRoles extends Document {
  role: string[];
}

const rolesSchema: Schema<IRoles> = new Schema({
  role: [{
    type: String,
    enum: ['employer', 'jobseeker']
  }]
});

export const Roles = mongoose.model<IRoles>("Roles", rolesSchema);
