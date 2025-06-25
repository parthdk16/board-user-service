import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Prop()
  studentId?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ type: Object, default: {} })
  profile?: {
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
    [key: string]: any;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for better performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ studentId: 1 });
UserSchema.index({ role: 1 });
